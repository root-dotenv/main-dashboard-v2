// src/pages/bookings/components/Step4_MobilePayment.tsx
"use client";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useBookingStore } from "@/store/booking.store";
import bookingClient from "@/api/booking-client";
import paymentClient from "@/api/paymentClient";
import { toast } from "sonner";
import {
  type CurrencyConversionResponse,
  type InitiateMobilePaymentPayload,
  type InitiateMobilePaymentResponse,
  type BookingDetails,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Smartphone,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Hourglass,
  Phone,
  Shield,
  Clock,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Schema for the mobile payment form
const mobilePaymentSchema = yup.object({
  accountNumber: yup
    .string()
    .required("Guest's phone number is required.")
    .matches(
      /^(\+?255|0)\d{9}$/,
      "Enter a valid Tanzanian phone number (e.g., 0xxxxxxxxx or +255xxxxxxxxx)."
    ),
});

type MobilePaymentFormData = yup.InferType<typeof mobilePaymentSchema>;

// Enum for payment status tracking
enum PaymentStatus {
  IDLE = "idle",
  INITIATING = "initiating",
  PENDING = "pending",
  SUCCESS = "success",
  FAILED_INITIATION = "failed_initiation",
  FAILED_CONFIRMATION = "failed_confirmation",
}

// Enhanced Input with Icon Component
const FormInputWithIcon = ({ icon: Icon, ...props }: any) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
    <Input {...props} className="pl-10 h-11" />
  </div>
);

export default function Step4_MobilePayment() {
  const { createdBooking, setStep, setBookingDetails, bookingDetails } =
    useBookingStore();
  const queryClient = useQueryClient();
  const [paymentState, setPaymentState] = useState<PaymentStatus>(
    PaymentStatus.IDLE
  );
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(
    null
  );

  const form = useForm<MobilePaymentFormData>({
    resolver: yupResolver(mobilePaymentSchema),
    mode: "onChange",
    defaultValues: {
      accountNumber: createdBooking?.phone_number
        ? String(createdBooking.phone_number)
        : "",
    },
  });

  // Query 1: Fetch Conversion Details
  const {
    data: fetchedConversionData,
    isLoading: isFetchingConversion,
    isError: conversionError,
    error: conversionErrorMessage,
    refetch: refetchConversion,
  } = useQuery<CurrencyConversionResponse>({
    queryKey: ["bookingCurrencyConversion", createdBooking?.id],
    queryFn: async () => {
      const response = await bookingClient.get(
        `/bookings/${createdBooking!.id}/currency-conversions`
      );
      return response.data;
    },
    enabled: !!createdBooking?.id && paymentState !== PaymentStatus.SUCCESS,
    retry: 1,
    refetchOnWindowFocus: false,
    onSuccess: (response) => {
      setBookingDetails(response.data.booking);
    },
  });

  const currentBookingDetails =
    bookingDetails || fetchedConversionData?.data.booking;
  const paymentReference = currentBookingDetails?.payment_reference;
  const currencyConversionDetails = useMemo(() => {
    const conversions = fetchedConversionData?.data.conversions;
    if (!conversions) return null;
    return (
      conversions.find(
        (c) => c.conversion_type === "amount_required_reference"
      ) || null
    );
  }, [fetchedConversionData]);
  const finalAmountTZS = currencyConversionDetails?.converted_amount;

  // Mutation: Initiate Mobile Payment
  const initiatePaymentMutation = useMutation<
    InitiateMobilePaymentResponse,
    Error,
    InitiateMobilePaymentPayload
  >({
    mutationFn: (payload) => paymentClient.post("/checkout", payload),
    onMutate: () => {
      setPaymentState(PaymentStatus.INITIATING);
    },
    onSuccess: (response) => {
      if (response.success && response.transactionId) {
        toast.info("Payment Request Sent", {
          description:
            "Please ask the guest to confirm the payment on their phone.",
        });
        setLastTransactionId(response.transactionId);
        setPaymentState(PaymentStatus.PENDING);
      } else {
        toast.error("Payment Initiation Failed", {
          description:
            response.message || "Unknown error from payment service.",
        });
        setPaymentState(PaymentStatus.FAILED_INITIATION);
      }
    },
    onError: (error) => {
      toast.error("Payment Initiation Failed", {
        description: error.message || "Could not connect to payment service.",
      });
      setPaymentState(PaymentStatus.FAILED_INITIATION);
    },
  });

  // Query 2: Poll Booking Status
  const { data: polledBookingData, error: pollingError } =
    useQuery<BookingDetails>({
      queryKey: ["bookingDetailsPoll", createdBooking?.id],
      queryFn: async () => {
        console.log(`Polling booking status for ID: ${createdBooking!.id}`);
        const response = await bookingClient.get(
          `/bookings/${createdBooking!.id}`
        );
        return response.data;
      },
      enabled: paymentState === PaymentStatus.PENDING && !!createdBooking?.id,
      refetchInterval: 5000,
      refetchOnWindowFocus: false,
      retry: false,
      onSuccess: (data) => {
        setBookingDetails(data);
        if (
          data.payment_status === "Paid" &&
          data.booking_status === "Confirmed"
        ) {
          toast.success("Payment Confirmed!", {
            description: "Booking status updated successfully.",
          });
          setPaymentState(PaymentStatus.SUCCESS);
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          queryClient.invalidateQueries({
            queryKey: ["bookingCurrencyConversion", createdBooking?.id],
          });
        } else {
          console.log(
            `Payment status: ${data.payment_status}, Booking status: ${data.booking_status}`
          );
        }
      },
      onError: (err) => {
        console.error("Polling error:", err);
        setPaymentState(PaymentStatus.FAILED_CONFIRMATION);
        toast.error("Status Check Failed", {
          description: err.message || "Could not verify payment.",
        });
      },
    });

  const onSubmit = (data: MobilePaymentFormData) => {
    if (!paymentReference || !finalAmountTZS) {
      toast.error("Missing Information", {
        description: "Payment reference or TZS amount not available.",
      });
      return;
    }

    const payload: InitiateMobilePaymentPayload = {
      accountNumber: data.accountNumber.replace("+", ""),
      referenceId: paymentReference,
      amount: finalAmountTZS,
    };
    initiatePaymentMutation.mutate(payload);
  };

  // Loading State
  if (isFetchingConversion && !currentBookingDetails) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Preparing Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Loading payment details and conversion rates...
        </p>
      </div>
    );
  }

  // Error State
  if (conversionError || (!finalAmountTZS && !isFetchingConversion)) {
    return (
      <Card className="max-w-2xl mx-auto border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Payment Details Unavailable
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Could not retrieve the final TZS amount or payment reference.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={() => setStep(3)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Confirmation
              </Button>
              <Button
                onClick={() => refetchConversion()}
                disabled={isFetchingConversion}
              >
                <RefreshCw
                  className={cn(
                    "mr-2 h-4 w-4",
                    isFetchingConversion && "animate-spin"
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

  // Success State
  if (paymentState === PaymentStatus.SUCCESS) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-3">
                Payment Successful!
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                The mobile payment has been confirmed and your booking is now
                complete.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
                </Button>
                <Button variant="main" onClick={() => setStep(5)}>
                  Proceed to Check-In
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending State
  if (paymentState === PaymentStatus.PENDING) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Hourglass className="h-10 w-10 text-amber-600 dark:text-amber-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-200 mb-3">
                Awaiting Payment Confirmation
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Payment request sent to guest's phone. Please ask them to
                approve the transaction.
              </p>
              {lastTransactionId && (
                <Badge variant="secondary" className="mb-4">
                  Transaction ID: {lastTransactionId}
                </Badge>
              )}
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPaymentState(PaymentStatus.IDLE)}
                >
                  Cancel & Retry
                </Button>
                <Button
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["bookingDetailsPoll", createdBooking?.id],
                    })
                  }
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Check Status
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default Form State
  return (
    <div className="space-y-8 p-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Smartphone className="h-4 w-4" />
          Step 4: Mobile Payment
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Initiate Mobile Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Enter the guest's phone number to send a secure payment request via
          mobile money.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Payment Form */}
        <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-700 shadow-none">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-3 text-2xl text-gray-900 dark:text-white">
              <Smartphone className="h-6 w-6 text-blue-600" />
              Mobile Payment Request
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Secure payment processing via mobile money
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
                  $
                  {currentBookingDetails?.billing_meta_data?.calculation_breakdown?.final_amount?.toFixed(
                    2
                  ) ?? "0.00"}
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Amount to Pay (TZS)
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {new Intl.NumberFormat("en-US").format(finalAmountTZS || 0)}{" "}
                  TZS
                </p>
              </div>
            </div>

            {/* Payment Reference */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Payment Reference:
                </span>
                <Badge className="font-mono bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  {paymentReference || "N/A"}
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
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Guest's Mobile Payment Number
                      </FormLabel>
                      <FormControl>
                        <FormInputWithIcon
                          icon={Phone}
                          type="tel"
                          placeholder="0712345678 or +255712345678"
                          {...field}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Disclaimer */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300">
                      Please Confirm
                    </h4>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                    By clicking "Send Payment Request", a payment request of{" "}
                    <strong>
                      {new Intl.NumberFormat("en-US").format(finalAmountTZS || 0)} TZS
                    </strong>{" "}
                    will be sent to the provided mobile number. Please confirm the
                    number and the amount with the guest before proceeding.
                  </p>
                </div>

                {/* Error Messages */}
                {(paymentState === PaymentStatus.FAILED_INITIATION ||
                  paymentState === PaymentStatus.FAILED_CONFIRMATION) && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <h4 className="font-semibold text-red-800 dark:text-red-300">
                        Payment Issue Detected
                      </h4>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {initiatePaymentMutation.error?.message ||
                        pollingError?.message}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                      Please check the phone number and try again, or consider
                      cash payment.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-start items-center pt-6 border-t border-gray-200 dark:border-gray-700 gap-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(3)}
                    disabled={initiatePaymentMutation.isPending}
                    className="h-11 px-6 border-gray-300 dark:border-gray-600"
                  >
                    Back to Confirmation
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !form.formState.isValid ||
                      initiatePaymentMutation.isPending ||
                      paymentState === PaymentStatus.PENDING
                    }
                    className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {(initiatePaymentMutation.isPending ||
                      paymentState === PaymentStatus.INITIATING) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Payment Request
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
                  Payment Processing
                </h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Payment request sent to guest's phone</li>
                <li>• Guest approves transaction</li>
                <li>• Automatic status updates</li>
                <li>• Instant booking confirmation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
