// src/pages/rooms/available-rooms-date.tsx
"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// Removed addDays, DateRange, react-day-picker imports
import {
  format,
  eachDayOfInterval,
  parseISO,
  isValid,
  addDays,
} from "date-fns"; // Added addDays back
import {
  Loader2,
  AlertCircle,
  Bed,
  ListFilter,
  Ticket,
  Check,
  Users,
  ImageIcon,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  Eye,
  CalendarIcon,
  // Calendar as CalendarIcon, // No longer needed
  Layers,
} from "lucide-react";
import { useHotel } from "@/providers/hotel-provider";
import hotelClient from "@/api/hotel-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { AvailabilityRangeResponse, DetailedRoom } from "./types/rooms";
import { toast } from "sonner"; // Import toast

// --- Room Details Sub-Component with Redesigned Gallery ---
function RoomDetailsView({ roomId }: { roomId: string }) {
  const {
    data: room,
    isLoading,
    isError,
    error,
  } = useQuery<DetailedRoom>({
    queryKey: ["roomDetails", roomId],
    queryFn: async () => (await hotelClient.get(`rooms/${roomId}`)).data,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#0785CF]" />
      </div>
    );
  }

  // Improved error display
  if (isError || !room) {
    return (
      <div className="p-6 text-red-600 dark:text-red-400 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/60 rounded-md">
        <AlertCircle className="h-5 w-5" />
        <span>
          Error loading room details: {error?.message || "Room data not found."}
        </span>
      </div>
    );
  }

  return (
    // Applied shadow-none to internal elements
    <div className="flex flex-col h-full space-y-6 p-6">
      {/* --- Conditionally render Gallery Section --- */}
      {room.images && room.images.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-[#1D2939] dark:text-[#D0D5DD]">
            <ImageIcon className="text-[#0785CF]" />
            Room Gallery
          </h3>
          <div
            className="flex gap-4 overflow-x-auto pb-4 noScroll"
            style={{ scrollBehavior: "smooth" }}
          >
            {room.images.map((img, index) => (
              <div
                key={img.id}
                // Applied shadow-none
                className="flex-shrink-0 w-64 h-40 rounded-lg overflow-hidden border dark:border-[#1D2939] shadow-none"
              >
                <img
                  src={img.url}
                  alt={img.code || `Room image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* --- End Conditional Rendering --- */}

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2 text-[#1D2939] dark:text-[#D0D5DD]">
            Top Amenities
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {room.amenities.map((amenity) => (
              // Applied shadow-none
              <Badge
                key={amenity.id}
                className="bg-[#EFF6FF] dark:bg-[#162142] text-[#0785CF] dark:text-[#98A2B3] border border-[#B4E6F5]200 dark:border-[#162142] shadow-none"
              >
                {amenity.name}
              </Badge>
            ))}
            {room.amenities.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No specific amenities listed.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="text-gray-600 dark:text-[#98A2B3]" />
            <span className="font-medium text-[#1D2939] dark:text-[#D0D5DD]">
              Max Occupancy:
            </span>
            <span className="text-gray-600 dark:text-[#98A2B3]">
              {room.max_occupancy}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="text-gray-600 dark:text-[#98A2B3]" />
            <span className="font-medium text-[#1D2939] dark:text-[#D0D5DD]">
              Floor Number:
            </span>
            <span className="text-gray-600 dark:text-[#98A2B3]">
              {room.floor_number ?? "N/A"} {/* Handle potential null floor */}
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-[#1D2939] dark:text-[#D0D5DD] mb-2">
            Room Description
          </h4>
          <p className="text-sm text-gray-600 dark:text-[#98A2B3] leading-relaxed">
            {room.description || "No description provided."}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function AvailableRoomsByDate() {
  const navigate = useNavigate();
  const { hotel } = useHotel();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(
    addDays(new Date(), 4)
  );
  // --- End date input state ---
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const isInitialMount = useRef(true);

  // Use startDate and endDate directly in queryKey and queryFn
  const { data, isError, error, refetch, isFetching } =
    useQuery<AvailabilityRangeResponse>({
      queryKey: [
        "roomAvailability",
        hotel?.id,
        startDate, // Use state directly
        endDate, // Use state directly
        selectedRoomTypeId,
      ],
      queryFn: async () => {
        if (!hotel?.id || !startDate || !endDate) {
          return Promise.reject(
            new Error("A valid hotel and date range are required to search.")
          );
        }
        if (endDate <= startDate) {
          return Promise.reject(
            new Error("End date must be after start date.")
          );
        }

        const params = new URLSearchParams({
          hotel_id: hotel.id,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
        });
        if (selectedRoomTypeId) {
          params.append("room_type_id", selectedRoomTypeId);
        }
        const response = await hotelClient.get(
          `rooms/availability/range/?${params.toString()}`
        );
        return response.data;
      },
      enabled: false, // Keep disabled initially
      retry: false,
    });

  // Fetch on initial load or if hotelId becomes available later
  useEffect(() => {
    if (hotel?.id && startDate && endDate) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel?.id]); // Only run when hotelId changes or on initial mount if already present

  // Refetch when room type filter or dates change (after initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (startDate && endDate && hotel?.id) {
      refetch();
    }
  }, [selectedRoomTypeId, startDate, endDate, refetch, hotel?.id]);

  const handleSearch = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both a start and end date.");
      return;
    }
    if (endDate <= startDate) {
      toast.error("End date must be after start date.");
      return;
    }
    if (hotel?.id) {
      // Ensure hotelId exists
      refetch();
    } else {
      toast.error("Hotel information is not available yet.");
    }
  };

  const filteredRooms = useMemo(() => {
    if (!data?.rooms) return [];
    let rooms = [...data.rooms];
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      rooms = rooms.filter(
        (room) =>
          room.room_code.toLowerCase().includes(lowerCaseSearch) ||
          room.room_type_name.toLowerCase().includes(lowerCaseSearch)
      );
    }
    return rooms;
  }, [data?.rooms, searchTerm]);

  const pageCount = Math.ceil(filteredRooms.length / pagination.pageSize);
  const paginatedRooms = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredRooms.slice(start, end);
  }, [filteredRooms, pagination]);

  const dateHeaders = useMemo(() => {
    // Generate dates based on the response data, ensures alignment
    if (!data?.start_date || !data?.end_date) return [];
    try {
      const start = parseISO(data.start_date);
      const end = parseISO(data.end_date);
      if (!isValid(start) || !isValid(end) || end < start) return []; // Add validation
      return eachDayOfInterval({ start, end });
    } catch (e) {
      console.error("Error parsing date headers:", e);
      return [];
    }
  }, [data?.start_date, data?.end_date]);

  // --- *** MODIFIED renderStatusCell Function *** ---
  const renderStatusCell = (status: string | undefined) => {
    // Accept undefined
    switch (status) {
      case "Available":
        return (
          // Keep Check icon for Available
          <div className="flex items-center justify-center text-green-600">
            <Check size={16} />
          </div>
        );
      case "Booked":
        return (
          // Use "BKD" text for Booked
          <span className="font-semibold text-xs text-amber-700 dark:text-amber-400">
            BKD
          </span>
        );
      case "Maintenance":
        return (
          // Use "MNC" text for Maintenance
          <span className="font-semibold text-xs text-rose-700 dark:text-rose-400">
            MNC
          </span>
        );
      default:
        // Handle cases where status might be missing or unexpected
        return <span className="text-gray-400 dark:text-gray-500">-</span>;
    }
  };
  // --- *** END MODIFICATION *** ---

  // Consistent input styling
  const dateInputClass =
    "w-full h-10 px-3 py-2 bg-white dark:bg-[#101828] border border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow-none focus:ring-2 focus:ring-blue-500 focus:border-[#0785CF]";

  return (
    // Applied consistent background
    <div className="min-h-screen bg-gray-50 dark:bg-[#101828]">
      {/* --- Adjusted Header Styling --- */}
      <div className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 shadow-none lg:h-[132px]">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Adjusted padding/layout */}
          <div className="flex items-center justify-between gap-4 py-6 lg:pt-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-[#1D2939] dark:text-[#D0D5DD] lg:text-[30px] lg:leading-[36px] lg:font-bold">
                Room Availability
              </h1>
              <p className="text-[0.9375rem] mt-1 text-gray-600 dark:text-[#98A2B3]">
                Check room status across different date ranges.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Adjusted main background and shadow */}
      <main className="max-w-8xl bg-gray-50 dark:bg-[#101828] min-h-screen mx-auto px-4 sm:px-6 lg:px-8 py-8 shadow-none">
        {/* --- Date Picker Section with Heading --- */}
        <div className="mb-6">
          {/* --- ADDED HEADING/DESCRIPTION --- */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#D0D5DD] mb-1">
            Select Date Range
          </h3>
          <p className="text-sm text-gray-600 dark:text-[#98A2B3] mb-4">
            Choose your desired check-in and check-out dates below to view room
            availability.
          </p>
          {/* --- END HEADING/DESCRIPTION --- */}
          <div className="flex flex-col md:flex-row items-end justify-start gap-4 pb-6 border-b dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-end gap-3 w-full md:w-auto">
              <div className="grid gap-1.5 w-full sm:w-auto">
                <Label
                  htmlFor="start-date"
                  className="text-sm font-medium text-gray-700 dark:text-[#98A2B3]"
                >
                  Start Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !startDate && "text-muted-foreground",
                        dateInputClass
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Select start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-1.5 w-full sm:w-auto">
                <Label
                  htmlFor="end-date"
                  className="text-sm font-medium text-gray-700 dark:text-[#98A2B3]"
                >
                  End Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !endDate && "text-muted-foreground",
                        dateInputClass
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, "PPP")
                      ) : (
                        <span>Select end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) =>
                        startDate ? date <= startDate : date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                onClick={handleSearch}
                disabled={!startDate || !endDate || isFetching}
                // Applied shadow-none
                className="bg-[#0785CF] hover:bg-[#0785CF]/90 text-[#FFF] text-[0.9375rem] font-medium border-none shadow-none w-full sm:w-auto"
              >
                {isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Find Rooms"
                )}
              </Button>
            </div>
          </div>
        </div>
        {/* --- End Date Picker Section --- */}

        {/* Loading State */}
        {isFetching && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-[#0785CF]" />
          </div>
        )}

        {/* Error State */}
        {isError && !isFetching && (
          // Applied shadow-none
          <div className="p-6 text-center text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/60 rounded-lg shadow-none">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <h3 className="font-semibold">An Error Occurred</h3>
            <p>{error?.message || "Could not fetch availability data."}</p>
          </div>
        )}

        {/* Data Display */}
        {data && !isFetching && (
          // Applied shadow-none to table container
          <div className="rounded-lg border border-gray-200 dark:border-[#1D2939] shadow-none bg-white dark:bg-[#171F2F] overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center border-b dark:border-gray-700">
              {/* Room Type Filter Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Applied shadow-none */}
                <Badge
                  onClick={() => setSelectedRoomTypeId(null)}
                  className={cn(
                    "cursor-pointer text-[13px] shadow-none", // Added shadow-none
                    selectedRoomTypeId === null
                      ? "bg-[#0785CF] text-white hover:bg-[#0785CF]/90"
                      : "text-[#0785CF] dark:text-[#0785CF] bg-[#D6EEF9] dark:bg-[#B4E6F5]/30 hover:bg-[#D6EEF9] dark:hover:bg-[#B4E6F5]/50 border border-[#B4E6F5]200 dark:border-[#B4E6F5]700/60" // Adjusted non-active style
                  )}
                >
                  All Types
                </Badge>
                {hotel?.room_type.map((rt) => (
                  // Applied shadow-none
                  <Badge
                    key={rt.id}
                    onClick={() => setSelectedRoomTypeId(rt.id)}
                    className={cn(
                      "cursor-pointer text-[13px] shadow-none", // Added shadow-none
                      selectedRoomTypeId === rt.id
                        ? "bg-[#0785CF] text-white hover:bg-[#0785CF]/90"
                        : "text-[#0785CF] dark:text-[#0785CF] bg-[#D6EEF9] dark:bg-[#B4E6F5]/30 hover:bg-[#D6EEF9] dark:hover:bg-[#B4E6F5]/50 border border-[#B4E6F5]200 dark:border-[#B4E6F5]700/60" // Adjusted non-active style
                    )}
                  >
                    {rt.name}
                  </Badge>
                ))}
              </div>
              {/* Search/Filter Input */}
              <div className="relative w-full sm:w-64">
                <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                {/* Applied shadow-none */}
                <Input
                  placeholder="Filter by Room Code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] shadow-none focus:ring-blue-500 focus:border-[#0785CF] dark:text-gray-200 dark:placeholder:text-gray-500"
                />
              </div>
            </div>
            {/* --- *** MODIFIED Availability Key *** --- */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 my-3 px-4">
              <strong className="mr-1">Key:</strong>
              <div className="flex items-center gap-1 text-green-600">
                <Check size={14} /> Available
              </div>
              <div className="flex items-center gap-1 text-amber-600">
                <span className="font-semibold text-xs text-amber-700 dark:text-amber-400">
                  BKD
                </span>{" "}
                = Booked
              </div>
              <div className="flex items-center gap-1 text-rose-600">
                <span className="font-semibold text-xs text-rose-700 dark:text-rose-400">
                  MNC
                </span>{" "}
                = Maintenance
              </div>
            </div>
            {/* --- *** END MODIFICATION *** --- */}
            {/* Table */}
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                {" "}
                {/* Added min-width */}
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-y border-gray-200 dark:border-y-[#1D2939]">
                    <TableHead className="h-12 px-4 font-semibold text-[13px] uppercase text-[#667085] dark:text-[#98A2B3] bg-gray-50 dark:bg-[#101828]/90 shadow-none sticky left-0 z-20 min-w-[180px] border-r border-gray-200 dark:border-r-[#1D2939]">
                      Room
                    </TableHead>
                    {dateHeaders.map((date) => (
                      <TableHead
                        key={date.toString()}
                        className="h-12 px-4 font-semibold text-[13px] uppercase text-[#667085] dark:text-[#98A2B3] bg-gray-50 dark:bg-[#101828]/90 text-center border-r border-gray-200 dark:border-r-[#1D2939] shadow-none min-w-[80px]" // Added min-width
                      >
                        {format(date, "MMM dd")}
                      </TableHead>
                    ))}
                    <TableHead className="h-12 px-4 font-semibold text-[13px] uppercase text-[#667085] dark:text-[#98A2B3] bg-gray-50 dark:bg-[#101828]/90 text-center sticky right-[100px] z-20 min-w-[100px] border-x border-gray-200 dark:border-x-[#1D2939] shadow-none">
                      {" "}
                      {/* Adjusted widths/positions */}
                      Details
                    </TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-[13px] uppercase text-[#667085] dark:text-[#98A2B3] bg-gray-50 dark:bg-[#101828]/90 text-center sticky right-0 z-20 min-w-[100px] border-l border-gray-200 dark:border-l-[#1D2939] shadow-none">
                      {" "}
                      {/* Adjusted widths/positions */}
                      Booking
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRooms.length > 0 ? (
                    paginatedRooms.map((room) => (
                      <TableRow
                        key={room.room_id}
                        className="border-b border-gray-200 dark:border-b-[#1D2939] hover:bg-indigo-50/30 dark:hover:bg-[#1C2433]"
                      >
                        <TableCell className="px-4 py-3 sticky left-0 z-10 bg-white dark:bg-[#171F2F] border-r border-gray-200 dark:border-r-[#1D2939]">
                          <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                            {room.room_type_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {room.room_code}
                          </div>
                        </TableCell>
                        {dateHeaders.map((date) => {
                          const dateString = format(date, "yyyy-MM-dd");
                          const day = room.availability.find(
                            (d) => d.date === dateString
                          );
                          return (
                            <TableCell
                              key={dateString}
                              className="px-4 py-3 text-center border-r border-gray-200 dark:border-r-[#1D2939]"
                            >
                              {renderStatusCell(day?.availability_status)}
                            </TableCell>
                          );
                        })}
                        <TableCell className="px-4 py-3 text-center sticky right-[100px] z-10 bg-white dark:bg-[#171F2F] border-x border-gray-200 dark:border-x-[#1D2939]">
                          {" "}
                          {/* Adjusted widths/positions */}
                          {/* Applied shadow-none */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedRoomId(room.room_id)}
                            className="text-[#0785CF] h-8 w-8 rounded-full hover:bg-[#D6EEF9] dark:hover:bg-[#B4E6F5]/40 shadow-none"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center sticky right-0 z-10 bg-white dark:bg-[#171F2F] border-l border-gray-200 dark:border-l-[#1D2939]">
                          {" "}
                          {/* Adjusted widths/positions */}
                          {/* Applied shadow-none */}
                          <Button
                            size="sm"
                            onClick={() => navigate("/bookings/new-booking")}
                            className="bg-[#0785CF] text-white hover:bg-[#0785CF]/90 shadow-none rounded-md px-3" // Adjusted styling
                          >
                            <Ticket className="h-4 w-4 mr-1.5" />{" "}
                            {/* Adjusted margin */}
                            Book
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        // Calculate colspan dynamically
                        colSpan={dateHeaders.length + 3}
                        className="h-48 text-center text-gray-500 dark:text-gray-400"
                      >
                        <Bed className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold mb-1">
                          No Rooms Found
                        </h3>
                        <p>
                          No rooms match your current criteria for the selected
                          dates.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between gap-4 mt-4 px-4 pb-4 border-t dark:border-gray-700 pt-4">
              <div className="flex-1 text-sm text-gray-600 dark:text-[#98A2B3]">
                Page {pagination.pageIndex + 1} of {pageCount || 1} (
                {filteredRooms.length} rooms)
              </div>
              <div className="flex items-center gap-2">
                {/* Applied shadow-none */}
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-none dark:bg-[#101828] dark:border-[#1D2939]"
                  onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))}
                  disabled={pagination.pageIndex === 0}
                >
                  <ChevronFirst className="h-5 w-5" />
                </Button>
                {/* Applied shadow-none */}
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-none dark:bg-[#101828] dark:border-[#1D2939]"
                  onClick={() =>
                    setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
                  }
                  disabled={pagination.pageIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                {/* Applied shadow-none */}
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-none dark:bg-[#101828] dark:border-[#1D2939]"
                  onClick={() =>
                    setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
                  }
                  disabled={pagination.pageIndex >= pageCount - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                {/* Applied shadow-none */}
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-none dark:bg-[#101828] dark:border-[#1D2939]"
                  onClick={() =>
                    setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }))
                  }
                  disabled={pagination.pageIndex >= pageCount - 1}
                >
                  <ChevronLast className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Room Details Sheet */}
      <Sheet
        open={!!selectedRoomId}
        onOpenChange={(isOpen) => !isOpen && setSelectedRoomId(null)}
      >
        {/* Applied shadow-none to SheetContent */}
        <SheetContent className="w-full sm:max-w-[540px] p-0 bg-white dark:bg-[#101828] border-l dark:border-l-[#1D2939] shadow-none">
          {/* Applied shadow-none */}
          <SheetHeader className="p-6 border-b border-gray-200 dark:border-b-[#1D2939] bg-white dark:bg-[#101828] shadow-none">
            <SheetTitle className="text-[#1D2939] text-2xl dark:text-[#D0D5DD]">
              Room Details:{" "}
              {data?.rooms.find((r) => r.room_id === selectedRoomId)?.room_code}
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-theme(space.24))] overflow-y-auto">
            {" "}
            {/* Adjusted height */}
            {selectedRoomId && <RoomDetailsView roomId={selectedRoomId} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
