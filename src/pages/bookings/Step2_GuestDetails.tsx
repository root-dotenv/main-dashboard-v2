// src/pages/bookings/components/Step2_GuestDetails.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useBookingStore } from "@/store/booking.store";
import { useHotel } from "@/providers/hotel-provider";
import bookingClient from "@/api/booking-client";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import {
  type CreateBookingPayload,
  type CreateBookingResponse,
} from "./booking-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  User,
  Mail,
  Home,
  Users,
  Baby,
  Info,
  Banknote,
  Smartphone,
  Calendar,
  MapPin,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

import "react-phone-number-input/style.css";
import PhoneInputWithCountry from "react-phone-number-input/react-hook-form";
import { isPossiblePhoneNumber } from "react-phone-number-input";
import { IoLocationOutline } from "react-icons/io5";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// Schema remains exactly the same
const guestDetailsSchema = yup.object({
  full_name: yup.string().required("Full name is required."),
  email: yup
    .string()
    .email("Invalid email address.")
    .required("Email is required."),
  phone_number: yup
    .string()
    .test(
      "is-possible",
      "Please enter a valid phone number",
      (value) => !value || isPossiblePhoneNumber(value)
    )
    .test(
      "length-check",
      "Phone number should be 9 digits, without the leading zero.",
      (value) => {
        if (!value) return true;
        const phoneNumber = parsePhoneNumberFromString(value);
        if (!phoneNumber) return true;
        if (phoneNumber.country === "TZ") {
          return phoneNumber.nationalNumber.length === 9;
        }
        return true;
      }
    )
    .required("Phone number is required."),
  address: yup.string().required("Address is required."),
  number_of_guests: yup
    .number()
    .min(1, "At least one guest is required.")
    .required()
    .typeError("Must be a number"),
  number_of_children: yup
    .number()
    .min(0)
    .required()
    .typeError("Must be a number"),
  number_of_infants: yup
    .number()
    .min(0)
    .required()
    .typeError("Must be a number"),
  payment_method: yup
    .string()
    .oneOf(["Cash", "Mobile"], "Please select a payment method.")
    .required("Payment method is required."),
  service_notes: yup.string().optional(),
  special_requests: yup.string().optional(),
});

type GuestDetailsFormData = yup.InferType<typeof guestDetailsSchema>;

// Enhanced Input with Icon Component
const FormInputWithIcon = ({ icon: Icon, ...props }: any) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
    <Input {...props} className="pl-10" />
  </div>
);

export default function Step2_GuestDetails() {
  const { hotel } = useHotel();
  const {
    startDate,
    endDate,
    selectedRoom,
    setCreatedBooking,
    setStep,
    setBookingPayload,
  } = useBookingStore();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const form = useForm<GuestDetailsFormData>({
    resolver: yupResolver(guestDetailsSchema),
    mode: "onBlur",
    defaultValues: {
      number_of_guests: 1,
      number_of_children: 0,
      number_of_infants: 0,
      service_notes: "",
      special_requests: "",
      payment_method: "Cash",
    },
  });

  const { errors, isValid } = form.formState;

  const mutation = useMutation<
    CreateBookingResponse,
    Error,
    CreateBookingPayload
  >({
    mutationKey: ["createBooking"],
    mutationFn: (payload) =>
      bookingClient.post("/bookings/web-create", payload),
    onSuccess: (response) => {
      toast.success("Booking draft created successfully!");
      setCreatedBooking(response.data);
      setStep(3);
    },
    onError: (error) => {
      toast.error(`Failed to create booking: ${error.message}`);
    },
  });

  const onSubmit = (data: GuestDetailsFormData) => {
    if (!selectedRoom || !startDate || !endDate || !hotel) {
      toast.error("Missing booking information. Please start over.", {
        description: "Key details like room selection or dates are missing.",
      });
      return;
    }

    const duration = differenceInDays(endDate, startDate) || 1;
    const amount_required = (duration * selectedRoom.price_per_night).toFixed(
      2
    );

    const payload: CreateBookingPayload = {
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone_number,
      address: data.address,
      number_of_guests: String(data.number_of_guests),
      number_of_children: String(data.number_of_children),
      number_of_infants: String(data.number_of_infants),
      service_notes: data.service_notes || "No",
      special_requests: data.special_requests || "No",
      amount_required,
      property_item_type: selectedRoom.room_type_name,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      microservice_item_id: hotel.id,
      booking_type: "Physical",
      booking_status: "Processing",
      payment_method: data.payment_method as "Cash" | "Mobile",
    };

    const fullUrl = `${bookingClient.defaults.baseURL}/bookings/web-create`;
    console.log("--- Debugging Booking Creation ---");
    console.log("Full Request URL:", fullUrl);
    console.log("Request Payload:", payload);

    setBookingPayload(payload);
    mutation.mutate(payload);
  };

  if (!selectedRoom || !startDate || !endDate) {
    return (
      <Card className="mx-auto max-w-md mt-8 shadow-none">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Missing Booking Information
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Please go back to Step 1 to select a room and date range.
            </p>
            <Button onClick={() => setStep(1)} className="w-full">
              Return to Room Selection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const duration = differenceInDays(endDate, startDate) || 1;
  const totalCost = duration * selectedRoom.price_per_night;
  const perNightCost = selectedRoom.price_per_night;

  return (
    <div className="space-y-8 p-8">
      <style>{`
        .custom-phone-input .PhoneInputCountry {
          margin-left: 16px;
        }
        .PhoneInputInput {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background-color: transparent !important;
          height: 100%;
          font-size: 16px;
        }
        .PhoneInput {
          display: flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          height: 44px;
          background-color: white;
          box-shadow: none;
        }
        .dark .PhoneInput {
          background-color: #1f2937;
          border-color: #4b5563;
        }
        .PhoneInput--error {
          border-color: #ef4444 !important;
        }
        .custom-form-label {
          font-size: 17px;
        }
        .custom-form-input {
          font-size: 16px;
        }
      `}</style>
      {/* Header Section */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <User className="h-4 w-4" />
          Step 2: Guest Information
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Complete Guest Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Please provide the primary guest's information and select your
          preferred payment method to proceed with the booking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Form - Enhanced Design */}
        <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-700 shadow-none">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <User className="h-6 w-6 text-blue-600" />
              Guest Information & Payment
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              All fields are required unless marked optional
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  * - required field
                </p>
                {/* Personal Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Personal Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 custom-form-label">
                            Full Name (First Name, Last Name)
                          </FormLabel>
                          <FormControl>
                            <FormInputWithIcon
                              icon={User}
                              placeholder="John Doe"
                              {...field}
                              className={cn(
                                "h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 custom-form-input",
                                form.formState.errors.full_name &&
                                  "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address
                            {form.formState.errors.email && (
                              <span className="text-red-500"> *</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <FormInputWithIcon
                              icon={Mail}
                              type="email"
                              placeholder="john.doe@email.com"
                              {...field}
                              className={cn(
                                "h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                                form.formState.errors.email &&
                                  "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phone Number
                            {form.formState.errors.phone_number && (
                              <span className="text-red-500"> *</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <PhoneInputWithCountry
                              name="phone_number"
                              control={form.control}
                              rules={{ required: true }}
                              maxLength={10}
                              defaultCountry="TZ"
                              placeholder="712 345 678"
                              className={cn(
                                "custom-phone-input rounded-md",
                                form.formState.errors.phone_number &&
                                  "PhoneInput--error"
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Address (i.e Region, Country)
                            {form.formState.errors.address && (
                              <span className="text-red-500"> *</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <FormInputWithIcon
                              icon={IoLocationOutline}
                              placeholder="Dar es Salaam, Tanzania"
                              {...field}
                              className={cn(
                                "h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                                form.formState.errors.address &&
                                  "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                {/* Occupancy Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Occupancy Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="number_of_guests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Adults
                            {form.formState.errors.number_of_guests && (
                              <span className="text-red-500"> *</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <FormInputWithIcon
                              icon={Users}
                              type="number"
                              min="1"
                              placeholder="2"
                              {...field}
                              className={cn(
                                "h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                                form.formState.errors.number_of_guests &&
                                  "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="number_of_children"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Children
                            {form.formState.errors.number_of_children && (
                              <span className="text-red-500"> *</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <FormInputWithIcon
                              icon={Users}
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              className={cn(
                                "h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                                form.formState.errors.number_of_children &&
                                  "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="number_of_infants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Infants
                            {form.formState.errors.number_of_infants && (
                              <span className="text-red-500"> *</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <FormInputWithIcon
                              icon={Baby}
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              className={cn(
                                "h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                                form.formState.errors.number_of_infants &&
                                  "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                {/* Payment Method Section - Enhanced */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Payment Method
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => {
                      const paymentTabs = [
                        {
                          value: "Cash",
                          label: "Pay with Cash",
                          description: "Pay at the property",
                          icon: Banknote,
                        },
                        {
                          value: "Mobile",
                          label: "Mobile Payment",
                          description: "Secure digital payment",
                          icon: Smartphone,
                        },
                      ];
                      return (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-base font-semibold text-gray-900 dark:text-white">
                            Select your preferred payment method
                            {form.formState.errors.payment_method && (
                              <span className="text-red-500"> *</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-1 w-full">
                              {paymentTabs.map((tab) => {
                                const isActive = field.value === tab.value;
                                return (
                                  <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => {
                                      form.setValue(
                                        "payment_method",
                                        tab.value as "Cash" | "Mobile"
                                      );
                                      form.trigger("payment_method");
                                    }}
                                    className={cn(
                                      "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 w-full",
                                      isActive
                                        ? "bg-blue-600 text-white"
                                        : "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    )}
                                  >
                                    {tab.label}
                                  </button>
                                );
                              })}
                            </div>
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                {/* Additional Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Additional Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="service_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Guest's Service Note (if any)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Guest is traveling with a pet, special dietary requirements..."
                              className={cn(
                                "min-h-[100px] resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 custom-form-input",
                                form.formState.errors.service_notes &&
                                  "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                              )}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="special_requests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Guest's Special Request (if any)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Late check-in, room preferences, airport transfer..."
                              className={cn(
                                "min-h-[100px] resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                                form.formState.errors.special_requests &&
                                  "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                              )}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                                {!isValid && (
                  <p className="text-red-500 text-sm">
                    {Object.keys(errors).length > 1
                      ? "Be sure to fill all field before submitting"
                      : `${Object.keys(errors).map(key => key.replace(/_/g, ' ')).join(', ')} is required and should be filled to continue`}
                  </p>
                )}
                <div className="flex justify-start items-center pt-6 border-t border-gray-200 dark:border-gray-700 gap-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-11 px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Back to Room Selection
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending || !form.formState.isValid}
                    className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Booking...
                      </>
                    ) : (
                      "Create Booking & Continue"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Enhanced Booking Summary Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-28 border border-gray-200 dark:border-gray-700 shadow-none">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <CreditCard className="h-5 w-5 text-green-600" />
                Booking Summary
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Review your reservation details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Room Information */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                      {selectedRoom.room_type_name}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {selectedRoom.room_code}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${totalCost.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ${perNightCost}/night × {duration} night
                      {duration > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              {/* Stay Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Stay Duration
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {format(startDate, "MMM dd, yyyy")} -{" "}
                      {format(endDate, "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Property
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {hotel?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Number of Days
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {duration} {duration > 1 ? "days" : "day"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Base price:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Taxes & fees:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${(totalCost * 0.27).toFixed(2)}
                  </span>
                </div>
                <Separator className="bg-gray-200 dark:bg-gray-700" />
                <div className="flex justify-between items-center pt-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${(totalCost * 1.27).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                Your information is secure and encrypted
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
