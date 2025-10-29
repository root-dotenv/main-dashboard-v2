// src/pages/bookings/components/Step4_ReceivePayment.tsx
"use client";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useBookingStore } from "@/store/booking.store";
import bookingClient from "@/api/booking-client";
import { toast } from "sonner";
import {
  type UpdatePaymentPayload,
  type CurrencyConversionResponse,
} from "./booking-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Info,
  Banknote,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Shield,
} from "lucide-react";
import { FaCheck } from "react-icons/fa6";
import { cn } from "@/lib/utils";

const paymentSchema = yup.object({
  amountReceived: yup
    .number()
    .required("Amount is required.")
    .typeError("Please enter a valid number."),
  confirmAmountReceived: yup
    .number()
    .oneOf([yup.ref("amountReceived")], "Amounts must match.")
    .required("Please confirm the amount.")
    .typeError("Please enter a valid number."),
});

type PaymentFormData = yup.InferType<typeof paymentSchema>;

const FormInputWithIcon = ({ icon: Icon, ...props }: any) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
    <Input {...props} className="pl-10 h-11" />
  </div>
);

export default function Step4_ReceivePayment() {
  const { bookingDetails, createdBooking, setStep, setBookingDetails } =
    useBookingStore();

  const queryClient = useQueryClient();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: yupResolver(paymentSchema),
    mode: "onChange",
  });

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
    enabled: !!createdBooking?.id,
    onSuccess: (response) => {
      setBookingDetails(response.data.booking);
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const currentBookingDetails =
    bookingDetails || fetchedConversionData?.data.booking;

  const currencyConversionDetails = useMemo(() => {
    const conversions = fetchedConversionData?.data.conversions;
    if (!conversions) return null;
    return (
      conversions.find(
        (c) => c.conversion_type === "amount_required_reference"
      ) || null
    );
  }, [fetchedConversionData]);

  const mutation = useMutation({
    mutationFn: (payload: { bookingId: string; data: UpdatePaymentPayload }) =>
      bookingClient.patch(`/bookings/${payload.bookingId}`, payload.data),
    onSuccess: (response) => {
      toast.success("Payment Recorded Successfully!", {
        description:
          "The cash payment has been confirmed and booking is now complete.",
      });
      queryClient.setQueryData(
        ["bookingCurrencyConversion", currentBookingDetails?.id],
        (oldData: CurrencyConversionResponse | undefined) => {
          if (!oldData) return;
          const updatedBooking = response.data;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              booking: updatedBooking,
            },
          };
        }
      );
      queryClient.setQueryData(
        ["bookingDetails", currentBookingDetails?.id],
        response.data
      );
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setBookingDetails(response.data);
      setStep(5);
    },
    onError: (error) => {
      console.error("Payment mutation error:", error);
      toast.error(`Payment Recording Failed: ${error.message}`);
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    if (!currentBookingDetails) {
      toast.error("Booking details are missing. Cannot proceed.");
      return;
    }
    if (!currencyConversionDetails?.converted_amount) {
      toast.error("Final TZS amount unavailable", {
        description:
          "Please go back to Step 3 and refresh the conversion rates.",
      });
      return;
    }

    const payload: UpdatePaymentPayload = {
      booking_status: "Confirmed",
      currency_paid: "TZS",
      amount_paid: String(data.amountReceived),
    };

    mutation.mutate({ bookingId: currentBookingDetails.id, data: payload });
  };

  if (isFetchingDetails && !currentBookingDetails) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="w-20 h-20 bg-[#D6EEF9] dark:bg-[#B4E6F5]/20 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="h-10 w-10 animate-spin text-[#0785CF]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Loading Payment Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Fetching the latest conversion rates and payment information...
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <Card className="max-w-2xl mx-auto border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Payment Details
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {fetchErrorMessage?.message}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={() => setStep(3)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Confirmation
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
              No booking details found. Please start the booking process from
              Step 1.
            </p>
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="w-full"
            >
              Go Back to Step 1
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentBookingDetails) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Missing Booking Details
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Could not load the booking details. Please go back.
            </p>
            <Button onClick={() => setStep(3)} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Confirmation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const finalAmountUSD =
    currentBookingDetails.billing_meta_data?.calculation_breakdown
      ?.final_amount;
  const finalAmountTZS = currencyConversionDetails?.converted_amount;

  return (
    <div className="space-y-8 p-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-[#D6EEF9] dark:bg-[#B4E6F5]/20 text-[#0785CF] dark:text-[#0785CF] px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Banknote className="h-4 w-4" />
          Step 4: Cash Payment
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Receive Cash Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Confirm the cash amount received from the guest to finalize the
          booking payment and complete the reservation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Payment Form */}
        <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-700 shadow-none">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-3 text-2xl text-gray-900 dark:text-white">
              <Banknote className="h-6 w-6 text-[#0785CF]" />
              Cash Payment Confirmation
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Enter the exact cash amount received in Tanzanian Shillings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Amount Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Total in USD
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${finalAmountUSD?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Amount to Pay (TZS)
                </p>
                {finalAmountTZS !== undefined && finalAmountTZS !== null ? (
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat("en-US").format(finalAmountTZS)}{" "}
                    TZS
                  </p>
                ) : (
                  <div className="flex items-center justify-center py-2">
                    {isFetchingDetails ? (
                      <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                    ) : (
                      <span className="text-sm text-amber-600 font-semibold">
                        Amount Unavailable
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Reference */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Payment Reference:
                </span>
                <Badge className="font-mono bg-[#D6EEF9] text-[#0785CF] dark:bg-[#B4E6F5]/30 dark:text-[#0785CF]">
                  {currentBookingDetails.payment_reference || "N/A"}
                </Badge>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            {/* Payment Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="amountReceived"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Amount Received (TZS) *
                        </FormLabel>
                        <FormControl>
                          <FormInputWithIcon
                            icon={Banknote}
                            type="number"
                            step="any"
                            min="0"
                            placeholder="Enter TZS amount..."
                            {...field}
                            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmAmountReceived"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Confirm Amount (TZS) *
                        </FormLabel>
                        <FormControl>
                          <FormInputWithIcon
                            icon={FaCheck}
                                                          type="number"
                                                          step="any"
                                                          min="0"                            placeholder="Re-enter TZS amount..."
                            {...field}
                            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Confirmation Section */}
                <div className="rounded-xl p-6 border">
                  <div className="flex items-start space-x-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="confirm-amount"
                          checked={isConfirmed}
                          onCheckedChange={(checked) =>
                            setIsConfirmed(!!checked)
                          }
                          className="data-[state=checked]:bg-[#0785CF] data-[state=checked]:border-[#0785CF]"
                        />
                        <label
                          htmlFor="confirm-amount"
                          className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer"
                        >
                          Confirm Cash Payment Received
                        </label>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 pl-9">
                        I verify that the exact cash amount has been received
                        from the guest and matches the expected total.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-start items-center pt-6 border-t border-gray-200 dark:border-gray-700 gap-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="h-11 px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Back to Confirmation
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isConfirmed || mutation.isPending}
                    className="h-11 px-8 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    {mutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm Payment & Complete
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-28 border border-gray-200 dark:border-gray-700 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="h-5 w-5 text-orange-500" />
                <h4 className="font-semibold text-orange-500">
                  Cash Handling
                </h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Count cash carefully with the guest</li>
                <li>• Verify amount matches exactly</li>
                <li>• Provide receipt if requested</li>
                <li>• Secure cash immediately</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}