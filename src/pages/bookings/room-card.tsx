// src/pages/bookings/room-card.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import hotelClient from "@/api/hotel-client";
import { type AvailableRoom, type DetailedRoom } from "./booking-types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Star,
  Users,
  Building,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Car,
  Coffee,
  Sparkles, // CHANGED: Replaced Eye with Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // Import cn utility

interface RoomCardProps {
  room: AvailableRoom;
  duration: number;
  onSelectRoom: (room: AvailableRoom) => void;
}

export default function RoomCard({
  room,
  duration,
  onSelectRoom,
}: RoomCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const {
    data: detailedRoom,
    isLoading,
    isError,
  } = useQuery<DetailedRoom>({
    queryKey: ["detailedRoom", room.room_id],
    queryFn: async () => {
      const response = await hotelClient.get(`/rooms/${room.room_id}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <RoomCardSkeleton />;
  if (isError || !detailedRoom) return <RoomCardError />;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? detailedRoom.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === detailedRoom.images.length - 1 ? 0 : prev + 1
    );
  };

  const totalCostWithTaxes = detailedRoom.price_per_night * 1.27 * duration;
  const rating = parseFloat(detailedRoom.average_rating);
  const topAmenities = detailedRoom.amenities.slice(0, 5); // CHANGED: Show 5 amenities

  // Amenity icons mapping
  const amenityIcons: { [key: string]: React.ReactNode } = {
    wifi: <Wifi className="h-3 w-3" />,
    parking: <Car className="h-3 w-3" />,
    breakfast: <Coffee className="h-3 w-3" />,
    // Add more mappings here based on amenity codes
  };

  // Check if images array exists and has content
  const hasImages = detailedRoom.images && detailedRoom.images.length > 0;
  const displayImage = hasImages
    ? detailedRoom.images[currentImageIndex]?.image_url
    : detailedRoom.image; // CHANGED: Use image_url and fallback to root image

  return (
    <Card className="group transition-all duration-300 border-[1px] border-gray-200 dark:border-gray-700 overflow-hidden shadow-none">
      <div className="flex flex-col lg:flex-row">
        {/* Image Gallery */}
        <div className="relative lg:w-2/5 xl:w-1/3 overflow-hidden rounded-t-lg lg:rounded-l-lg lg:rounded-t-none">
          <img
            src={
              displayImage ||
              "https://placehold.co/600x400/EEE/31343C?text=No+Image"
            }
            alt={detailedRoom.room_type_name}
            className="w-full h-64 lg:h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Image Navigation */}
          {hasImages && detailedRoom.images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full h-9 w-9 bg-black/40 hover:bg-black/60 border-none text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full h-9 w-9 bg-black/40 hover:bg-black/60 border-none text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Image Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
                {detailedRoom.images.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      currentImageIndex === index
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/60"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Room Code Badge */}
          <Badge className="absolute top-3 left-3 bg-black/70 text-white border-none backdrop-blur-sm">
            {detailedRoom.code}
          </Badge>
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-6">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
              <div className="flex-1 mb-3 sm:mb-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {detailedRoom.room_type_name}
                </h3>

                {/* Rating and Occupancy */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({detailedRoom.review_count} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    {detailedRoom.max_occupancy} guests
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Building className="w-4 h-4" />
                    Floor {detailedRoom.floor_number}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="text-left sm:text-right sm:pl-4 flex-shrink-0">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${totalCostWithTaxes.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  for {duration} night{duration > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  ${detailedRoom.price_per_night}/night
                </p>
              </div>
            </div>

            {/* Amenities */}
            {topAmenities.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {topAmenities.map((amenity) => (
                    <Badge
                      key={amenity.id}
                      variant="secondary"
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs"
                    >
                      {amenityIcons[amenity.code?.toLowerCase() || ""] || (
                        <Sparkles className="h-3 w-3" /> // CHANGED: Fallback icon
                      )}
                      {amenity.name}
                    </Badge>
                  ))}
                  {/* REMOVED: "+X more" badge */}
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
              {detailedRoom.description ||
                "A comfortable and well-appointed room for your stay."}
            </p>

            {/* Action */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t-[1px] border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 sm:mb-0">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  Available
                </span>
                <span className="ml-2">• Free cancellation</span>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 w-full sm:w-auto rounded-full"
                onClick={() => onSelectRoom(room)}
              >
                Select Room
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function RoomCardSkeleton() {
  return (
    <Card className="border-[1px] border-gray-200 dark:border-gray-700 shadow-none">
      <div className="flex flex-col lg:flex-row">
        <Skeleton className="h-64 lg:h-auto lg:w-2/5 xl:w-1/3" />
        <CardContent className="flex-1 p-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex justify-between items-center pt-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function RoomCardError() {
  return (
    <Card className="border-[1px] border-red-200 dark:border-red-800 shadow-none">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Room Unavailable
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">
            We're having trouble loading this room's details. Please try again
            later.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
