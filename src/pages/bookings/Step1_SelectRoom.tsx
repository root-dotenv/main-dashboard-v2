"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, addDays } from "date-fns";
import { useBookingStore } from "@/store/booking.store";
import { useHotel } from "@/providers/hotel-provider";
import hotelClient from "@/api/hotel-client";
import {
  type AvailabilityRangeResponse,
  type AvailableRoom,
} from "./booking-types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  Bed,
  CalendarIcon,
  Search,
  Filter,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import RoomCard from "./room-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Step1_SelectRoom() {
  const { hotel } = useHotel();
  const { startDate, endDate, setDates, setSelectedRoom, setStep } =
    useBookingStore();

  const [checkinDate, setCheckinDate] = useState<Date | undefined>(startDate);
  const [checkoutDate, setCheckoutDate] = useState<Date | undefined>(endDate);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(
    null
  );
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedQuickDate, setSelectedQuickDate] = useState<number | null>(
    null
  );

  const {
    data: availabilityData,
    isError,
    error,
    isFetching,
  } = useQuery<AvailabilityRangeResponse>({
    queryKey: [
      "roomAvailabilitySearch",
      hotel?.id,
      checkinDate,
      checkoutDate,
      selectedRoomTypeId,
    ],
    queryFn: async () => {
      if (!hotel?.id || !checkinDate || !checkoutDate) {
        throw new Error("A valid hotel and date range are required.");
      }
      const params = new URLSearchParams({
        hotel_id: hotel.id,
        start_date: format(checkinDate, "yyyy-MM-dd"),
        end_date: format(checkoutDate, "yyyy-MM-dd"),
      });
      if (selectedRoomTypeId) {
        params.append("room_type_id", selectedRoomTypeId);
      }
      const response = await hotelClient.get(
        `rooms/availability/range/?${params.toString()}`
      );
      return response.data;
    },
    enabled: hasSearched && !!hotel?.id && !!checkinDate && !!checkoutDate,
    retry: 1,
  });

  const handleSearch = () => {
    if (!checkinDate || !checkoutDate) {
      toast.error("Please select both a start and end date.");
      return;
    }
    if (checkoutDate <= checkinDate) {
      toast.error("End date must be after the start date.");
      return;
    }
    setDates({ start: checkinDate, end: checkoutDate });
    setHasSearched(true);
    setSelectedQuickDate(null); // Reset quick date selection
  };

  const handleQuickDateSelect = (days: number) => {
    const today = new Date();
    setCheckinDate(today);
    setCheckoutDate(addDays(today, days));
    setSelectedQuickDate(days);
  };

  const handleSelectRoom = (room: AvailableRoom) => {
    setSelectedRoom(room);
    setStep(2);
    toast.success(`Selected room: ${room.room_type_name}`);
  };

  const fullyAvailableRooms =
    availabilityData?.rooms.filter((room) =>
      room.availability.every((d) => d.availability_status === "Available")
    ) ?? [];

  const quickDateOptions = [2, 3, 4, 5, 7];

  return (
    <div className="space-y-8 p-8">
      {/* Search Section */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Search className="h-6 w-6 text-[#0785CF]" />
          Search for Available Rooms
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <Label
              htmlFor="start-date"
              className="text-sm font-semibold mb-2 block"
            >
              Start Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                    !checkinDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkinDate ? (
                    format(checkinDate, "PPP")
                  ) : (
                    <span>Select start date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkinDate}
                  onSelect={(date) => {
                    setCheckinDate(date);
                    setSelectedQuickDate(null);
                  }}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="lg:col-span-2">
            <Label
              htmlFor="end-date"
              className="text-sm font-semibold mb-2 block"
            >
              End Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                    !checkoutDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkoutDate ? (
                    format(checkoutDate, "PPP")
                  ) : (
                    <span>Select end date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkoutDate}
                  onSelect={(date) => {
                    setCheckoutDate(date);
                    setSelectedQuickDate(null);
                  }}
                  disabled={(date) =>
                    checkinDate ? date <= checkinDate : date < new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isFetching}
            className="h-12 bg-[#0785CF] hover:bg-[#0785CF]/90 text-white font-semibold"
          >
            {isFetching && hasSearched ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Search Available Rooms
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Quick Select:
          </span>
          {quickDateOptions.map((days) => (
            <Badge
              key={days}
              onClick={() => handleQuickDateSelect(days)}
              className={cn(
                "cursor-pointer text-base shadow-none",
                selectedQuickDate === days
                  ? "bg-[#0785CF] text-white hover:bg-[#0785CF]/90"
                  : "text-[#0785CF] dark:text-[#0785CF] bg-[#D6EEF9] dark:bg-[#B4E6F5]/30 hover:bg-[#D6EEF9] dark:hover:bg-[#B4E6F5]/50 border border-[#B4E6F5]200 dark:border-[#B4E6F5]700/60"
              )}
            >
              {days} {days === 7 ? "Week" : "Days"}
            </Badge>
          ))}
        </div>
        <p className="text-[0.9375rem] text-gray-600 dark:text-gray-400 mt-4">
          Enter a date range to search for rooms, then click the 'Select Room'
          button on your desired room card to continue to the next step.
        </p>
      </div>

      {isError && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Search Error</p>
                <p className="text-sm">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSearched && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="col-span-1">
            <Card className="px-4 py-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg px-0 py-0">
                  <Filter className="h-5 w-5 text-[#0785CF]" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 py-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
                      Room Types
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        onClick={() => setSelectedRoomTypeId(null)}
                        className={cn(
                          "cursor-pointer text-[13px] shadow-none",
                          selectedRoomTypeId === null
                            ? "bg-[#0785CF] text-white hover:bg-[#0785CF]/90"
                            : "text-[#0785CF] dark:text-[#0785CF] bg-[#D6EEF9] dark:bg-[#B4E6F5]/30 hover:bg-[#D6EEF9] dark:hover:bg-[#B4E6F5]/50 border border-[#B4E6F5]200 dark:border-[#B4E6F5]700/60"
                        )}
                      >
                        All Types
                      </Badge>
                      {hotel?.room_type.map((type) => (
                        <Badge
                          key={type.id}
                          onClick={() => setSelectedRoomTypeId(type.id)}
                          className={cn(
                            "cursor-pointer text-[13px] shadow-none",
                            selectedRoomTypeId === type.id
                              ? "bg-[#0785CF] text-white hover:bg-[#0785CF]/90"
                              : "text-[#0785CF] dark:text-[#0785CF] bg-[#D6EEF9] dark:bg-[#B4E6F5]/30 hover:bg-[#D6EEF9] dark:hover:bg-[#B4E6F5]/50 border border-[#B4E6F5]200 dark:border-[#B4E6F5]700/60"
                          )}
                        >
                          {type.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedRoomTypeId && (
                    <div className="flex justify-start">
                      <Button
                        variant="link"
                        className="text-sm text-rose-600 p-0 h-auto flex items-center"
                        onClick={() => setSelectedRoomTypeId(null)}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Clear Filter
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3">
            {isFetching ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-[#0785CF]" />
                  </div>
                </CardContent>
              </Card>
            ) : fullyAvailableRooms.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {fullyAvailableRooms.length} Available Rooms
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Perfect accommodations for your stay
                    </p>
                  </div>
                  {selectedRoomTypeId && (
                    <div className="bg-[#D6EEF9] dark:bg-[#B4E6F5]/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                      Filtered
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {fullyAvailableRooms.map((room) => {
                    const duration =
                      checkinDate && checkoutDate
                        ? differenceInDays(checkoutDate, checkinDate) || 1
                        : 1;
                    return (
                      <RoomCard
                        key={room.room_id}
                        room={room}
                        duration={duration}
                        onSelectRoom={handleSelectRoom}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-16">
                    <Bed className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No Rooms Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      We couldn't find any available rooms matching your
                      criteria. Try adjusting your dates or filters.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setHasSearched(false)}
                    >
                      Modify Search
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {!hasSearched && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#D6EEF9] dark:bg-[#B4E6F5]/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-[#0785CF]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Start Your Booking Journey
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                Select your start and end dates to discover available rooms and
                suites for your perfect stay.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                Quick and easy booking process
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
