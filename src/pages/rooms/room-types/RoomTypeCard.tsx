// src/pages/rooms/components/RoomTypeCard.tsx
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BedDouble, Users, Maximize, Star, Eye } from "lucide-react";
import type { DetailedRoomType } from "./types";
import { HiOutlineTicket } from "react-icons/hi2";
// Import Progress component
import { Progress } from "@/components/ui/progress";

interface RoomTypeCardProps {
  room: DetailedRoomType;
  variant: "hotel" | "safaripro";
}

export function RoomTypeCard({ room, variant }: RoomTypeCardProps) {
  const navigate = useNavigate();

  // Calculation for occupancy percentage
  const occupancyPercentage =
    room.room_count > 0 && room.room_availability >= 0 // Ensure valid numbers
      ? ((room.room_count - room.room_availability) / room.room_count) * 100
      : 0;

  // Ensure percentage is within 0-100 range
  const validOccupancyPercentage = Math.max(
    0,
    Math.min(100, occupancyPercentage)
  );

  // Function to get the progress bar color based on percentage
  const getOccupancyColor = (percentage: number): string => {
    if (percentage > 80) return "bg-red-500"; // High occupancy
    if (percentage > 50) return "bg-yellow-500"; // Medium occupancy
    return "bg-green-500"; // Low occupancy
  };

  return (
    // Applied shadow-none, removed hover effects
    <Card className="group relative overflow-hidden bg-[#FFF] border border-[#E4E7EC] dark:border-[#1D2939] dark:bg-[#171F2F] shadow-none transition-colors duration-300 flex flex-col h-full">
      {" "}
      {/* Added flex flex-col h-full */}
      {/* Removed Image Section */}
      {/* Content Section */}
      {/* Adjusted padding, added flex-grow */}
      <div className="p-4 space-y-4 flex-grow flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Adjusted font size */}
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white tracking-tight line-clamp-1">
              {room.name}
            </CardTitle>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              {/* Applied shadow-none */}
              <Badge
                variant="secondary"
                className="text-xs bg-[#D6EEF9] dark:bg-[#B4E6F5]/30 text-[#0785CF] dark:text-[#0785CF] border-0 shadow-none"
              >
                {room.bed_type} Bed
              </Badge>
              {room.size_sqm && (
                // Applied shadow-none
                <Badge
                  variant="outline"
                  className="text-xs border-gray-200 dark:border-gray-700 shadow-none"
                >
                  {room.size_sqm}m²
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                ${parseFloat(room.base_price).toFixed(0)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                /night
              </span>
            </div>
            {/* Conditionally show Rating for safaripro variant if available */}
            {variant === "safaripro" && room.average_rating && (
              <div className="flex items-center justify-end gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                <span>{parseFloat(room.average_rating).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <CardContent className="p-0 flex-grow">
          {" "}
          {/* Added flex-grow */}
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
            {" "}
            {/* Increased line-clamp */}
            {room.description ||
              "Experience comfort and luxury with premium amenities."}
          </p>
        </CardContent>

        {/* Room Features */}
        <div className="grid grid-cols-3 gap-3 text-center pt-2">
          {" "}
          {/* Added pt-2 */}
          {/* Added shadow-none */}
          <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-none">
            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {room.max_occupancy} Guests
            </span>
          </div>
          {/* Added shadow-none */}
          <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-none">
            <BedDouble className="h-4 w-4 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
            {/* Display relevant count based on variant */}
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {/* Show Available for Hotel Variant */}
              {variant === "hotel"
                ? `${room.room_availability} Avail.`
                : `${room.room_count} Total`}
            </span>
          </div>
          {room.size_sqm && (
            // Added shadow-none
            <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-none">
              <Maximize className="h-4 w-4 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {room.size_sqm}m²
              </span>
            </div>
          )}
        </div>

        {/* Amenities Preview */}
        {room.amenities_details && room.amenities_details.length > 0 && (
          <div className="space-y-2 pt-2">
            {" "}
            {/* Added pt-2 */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Top Amenities:
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {room.amenities_details.slice(0, 4).map(
                (
                  amenity // Show up to 4
                ) => (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400"
                  >
                    {/* Consistent Star icon */}
                    <Star className="h-3 w-3 text-[#0785CF] dark:text-[#0785CF] fill-current" />
                    <span>{amenity.name}</span>
                  </div>
                )
              )}
              {room.amenities_details.length > 4 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  + {room.amenities_details.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Occupancy Indicator (Hotel view only) */}
        {variant === "hotel" && (
          <div className="space-y-2 pt-2">
            {" "}
            {/* Added pt-2 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                {/* Updated label to show counts */}
                Occupancy ({room.room_count - room.room_availability} /{" "}
                {room.room_count})
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {Math.round(validOccupancyPercentage)}%
              </span>
            </div>
            {/* Replaced div with Progress component and added color logic */}
            <Progress
              value={validOccupancyPercentage}
              className="h-2 shadow-none [&>div]:rounded-full"
              indicatorClassName={getOccupancyColor(validOccupancyPercentage)} // Apply color class here
            />
          </div>
        )}

        {/* Action Buttons (Hotel view only) - Placed at the bottom */}
        {variant === "hotel" && (
          <CardFooter className="p-0 pt-4 flex gap-3 mt-auto">
            {" "}
            {/* Added mt-auto */}
            {/* Applied shadow-none */}
            <Button
              onClick={() => navigate("/bookings/new-booking")}
              variant="default" // Changed variant for primary action
              className="flex-1 bg-[#0785CF] hover:bg-[#0785CF]/90 text-[#FFF] rounded-lg font-medium shadow-none transition-all duration-300 cursor-pointer"
            >
              <HiOutlineTicket className="h-4 w-4 mr-2" />
              Book Now
            </Button>
            {/* Applied shadow-none */}
            <Button
              // Navigate to filtered room list? Requires passing room type ID
              onClick={() =>
                navigate(`/rooms/hotel-rooms?roomTypeId=${room.id}`)
              }
              variant={"outline"}
              className="text-[#0785CF] dark:text-[#0785CF] hover:text-[#0785CF] dark:hover:text-[#0785CF] dark:border-[#1D2939] border-gray-200 px-4 font-medium shadow-none transition-all duration-300 cursor-pointer hover:bg-[#D6EEF9] dark:hover:bg-[#1C2433] rounded-lg"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Rooms
            </Button>
          </CardFooter>
        )}
      </div>
    </Card>
  );
}
