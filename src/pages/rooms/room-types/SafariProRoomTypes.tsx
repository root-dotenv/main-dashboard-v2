// src/pages/rooms/SafariProRoomTypes.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bed, Loader2, Search, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type {
  PaginatedRoomTypes,
  AmenityDetail,
  DetailedRoomType,
} from "./types";
import hotelClient from "@/api/hotel-client";
import { RoomTypeCard } from "./RoomTypeCard";

interface FilterState {
  priceSort: "none" | "low-to-high" | "high-to-low";
  availabilityFilter: "all" | "available" | "full";
}

export default function SafariProRoomTypes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    priceSort: "none",
    availabilityFilter: "all",
  });

  // STEP 1: Fetch the initial list of room types with amenity IDs
  const { data: paginatedData, isLoading: isListLoading } =
    useQuery<PaginatedRoomTypes>({
      queryKey: ["allRoomTypesList"],
      queryFn: async () => (await hotelClient.get("room-types/")).data,
    });

  const allRoomTypes = useMemo(
    () => paginatedData?.results ?? [],
    [paginatedData]
  );

  // Extract all unique amenity IDs from all room types
  const uniqueAmenityIds = useMemo(() => {
    const allIds = allRoomTypes.flatMap((room) => room.amenities);
    return [...new Set(allIds)];
  }, [allRoomTypes]);

  // STEP 2: Fetch the details for all unique amenities in a single batch
  const { data: amenitiesDetails, isLoading: areAmenitiesLoading } = useQuery<
    AmenityDetail[]
  >({
    queryKey: ["amenitiesDetails", uniqueAmenityIds],
    queryFn: async () => {
      if (uniqueAmenityIds.length === 0) return [];
      const promises = uniqueAmenityIds.map((id) =>
        hotelClient.get(`amenities/${id}`)
      );
      const responses = await Promise.all(promises);
      return responses.map((res) => res.data);
    },
    // This query will only run if we have amenity IDs to fetch
    enabled: uniqueAmenityIds.length > 0,
  });

  // STEP 3: Merge the room data with the fetched amenity details
  const hydratedRoomTypes = useMemo(() => {
    // Return early if amenities haven't been fetched yet
    if (!amenitiesDetails && uniqueAmenityIds.length > 0) {
      // Return a temporary structure that matches DetailedRoomType to avoid prop errors
      return allRoomTypes.map((room) => ({
        ...room,
        amenities_details: [],
        features_list: [],
      })) as DetailedRoomType[];
    }

    const amenitiesMap = new Map(
      (amenitiesDetails || []).map((amenity) => [amenity.id, amenity])
    );

    return allRoomTypes.map((room) => ({
      ...room,
      // Transform the array of IDs into an array of full amenity objects
      amenities_details: room.amenities
        .map((id) => amenitiesMap.get(id))
        .filter(Boolean) as AmenityDetail[],
      features_list: [], // Ensure this property exists for the DetailedRoomType interface
    }));
  }, [allRoomTypes, amenitiesDetails, uniqueAmenityIds]);

  // The filtering logic now runs on the fully hydrated data
  const filteredRooms = useMemo(() => {
    let filtered = [...hydratedRoomTypes];

    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(lowerCaseQuery) ||
          room.description.toLowerCase().includes(lowerCaseQuery) ||
          room.bed_type.toLowerCase().includes(lowerCaseQuery)
      );
    }

    if (filters.availabilityFilter !== "all") {
      filtered = filtered.filter((room) => {
        // Assuming is_active determines if it *can* be available,
        // and room_availability > 0 means it *is* currently available
        const isAvailable = room.is_active && room.room_availability > 0;
        if (filters.availabilityFilter === "available") return isAvailable;
        // Adjusted logic: 'full' likely means not available (booked or inactive)
        if (filters.availabilityFilter === "full") return !isAvailable;
        return true;
      });
    }

    if (filters.priceSort !== "none") {
      filtered.sort((a, b) => {
        const priceA = parseFloat(a.base_price);
        const priceB = parseFloat(b.base_price);
        return filters.priceSort === "low-to-high"
          ? priceA - priceB
          : priceB - priceA;
      });
    }
    return filtered;
  }, [hydratedRoomTypes, searchQuery, filters]);

  const isLoading =
    isListLoading || (uniqueAmenityIds.length > 0 && areAmenitiesLoading);

  // Consistent styling classes
  const nativeSelectClass =
    "w-full sm:w-40 h-10 px-3 py-2 bg-white dark:bg-[#101828] border border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow-none focus:ring-2 focus:ring-blue-500 focus:border-[#0785CF]";

  return (
    <div className="space-y-6">
      <div className="pt-4">
        {/* Adjusted font sizes */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-[#D0D5DD]">
          All SafariPro Room Types
        </h3>
        <p className="text-base text-gray-600 dark:text-[#98A2B3] mt-1">
          A global catalog of all room types available across the SafariPro
          network.
        </p>
      </div>

      {/* --- START: Redesigned Filter Controls --- */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#D0D5DD] mb-2">
          Filter & Sort Global Room Types:
        </h3>
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-grow w-full md:w-auto md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
            <Input
              placeholder="Search name, bed type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 w-full h-10 bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1D2939] rounded-md shadow-none focus:ring-2 focus:ring-blue-500 focus:border-[#0785CF] dark:text-[#D0D5DD] dark:placeholder:text-[#5D636E]"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 dark:text-[#98A2B3]"
                onClick={() => setSearchQuery("")}
              >
                <XIcon size={18} />
              </button>
            )}
          </div>

          {/* Native Select for Availability */}
          <select
            aria-label="Filter by Availability"
            value={filters.availabilityFilter}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                availabilityFilter: e.target.value as any,
              }))
            }
            className={nativeSelectClass}
          >
            <option value="all">All Availability</option>
            <option value="available">Available</option>
            <option value="full">Unavailable</option> {/* Changed label */}
          </select>

          {/* Native Select for Price Sort */}
          <select
            aria-label="Sort by Price"
            value={filters.priceSort}
            onChange={(e) =>
              setFilters((f) => ({ ...f, priceSort: e.target.value as any }))
            }
            className={nativeSelectClass}
          >
            <option value="none">Default Sort</option>
            <option value="low-to-high">Price: Low to High</option>
            <option value="high-to-low">Price: High to Low</option>
          </select>
        </div>
      </div>
      {/* --- END: Redesigned Filter Controls --- */}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#0785CF]" />
        </div>
      ) : (
        // Applied shadow-none to grid container
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 shadow-none">
          {filteredRooms.map((room) => (
            <RoomTypeCard key={room.id} room={room} variant="safaripro" />
          ))}
          {/* Added message for no results after filtering */}
          {!isLoading && filteredRooms.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3 text-center py-16 text-muted-foreground border-dashed border-2 dark:border-gray-700 rounded-lg">
              <Bed className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="font-semibold">No Matching Room Types Found</p>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
