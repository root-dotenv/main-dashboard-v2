// src/pages/rooms/HotelRoomTypes.tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { Loader, BedDouble, Building, BarChart3 } from "lucide-react";
import ErrorPage from "@/components/custom/error-page";
import { useHotel } from "@/providers/hotel-provider";
import type { DetailedRoomType } from "./types";
import hotelClient from "@/api/hotel-client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { RoomTypeCard } from "./RoomTypeCard";

export default function HotelRoomTypes() {
  const {
    hotel,
    isLoading: isHotelLoading,
    isError: isHotelError,
    refetch: refetchHotel,
    error: hotelError,
  } = useHotel();

  const roomTypeIds = useMemo(
    () => hotel?.room_type.map((rt) => rt.id) ?? [],
    [hotel]
  );

  const {
    data: detailedRoomTypes,
    isLoading: areDetailsLoading,
    isError: isDetailsError,
    error: detailsError,
    refetch: refetchDetails,
  } = useQuery<DetailedRoomType[]>({
    queryKey: ["hotelRoomTypesDetails", roomTypeIds],
    queryFn: async () => {
      if (roomTypeIds.length === 0) return [];
      const promises = roomTypeIds.map((id) =>
        hotelClient.get(`room-types/${id}`)
      );
      const responses = await Promise.all(promises);
      return responses.map((res) => res.data);
    },
    enabled: !!hotel && roomTypeIds.length > 0,
  });

  if (isHotelLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-[#0785CF]" />
      </div>
    );
  }
  if (isHotelError) {
    return <ErrorPage error={hotelError as Error} onRetry={refetchHotel} />;
  }
  if (isDetailsError) {
    return <ErrorPage error={detailsError as Error} onRetry={refetchDetails} />;
  }
  if (!hotel) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-[#98A2B3]">
        No hotel data available.
      </div>
    );
  }

  const summaryStats = [
    {
      title: "Total Room Types",
      value: hotel.room_type.length,
      icon: Building,
    },
    {
      title: "Total Rooms Available",
      value: hotel.summary_counts.available_rooms,
      icon: BedDouble,
    },
    {
      title: "Occupancy Rate",
      value: `${hotel.availability_stats.occupancy_rate.toFixed(1)}%`,
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="w-full flex">
        {summaryStats.map((stat, index) => (
          <div
            key={stat.title}
            className={cn(
              "bg-white dark:bg-[#171F2F] w-full flex items-center border border-[#E4E7EC] dark:border-[#1D2939] px-4 py-6 shadow-xs",
              index === 0 && "rounded-l-md",
              index > 0 && "border-l-0",
              index === summaryStats.length - 1 && "rounded-r-md"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#EFF6FF] dark:bg-[#162142] rounded-full">
                <stat.icon className="h-5 w-5 text-[#0785CF] dark:text-[#7592FF]" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-[#98A2B3]">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
          Room Types in This Hotel
        </h3>
        <p className="text-base text-gray-600 dark:text-[#98A2B3] mt-1">
          A detailed overview of all room types available at your property.
        </p>
      </div>

      {areDetailsLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 animate-spin text-[#0785CF]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {detailedRoomTypes?.map((room) => (
            <RoomTypeCard key={room.id} room={room} variant="hotel" />
          ))}
        </div>
      )}
    </div>
  );
}
