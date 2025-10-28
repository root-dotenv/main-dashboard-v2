// src/pages/rooms/new-room.tsx
"use client";
import { useState, useMemo, useEffect, useRef, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import hotelClient from "@/api/hotel-client";
import ErrorPage from "@/components/custom/error-page";
import { useAuthStore } from "@/store/auth.store";
import { FaRegImages } from "react-icons/fa";

// --- Icon Imports ---
import {
  Loader2,
  Layers,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Bed,
  Image as ImageIcon,
  Check,
  UploadCloud,
  HelpCircle,
  Trash2,
  Users as UsersIcon,
  DollarSign,
} from "lucide-react";

// --- TYPE DEFINITIONS & SCHEMAS ---
interface RoomTypeOption {
  id: string;
  name: string;
}
interface AmenityOption {
  id: string;
  name: string;
}

// --- MODIFIED: New Room type from API response ---
interface NewRoomResponse {
  id: string;
  code: string;
  // ... other fields
}

const FILE_SIZE_LIMIT = 3 * 1024 * 1024; // 3 MB
const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/jpg"];

const fileValidator = yup
  .mixed()
  .test(
    "is-file",
    "A primary image is required.",
    (value: any) => value && value[0]
  )
  .test(
    "fileSize",
    "Image must be less than 3 MB",
    (value: any) => !value || (value && value[0]?.size <= FILE_SIZE_LIMIT)
  )
  .test(
    "fileFormat",
    "Unsupported format. Use JPG or PNG.",
    (value: any) =>
      !value || (value && SUPPORTED_FORMATS.includes(value[0]?.type))
  );

const singleRoomSchema = yup.object({
  hotel: yup.string().required(),
  code: yup.string().optional(),
  description: yup.string().required("Description is required."),
  room_type: yup.string().required("A room type is required."),
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
  image: fileValidator.required("A primary image is required."),
  floor_number: yup
    .number()
    .integer("Floor must be a whole number")
    .typeError("Floor must be a number")
    .required("Floor number is required."),
});

const bulkCreateSchema = yup.object({
  hotel_id: yup.string().required(),
  room_type_id: yup.string().required("A room type is required."),
  description: yup.string().optional(),
  count: yup
    .number()
    .typeError("Count must be a number.")
    .required("Number of rooms is required.")
    .min(1, "Must create at least one room."),
  price_per_night: yup
    .number()
    .typeError("Price must be a number")
    .required("Price is required.")
    .positive("Price must be a positive number."),
  room_amenities: yup.array().of(yup.string().required()).optional(),
  image: fileValidator.required("A primary image is required."),
  floor_number: yup
    .number()
    .integer("Floor must be a whole number")
    .typeError("Floor must be a number")
    .required("Floor number is required."),
});

type SingleRoomFormData = yup.InferType<typeof singleRoomSchema>;
type BulkCreateFormShape = yup.InferType<typeof bulkCreateSchema>;

// --- API FUNCTIONS ---
const createRoomWithFile = async (data: any) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === "image" && value instanceof FileList && value.length > 0) {
      formData.append(key, value[0]);
    } else if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
    } else if (value !== null && value !== undefined && value !== "") {
      formData.append(key, String(value));
    }
  });

  const response = await hotelClient.post("rooms/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data; // This should return the NewRoomResponse
};

const bulkCreateRoomsWithFile = async (data: any) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === "image" && value instanceof FileList && value.length > 0) {
      formData.append(key, value[0]);
    } else if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
    } else if (value !== null && value !== undefined && value !== "") {
      formData.append(key, String(value));
    }
  });

  const response = await hotelClient.post("/rooms/bulk-create/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// --- STYLING CONSTANTS & MAIN COMPONENT ---
const focusRingClass =
  "focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 focus:border-blue-500 dark:focus:border-blue-400";
const inputBaseClass =
  "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500";

export default function NewRoomPage() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const { hotelId } = useAuthStore();
  const navigate = useNavigate(); // Get navigate function

  // --- NEW STATE for 2-step flow ---
  const [newlyCreatedRoomId, setNewlyCreatedRoomId] = useState<string | null>(
    null
  );

  const {
    data: roomTypes,
    isLoading: isLoadingRoomTypes,
    error: roomTypesError,
  } = useQuery<RoomTypeOption[]>({
    queryKey: ["allRoomTypes"],
    queryFn: async () => (await hotelClient.get("room-types/")).data.results,
    staleTime: 1000 * 60 * 30,
  });

  const {
    data: allAmenities,
    isLoading: isLoadingAmenities,
    error: amenitiesError,
  } = useQuery<AmenityOption[]>({
    queryKey: ["allAmenities"],
    queryFn: async () => (await hotelClient.get("amenities/")).data.results,
    staleTime: 1000 * 60 * 30,
  });

  if (isLoadingRoomTypes || isLoadingAmenities || !hotelId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (roomTypesError || amenitiesError) {
    return (
      <ErrorPage
        error={(roomTypesError || amenitiesError) as Error}
        onRetry={() => {}}
      />
    );
  }

  const TABS_CONFIG = [
    { value: "single", label: "Create Single Room", icon: Bed },
    { value: "bulk", label: "Create Multiple Rooms", icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101828]">
      <header className="bg-white/80 dark:bg-[#101828d1] backdrop-blur-sm border-b rounded dark:border-gray-800 sticky top-0 z-30 px-4 md:px-6 py-4 lg:h-[132px]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <Link
              to="/rooms/hotel-rooms"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mb-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Rooms
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Add New Hotel Room(s)
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#101828] border dark:border-none rounded-lg p-1">
            {TABS_CONFIG.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value as "single" | "bulk");
                  setNewlyCreatedRoomId(null); // Reset step 2 if tabs are switched
                }}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer",
                  activeTab === tab.value
                    ? "hover:bg-[#1547E5] bg-[#155DFC] dark:bg-[#1C263A] text-[#FFF] dark:text-gray-100 shadow-none border dark:border-none border-[#DADCE0]"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        {/* --- MODIFIED: Conditional Rendering for 2-Step Flow --- */}
        {activeTab === "single" && !newlyCreatedRoomId && (
          <SingleRoomFormWrapper
            hotelId={hotelId}
            roomTypes={roomTypes ?? []}
            allAmenities={allAmenities ?? []}
            // Pass setter to update state on success
            onRoomCreated={(roomId) => setNewlyCreatedRoomId(roomId)}
          />
        )}
        {activeTab === "single" && newlyCreatedRoomId && (
          <AdditionalImageUploader
            roomId={newlyCreatedRoomId}
            onComplete={() => {
              setNewlyCreatedRoomId(null); // Reset state
              navigate("/rooms/hotel-rooms"); // Navigate on complete
            }}
          />
        )}
        {/* --- END MODIFICATION --- */}

        {activeTab === "bulk" && (
          <BulkRoomFormWrapper
            hotelId={hotelId}
            roomTypes={roomTypes ?? []}
            allAmenities={allAmenities ?? []}
          />
        )}
      </main>
    </div>
  );
}

// --- FORM WRAPPERS & PREVIEWS ---
interface WrapperProps {
  hotelId: string;
  roomTypes: RoomTypeOption[];
  allAmenities: AmenityOption[];
}

// --- MODIFIED: Added onRoomCreated prop ---
interface SingleRoomWrapperProps extends WrapperProps {
  onRoomCreated: (roomId: string) => void;
}

function SingleRoomFormWrapper({
  hotelId,
  roomTypes,
  allAmenities,
  onRoomCreated,
}: SingleRoomWrapperProps) {
  const form = useForm<SingleRoomFormData>({
    resolver: yupResolver(singleRoomSchema),
    mode: "onChange",
    defaultValues: {
      hotel: hotelId,
      availability_status: "Available",
      room_amenities: [],
      room_type: "",
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-6 items-start">
      <SingleRoomForm
        form={form}
        roomTypes={roomTypes}
        allAmenities={allAmenities}
        onRoomCreated={onRoomCreated} // Pass prop down
      />
      <DetailsPreview
        control={form.control}
        roomTypes={roomTypes}
        allAmenities={allAmenities}
      />
    </div>
  );
}

function BulkRoomFormWrapper({
  hotelId,
  roomTypes,
  allAmenities,
}: WrapperProps) {
  const form = useForm<BulkCreateFormShape>({
    resolver: yupResolver(bulkCreateSchema),
    mode: "onChange",
    defaultValues: {
      hotel_id: hotelId,
      count: 1,
      room_amenities: [],
      room_type_id: "",
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-6 items-start">
      <BulkRoomForm
        form={form}
        roomTypes={roomTypes}
        allAmenities={allAmenities}
      />
      <BulkDetailsPreview
        control={form.control}
        roomTypes={roomTypes}
        allAmenities={allAmenities}
      />
    </div>
  );
}

// ... (DetailsPreview and BulkDetailsPreview components remain unchanged) ...
function DetailsPreview({ control, roomTypes, allAmenities }: any) {
  const watchedValues = useWatch({ control });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const imageFile = watchedValues.image?.[0];
    if (imageFile instanceof File) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [watchedValues.image]);

  const roomTypeName = useMemo(
    () => roomTypes?.find((rt: any) => rt.id === watchedValues.room_type)?.name,
    [watchedValues.room_type, roomTypes]
  );
  const selectedAmenities = useMemo(
    () =>
      allAmenities?.filter((a: any) =>
        watchedValues.room_amenities?.includes(a.id)
      ),
    [watchedValues.room_amenities, allAmenities]
  );

  return (
    <div className="lg:col-span-1 lg:sticky top-24">
      <Card className="bg-[#FFF] dark:bg-gray-900 px-0 py-6 rounded-md dark:border-gray-800 shadow-none border border-[#DADCE0]">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Room Preview
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Review details as you type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 md:px-6">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Room Preview"
              className="rounded-lg object-cover w-full h-40 bg-gray-100 dark:bg-gray-800"
            />
          ) : (
            <div className="rounded-lg w-full h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-600" />
            </div>
          )}
          <DetailRow label="Code" value={watchedValues.code} />
          <DetailRow label="Type" value={roomTypeName} />
          <DetailRow
            label="Price"
            value={
              watchedValues.price_per_night
                ? `$${Number(watchedValues.price_per_night)} / night`
                : ""
            }
          />
          <DetailRow label="Occupancy" value={watchedValues.max_occupancy} />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Amenities
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedAmenities && selectedAmenities.length > 0 ? (
                selectedAmenities.map((amenity: any) => (
                  <Badge key={amenity.id} variant="secondary">
                    {amenity.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">—</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BulkDetailsPreview({ control, roomTypes, allAmenities }: any) {
  const watchedValues = useWatch({ control });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const imageFile = watchedValues.image?.[0];
    if (imageFile instanceof File) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [watchedValues.image]);

  const roomTypeName = useMemo(
    () =>
      roomTypes?.find((rt: any) => rt.id === watchedValues.room_type_id)?.name,
    [watchedValues.room_type_id, roomTypes]
  );
  const selectedAmenities = useMemo(
    () =>
      allAmenities?.filter((a: any) =>
        watchedValues.room_amenities?.includes(a.id)
      ),
    [watchedValues.room_amenities, allAmenities]
  );

  return (
    <div className="lg:col-span-1 lg:sticky top-24">
      <Card className="bg-white dark:bg-gray-900 rounded-md dark:border-gray-800 shadow-none border border-[#DADCE0]">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Bulk Creation Summary
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            A summary of the rooms to be created.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 md:px-6">
          {imagePreview && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Image Preview
              </p>
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt={`Preview`}
                  className="rounded-md object-cover w-full h-32 bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </div>
          )}
          <DetailRow label="Number of Rooms" value={watchedValues.count} />
          <DetailRow label="Room Type" value={roomTypeName} />
          <DetailRow
            label="Price per Room"
            value={
              watchedValues.price_per_night
                ? `$${Number(watchedValues.price_per_night)} / night`
                : ""
            }
          />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Shared Amenities
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedAmenities && selectedAmenities.length > 0 ? (
                selectedAmenities.map((amenity: any) => (
                  <Badge key={amenity.id} variant="secondary">
                    {amenity.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">—</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- FORM & HELPER COMPONENTS ---
interface FormComponentProps {
  form: any;
  roomTypes: RoomTypeOption[];
  allAmenities: AmenityOption[];
}

// --- MODIFIED: Added onRoomCreated prop ---
interface SingleRoomFormProps extends FormComponentProps {
  onRoomCreated: (roomId: string) => void;
}

const AmenitiesSelector = ({ allAmenities, field }: any) => {
  const handleToggle = (id: string) => {
    const currentValue = field.value ?? [];
    const isSelected = currentValue.includes(id);
    if (isSelected) {
      field.onChange(currentValue.filter((itemId: string) => itemId !== id));
    } else {
      field.onChange([...currentValue, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {allAmenities.map((item) => {
        const isChecked = field.value?.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            role="checkbox"
            aria-checked={isChecked}
            onClick={() => handleToggle(item.id)}
            className={cn(
              "flex items-center gap-2 pl-2 pr-4 py-1.75 rounded-full font-medium",
              "transition-colors text-slate-800 border bg-[#FFF] dark:bg-gray-900/50 shadow-xs",
              "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-950"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                isChecked
                  ? "border-blue-600 bg-blue-600"
                  : "border-gray-400 bg-transparent"
              )}
            >
              {isChecked && <Check className="h-3.5 w-3.5 text-white" />}
            </span>
            <span className="text-[0.9375rem] font-medium text-gray-800 dark:text-gray-200">
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
const FormLabelWithInfo = ({
  label,
  infoText,
  icon,
}: {
  label: string;
  infoText: string;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center gap-2">
    {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
    <FormLabel className="text-gray-800 dark:text-gray-300">
      {label}
    </FormLabel>{" "}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-help" />
        </TooltipTrigger>
        {/* Adjusted TooltipContent styling */}
        <TooltipContent className="bg-gray-800 text-white border-gray-900">
          <p className="max-w-xs">{infoText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

// --- (ImageDropzone component remains unchanged) ---
const ImageDropzone = ({ field }: { field: any }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  if (selectedFile instanceof File) {
    return (
      <div className="flex items-center justify-between w-full h-auto border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <div className="flex items-center gap-4 min-w-0">
          <FaRegImages className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
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

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        isDragging
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
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

// --- MODIFIED: SingleRoomForm to call onRoomCreated ---
function SingleRoomForm({
  form,
  roomTypes,
  allAmenities,
  onRoomCreated,
}: SingleRoomFormProps) {
  const queryClient = useQueryClient();
  // const navigate = useNavigate(); // Navigation handled by parent

  const mutation = useMutation({
    mutationFn: createRoomWithFile,
    onSuccess: (data: NewRoomResponse) => {
      // Use specific response type
      toast.success("Step 1 Complete: Room Created!", {
        description: `The room "${data.code}" has been added. Now, add more images.`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["hotelDetails"] });
      form.reset();
      // --- NEW ---
      onRoomCreated(data.id); // Trigger Step 2
    },
    onError: (error: any) => {
      toast.error("Creation Failed", {
        description:
          error.response?.data?.detail || "An unexpected error occurred.",
        icon: <XCircle className="h-5 w-5 text-red-500" />,
      });
    },
  });

  const onSubmit = (data: SingleRoomFormData) => {
    console.log("Submitting Payload for Single Room:", data);
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="lg:col-span-2 space-y-8"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Step 1: Core Details
          </h2>
          <Card className="bg-[#FFF] dark:bg-gray-900 rounded-md dark:border-gray-800 shadow-none border border-[#DADCE0]">
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      label="Room Code/Number (Optional)"
                      infoText="A unique identifier for this room (e.g., 'DLX-101'). If left blank, one will be generated automatically."
                    />
                    <FormControl>
                      <Input
                        className={cn(inputBaseClass, focusRingClass)}
                        placeholder="e.g. DLX-101"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_occupancy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      // Added Icon
                      icon={<UsersIcon className="h-4 w-4 text-gray-500" />}
                      label="Max Occupancy"
                      infoText="The maximum number of guests this room can accommodate."
                    />
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        className={cn(inputBaseClass, focusRingClass)}
                        placeholder="e.g. 2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="room_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      label="Room Type"
                      infoText="Select the classification for this room (e.g., Standard, Deluxe, Suite)."
                    />
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "w-full h-10 rounded-md border px-3 py-2 text-sm",
                          inputBaseClass,
                          focusRingClass
                        )}
                      >
                        <option value="" disabled>
                          Select a room type...
                        </option>
                        {roomTypes.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floor_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      // Added Icon
                      icon={<Layers className="h-4 w-4 text-gray-500" />}
                      label="Floor Number"
                      infoText="The floor this room is on."
                    />
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className={cn(inputBaseClass, focusRingClass)}
                        placeholder="e.g. 3"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabelWithInfo
                      label="Room Description"
                      infoText="A detailed description of the room, its features, and view. This will be visible to guests."
                    />
                    <FormControl>
                      <Textarea
                        placeholder="e.g., A spacious room with a king-sized bed and a stunning ocean view..."
                        className={cn(
                          "min-h-[120px] resize-none",
                          inputBaseClass,
                          focusRingClass
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Pricing & Primary Image
          </h2>
          <Card className="bg-[#FFF] dark:bg-gray-900 rounded-md dark:border-gray-800 shadow-none border border-[#DADCE0]">
            <CardContent className="space-y-6 p-4 md:p-6">
              <FormField
                control={form.control}
                name="price_per_night"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      // Added Icon
                      icon={<DollarSign className="h-4 w-4 text-gray-500" />}
                      label="Price/Night (USD)"
                      infoText="The standard rate for this room for one night, in US Dollars."
                    />
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className={cn(inputBaseClass, focusRingClass)}
                        placeholder="e.g. 150"
                        {...field}
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      label="Primary Image"
                      infoText="Upload one high-quality image for this room (JPG, PNG, max 3MB)."
                    />
                    <FormControl>
                      <ImageDropzone field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Features & Amenities
          </h2>
          <Card className="bg-[#FFF] dark:bg-gray-900 rounded-md dark:border-gray-800 shadow-none border border-[#DADCE0]">
            <CardContent className="p-4 md:p-6">
              <FormField
                control={form.control}
                name="room_amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      // Added live counter
                      label={`Room Amenities (${
                        (field.value as string[])?.length || 0
                      })`}
                      label="Room Amenities"
                      infoText="Select all the amenities available within this specific room."
                    />
                    <div className="pt-2">
                      <AmenitiesSelector
                        allAmenities={allAmenities}
                        field={field}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Room & Add Images
          </Button>
        </div>
      </form>
    </Form>
  );
}
// ... (BulkRoomForm component remains unchanged) ...
function BulkRoomForm({ form, roomTypes, allAmenities }: FormComponentProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const selectedAmenities = useWatch({
    control: form.control,
    name: "room_amenities",
  });

  const mutation = useMutation({
    mutationFn: bulkCreateRoomsWithFile,
    onSuccess: (data) => {
      toast.success("Rooms Created Successfully!", {
        description: `${data.count || "Multiple"} rooms have been added.`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["hotelDetails"] });
      form.reset();
      setTimeout(() => navigate("/rooms/hotel-rooms"), 1500);
    },
    onError: (error: any) => {
      toast.error("Bulk Creation Failed", {
        description:
          error.response?.data?.detail || "An unexpected error occurred.",
        icon: <XCircle className="h-5 w-5 text-red-500" />,
      });
    },
  });

  const onSubmit = (data: BulkCreateFormShape) => {
    console.log("Submitting Payload for Bulk Create:", data);
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="lg:col-span-2 space-y-8"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Core Details
          </h2>
          <Card className="bg-[#FFF] dark:bg-gray-900 rounded-md dark:border-gray-800 shadow-none border border-[#DADCE0]">
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-6">
              <FormField
                control={form.control}
                name="room_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      label="Room Type"
                      infoText="All rooms created in this batch will share this room type."
                    />
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "w-full h-10 rounded-md border px-3 py-2 text-sm",
                          inputBaseClass,
                          focusRingClass
                        )}
                      >
                        <option value="" disabled>
                          Select a room type...
                        </option>
                        {roomTypes.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      label="Number of Rooms"
                      infoText="The total number of rooms to create in this batch."
                    />
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 10"
                        className={cn(inputBaseClass, focusRingClass)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_per_night"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      // Added Icon
                      icon={<DollarSign className="h-4 w-4 text-gray-500" />}
                      label="Price/Night (USD)"
                      infoText="This price will be applied to every room created in this batch."
                    />
                    <FormControl>
                      <Input
                        className={cn(inputBaseClass, focusRingClass)}
                        type="number"
                        min="0"
                        placeholder="e.g. 150"
                        {...field}
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floor_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      // Added Icon
                      icon={<Layers className="h-4 w-4 text-gray-500" />}
                      label="Floor Number"
                      infoText="The floor these rooms are on."
                    />
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className={cn(inputBaseClass, focusRingClass)}
                        placeholder="e.g. 3"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabelWithInfo
                      label="Common Room Description (Optional)"
                      infoText="A shared description that will be applied to all rooms created in this batch."
                    />
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Our standard rooms offer comfort and style..."
                        className={cn(
                          "min-h-[120px] resize-none",
                          inputBaseClass,
                          focusRingClass
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Image & Amenities
          </h2>
          <Card className="bg-[#FFF] dark:bg-gray-900 rounded-md dark:border-gray-800 shadow-none border border-[#DADCE0]">
            <CardContent className="space-y-6 p-4 md:p-6">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      label="Shared Primary Image"
                      infoText="Upload one image that will be applied to all rooms in this batch (JPG, PNG, max 3MB)."
                    />
                    <FormControl>
                      <ImageDropzone field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="room_amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithInfo
                      // Added live counter
                      label={`Shared Amenities (${
                        (field.value as string[])?.length || 0
                      })`}
                      label="Shared Amenities"
                      infoText="Select all amenities that will be available in every room created in this batch."
                    />
                    <div className="pt-2">
                      <AmenitiesSelector
                        allAmenities={allAmenities}
                        field={field}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Rooms
          </Button>
        </div>
      </form>
    </Form>
  );
}

// --- NEW: Multiple Image Uploader Component ---
const MAX_FILES = 5;

// New Dropzone component for multiple files
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
      // Reset input value to allow re-uploading the same file
      if (inputRef.current) inputRef.current.value = "";
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
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
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

// New component for the Step 2 UI
function AdditionalImageUploader({
  roomId,
  onComplete,
}: {
  roomId: string;
  onComplete: () => void;
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("room_id", roomId);
      formData.append("is_active", "true");
      return hotelClient.post("/room-images/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (data, file) => {
      toast.success(`Image "${file.name}" uploaded successfully.`);
    },
    onError: (error: any, file) => {
      toast.error(`Failed to upload "${file.name}": ${error.message}`);
    },
  });

  const handleFilesSelected = (files: File[]) => {
    const newFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (selectedFiles.length + newFiles.length >= MAX_FILES) {
        errors.push(`You can only upload a maximum of ${MAX_FILES} images.`);
        break; // Stop processing if max is reached
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

    setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, MAX_FILES));
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleUploadAndFinish = async () => {
    if (selectedFiles.length === 0) {
      onComplete(); // Just finish if no files
      return;
    }

    const uploadPromises = selectedFiles.map((file) =>
      uploadImageMutation.mutateAsync(file)
    );

    const results = await Promise.allSettled(uploadPromises);

    const failedCount = results.filter((r) => r.status === "rejected").length;

    if (failedCount > 0) {
      toast.error(`${failedCount} image(s) failed to upload.`, {
        description:
          "Please check the image format or size and try again later.",
      });
    } else {
      toast.success("All additional images uploaded successfully!");
    }

    // Invalidate room details query to show new images if user navigates there
    queryClient.invalidateQueries({ queryKey: ["roomDetails", roomId] });
    onComplete();
  };

  return (
    <div className="p-4 md:p-6">
      <Card className="lg:col-span-2 bg-[#FFF] dark:bg-gray-900 rounded-md dark:border-gray-800 shadow-none border border-[#DADCE0]">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Step 2: Add Additional Images (Optional)
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            The room is created. You can now add up to {MAX_FILES} gallery
            images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MultipleImageDropzone onFilesSelected={handleFilesSelected} />

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">
                Image Previews ({selectedFiles.length} / {MAX_FILES})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover rounded-md border dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600/80 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1.5 rounded-b-md">
                      <p className="text-xs text-white truncate">{file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardContent className="flex justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            className="shadow-none border-gray-300 dark:border-gray-700"
            onClick={onComplete}
            disabled={uploadImageMutation.isPending}
          >
            Skip & Finish
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 shadow-none"
            onClick={handleUploadAndFinish}
            disabled={
              uploadImageMutation.isPending || selectedFiles.length === 0
            }
          >
            {uploadImageMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Upload & Finish ({selectedFiles.length})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// --- HELPER COMPONENTS ---
const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) => (
  <div>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="text-base font-semibold text-gray-800 dark:text-white mt-1">
      {value || "—"}
    </p>
  </div>
);
