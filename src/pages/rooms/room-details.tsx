// src/pages/rooms/room-details.tsx
"use client";
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useHotel } from "../../providers/hotel-provider";
import hotelClient from "../../api/hotel-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ErrorPage from "@/components/custom/error-page";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import {
  BookCheck,
  CheckCircle,
  Wrench,
  Loader,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowLeft,
  TrendingUp,
  Star,
  Share2,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { FiMoreVertical, FiEdit2 } from "react-icons/fi";
import { TbFileTypeCsv, TbStack3 } from "react-icons/tb";
import { RiCheckboxCircleLine } from "react-icons/ri";
import { BsCurrencyDollar } from "react-icons/bs";
import { LuInfo } from "react-icons/lu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditRoomForm } from "./edit-room-dialog";

// --- TYPE DEFINITIONS ---
interface Amenity {
  id: string;
  name: string;
  code?: string;
  description?: string;
  icon?: string;
}

interface GalleryImage {
  id: string;
  // --- FIX: Based on API response, this should be 'image' ---
  image: string;
  image_url?: string; // Add this field based on API
  code?: string;
}

interface Review {
  id: string;
  authorName: string;
  authorAvatarUrl: string;
  rating: number;
  createdAt: string;
  title: string;
  body: string;
}

interface RoomDetails {
  id: string;
  code: string;
  description: string;
  image: string; // This is the Primary Image URL
  images: GalleryImage[]; // This is the Gallery Image array
  max_occupancy: number;
  price_per_night: number;
  availability_status: "Available" | "Booked" | "Maintenance";
  room_type_id: string;
  room_type_name: string;
  amenities: Amenity[];
  room_amenities: string[];
  floor_number?: number;
  average_rating?: string;
  review_count?: number;
  created_at: string;
  updated_at: string;
  reviews?: Review[];
}

// --- MOCK DATA FOR REVIEWS ---
const mockReviews: Review[] = [
  // ... (mock data remains unchanged) ...
  {
    id: "rev_1",
    authorName: "Elena V.",
    authorAvatarUrl: "https://i.pravatar.cc/48?u=1",
    rating: 5,
    createdAt: "2025-09-15T10:00:00Z",
    title: "Absolutely Perfect Stay!",
    body: "The room was spotless and beautifully decorated. Had everything we needed and more. The view was breathtaking. Will definitely be coming back!",
  },
];

export default function RoomDetailsPage() {
  const { room_id } = useParams<{ room_id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false);

  // --- ENHANCEMENT 1: Replaced SweetAlert with Shadcn AlertDialog ---
  const handleSheetOpenChange = (open: boolean) => {
    if (!open && isFormDirty) {
      setShowUnsavedChangesDialog(true);
      return; // Prevent sheet from closing
    }
    setIsSheetOpen(open);
    if (!open) {
      setIsFormDirty(false); // Reset dirty state when closed
    }
  };

  const handleDiscardChanges = () => {
    setIsFormDirty(false);
    setIsSheetOpen(false);
    setShowUnsavedChangesDialog(false); // Close dialog
  };
  // --- End of Enhancement ---

  const { hotel } = useHotel();
  const {
    data: room,
    isLoading,
    isError,
    refetch,
    error,
  } = useQuery<RoomDetails>({
    queryKey: ["roomDetails", room_id],
    queryFn: async () => (await hotelClient.get(`rooms/${room_id}`)).data,
    enabled: !!room_id,
  });

  // --- MODIFICATION: Updated gallery logic to match API response ---
  const galleryImages = useMemo(() => {
    if (!room) return []; // Return empty array if no room

    const allImages: string[] = [];

    // 1. Add the primary image (from `room.image`)
    if (room.image) {
      allImages.push(room.image);
    }

    // 2. Add the gallery images (from `room.images` array, using `img.image`)
    if (room.images && Array.isArray(room.images)) {
      room.images.forEach((imgObj) => {
        // Use 'image' field from the object, as per API response
        if (imgObj.image && imgObj.image !== room.image) {
          // Avoid duplicates
          allImages.push(imgObj.image);
        }
      });
    }

    // If no images were found at all, add one placeholder
    if (allImages.length === 0) {
      allImages.push("https://placehold.co/600x400");
    }

    // Pad with placeholders up to 4, as per original logic
    const resultImages = [...allImages];
    while (resultImages.length < 4 && resultImages.length > 0) {
      resultImages.push("https://placehold.co/600x400");
    }

    // Return exactly 4 images, or all images if more than 4
    return allImages.length >= 4
      ? allImages.slice(0)
      : resultImages.slice(0, 4);
  }, [room]);
  // --- END MODIFICATION ---

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      hotelClient.patch(`/rooms/${room_id}/`, { availability_status: status }),
    onSuccess: () => {
      toast.success("Room status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["roomDetails", room_id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (error: any) => {
      toast.error(
        `Failed to update status: ${
          error.response?.data?.detail || error.message
        }`
      );
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: () => hotelClient.delete(`/rooms/${room_id}/`),
    onSuccess: () => {
      toast.success("Room deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate(-1);
    },
    onError: (error: any) => {
      toast.error(
        `Failed to delete room: ${
          error.response?.data?.detail || error.message
        }`
      );
    },
  });

  const handleDeleteRoom = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this! This action will permanently delete the room.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteRoomMutation.mutate();
      }
    });
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const statusConfig = {
    Available: {
      color: "text-emerald-700 dark:text-green-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/50",
      borderColor: "border-emerald-200 dark:border-emerald-700/60",
    },
    Booked: {
      color: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/50",
      borderColor: "border-amber-200 dark:border-amber-700/60",
    },
    Maintenance: {
      color: "text-rose-700 dark:text-rose-400",
      bgColor: "bg-rose-100 dark:bg-rose-900/50",
      borderColor: "border-rose-200 dark:border-rose-700/60",
    },
  };

  const renderStatusActions = () => {
    switch (room?.availability_status) {
      case "Available":
        return (
          <>
            <DropdownMenuItem
              onClick={() => updateStatusMutation.mutate({ status: "Booked" })}
              className="flex items-center py-3 cursor-pointer"
            >
              <BookCheck className="mr-3 h-4 w-4 text-amber-600" />
              <div>
                <p className="font-medium">Mark as Booked</p>
                <p className="text-xs text-gray-500 dark:text-[#98A2B3]">
                  Temporarily unavailable
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="dark:bg-[#1D2939]" />
            <DropdownMenuItem
              onClick={() =>
                updateStatusMutation.mutate({ status: "Maintenance" })
              }
              className="flex items-center py-3 cursor-pointer"
            >
              <Wrench className="mr-3 h-4 w-4 text-rose-600" />
              <div>
                <p className="font-medium">Mark as Maintenance</p>
                <p className="text-xs text-gray-500 dark:text-[#98A2B3]">
                  Under maintenance
                </p>
              </div>
            </DropdownMenuItem>
          </>
        );
      case "Booked":
      case "Maintenance":
        return (
          <DropdownMenuItem
            onClick={() => updateStatusMutation.mutate({ status: "Available" })}
            className="flex items-center py-3 cursor-pointer"
          >
            <CheckCircle className="mr-3 h-4 w-4 text-emerald-600" />
            <div>
              <p className="font-medium">Mark as Available</p>
              <p className="text-xs text-gray-500 dark:text-[#98A2B3]">
                Ready for booking
              </p>
            </div>
          </DropdownMenuItem>
        );
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              "h-4 w-4",
              index < fullStars
                ? "text-yellow-400 fill-current"
                : index === fullStars && hasHalfStar
                ? "text-yellow-400 fill-current opacity-50"
                : "text-gray-300 dark:text-gray-600"
            )}
          />
        ))}
      </div>
    );
  };

  const reviewSummary = useMemo(() => {
    const totalReviews = mockReviews.length;
    if (totalReviews === 0) {
      return {
        average: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }
    const totalRating = mockReviews.reduce((sum, r) => sum + r.rating, 0);
    const average = totalRating / totalReviews;
    const distribution = mockReviews.reduce(
      (acc, review) => {
        const rating = Math.floor(review.rating);
        acc[rating]++;
        return acc;
      },
      { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>
    );
    return { average, distribution };
  }, []);

  if (isLoading || !hotel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF] dark:bg-[#101828]">
        <div className="relative">
          <Loader className="h-12 w-12 animate-spin text-[#0785CF]" />
          <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-400 opacity-20"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorPage error={error as Error} onRetry={refetch} />;
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#101828]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#D0D5DD] mb-2">
            Room Not Found
          </h2>
          <p className="text-gray-600 dark:text-[#98A2B3] mb-4">
            The room you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => window.history.back()}
            className="inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const shareRoom = () => {
    if (navigator.share) {
      navigator.share({
        title: `${hotel?.name} - ${room?.room_type_name}`,
        text: room?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInDays = Math.floor(diffInSeconds / 86400);

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#101828]">
        <div className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-40">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-3 text-sm text-gray-500 dark:text-[#98A2B3]">
              <button
                onClick={() => window.history.back()}
                className="hover:text-[#0785CF] transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Rooms
              </button>
              <span>/</span>
              <span className="text-gray-900 font-medium dark:text-[#D0D5DD]">
                {room.room_type_name}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-x-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-[#D0D5DD]">
                    {hotel.name} - {room.room_type_name}
                  </h1>
                  <div
                    className={cn(
                      "flex items-center rounded-md px-3 py-[3px] text-[13px] font-medium border",
                      statusConfig[room.availability_status]?.bgColor,
                      statusConfig[room.availability_status]?.color,
                      statusConfig[room.availability_status]?.borderColor
                    )}
                  >
                    <span>{room.availability_status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-[#98A2B3] flex-wrap">
                  <span className="flex items-center gap-1">
                    {renderStars(parseFloat(room.average_rating || "0"))}
                    <span className="ml-1">
                      ({room.review_count || 0} reviews)
                    </span>
                  </span>
                  <span>
                    <strong>Room Code:</strong> {room.code}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Updated: {new Date(room.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={shareRoom}
                  className="rounded-full border-gray-300 dark:border-[#1D2939] dark:bg-[#171F2F] dark:hover:bg-[#1C2433]"
                >
                  <Share2 className="h-4 w-4 text-gray-500 dark:text-[#98A2B3]" />
                </Button>
                <SheetTrigger asChild>
                  <Button
                    variant={"ghost"}
                    className="rounded-full flex items-center gap-2 border border-gray-300 font-medium transition-all text-[#697282] cursor-pointer dark:border-[#1D2939] dark:bg-[#171F2F] dark:hover:bg-[#1C2433] dark:text-[#D0D5DD]"
                  >
                    <FiEdit2 className="h-4 w-4" />
                    Edit Room
                  </Button>
                </SheetTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-gray-300 dark:border-[#1D2939] dark:bg-[#171F2F] dark:hover:bg-[#1C2433]"
                    >
                      <FiMoreVertical className="h-4 w-4 dark:text-[#98A2B3]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white dark:bg-[#101828] dark:border-[#1D2939] shadow-xl rounded-lg w-64 p-2"
                  >
                    <DropdownMenuGroup>
                      {renderStatusActions()}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="dark:bg-[#1D2939]" />
                    <DropdownMenuItem
                      onClick={handleDeleteRoom}
                      className="flex items-center py-3 cursor-pointer rounded-md text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/50 dark:focus:text-red-400"
                    >
                      <Trash2 className="mr-3 h-4 w-4" />
                      <div>
                        <p className="font-medium">Delete Room</p>
                        <p className="text-xs text-gray-500 dark:text-[#98A2B3]">
                          Permanently remove this room
                        </p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="dark:bg-[#1D2939]" />
                    <DropdownMenuItem className="flex items-center py-3 cursor-pointer rounded-md">
                      <TbFileTypeCsv className="mr-3 h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="font-medium">Export Details CSV</p>
                        <p className="text-xs text-gray-500 dark:text-[#98A2B3]">
                          Download room data
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-full flex flex-col lg:flex-row items-start gap-8">
            <div className="w-full lg:w-[55%] xl:w-[50%] flex-shrink-0 space-y-4 lg:sticky lg:top-36">
              <div className="relative group rounded-xl overflow-hidden shadow-sm border dark:border-[#1D2939]">
                {/* --- MODIFICATION: Check galleryImages length --- */}
                <img
                  src={
                    galleryImages[activeImageIndex] ||
                    "https://placehold.co/600x400"
                  }
                  alt={`Room view ${activeImageIndex + 1}`}
                  className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/5 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />

                <span className="absolute bottom-4 left-4 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {activeImageIndex + 1} / {galleryImages.length}
                </span>

                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-12 w-12 text-white" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-12 w-12 text-white" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {galleryImages.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        activeImageIndex === index
                          ? "w-6 bg-white"
                          : "w-2 bg-white/60"
                      )}
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={cn(
                      "relative rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105",
                      activeImageIndex === index
                        ? "border-[#B4E6F5]500 shadow-md"
                        : "border-transparent dark:border-gray-800"
                    )}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-20 md:h-24 object-cover"
                      loading="lazy"
                    />
                    <div
                      className={cn(
                        "absolute inset-0 transition-opacity duration-200",
                        activeImageIndex === index
                          ? "bg-[#0785CF]/20"
                          : "bg-black/0 hover:bg-black/10"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[45%] xl:w-[50%] space-y-6">
              <div className="w-full flex px-0 py-0">
                <div className="bg-[#FFF] dark:bg-[#171F2F] w-full flex items-center border border-[#E4E7EC] dark:border-[#1D2939] rounded-l-md px-4 py-6 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#EFF6FF] dark:bg-[#162142] rounded-full">
                      <BsCurrencyDollar className="h-5 w-5 text-[#0785CF] dark:text-[#7592FF]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-[#98A2B3]">
                        Price
                      </p>
                      <p className="text-2xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
                        ${(room.price_per_night ?? 0).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#FFF] dark:bg-[#171F2F] w-full flex items-center border border-[#E4E7EC] dark:border-[#1D2939] rounded-none px-4 py-6 shadow-xs">
                  <div className="flex items-center gap-5">
                    <div className="p-2 bg-[#EFF6FF] dark:bg-[#162142] rounded-full">
                      <Users className="h-5 w-5 text-[#0785CF] dark:text-[#7592FF]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-[#98A2B3]">
                        Guests
                      </p>
                      <p className="text-2xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
                        {room.max_occupancy}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#FFF] dark:bg-[#171F2F] w-full flex items-center border border-[#E4E7EC] dark:border-[#1D2939] rounded-none px-4 py-6 shadow-xs">
                  <div className="flex items-center gap-5">
                    <div className="p-2 bg-[#EFF6FF] dark:bg-[#162142] rounded-full">
                      <TbStack3 className="h-5 w-5 text-[#0785CF] dark:text-[#7592FF]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-[#98A2B3]">
                        Floor
                      </p>
                      <p className="text-2xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
                        {room.floor_number || 1}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#FFF] dark:bg-[#171F2F] w-full flex items-center border border-[#E4E7EC] dark:border-[#1D2939] rounded-r-md px-4 py-6 shadow-xs">
                  <div className="flex items-center gap-5">
                    <div className="p-2 bg-[#EFF6FF] dark:bg-[#162142] shadow-xs rounded-full">
                      <TrendingUp className="h-5 w-5 text-[#0785CF] dark:text-[#7592FF]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-[#98A2B3]">
                        Rating
                      </p>
                      <p className="text-2xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
                        {room.average_rating
                          ? parseFloat(room.average_rating).toFixed(1)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="shadow-xs dark:bg-[#1D2939]" />

              <div className="bg-[#FFF] dark:bg-[#171F2F] border-[1.25px] shadow-xs border-[#E4E7EC] dark:border-[#1D2939] rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-[#D0D5DD] mb-3">
                    About this Room:
                  </h3>
                  <p className="text-gray-600 dark:text-[#98A2B3] leading-relaxed">
                    {room.description}
                  </p>
                </div>
                <Separator className="dark:bg-[#1D2939]" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-[#D0D5DD] mb-4">
                    Key Features:
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-700 dark:text-[#98A2B3]">
                      <RiCheckboxCircleLine className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>
                        Maximum occupancy: {room.max_occupancy} guests
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 dark:text-[#98A2B3]">
                      <RiCheckboxCircleLine className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Located on floor {room.floor_number || 1}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 dark:text-[#98A2B3]">
                      <RiCheckboxCircleLine className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Room type: {room.room_type_name}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-[#1D2939] pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-[#D0D5DD] mb-4">
                    Room Amenities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {/* --- BUG FIX: Added optional chaining to prevent crash --- */}
                    {room.amenities?.map((amenity) => (
                      <span
                        key={amenity.id}
                        className="bg-[#EFF6FF] text-[#0785CF] border border-[#B4E6F5]200 rounded-full px-4 py-2 text-sm font-medium hover:from-blue-100 hover:to-indigo-100 transition-all cursor-default dark:bg-[#162142]  dark:border-[#162142] dark:text-[#98A2B3]"
                      >
                        {amenity.name}
                      </span>
                    ))}
                  </div>
                </div>

                <Separator className="dark:bg-[#1D2939]" />
                <div className="pt-4">
                  {room.availability_status === "Available" ? (
                    <button
                      className="w-fit rounded-full bg-[#0785CF] hover:bg-[#0785CF]/90 text-white font-medium px-8 py-3"
                      onClick={() => toast.success("Room booking initiated!")}
                    >
                      Book Room
                    </button>
                  ) : (
                    <div className="text-center w-full bg-[#FEFCE8] dark:bg-amber-900/40 text-[#27272B] dark:text-amber-300 font-medium py-3 px-4 rounded-2xl border border-[#FFF085] dark:border-amber-700/60">
                      <p className="text-sm flex items-center gap-x-2">
                        <LuInfo className={"h-4 w-4"} />
                        {room.availability_status === "Booked"
                          ? "This room is currently booked."
                          : "This room is currently under maintenance."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-12 dark:bg-[#1D2939]" />

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-[#D0D5DD] flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-[#0785CF]" />
                Guest Reviews & Ratings
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-6">
                {mockReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-[#FFF] dark:bg-[#171F2F] border-[#E4E7EC] dark:border-[#1D2939] p-8 rounded-lg border"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={review.authorAvatarUrl}
                          alt={review.authorName}
                          className="h-10 w-10 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-[#D0D5DD]">
                            {review.authorName}
                          </p>
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-[#98A2B3]">
                        {formatRelativeTime(review.createdAt)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 dark:text-[#D0D5DD]">
                        {review.title}
                      </h4>
                      <p className="text-gray-600 dark:text-[#98A2B3] leading-relaxed">
                        {review.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:sticky lg:top-36">
                <div className="bg-[#FFF] dark:bg-[#171F2F] p-6 rounded-lg border border-[#E4E7EC] dark:border-[#1D2939] shadow-xs space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-900 dark:text-[#D0D5DD]">
                      {reviewSummary.average.toFixed(1)}
                    </p>
                    {renderStars(reviewSummary.average)}
                    <p className="text-sm text-gray-500 dark:text-[#98A2B3] mt-1">
                      Based on {mockReviews.length} reviews
                    </p>
                  </div>
                  <Separator className="dark:bg-[#1D2939]" />
                  <div className="space-y-2">
                    {Object.entries(reviewSummary.distribution)
                      .reverse()
                      .map(([star, count]) => {
                        const percentage = (count / mockReviews.length) * 100;
                        return (
                          <div
                            key={star}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="text-gray-600 dark:text-[#98A2B3] w-12">
                              {star} star
                            </span>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-500 dark:text-[#98A2B3] font-medium w-8 text-right">
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 bg-white dark:bg-[#101828] border-l dark:border-l-[#1D2939]"
      >
        {room && (
          <EditRoomForm
            room={room}
            onUpdateComplete={() => {
              setIsSheetOpen(false);
              setIsFormDirty(false);
            }}
            onDirtyChange={setIsFormDirty}
          />
        )}
      </SheetContent>

      <AlertDialog
        open={showUnsavedChangesDialog}
        onOpenChange={setShowUnsavedChangesDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes!</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close? Your changes will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep editing</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-[#0785CF] hover:bg-[#0785CF]/90 transition-all"
              onClick={handleDiscardChanges}
            >
              Yes, discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
