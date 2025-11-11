// // src/pages/bookings/components/Step3_ConfirmBooking.tsx
// "use client";
// import { useMemo } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { useBookingStore } from "@/store/booking.store";
// import bookingClient from "@/api/booking-client";
// import {
//   type BookingDetails,
//   type CurrencyConversionResponse,
// } from "./booking-types";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import {
//   Loader2,
//   AlertCircle,
//   FileText,
//   User,
//   Calendar,
//   RefreshCw,
//   CheckCircle,
//   CreditCard,
//   Clock,
//   Shield,
// } from "lucide-react";
// import { FaCheck } from "react-icons/fa6";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";

// // Helper to format charge keys (e.g., "BASE_CHARGE" -> "Base Charge")
// const formatChargeKey = (key: string) => {
//   return key
//     .replace(/_/g, " ")
//     .replace(
//       /\w\S*/g,
//       (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
//     );
// };

// export default function Step3_ConfirmBooking() {
//   const { createdBooking, setBookingDetails, setStep } = useBookingStore();

//   const {
//     data: queryData,
//     isLoading,
//     isError,
//     error,
//     refetch,
//     isFetching,
//   } = useQuery<CurrencyConversionResponse>({
//     queryKey: ["bookingCurrencyConversion", createdBooking?.id],
//     queryFn: async () => {
//       const response = await bookingClient.get(
//         `/bookings/${createdBooking!.id}/currency-conversions`
//       );
//       return response.data;
//     },
//     enabled: !!createdBooking?.id,
//     onSuccess: (response) => {
//       setBookingDetails(response.data.booking);
//     },
//     refetchInterval: (query) => {
//       const conversions = query.state.data?.data.conversions;
//       if (!conversions) return 2000;
//       const hasConversion = conversions.some(
//         (c) => c.conversion_type === "amount_required_reference"
//       );
//       return hasConversion ? false : 2000;
//     },
//     refetchOnWindowFocus: false,
//     retry: 2,
//   });

//   // Extract booking details from the new response structure
//   const bookingData: BookingDetails | undefined = useMemo(
//     () => queryData?.data.booking,
//     [queryData]
//   );

//   // Extract the specific conversion details we need
//   const currencyConversionDetails = useMemo(() => {
//     const conversions = queryData?.data.conversions;
//     if (!conversions) return null;
//     return (
//       conversions.find(
//         (c) => c.conversion_type === "amount_required_reference"
//       ) || null
//     );
//   }, [queryData]);

//   // Extract the charges breakdown object
//   const charges = useMemo(
//     () => bookingData?.billing_meta_data?.charges_breakdown,
//     [bookingData]
//   );

//   if (isLoading || (isFetching && !currencyConversionDetails)) {
//     return (
//       <div className="flex flex-col items-center justify-center text-center py-20 px-4">
//         <div className="relative w-24 h-24 flex items-center justify-center mb-6">
//           <div className="absolute inset-0 rounded-full bg-[#0785CF] opacity-10 animate-ping"></div>
//           <div className="relative w-20 h-20 bg-[#D6EEF9] dark:bg-[#B4E6F5]/20 rounded-full flex items-center justify-center">
//             <FileText className="h-10 w-10 text-[#0785CF]" />
//           </div>
//         </div>
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
//           Finalizing Your Invoice...
//         </h2>
//         <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
//           We're confirming final taxes, fees, and currency conversion rates for
//           your booking. This should only take a moment.
//         </p>
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <Card className="max-w-2xl mx-auto border-red-200 dark:border-red-800">
//         <CardContent className="pt-6">
//           <div className="text-center py-8">
//             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
//               <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
//             </div>
//             <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
//               Failed to Load Booking Details
//             </h3>
//             <p className="text-gray-600 dark:text-gray-400 mb-6">
//               {error.message}
//             </p>
//             <div className="flex items-center justify-center gap-4">
//               <Button onClick={() => setStep(2)} variant="outline">
//                 Go Back
//               </Button>
//               <Button onClick={() => refetch()} disabled={isFetching}>
//                 <RefreshCw
//                   className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
//                 />
//                 Try Again
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   if (bookingData) {
//     return (
//       <div className="space-y-8 p-8">
//         {/* Header Section */}
//         <div className="text-center">
//           <div className="inline-flex items-center gap-2 bg-[#D6EEF9] dark:bg-[#B4E6F5]/20 text-[#0785CF] dark:text-[#0785CF] px-4 py-2 rounded-full text-sm font-medium mb-4">
//             <FileText className="h-4 w-4" />
//             Step 3: Booking Confirmation
//           </div>
//           <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
//             Review Your Booking Details
//           </h2>
//           <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
//             Please carefully review the final booking details and pricing
//             breakdown before proceeding to payment.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Main Content */}
//           <div className="lg:col-span-2 space-y-6">
//             <Card className="border border-gray-200 dark:border-gray-700 shadow-none">
//               <CardHeader className="border-b">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 bg-[#0785CF] rounded-full flex items-center justify-center">
//                       <CheckCircle className="h-5 w-5 text-white" />
//                     </div>
//                     <div>
//                       <CardTitle className="text-2xl text-gray-900 dark:text-white">
//                         Booking Confirmation
//                       </CardTitle>
//                       <CardDescription>
//                         Complete booking summary and invoice
//                       </CardDescription>
//                     </div>
//                   </div>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => refetch()}
//                     disabled={isFetching}
//                     className="border-gray-300 dark:border-gray-600 shadow-none"
//                   >
//                     <RefreshCw
//                       className={cn(
//                         "mr-2 h-4 w-4",
//                         isFetching && "animate-spin"
//                       )}
//                     />
//                     Refresh
//                   </Button>
//                 </div>
//               </CardHeader>
//               <CardContent className="p-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                   {/* Left Column - Guest & Stay Details */}
//                   <div className="space-y-6">
//                     {/* Guest Information */}
//                     <div className="space-y-4">
//                       <div className="flex items-center gap-3">
//                         <div className="w-2 h-6 bg-[#0785CF] rounded-full"></div>
//                         <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
//                           <User className="h-5 w-5 text-[#0785CF]" />
//                           Guest Details
//                         </h4>
//                       </div>
//                       <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
//                         <div>
//                           <p className="font-semibold text-gray-900 dark:text-white">
//                             {bookingData.full_name}
//                           </p>
//                           <p className="text-sm text-gray-600 dark:text-gray-400">
//                             {bookingData.email}
//                           </p>
//                           <p className="text-sm text-gray-600 dark:text-gray-400">
//                             {bookingData.phone_number}
//                           </p>
//                         </div>
//                       </div>
//                     </div>

//                     <Separator className="bg-gray-200 dark:bg-gray-700" />

//                     {/* Stay Information */}
//                     <div className="space-y-4">
//                       <div className="flex items-center gap-3">
//                         <div className="w-2 h-6 bg-[#0785CF] rounded-full"></div>
//                         <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
//                           <Calendar className="h-5 w-5 text-[#0785CF]" />
//                           Stay Details
//                         </h4>
//                       </div>
//                       <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
//                         <div className="flex justify-between items-center">
//                           <span className="text-gray-600 dark:text-gray-400">
//                             Check-in:
//                           </span>
//                           <span className="font-semibold text-gray-900 dark:text-white">
//                             {format(
//                               new Date(bookingData.start_date),
//                               "MMM dd, yyyy"
//                             )}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-gray-600 dark:text-gray-400">
//                             Check-out:
//                           </span>
//                           <span className="font-semibold text-gray-900 dark:text-white">
//                             {format(
//                               new Date(bookingData.end_date),
//                               "MMM dd, yyyy"
//                             )}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-gray-600 dark:text-gray-400">
//                             Duration:
//                           </span>
//                           <Badge
//                             variant="secondary"
//                             className="bg-[#D6EEF9] text-[#0785CF] dark:bg-[#B4E6F5]/30 dark:text-[#0785CF]"
//                           >
//                             {bookingData.duration_days} Night
//                             {bookingData.duration_days > 1 ? "s" : ""}
//                           </Badge>
//                         </div>
//                       </div>
//                     </div>

//                     <Separator className="bg-gray-200 dark:bg-gray-700" />

//                     {/* Reference Information */}
//                     <div className="space-y-4">
//                       <div className="flex items-center gap-3">
//                         <div className="w-2 h-6 bg-[#0785CF] rounded-full"></div>
//                         <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
//                           Booking Reference
//                         </h4>
//                       </div>
//                       <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
//                         <div className="flex justify-between items-center">
//                           <span className="text-gray-600 dark:text-gray-400">
//                             Booking Code:
//                           </span>
//                           <p className="font-semibold text-[0.875rem] text-emerald-800">
//                             {bookingData.code}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Right Column - Pricing */}
//                   <div className="space-y-6">
//                     <div className="space-y-4">
//                       <div className="flex items-center gap-3">
//                         <div className="w-2 h-6 bg-[#0785CF] rounded-full"></div>
//                         <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
//                           <CreditCard className="h-5 w-5 text-[#0785CF]" />
//                           Pricing Breakdown (USD)
//                         </h4>
//                       </div>

//                       <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
//                         {charges ? (
//                           Object.entries(charges).map(
//                             ([key, charge]) =>
//                               charge && (
//                                 <div
//                                   className="flex justify-between items-center"
//                                   key={key}
//                                 >
//                                   <span className="text-sm text-gray-600 dark:text-gray-400">
//                                     {charge.description || formatChargeKey(key)}
//                                   </span>
//                                   <span className="font-medium text-gray-900 dark:text-white">
//                                     ${(charge.amount ?? 0).toFixed(2)}
//                                   </span>
//                                 </div>
//                               )
//                           )
//                         ) : (
//                           <p className="text-gray-500 text-center py-4">
//                             No charge details available.
//                           </p>
//                         )}

//                         <Separator className="bg-gray-200 dark:bg-gray-700" />

//                         <div className="flex justify-between items-center pt-2">
//                           <span className="font-semibold text-gray-900 dark:text-white">
//                             Total (USD)
//                           </span>
//                           <span className="text-xl font-bold text-emerald-800 dark:text-emerald-600 space-mono-bold">
//                             $
//                             {bookingData.billing_meta_data?.calculation_breakdown?.final_amount?.toFixed(
//                               2
//                             ) ?? "0.00"}
//                           </span>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Currency Conversion */}
//                     <div className="bg-[#D6EEF9] dark:bg-[#B4E6F5]/20 border border-[#B4E6F5]200 dark:border-[#B4E6F5]800 rounded-xl p-6 text-center">
//                       <div className="flex items-center justify-center gap-2 mb-3">
//                         <p className="text-sm font-semibold text-blue-800 dark:text-[#0785CF]">
//                           Total Amount to be Paid
//                         </p>
//                       </div>

//                       <p className="text-3xl font-bold text-[#0785CF] dark:text-[#0785CF] mb-2">
//                         {currencyConversionDetails ? (
//                           new Intl.NumberFormat("en-US", {
//                             style: "currency",
//                             currency:
//                               currencyConversionDetails.converted_currency,
//                           }).format(currencyConversionDetails.converted_amount)
//                         ) : (
//                           <Loader2 className="h-8 w-8 animate-spin inline-block text-[#0785CF]" />
//                         )}
//                       </p>

//                       {currencyConversionDetails && (
//                         <div className="flex items-center justify-center gap-2 text-xs text-[#0785CF] dark:text-[#0785CF]">
//                           <Clock className="h-3 w-3" />
//                           <span>
//                             1 {currencyConversionDetails.original_currency} ≈{" "}
//                             {parseFloat(
//                               currencyConversionDetails.exchange_rate
//                             ).toFixed(2)}{" "}
//                             {currencyConversionDetails.converted_currency}
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Sidebar */}
//           <div className="lg:col-span-1 space-y-6">
//             {/* Security Assurance */}
//             <Card className="border border-gray-200 dark:border-gray-700 shadow-none">
//               <CardContent className="p-6">
//                 <div className="flex items-center gap-3 mb-4">
//                   <div className="w-10 h-10 bg-[#0785CF] rounded-full flex items-center justify-center">
//                     <Shield className="h-5 w-5 text-white" />
//                   </div>
//                   <div>
//                     <h4 className="font-semibold text-blue-900 dark:text-blue-100">
//                       Secure Booking
//                     </h4>
//                     <p className="text-sm text-[#0785CF] dark:text-[#0785CF]">
//                       Your information is protected
//                     </p>
//                   </div>
//                 </div>
//                 <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
//                   <li className="flex items-center gap-2">
//                     <FaCheck className="h-4 w-4" />
//                     Encrypted payment processing
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <FaCheck className="h-4 w-4" />
//                     PCI DSS compliant
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <FaCheck className="h-4 w-4" />
//                     Secure data transmission
//                   </li>
//                 </ul>
//               </CardContent>
//             </Card>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex justify-start items-center pt-6 border-t border-gray-200 dark:border-gray-700 gap-6">
//           <Button
//             variant="outline"
//             onClick={() => setStep(2)}
//             className="h-11 px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
//           >
//             Back to Guest Details
//           </Button>
//           <Button
//             variant="main"
//             onClick={() => setStep(4)}
//             disabled={!currencyConversionDetails || isFetching}
//             className="h-11 px-8 bg-[#0785CF] hover:bg-[#0785CF]/90 text-white font-semibold"
//           >
//             Proceed to Payment
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return null;
// }

// src/pages/bookings/components/Step3_ConfirmBooking.tsx
"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBookingStore } from "@/store/booking.store";
import bookingClient from "@/api/booking-client";
import {
  type BookingDetails,
  type CurrencyConversionResponse,
} from "./booking-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  FileText,
  User,
  Calendar,
  RefreshCw,
  CheckCircle,
  CreditCard,
  Clock,
  Shield,
} from "lucide-react";
import { FaCheck } from "react-icons/fa6";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Helper to format charge keys (e.g., "BASE_CHARGE" -> "Base Charge")
const formatChargeKey = (key: string) => {
  return key
    .replace(/_/g, " ")
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
};

export default function Step3_ConfirmBooking() {
  const { createdBooking, setBookingDetails, setStep } = useBookingStore();

  const {
    data: queryData,
    isLoading, // --- This is TRUE only on the first load ---
    isError,
    error,
    refetch,
    isFetching, // --- This is TRUE on first load AND background polls ---
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
    refetchInterval: (query) => {
      const conversions = query.state.data?.data.conversions;
      // --- TASK 1: Changed 2000 to 5000 ---
      if (!conversions) return 5000;
      const hasConversion = conversions.some(
        (c) => c.conversion_type === "amount_required_reference"
      );
      // --- TASK 1: Changed 2000 to 5000 ---
      return hasConversion ? false : 5000;
    },
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Extract booking details from the new response structure
  const bookingData: BookingDetails | undefined = useMemo(
    () => queryData?.data.booking,
    [queryData]
  );

  // Extract the specific conversion details we need
  const currencyConversionDetails = useMemo(() => {
    const conversions = queryData?.data.conversions;
    if (!conversions) return null;
    return (
      conversions.find(
        (c) => c.conversion_type === "amount_required_reference"
      ) || null
    );
  }, [queryData]);

  // Extract the charges breakdown object
  const charges = useMemo(
    () => bookingData?.billing_meta_data?.charges_breakdown,
    [bookingData]
  );

  // --- TASK 2: Updated loading check to ONLY use `isLoading` ---
  // This prevents the full-page loader from showing on every poll.
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="w-20 h-20 bg-[#D6EEF9] dark:bg-[#B4E6F5]/20 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="h-10 w-10 animate-spin text-[#0785CF]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Finalizing Your Invoice
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          We're confirming final taxes, fees, and currency conversion rates for
          your booking.
        </p>
      </div>
    );
  }

  if (isError) {
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
              {error.message}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={() => setStep(2)} variant="outline">
                Go Back
              </Button>
              <Button onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw
                  className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
                />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookingData) {
    return (
      <div className="space-y-8 p-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-[#D6EEF9] dark:bg-[#B4E6F5]/20 text-[#0785CF] dark:text-[#0785CF] px-4 py-2 rounded-full text-sm font-medium mb-4">
            <FileText className="h-4 w-4" />
            Step 3: Booking Confirmation
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Review Your Booking Details
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Please carefully review the final booking details and pricing
            breakdown before proceeding to payment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-none">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0785CF] rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900 dark:text-white">
                        Booking Confirmation
                      </CardTitle>
                      <CardDescription>
                        Complete booking summary and invoice
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="border-gray-300 dark:border-gray-600 shadow-none"
                  >
                    <RefreshCw
                      className={cn(
                        "mr-2 h-4 w-4",
                        isFetching && "animate-spin"
                      )}
                    />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column - Guest & Stay Details */}
                  <div className="space-y-6">
                    {/* Guest Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-[#0785CF] rounded-full"></div>
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          <User className="h-5 w-5 text-[#0785CF]" />
                          Guest Details
                        </h4>
                      </div>
                      <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {bookingData.full_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {bookingData.email}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {bookingData.phone_number}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-gray-200 dark:bg-gray-700" />

                    {/* Stay Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-[#0785CF] rounded-full"></div>
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-[#0785CF]" />
                          Stay Details
                        </h4>
                      </div>
                      <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Check-in:
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {format(
                              new Date(bookingData.start_date),
                              "MMM dd, yyyy"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Check-out:
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {format(
                              new Date(bookingData.end_date),
                              "MMM dd, yyyy"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Duration:
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-[#D6EEF9] text-[#0785CF] dark:bg-[#B4E6F5]/30 dark:text-[#0785CF]"
                          >
                            {bookingData.duration_days} Night
                            {bookingData.duration_days > 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-gray-200 dark:bg-gray-700" />

                    {/* Reference Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-[#0785CF] rounded-full"></div>
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                          Booking Reference
                        </h4>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Booking Code:
                          </span>
                          <p className="font-semibold text-[0.875rem] text-emerald-800">
                            {bookingData.code}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Pricing */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-[#0785CF] rounded-full"></div>
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-[#0785CF]" />
                          Pricing Breakdown (USD)
                        </h4>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                        {charges ? (
                          Object.entries(charges).map(
                            ([key, charge]) =>
                              charge && (
                                <div
                                  className="flex justify-between items-center"
                                  key={key}
                                >
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {charge.description || formatChargeKey(key)}
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    ${(charge.amount ?? 0).toFixed(2)}
                                  </span>
                                </div>
                              )
                          )
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No charge details available.
                          </p>
                        )}

                        <Separator className="bg-gray-200 dark:bg-gray-700" />

                        <div className="flex justify-between items-center pt-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            Total (USD)
                          </span>
                          <span className="text-xl font-bold text-emerald-800 dark:text-emerald-600 space-mono-bold">
                            $
                            {bookingData.billing_meta_data?.calculation_breakdown?.final_amount?.toFixed(
                              2
                            ) ?? "0.00"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Currency Conversion */}
                    <div className="bg-[#D6EEF9] dark:bg-[#B4E6F5]/20 border border-[#B4E6F5]200 dark:border-[#B4E6F5]800 rounded-xl p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <p className="text-sm font-semibold text-blue-800 dark:text-[#0785CF]">
                          Total Amount to be Paid
                        </p>
                      </div>

                      <div className="text-3xl font-bold text-[#0785CF] dark:text-[#0785CF] mb-2 min-h-[40px] flex justify-center items-center">
                        {/* --- TASK 3: Replaced Loader2 with Skeleton --- */}
                        {currencyConversionDetails ? (
                          <span>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency:
                                currencyConversionDetails.converted_currency,
                            }).format(
                              currencyConversionDetails.converted_amount
                            )}
                          </span>
                        ) : (
                          <div className="h-9 w-40 bg-[#E6F1F5] dark:bg-gray-700 rounded-md animate-pulse mx-auto"></div>
                        )}
                      </div>

                      {currencyConversionDetails && (
                        <div className="flex items-center justify-center gap-2 text-xs text-[#0785CF] dark:text-[#0785CF]">
                          <Clock className="h-3 w-3" />
                          <span>
                            1 {currencyConversionDetails.original_currency} ≈{" "}
                            {parseFloat(
                              currencyConversionDetails.exchange_rate
                            ).toFixed(2)}{" "}
                            {currencyConversionDetails.converted_currency}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Security Assurance */}
            <Card className="border border-gray-200 dark:border-gray-700 shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#0785CF] rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Secure Booking
                    </h4>
                    <p className="text-sm text-[#0785CF] dark:text-[#0785CF]">
                      Your information is protected
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-center gap-2">
                    <FaCheck className="h-4 w-4" />
                    Encrypted payment processing
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="h-4 w-4" />
                    PCI DSS compliant
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="h-4 w-4" />
                    Secure data transmission
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-start items-center pt-6 border-t border-gray-200 dark:border-gray-700 gap-6">
          <Button
            variant="outline"
            onClick={() => setStep(2)}
            className="h-11 px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            Back to Guest Details
          </Button>
          <Button
            variant="main"
            onClick={() => setStep(4)}
            disabled={!currencyConversionDetails}
            className="h-11 px-8 bg-[#0785CF] hover:bg-[#0785CF]/90 text-white font-semibold"
          >
            {!currencyConversionDetails && isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizing...
              </>
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
