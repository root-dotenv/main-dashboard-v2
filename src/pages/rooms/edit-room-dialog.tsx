// src/pages/rooms/edit-room-dialog.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form"; // Added Controller
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { Loader2, Users, Building, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import hotelClient from "../../api/hotel-client";
import { cn } from "@/lib/utils";
import { BsCurrencyDollar } from "react-icons/bs";
import type { DetailedRoom, RoomImage } from "./types/rooms"; // Added types
// Import Alert Dialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- TYPE DEFINITIONS ---
interface RoomTypeOption {
  id: string;
  name: string;
}
interface AmenityOption {
  id: string;
  name: string;
}

// --- MODIFIED: Added types from new-room.tsx for uploader ---
const FILE_SIZE_LIMIT = 3 * 1024 * 1024; // 3 MB
const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/jpg"];
const MAX_FILES = 5; // Max *new* files

// Validation for *new* primary image
const fileValidator = yup
  .mixed()
  .test(
    "fileSize",
    "Image must be less than 3 MB",
    (value: any) =>
      !value || !value[0] || (value && value[0]?.size <= FILE_SIZE_LIMIT)
  )
  .test(
    "fileFormat",
    "Unsupported format. Use JPG or PNG.",
    (value: any) =>
      !value ||
      !value[0] ||
      (value && SUPPORTED_FORMATS.includes(value[0]?.type))
  );

// Main form schema
const editRoomSchema = yup.object().shape({
  code: yup.string().required("Room code is required."),
  description: yup.string().required("Description is required."),
  room_type: yup.string().required("A room type is required."), // Changed from room_type_id
  max_occupancy: yup
    .number()
    .typeError("Max occupancy must be a number")
    .required("Max occupancy is required")
    .min(1, "Occupancy must be at least 1."),
  price_per_night: yup
    .number()
    .typeError("Price must be a number")
    .required("Price per night is required")
    .positive("Price must be a positive number."),
  availability_status: yup
    .string()
    .oneOf(["Available", "Booked", "Maintenance"], "Invalid status")
    .required("Availability status is required."),
  room_amenities: yup.array().of(yup.string().required()).optional(),
  image: fileValidator.optional().nullable(), // Primary image is optional on edit
  floor_number: yup
    .number()
    .integer("Floor must be a whole number")
    .typeError("Floor must be a number")
    .required("Floor number is required."),
});

type EditRoomFormData = yup.InferType<typeof editRoomSchema>;

interface EditRoomFormProps {
  room: DetailedRoom;
  onUpdateComplete: () => void;
  onDirtyChange: (isDirty: boolean) => void; // Kept this prop
}

// --- Helper: Single Image Dropzone (for Primary Image) ---
const ImageDropzone = ({
  field,
  currentImageUrl,
}: {
  field: any;
  currentImageUrl: string | null;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    // Handle new file selection
    const file = field.value?.[0];
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      // Handle reset or initial state
      setPreview(currentImageUrl);
    }
  }, [field.value, currentImageUrl]);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      field.onChange(files);
    }
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const selectedFile = field.value?.[0];

  // Show new file preview
  if (preview && selectedFile) {
    return (
      <div className="flex items-center justify-between w-full h-auto border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={preview}
            alt="Preview"
            className="h-12 w-12 object-cover rounded-md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-green-800 dark:text-green-300 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50"
          onClick={() => {
            field.onChange(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Show current image
  if (currentImageUrl && !selectedFile) {
    // Only show if no new file is selected
    return (
      <div className="flex items-center justify-between w-full h-auto border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={currentImageUrl}
            alt="Current"
            className="h-12 w-12 object-cover rounded-md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 dark:text-gray-300 truncate">
              Current Primary Image
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click to replace
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-[#0785CF] hover:bg-[#D6EEF9] hover:text-[#0785CF] dark:hover:bg-[#B4E6F5]/50"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Show empty dropzone
  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        isDragging
          ? "border-[#B4E6F5]500 bg-[#D6EEF9] dark:bg-[#B4E6F5]/20"
          : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
        <UploadCloud className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold">Click to upload</span> or drag and
          drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          PNG, JPG up to 3MB
        </p>
      </div>
      <Input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files)}
      />
    </div>
  );
};

// --- NEW: Multiple Image Uploader Component ---
function MultipleImageDropzone({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      if (inputRef.current) inputRef.current.value = ""; // Reset input
    }
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        isDragging
          ? "border-[#B4E6F5]500 bg-[#D6EEF9] dark:bg-[#B4E6F5]/20"
          : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
        <UploadCloud className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold">Click to upload</span> or drag and
          drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Upload up to {MAX_FILES} images (PNG, JPG, max 3MB each)
        </p>
      </div>
      <Input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        className="hidden"
        multiple // Allow multiple files
        onChange={handleFileChange}
      />
    </div>
  );
}
// --- END: Multiple Image Uploader ---

// --- ADDED: getStatusVariant function ---
const getStatusVariant = (
  status: string
): "success" | "pending" | "failed" | "default" => {
  switch (status) {
    case "Available":
      return "success";
    case "Booked":
      return "pending";
    case "Maintenance":
      return "failed";
    default:
      return "default";
  }
};
// --- END ---

// --- Main Form Component ---
export function EditRoomForm({
  room,
  onUpdateComplete,
  onDirtyChange,
}: EditRoomFormProps) {
  const queryClient = useQueryClient();

  // --- NEW: State for additional images ---
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  // Store existing images separately
  const [existingImages, setExistingImages] = useState<RoomImage[]>(
    room.images || []
  );

  const { data: roomTypes, isLoading: isLoadingTypes } = useQuery<
    RoomTypeOption[]
  >({
    queryKey: ["allRoomTypes"],
    queryFn: async () => (await hotelClient.get("room-types/")).data.results,
  });

  const { data: allAmenities, isLoading: isLoadingAmenities } = useQuery<
    AmenityOption[]
  >({
    queryKey: ["allAmenities"],
    queryFn: async () => (await hotelClient.get("amenities/")).data.results,
  });

  const form = useForm<EditRoomFormData>({
    resolver: yupResolver(editRoomSchema),
    defaultValues: {
      code: room.code,
      description: room.description || "",
      room_type: room.room_type_id, // Use room_type_id from API
      max_occupancy: room.max_occupancy,
      price_per_night: room.price_per_night,
      availability_status: room.availability_status,
      room_amenities: room.amenities?.map((a) => a.id) || [],
      floor_number: room.floor_number,
      image: null, // Start with no new primary image
    },
    mode: "onChange",
  });

  // Use RHF's isDirty + custom state
  const {
    control, // Added control
    handleSubmit, // Added handleSubmit
    formState: { isDirty, dirtyFields },
  } = form;
  const isFormTrulyDirty = isDirty || newGalleryFiles.length > 0;

  useEffect(() => {
    onDirtyChange(isFormTrulyDirty);
  }, [isFormTrulyDirty, onDirtyChange]);

  // --- Main form update mutation ---
  const updateRoomMutation = useMutation({
    mutationFn: (data: FormData) =>
      hotelClient.patch(`rooms/${room.id}/`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    // onSuccess is handled in onSubmit
  });

  // --- NEW: Mutation for uploading *additional* gallery images ---
  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("room_id", room.id);
      formData.append("is_active", "true");
      return hotelClient.post("/room-images/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    // We'll handle aggregate toast messages in onSubmit
  });

  // --- NEW: Mutation for DELETING existing gallery images ---
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) =>
      hotelClient.delete(`/room-images/${imageId}/`),
    onSuccess: (data, imageId) => {
      toast.success("Image deleted");
      // Remove from local state to update UI instantly
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      // Notify parent that a change has occurred (for save button)
      onDirtyChange(true);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete image: ${error.message}`);
    },
  });

  const onSubmit = async (data: EditRoomFormData) => {
    const formData = new FormData();
    // const changedFields = form.formState.dirtyFields; // Already destructured

    // --- Build FormData for PATCH request ---
    Object.keys(data).forEach((key) => {
      const formKey = key as keyof EditRoomFormData;
      // Only append fields that have changed
      if (dirtyFields[formKey]) {
        if (formKey === "image" && data.image instanceof FileList) {
          if (data.image.length > 0) {
            formData.append(formKey, data.image[0]);
          }
        } else if (formKey === "room_amenities") {
          // Handle amenity array
          formData.delete("room_amenities"); // Clear existing entries
          data.room_amenities?.forEach((id) =>
            formData.append("room_amenities", id)
          );
        } else {
          // @ts-ignore
          formData.append(formKey, data[formKey]);
        }
      }
    });

    // If no fields changed *and* no new images, just close
    if (!isDirty && newGalleryFiles.length === 0) {
      toast.info("No changes to save.");
      onUpdateComplete();
      return;
    }

    // --- Step 1: Save core room details (if changed) ---
    if (isDirty) {
      try {
        await updateRoomMutation.mutateAsync(formData);
        toast.success("Room details saved successfully!");
      } catch (error: any) {
        toast.error(
          `Failed to save details: ${
            error.response?.data?.detail || error.message
          }`
        );
        return; // Stop if core details fail
      }
    }

    // --- Step 2: Upload new gallery images (if any) ---
    if (newGalleryFiles.length > 0) {
      toast.info(`Uploading ${newGalleryFiles.length} new image(s)...`);
      const uploadPromises = newGalleryFiles.map((file) =>
        uploadImageMutation.mutateAsync(file)
      );

      const results = await Promise.allSettled(uploadPromises);
      const failedCount = results.filter((r) => r.status === "rejected").length;

      if (failedCount > 0) {
        toast.warning(`${failedCount} image(s) failed to upload.`);
      } else {
        toast.success("All new images uploaded successfully!");
      }
      setNewGalleryFiles([]); // Clear queue
    }

    // --- Final Step: Invalidate query and close ---
    queryClient.invalidateQueries({ queryKey: ["roomDetails", room.id] });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    onUpdateComplete();
  };

  // --- NEW: Handler for multiple file dropzone ---
  const handleFilesSelected = (files: File[]) => {
    const newFiles: File[] = [];
    const errors: string[] = [];

    // Check against combined total
    const currentImageCount = existingImages.length + newGalleryFiles.length;

    for (const file of files) {
      if (currentImageCount + newFiles.length >= MAX_FILES) {
        errors.push(`Gallery limit of ${MAX_FILES} images reached.`);
        break;
      }
      if (file.size > FILE_SIZE_LIMIT) {
        errors.push(`"${file.name}" is too large (max 3MB).`);
        continue;
      }
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        errors.push(`"${file.name}" has an unsupported format (use JPG/PNG).`);
        continue;
      }
      newFiles.push(file);
    }

    if (errors.length > 0) {
      toast.warning("Some files were not added:", {
        description: (
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        ),
      });
    }

    setNewGalleryFiles((prev) =>
      [...prev, ...newFiles].slice(0, MAX_FILES - existingImages.length)
    );
    onDirtyChange(true); // Manually set dirty state
  };

  const handleRemoveNewFile = (indexToRemove: number) => {
    setNewGalleryFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
    onDirtyChange(true); // Manually set dirty state
  };

  const handleDeleteExistingImage = (imageId: string) => {
    // Trigger delete mutation
    deleteImageMutation.mutate(imageId);
    // onDirtyChange is called in mutation's onSuccess
  };

  // Consistent input styling
  const inputBaseClass =
    "dark:bg-[#171F2F] dark:border-[#1D2939] dark:text-[#D0D5DD] dark:placeholder:text-[#5D636E]";
  const focusRingClass =
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500";

  return (
    // Applied shadow-none
    <div className="flex flex-col h-full bg-[#FFF] dark:bg-[#101828] border-none">
      {/* Applied shadow-none */}
      <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-6 bg-[#F9FAFB] dark:bg-[#101828] border-b border-[#E4E7EC] dark:border-b-[#1D2939]">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SheetTitle className="text-2xl font-bold text-[#1D2939] dark:text-[#D0D5DD]">
              Edit Room Details
            </SheetTitle>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-lg px-3 py-1 font-semibold dark:border-[#1D2939] dark:text-[#D0D5DD]"
              >
                {room.code}
              </Badge>
              <Badge
                variant={getStatusVariant(room.availability_status)}
                className="text-sm px-3 py-1 dark:bg-transparent dark:border-none"
              >
                {room.availability_status}
              </Badge>
            </div>
          </div>
        </div>
        <SheetDescription className="text-base text-[#667085] dark:text-[#98A2B3] mt-2">
          Modify room configuration, pricing, and amenities. All changes will be
          applied immediately upon saving.
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <form
          // --- THIS IS THE FIX ---
          onSubmit={handleSubmit(onSubmit)}
          // -----------------------
          className="flex flex-col h-full min-h-0"
        >
          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-8 pb-6">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
                  Room Type & Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <FormField
                    control={control}
                    name="room_type" // --- FIX: Changed name to room_type ---
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[0.9375rem] text-[#667085] dark:text-[#98A2B3] font-medium">
                          Room Type
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoadingTypes}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                "h-11 text-base rounded-lg",
                                focusRingClass,
                                inputBaseClass
                              )}
                            >
                              <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="dark:bg-[#101828] dark:border-[#1D2939] dark:text-[#D0D5DD]">
                            {roomTypes?.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="availability_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[0.9375rem] text-[#667085] dark:text-[#98A2B3] font-medium">
                          Availability Status
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                "h-11 text-base rounded-lg",
                                focusRingClass,
                                inputBaseClass
                              )}
                            >
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="dark:bg-[#101828] dark:border-[#1D2939] dark:text-[#D0D5DD]">
                            <SelectItem value="Available">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                Available
                              </span>
                            </SelectItem>
                            <SelectItem value="Booked">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                Booked
                              </span>
                            </SelectItem>
                            <SelectItem value="Maintenance">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                Maintenance
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="dark:bg-[#1D2939]" />

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <FormField
                    control={control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[0.9375rem] text-[#667085] dark:text-[#98A2B3] font-medium">
                          Room Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., DLX-101"
                            className={cn(
                              "h-11 text-base rounded-lg",
                              focusRingClass,
                              inputBaseClass
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="price_per_night"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[0.9375rem] text-[#667085] dark:text-[#98A2B3] font-medium">
                          Price per Night
                        </FormLabel>
                        <div className="relative">
                          <BsCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              className={cn(
                                "pl-10 h-11 text-[0.9375rem] rounded-lg",
                                focusRingClass,
                                inputBaseClass
                              )}
                              placeholder="0.00"
                              value={field.value || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : parseFloat(val)
                                );
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="max_occupancy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[0.9375rem] text-[#667085] dark:text-[#98A2B3] font-medium">
                          Maximum Occupancy
                        </FormLabel>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
                          <FormControl>
                            <Input
                              type="number"
                              className={cn(
                                "pl-10 h-11 text-base rounded-lg",
                                focusRingClass,
                                inputBaseClass
                              )}
                              placeholder="0"
                              // Handle number conversion
                              value={field.value || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : parseInt(val, 10)
                                );
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              min="1"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="floor_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[0.9375rem] text-[#667085] dark:text-[#98A2B3] font-medium">
                          Floor Number
                        </FormLabel>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
                          <FormControl>
                            <Input
                              type="number"
                              className={cn(
                                "pl-10 h-11 text-base rounded-lg",
                                focusRingClass,
                                inputBaseClass
                              )}
                              placeholder="0"
                              // Handle number conversion
                              value={field.value || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : parseInt(val, 10)
                                );
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[0.9375rem] text-[#667085] dark:text-[#98A2B3] font-medium">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of the room and its features..."
                          className={cn(
                            "min-h-[120px] text-base resize-none rounded-lg",
                            focusRingClass,
                            inputBaseClass
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="dark:bg-[#1D2939]" />

              <FormField
                control={control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
                      Update Primary Image
                    </FormLabel>
                    <FormControl>
                      <ImageDropzone
                        field={field}
                        currentImageUrl={room.image}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- NEW: Gallery Image Management Section --- */}
              <Separator className="dark:bg-[#1D2939]" />
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
                  Gallery Images
                </h3>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Gallery
                    </FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                      {existingImages.map((image) => (
                        <div
                          key={image.id}
                          className="relative group aspect-square"
                        >
                          <img
                            src={image.image} // Use 'image' field as per API response
                            alt="Existing gallery"
                            className="w-full h-full object-cover rounded-md border dark:border-gray-700"
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600/80 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Delete image"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Image?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete
                                  this image? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() =>
                                    handleDeleteExistingImage(image.id)
                                  }
                                  disabled={deleteImageMutation.isPending}
                                >
                                  {deleteImageMutation.isPending
                                    ? "Deleting..."
                                    : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Uploader */}
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add New Images (Up to {MAX_FILES - existingImages.length}{" "}
                    more)
                  </FormLabel>
                  <FormControl>
                    <MultipleImageDropzone
                      onFilesSelected={handleFilesSelected}
                    />
                  </FormControl>
                </FormItem>

                {/* New Image Previews */}
                {newGalleryFiles.length > 0 && (
                  <div>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Images to Upload
                    </FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                      {newGalleryFiles.map((file, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover rounded-md border dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewFile(index)}
                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600/80 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1.5 rounded-b-md">
                            <p className="text-xs text-white truncate">
                              {file.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* --- END: Gallery Image Management --- */}

              <Separator className="dark:bg-[#1D2939]" />

              <div className="space-y-6">
                <FormField
                  control={control}
                  name="room_amenities"
                  // --- SYNTAX FIX: Removed the underscore ---
                  render={(
                    { field } // field is managed by Controller
                  ) => (
                    <FormItem>
                      <FormLabel className="text-xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
                        Room Amenities
                      </FormLabel>
                      {isLoadingAmenities ? (
                        <div className="flex items-center gap-2 py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-[#0785CF]" />
                          <p className="text-base text-[#667085] dark:text-[#98A2B3]">
                            Loading amenities...
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {allAmenities?.map((amenity) => {
                            const isChecked = field.value?.includes(amenity.id);
                            return (
                              <FormItem key={amenity.id}>
                                <FormControl>
                                  <Checkbox
                                    className="sr-only"
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([
                                            ...(field.value || []), // Ensure field.value is an array
                                            amenity.id,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (id) => id !== amenity.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel
                                  className={cn(
                                    "flex flex-wrap items-center justify-center text-center px-4 py-2.5 rounded-lg border-2 font-medium cursor-pointer transition-all text-[13px]",
                                    isChecked
                                      ? "bg-[#EFF6FF] dark:bg-[#162142] text-[#0785CF] border border-[#B4E6F5]300 shadow-xs rounded-full dark:border-none dark:border-[#162142] dark:text-[#98A2B3]"
                                      : "bg-white dark:bg-[#162142] border border-[#E4E7EC] text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-full shadow-xs dark:hover:bg-[#1C2433] dark:border-[#162142] dark:text-[#98A2B3]"
                                  )}
                                >
                                  {amenity.name}
                                </FormLabel>
                              </FormItem>
                            );
                          })}
                        </div>
                      )}
                      <FormMessage className="pt-2" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <SheetFooter className="flex-shrink-0 px-6 shadow-lg py-4 border-t bg-white dark:bg-[#101828] dark:border-t-[#1D2939]">
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                className="bg-[#0785CF] hover:bg-[#0785CF]/90 text-[#FFF] flex items-center gap-x-2 py-2.5 px-4 rounded-full text-[1rem] cursor-pointer transition-all focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={
                  updateRoomMutation.isPending ||
                  uploadImageMutation.isPending ||
                  deleteImageMutation.isPending ||
                  !isFormTrulyDirty // Use combined dirty state
                }
              >
                {(updateRoomMutation.isPending ||
                  uploadImageMutation.isPending ||
                  deleteImageMutation.isPending) && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                {updateRoomMutation.isPending ||
                uploadImageMutation.isPending ||
                deleteImageMutation.isPending
                  ? "Saving Changes..."
                  : // --- MODIFIED: Show save text even if only new files are added ---
                    "Save Changes"}
              </button>
              <SheetClose asChild>
                <button
                  type="button"
                  className="border border-[#E4E7EC] dark:border-[#1D2939] bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#1C2433] rounded-full py-2.5 px-4 text-[1rem] cursor-pointer transition-all focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:ring-offset-2 text-gray-800 dark:text-gray-200"
                  data-sheet-close="true"
                >
                  Cancel
                </button>
              </SheetClose>
            </div>
          </SheetFooter>
        </form>
      </Form>
    </div>
  );
}
