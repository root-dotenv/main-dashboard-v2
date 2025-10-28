"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Plus,
  Image as ImageIcon,
  Edit,
  Trash2,
  Loader2,
  UploadCloud,
  X,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import { IoMdExpand } from "react-icons/io"; // 3. Added Expand Icon import
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDropzone } from "react-dropzone";

// Assuming Swal is available globally via a script tag, e.g., from a CDN
declare const Swal: any;

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useHotel } from "@/providers/hotel-provider";
import axios from "axios";
import type { HotelImage } from "../hotel-types";

// --- TYPE DEFINITIONS ---

// 4. Added ImageCategory interface as requested
interface ImageCategory {
  id: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  translation: string | null;
}

const hotelClient = axios.create({
  baseURL: "https://hotel.safaripro.net/api/v1/",
});

const DataLoadingError = ({
  title,
  subtitle,
  error,
}: {
  title: string;
  subtitle: string;
  error: Error;
}) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-16">
    <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
      {title}
    </h2>
    <p className="text-gray-600 dark:text-gray-400 mb-4">{subtitle}</p>
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm text-red-600 dark:text-red-400 w-full max-w-md overflow-x-auto">
      <code>{error.message}</code>
    </pre>
  </div>
);

// --- API HELPER FUNCTIONS ---
const api = {
  getImageCategories: async (): Promise<ImageCategory[]> => {
    const response = await hotelClient.get("image-categories/");
    return response.data.results || [];
  },
  getHotelImages: async (hotelId: string): Promise<HotelImage[]> => {
    const response = await hotelClient.get(`hotel-images/?hotel_id=${hotelId}`);
    return response.data.results || [];
  },
  // 2. Updated updateHotelImage to handle FormData for file uploads
  updateHotelImage: async (payload: {
    id: string;
    caption?: string;
    tag?: string;
    category?: string;
    image?: File;
  }): Promise<HotelImage> => {
    const { id, ...data } = payload;
    const formData = new FormData();

    // Conditionally append data to FormData for a PATCH request
    if (data.image) {
      formData.append("image", data.image);
    }
    if (data.caption) {
      formData.append("caption", data.caption);
    }
    if (data.tag) {
      formData.append("tag", data.tag);
    }
    if (data.category) {
      formData.append("category", data.category);
    }

    const response = await hotelClient.patch(`hotel-images/${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  createHotelImage: async (
    data: z.infer<typeof addImageSchema> & { hotel: string }
  ): Promise<HotelImage> => {
    const formData = new FormData();
    formData.append("image", data.original);
    formData.append("caption", data.caption);
    formData.append("tag", data.tag);
    formData.append("category", data.category);
    formData.append("image_type", data.image_type);
    formData.append("hotel", data.hotel);

    const response = await hotelClient.post("hotel-images/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  // 1. Delete functionality (already correctly implemented)
  deleteHotelImage: async (id: string): Promise<void> => {
    await hotelClient.delete(`hotel-images/${id}/`);
  },
};

// --- FORM SCHEMAS (ZOD) ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const addImageSchema = z.object({
  original: z
    .any()
    .refine((file) => file instanceof File, "Image is required.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  caption: z.string().min(3, "Caption must be at least 3 characters long."),
  tag: z.string().min(2, "Tag must be at least 2 characters long."),
  category: z.string().min(1, "Please select a category."),
  image_type: z.string().default("hotel-gallery"),
});

const editImageSchema = z.object({
  caption: z.string().min(3, "Caption must be at least 3 characters long."),
  tag: z.string().min(2, "Tag must be at least 2 characters long."),
  category: z.string().min(1, "Please select a category."),
  // 2. Added image to the edit schema
  image: z
    .any()
    .optional()
    .refine((file) => !file || file instanceof File, "Image must be a file.")
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

// --- REUSABLE COMPONENTS ---

const AddImageDialog = ({
  categories,
  hotelId,
}: {
  categories: ImageCategory[];
  hotelId: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof addImageSchema>>({
    resolver: zodResolver(addImageSchema),
    defaultValues: {
      caption: "",
      tag: "",
      category: "",
      image_type: "hotel-gallery",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof addImageSchema>) =>
      api.createHotelImage({ ...data, hotel: hotelId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelImages"] });
      toast.success("Image added to gallery successfully!");
      setIsOpen(false);
      form.reset();
      setPreview(null);
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        form.setValue("original", file, { shouldValidate: true });
        setPreview(URL.createObjectURL(file));
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-[#FFF] hover:text-[#FFF]">
          <Plus className="h-4 w-4" /> Add Image
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
        <DialogHeader>
          <DialogTitle className="dark:text-[#D0D5DD]">
            Upload New Image
          </DialogTitle>
          <DialogDescription className="dark:text-[#98A2B3]">
            Select an image from your device to add to the gallery.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(mutate)} className="space-y-4">
            <FormField
              name="original"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#D0D5DD]">
                    Image File
                  </FormLabel>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "mt-1 flex justify-center rounded-lg border-2 border-dashed px-6 pt-5 pb-6 transition-colors",
                      isDragActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                  >
                    <input {...getInputProps()} />
                    {preview ? (
                      <div className="relative group">
                        <img
                          src={preview}
                          alt="Image preview"
                          className="h-32 w-auto rounded-md"
                          onLoad={() => URL.revokeObjectURL(preview)}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            form.setValue("original", undefined, {
                              shouldValidate: true,
                            });
                            setPreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isDragActive
                            ? "Drop the file here..."
                            : "Drag & drop a file here, or click to select"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          PNG, JPG, WEBP up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#D0D5DD]">Caption</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Deluxe King Room View"
                      {...field}
                      className="bg-white dark:bg-[#171F2F] border-gray-300 dark:border-[#1D2939]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#D0D5DD]">Tag</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., hotel-image"
                      {...field}
                      className="bg-white dark:bg-[#171F2F] border-gray-300 dark:border-[#1D2939]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#D0D5DD]">
                    Category
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-[#171F2F] border-gray-300 dark:border-[#1D2939]">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
                      {categories.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="dark:text-[#D0D5DD] dark:focus:bg-[#1C2433]"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
                Add Image
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// 2. Updated EditImageDialog
const EditImageDialog = ({
  image,
  categories,
  isOpen,
  onOpenChange,
  onSave,
  isSaving,
}: {
  image: HotelImage | null;
  categories: ImageCategory[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Updated onSave prop to include optional image
  onSave: (data: {
    id: string;
    caption: string;
    tag: string;
    category: string;
    image?: File;
  }) => void;
  isSaving: boolean;
}) => {
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const form = useForm<z.infer<typeof editImageSchema>>({
    resolver: zodResolver(editImageSchema),
  });

  useEffect(() => {
    if (image) {
      form.reset({
        caption: image.caption,
        tag: image.tag,
        category: image.category,
        image: undefined, // Reset image field on open
      });
      setNewImagePreview(null); // Clear preview on open
    }
  }, [image, isOpen, form]); // Reset form when dialog opens or image changes

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        form.setValue("image", file, { shouldValidate: true });
        setNewImagePreview(URL.createObjectURL(file));
      }
    },
  });

  if (!image) return null;

  const handleSubmit = (data: z.infer<typeof editImageSchema>) => {
    const payload: {
      id: string;
      caption: string;
      tag: string;
      category: string;
      image?: File;
    } = {
      id: image.id,
      ...data,
    };
    if (!data.image) delete payload.image;
    onSave(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
        <DialogHeader>
          <DialogTitle className="dark:text-[#D0D5DD]">
            Edit Image Details
          </DialogTitle>
          <DialogDescription className="dark:text-[#98A2B3]">
            Update the caption, tag, category, or replace the image.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {/* --- NEW DROPZONE UI FOR EDITING --- */}
              <FormField
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#D0D5DD]">
                      Replace Image (Optional)
                    </FormLabel>
                    <div
                      {...getRootProps()}
                      className={cn(
                        "mt-1 flex justify-center rounded-lg border-2 border-dashed px-6 pt-5 pb-6 transition-colors",
                        isDragActive
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600"
                      )}
                    >
                      <input {...getInputProps()} />
                      {newImagePreview ? (
                        // Preview for NEW image
                        <div className="relative group">
                          <img
                            src={newImagePreview}
                            alt="New image preview"
                            className="h-32 w-auto rounded-md"
                            onLoad={() =>
                              newImagePreview &&
                              URL.revokeObjectURL(newImagePreview)
                            }
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              form.setValue("image", undefined, {
                                shouldValidate: true,
                              });
                              setNewImagePreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        // Current image
                        <div className="relative group cursor-pointer">
                          <img
                            src={image.image}
                            alt={image.caption}
                            className="h-32 w-auto rounded-md"
                          />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <UploadCloud className="h-8 w-8 text-white" />
                            <p className="text-white text-sm font-semibold">
                              Drop file to replace
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* --- END NEW DROPZONE UI --- */}
              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#D0D5DD]">
                      Caption
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-[#171F2F] border-gray-300 dark:border-[#1D2939]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#D0D5DD]">Tag</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-[#171F2F] border-gray-300 dark:border-[#1D2939]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#D0D5DD]">
                      Category
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value} // Use value for controlled component
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-[#171F2F] border-gray-300 dark:border-[#1D2939]">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939]">
                        {categories.map((cat) => (
                          <SelectItem
                            key={cat.id}
                            value={cat.id}
                            className="dark:text-[#D0D5DD] dark:focus:bg-[#1C2433]"
                          >
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}{" "}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 3. Updated SortableImage to include Expand button
const SortableImage = ({
  image,
  index,
  onDelete,
  onEdit,
  onView, // Added onView to props destructuring
}: {
  image: HotelImage;
  index: number;
  onDelete: (image: HotelImage) => void;
  onView: (image: HotelImage) => void;
  onEdit: (image: HotelImage) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const bentoSpanClasses = [
    "col-span-2 row-span-2",
    "col-span-1 row-span-1",
    "col-span-1 row-span-2",
    "col-span-1 row-span-1",
    "col-span-2 row-span-1",
  ];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "group relative overflow-hidden rounded-xl shadow transition-all duration-300 hover:shadow-md hover:scale-[1.02] dark:border-[#1D2939] touch-none",
        bentoSpanClasses[index % 5]
      )}
    >
      <img
        src={image.image}
        alt={image.caption}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300"
        )}
      />
      <div className="absolute bottom-0 left-0 p-4 text-white w-full">
        <p className="font-bold text-sm truncate">{image.caption}</p>
        <p className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {image.tag}
        </p>
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        {/* --- NEW EXPAND BUTTON --- */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
          onClick={(e) => {
            e.stopPropagation();
            onView(image);
          }}
        >
          <IoMdExpand className="h-4 w-4" />
        </Button>
        {/* --- END NEW BUTTON --- */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 cursor-grab"
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(image);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
        {/* 1. Delete button (already correct) */}
        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8 rounded-full bg-red-600/80 text-white hover:bg-red-700/90"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

// --- MAIN HOTEL GALLERY COMPONENT ---
export default function HotelGallery() {
  const [activeTab, setActiveTab] = useState("all");
  const [lightboxImage, setLightboxImage] = useState<HotelImage | null>(null);
  const { hotel } = useHotel();
  const queryClient = useQueryClient();
  const [displayedImages, setDisplayedImages] = useState<HotelImage[]>([]);
  const [editingImage, setEditingImage] = useState<HotelImage | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    error: categoriesError,
  } = useQuery<ImageCategory[]>({
    queryKey: ["imageCategories"],
    queryFn: api.getImageCategories,
  });

  const {
    data: images = [],
    isLoading: isLoadingImages,
    isError: isImagesError,
    error: imagesError,
  } = useQuery<HotelImage[]>({
    queryKey: ["hotelImages", hotel?.id],
    queryFn: () => api.getHotelImages(hotel!.id),
    enabled: !!hotel?.id,
  });

  // 1. Delete mutation (already correct)
  const { mutate: deleteImageMutate } = useMutation({
    mutationFn: api.deleteHotelImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelImages"] });
      toast.success("Image deleted successfully.");
    },
    onError: (e) => toast.error(`Error deleting image: ${e.message}`),
  });

  // 2. Update mutation
  const { mutate: updateImageMutate, isPending: isUpdatingImage } = useMutation(
    {
      mutationFn: api.updateHotelImage,
      onSuccess: () => {
        toast.success("Image details updated successfully.");
        queryClient.invalidateQueries({ queryKey: ["hotelImages", hotel?.id] });
        setEditingImage(null);
      },
      onError: (e) => toast.error(`Failed to update image: ${e.message}`),
    }
  );

  // 1. Delete handler (already correct)
  const handleDeleteImage = (image: HotelImage) => {
    Swal.fire({
      title: "Are you sure?",
      text: `This will permanently delete the image "${image.caption}". This action cannot be undone.`,
      imageUrl: image.image,
      imageHeight: 200,
      imageAlt: image.caption,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      background: document.body.classList.contains("dark") ? "#101828" : "#fff",
      color: document.body.classList.contains("dark") ? "#D0D5DD" : "#000",
    }).then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed) {
        deleteImageMutate(image.id);
      }
    });
  };

  const filteredImages = useMemo(() => {
    if (activeTab === "all") return images;
    return images.filter(
      (image) =>
        image.category === categories.find((c) => c.name === activeTab)?.id
    );
  }, [activeTab, images, categories]);

  useEffect(() => {
    setDisplayedImages(filteredImages);
  }, [filteredImages]);

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setDisplayedImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  if (isCategoriesError || isImagesError || !hotel) {
    const error = new Error(
      [(categoriesError as Error)?.message, (imagesError as Error)?.message]
        .filter(Boolean)
        .join(" | ")
    );
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <DataLoadingError
          error={error}
          title="Hotel Service Unavailable"
          subtitle="We couldn't load the gallery data."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFDFD] dark:bg-[#101828]">
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="sticky top-0 z-10 bg-[#F9FAFB] dark:bg-[#101828] py-4 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-4">
            {isLoadingCategories ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="overflow-x-auto pb-2 flex-1">
                <div className="flex items-center gap-2 w-max">
                  <Button
                    onClick={() => setActiveTab("all")}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold shadow-none transition-all duration-200",
                      activeTab === "all"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-[#1D2939] border border-gray-200 bg-white hover:bg-gray-100 dark:text-[#98A2B3] dark:hover:bg-[#1C2433] dark:bg-[#171F2F] dark:border-[#1D2939]"
                    )}
                  >
                    All
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      onClick={() => setActiveTab(category.name)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold shadow-none transition-all duration-200",
                        activeTab === category.name
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "text-[#1D2939] border border-gray-200 bg-white hover:bg-gray-100 dark:text-[#98A2B3] dark:hover:bg-[#1C2433] dark:bg-[#171F2F] dark:border-[#1D2939]"
                      )}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Page Header with Title, Subtitle, and Add Button --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-[#D0D5DD]">
              Hotel Gallery
            </h2>
            <p className="text-sm text-gray-600 dark:text-[#98A2B3]">
              Manage your hotel's images and categories.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            {hotel && (
              <AddImageDialog categories={categories} hotelId={hotel.id} />
            )}
          </div>
        </div>

        <div>
          {isLoadingImages ? (
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="rounded-xl h-full w-full" />
              ))}
            </div>
          ) : displayedImages.length === 0 ? (
            <Card className="text-center py-16 bg-white dark:bg-[#171F2F] border-gray-200 dark:border-[#1D2939]">
              <CardContent>
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-[#5D636E]" />
                <h3 className="mt-4 text-lg font-semibold dark:text-[#D0D5DD]">
                  No Images Found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground dark:text-[#98A2B3]">
                  There are no images in this category. Try adding one!
                </p>
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayedImages}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-4">
                  {displayedImages.map((image, index) => (
                    <SortableImage
                      key={image.id}
                      image={image}
                      index={index}
                      onDelete={handleDeleteImage}
                      onView={setLightboxImage} // 3. Pass setLightboxImage to onView
                      onEdit={setEditingImage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>
      <EditImageDialog
        isOpen={!!editingImage}
        onOpenChange={(open) => !open && setEditingImage(null)}
        image={editingImage}
        categories={categories}
        onSave={updateImageMutate} // 2. Pass the update mutation
        isSaving={isUpdatingImage}
      />
      {/* 3. Lightbox (already correct) */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setLightboxImage(null)}
          >
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30"
              onClick={() => setLightboxImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <motion.img
              layoutId={lightboxImage.id}
              src={lightboxImage.image}
              alt={lightboxImage.caption}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
