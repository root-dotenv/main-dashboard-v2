// src/pages/bookings/components/Step5_CheckInAndFinish.tsx
"use client";
import { useMemo, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useBookingStore } from "@/store/booking.store";
import { useNavigate } from "react-router-dom";
import bookingClient from "@/api/booking-client";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Info,
  CheckCircle,
  LogIn,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { type CurrencyConversionResponse } from "./booking-types";
import { cn } from "@/lib/utils";
import BookingPrintTicket from "./booking-ticket";

export default function Step5_CheckInAndFinish() {
  const {
    bookingDetails,
    createdBooking,
    reset: resetBookingStore,
    setStep,
    setBookingDetails,
  } = useBookingStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ticketRef = useRef<HTMLDivElement>(null);

  const {
    data: fetchedConversionData,
    isLoading: isFetchingDetails,
    isError: fetchError,
    error: fetchErrorMessage,
    refetch: refetchConversion,
  } = useQuery<CurrencyConversionResponse>({
    queryKey: ["bookingCurrencyConversion", createdBooking?.id],
    queryFn: async () => {
      const response = await bookingClient.get(
        `/bookings/${createdBooking!.id}/currency-conversions`
      );
      return response.data;
    },
    enabled: !!createdBooking?.id && !bookingDetails?.payment_status,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    retry: 1,
    onSuccess: (response) => {
      setBookingDetails(response.data.booking);
    },
  });

  const { data: exchangeRateData, isLoading: isFetchingExchangeRate } =
    useQuery({
      queryKey: ["exchangeRate", "USD", "TZS"],
      queryFn: async () => {
        const response = await bookingClient.post("/currency/convert", {
          amount: 1,
          from_currency: "USD",
          to_currency: "TZS",
        });
        return response.data;
      },
      staleTime: 1000 * 60 * 60, // Cache for an hour
    });

  const currentBookingDetails =
    bookingDetails || fetchedConversionData?.data.booking;

  const checkInMutation = useMutation({
    mutationFn: (bookingId: string) =>
      bookingClient.post(`/bookings/${bookingId}/check_in`),
    onSuccess: () => {
      toast.success("Guest Checked In Successfully!", {
        description:
          "The room status has been updated and guest is now checked in.",
      });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      resetBookingStore();
      navigate("/bookings/all-bookings");
    },
    onError: (error) => {
      console.error("Check-in mutation error:", error);
      toast.error(`Check-in Failed: ${error.message}`);
    },
  });

  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
    documentTitle: `Booking-Ticket-${currentBookingDetails?.code}`,
  });

  const handleFinish = () => {
    toast.success("Booking Process Completed!", {
      description:
        "The booking has been successfully created and payment confirmed.",
    });
    resetBookingStore();
    navigate("/bookings/all-bookings");
  };

  if ((isFetchingDetails && !currentBookingDetails) || isFetchingExchangeRate) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="w-20 h-20 bg-[#D6EEF9] dark:bg-[#B4E6F5]/20 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="h-10 w-10 animate-spin text-[#0785CF]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Preparing Your Booking Ticket
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Loading final booking details and generating your ticket...
        </p>
      </div>
    );
  }

  if (fetchError && !currentBookingDetails) {
    return (
      <Card className="max-w-2xl mx-auto border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Booking Details
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {fetchErrorMessage?.message}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={() => setStep(4)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payment
              </Button>
              <Button
                onClick={() => refetchConversion()}
                disabled={isFetchingDetails}
              >
                <RefreshCw
                  className={cn(
                    "mr-2 h-4 w-4",
                    isFetchingDetails && "animate-spin"
                  )}
                />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentBookingDetails && !createdBooking) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Missing Booking Information
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Cannot display ticket. Please start the booking process again.
            </p>
            <Button
              onClick={() => {
                resetBookingStore();
                setStep(1);
              }}
              variant="outline"
              className="w-full"
            >
              Start New Booking
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentBookingDetails) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-[#0785CF] mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Loading booking details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <CheckCircle className="h-4 w-4" />
          Step 5: Booking Complete
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Booking Confirmed & Ready
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your booking has been successfully created and paid. You can now print
          the ticket or check in the guest.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end items-center gap-6 mb-4">
          <Button onClick={handleFinish} variant="outline" className="h-12">
            Finish & View Bookings
          </Button>
          <Button
            onClick={() => checkInMutation.mutate(currentBookingDetails.id)}
            disabled={
              checkInMutation.isPending ||
              currentBookingDetails.booking_status === "Checked In"
            }
            className="h-12 bg-[#0785CF] hover:bg-[#0785CF]/90 text-white"
          >
            {checkInMutation.isPending
              ? "Checking In..."
              : currentBookingDetails.booking_status === "Checked In"
              ? "Already Checked In"
              : "Check-In Guest Now"}
          </Button>
        </div>
        <div ref={ticketRef}>
          <BookingPrintTicket
            booking={currentBookingDetails}
            exchangeRate={exchangeRateData?.exchange_rate}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center pt-6 mt-4">
        <Button onClick={handlePrint} variant="outline" className="h-12">
          Print Booking Ticket
        </Button>
      </div>
    </div>
  );
}
