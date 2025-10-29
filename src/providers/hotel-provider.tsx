import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import hotelClient from "../api/hotel-client";
import { useAuthStore } from "../store/auth.store";
import type { Hotel } from "../types/hotel-types";
import { Loader2 } from "lucide-react";

// Define the shape of the context's value
interface HotelContextType {
  hotel: Hotel | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  refetch: () => void;
}

// Create the Context
const HotelContext = createContext<HotelContextType | undefined>(undefined);

// Create the Provider Component
export function HotelProvider({ children }: { children: ReactNode }) {
  // Get the dynamic hotelId from the auth store
  const { hotelId } = useAuthStore();

  const {
    data: hotel,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery<Hotel, Error>({
    // The queryKey is now dynamic, tied to the hotelId from the store.
    queryKey: ["hotel", hotelId],
    queryFn: async () => {
      // Use the dynamic hotelId in the API request URL.
      const response = await hotelClient.get(`hotels/${hotelId}`);
      return response.data;
    },
    // The query will only run if a hotelId exists.
    enabled: !!hotelId,
    staleTime: 1000 * 60 * 30, // Keep data fresh for 30 minutes
    retry: false, // Don't retry if the first fetch fails
  });

  // Define the value to be passed down through the context
  const value = {
    hotel: hotel || null,
    isLoading,
    error,
    isError,
    refetch: refetch as () => void,
  };

  // If there's no hotelId yet, we can show a loading state for the whole app
  // This can be useful on initial load while the hotelId is being fetched.
  if (!hotelId && !isLoading && !isError) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0785CF]" />
          <p className="text-gray-600">Initializing hotel data...</p>
        </div>
      </div>
    );
  }

  return (
    <HotelContext.Provider value={value}>{children}</HotelContext.Provider>
  );
}

// Custom hook for consuming the context
export function useHotel() {
  const context = useContext(HotelContext);

  if (context === undefined) {
    throw new Error("useHotel must be used within a HotelProvider");
  }

  return context;
}
