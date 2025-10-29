// src/components/custom/command-search.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { File, BedDouble, Ticket, Loader2, User, Command } from "lucide-react";
import { LuReply } from "react-icons/lu";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandSearchStore } from "@/store/command-search-store";
import bookingClient from "@/api/booking-client";
import hotelClient from "@/api/hotel-client";
import { Badge } from "@/components/ui/badge";

// --- Debounce Hook ---
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- Type Definitions ---
interface BookingResult {
  id: string;
  code: string;
  full_name: string;
}

interface RoomResult {
  id: string;
  code: string;
  room_type: string;
}

export function CommandSearch() {
  const navigate = useNavigate();
  const { isOpen, close } = useCommandSearchStore();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const hotelId = "a3d5501e-c910-4e2e-a0b2-ad616c5910db";

  // --- Keyboard shortcut listener (⌘K) ---
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useCommandSearchStore.getState().toggle();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // --- Data Fetching Queries ---
  const { data: bookingResults, isLoading: isBookingLoading } = useQuery<{
    results: BookingResult[];
  }>({
    queryKey: ["command-search-bookings", debouncedQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        microservice_item_id: hotelId,
        full_name: debouncedQuery,
        limit: "5",
      });
      const response = await bookingClient.get("/bookings", { params });
      return response.data;
    },
    enabled: !!debouncedQuery,
  });

  const { data: roomResults, isLoading: isRoomLoading } = useQuery<{
    results: RoomResult[];
  }>({
    queryKey: ["command-search-rooms", debouncedQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        hotel_id: hotelId,
        search: debouncedQuery,
        page_size: "5",
      });
      const response = await hotelClient.get("/rooms/", { params });
      return response.data;
    },
    enabled: !!debouncedQuery,
  });

  // --- Action Handler ---
  const runCommand = useCallback(
    (command: () => unknown) => {
      close();
      command();
    },
    [close]
  );

  // Reset query when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const isLoading = isBookingLoading || isRoomLoading;
  const hasResults =
    (bookingResults?.results?.length ?? 0) > 0 ||
    (roomResults?.results?.length ?? 0) > 0;

  return (
    <CommandDialog open={isOpen} onOpenChange={close}>
      <div className="flex items-center border-b px-4 py-3">
        <CommandInput
          placeholder="Search bookings, rooms, or navigate to pages..."
          value={query}
          onValueChange={setQuery}
          className="border-0 outline-none ring-0 placeholder:text-muted-foreground focus:ring-0"
        />
        {isLoading && (
          <div className="ml-3 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <CommandList className="max-h-[400px] overflow-y-auto">
        {/* Empty State */}
        {!isLoading && debouncedQuery && !hasResults && (
          <CommandEmpty className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">No results found</p>
                <p className="text-xs text-muted-foreground">
                  Try searching for a guest name, room code, or room type
                </p>
              </div>
            </div>
          </CommandEmpty>
        )}

        {/* Loading State */}
        {isLoading && debouncedQuery && (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Searching...</p>
                <p className="text-xs text-muted-foreground">
                  Looking through bookings and rooms
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Booking Results */}
        {bookingResults && bookingResults.results.length > 0 && (
          <>
            <CommandGroup>
              <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <User className="h-3 w-3" />
                Guest Bookings
                <Badge variant="secondary" className="text-xs">
                  {bookingResults.results.length}
                </Badge>
              </div>
              {bookingResults.results.map((booking) => (
                <CommandItem
                  key={booking.id}
                  value={`booking-${booking.id}-${booking.full_name}`}
                  onSelect={() =>
                    runCommand(() => navigate(`/bookings/${booking.id}`))
                  }
                  className="group mx-2 rounded-lg px-4 py-3 data-[selected=true]:bg-primary/10"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      <div className="rounded-lg bg-primary/10 p-2 group-data-[selected=true]:bg-primary/20">
                        <Ticket className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {booking.full_name}
                        </span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {booking.code}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        View booking details and management
                      </p>
                    </div>
                    <LuReply className="h-4 w-4 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Room Results */}
        {roomResults && roomResults.results.length > 0 && (
          <>
            <CommandGroup>
              <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <BedDouble className="h-3 w-3" />
                Hotel Rooms
                <Badge variant="secondary" className="text-xs">
                  {roomResults.results.length}
                </Badge>
              </div>
              {roomResults.results.map((room) => (
                <CommandItem
                  key={room.id}
                  value={`room-${room.id}-${room.code}`}
                  onSelect={() =>
                    runCommand(() => navigate(`/rooms/${room.id}`))
                  }
                  className="group mx-2 rounded-lg px-4 py-3 data-[selected=true]:bg-primary/10"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      <div className="rounded-lg bg-[#D6EEF9] p-2 group-data-[selected=true]:bg-[#B4E6F<｜place▁holder▁no▁797｜>] dark:bg-[#B4E6F5] dark:group-data-[selected=true]:bg-blue-800">
                        <BedDouble className="h-4 w-4 text-[#0785CF] dark:text-[#0785CF]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          Room {room.code}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {room.room_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Room details and availability
                      </p>
                    </div>
                    <LuReply className="h-4 w-4 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Show separator and pages only if there are search results or no query */}
        {(!debouncedQuery || hasResults) && (
          <>
            <CommandSeparator className="my-2" />
            <CommandGroup>
              <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {/* <Building className="h-3 w-3" /> */}
                Quick Navigation
              </div>
              <CommandItem
                onSelect={() =>
                  runCommand(() => navigate("/bookings/all-bookings"))
                }
                className="group mx-2 rounded-lg px-4 py-3 data-[selected=true]:bg-emerald-50 dark:data-[selected=true]:bg-emerald-950"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0">
                    <div className="rounded-lg bg-emerald-100 p-2 group-data-[selected=true]:bg-emerald-200 dark:bg-emerald-900 dark:group-data-[selected=true]:bg-emerald-800">
                      <Ticket className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">
                      All Bookings
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      View and manage all reservations
                    </p>
                  </div>
                  <LuReply className="h-4 w-4 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                </div>
              </CommandItem>

              <CommandItem
                onSelect={() =>
                  runCommand(() => navigate("/rooms/hotel-rooms"))
                }
                className="group mx-2 rounded-lg px-4 py-3 data-[selected=true]:bg-[#D6EEF9] dark:data-[selected=true]:bg-blue-950"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0">
                    <div className="rounded-lg bg-[#D6EEF9] p-2 group-data-[selected=true]:bg-[#B4E6F<｜place▁holder▁no▁797｜>] dark:bg-[#B4E6F5] dark:group-data-[selected=true]:bg-blue-800">
                      <BedDouble className="h-4 w-4 text-[#0785CF] dark:text-[#0785CF]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">
                      Hotel Rooms
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Room inventory and management
                    </p>
                  </div>
                  <LuReply className="h-4 w-4 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                </div>
              </CommandItem>

              <CommandItem
                onSelect={() =>
                  runCommand(() => navigate("/hotel/hotel-features"))
                }
                className="group mx-2 rounded-lg px-4 py-3 data-[selected=true]:bg-orange-50 dark:data-[selected=true]:bg-orange-950"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0">
                    <div className="rounded-lg bg-orange-100 p-2 group-data-[selected=true]:bg-orange-200 dark:bg-orange-900 dark:group-data-[selected=true]:bg-orange-800">
                      <File className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">
                      Hotel Features
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Manage amenities and services
                    </p>
                  </div>
                  <LuReply className="h-4 w-4 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                </div>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Helpful hint when no query */}
        {!debouncedQuery && !isLoading && (
          <div className="px-4 py-6 text-center border-t bg-muted/20">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />
              <span>Press</span>
              <Badge
                variant="outline"
                className="px-1.5 py-0.5 text-xs font-mono"
              >
                {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"} K
              </Badge>
              <span>to open • Type to search</span>
            </div>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
