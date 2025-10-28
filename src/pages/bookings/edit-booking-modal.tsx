"use client";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Info } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import {
  AlertTriangle,
  Loader2,
  Mail,
  MapPin,
  Phone,
  MessageSquare,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField as HookFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditableFormField } from "./EditableFormField";

// --- Type Definitions ---
interface Booking {
  id: string;
  code: string;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  booking_status: string;
  checkin: string | null;
  checkout: string | null;
  special_requests: string | null;
  service_notes: string | null;
  [key: string]: any;
}

interface EditBookingFormProps {
  booking: Booking;
  onUpdateComplete: () => void;
  onDirtyChange: (isDirty: boolean) => void;
}

const schema = yup.object().shape({
  full_name: yup
    .string()
    .min(3, "Name must be at least 3 characters")
    .required("Full name is required"),
  email: yup
    .string()
    .email("Must be a valid email")
    .required("Email is required"),
  phone_number: yup.string().required("Phone number is required"),
  address: yup.string().required("Address is required"),
  booking_status: yup.string().required("Booking status is required"),
  special_requests: yup.string().nullable(),
  service_notes: yup.string().nullable(),
});

// --- Styling Constants (from all-bookings.tsx) ---
const focusRingClass =
  "focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none";
const inputBaseClass =
  "bg-white dark:bg-[#171F2F] border border-[#DADCE0] dark:border-[#1D2939] dark:text-[#D0D5DD] dark:placeholder:text-[#5D636E] rounded-lg shadow-none h-10 px-3 py-2 text-sm";

export default function EditBookingForm({
  booking,
  onUpdateComplete,
  onDirtyChange,
}: EditBookingFormProps) {
  const queryClient = useQueryClient();
  const [isCheckoutRequested, setIsCheckoutRequested] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [dataToSave, setDataToSave] = useState<Partial<Booking> | null>(null);

  const form = useForm<Partial<Booking>>({
    resolver: yupResolver(schema),
    defaultValues: {
      full_name: booking.full_name,
      email: booking.email,
      phone_number: booking.phone_number.toString(),
      booking_status: booking.booking_status,
      address: booking.address,
      special_requests: booking.special_requests || "",
      service_notes: booking.service_notes || "",
    },
    mode: "onChange",
  });

  const {
    formState: { isDirty, dirtyFields },
  } = form;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const BOOKING_BASE_URL = "http://booking.safaripro.net/api/v1/";

  const updateBookingMutation = useMutation({
    mutationFn: (updatedData: Partial<Booking>) =>
      axios.patch(`${BOOKING_BASE_URL}bookings/${booking.id}`, updatedData),
    onSuccess: () => {
      toast.success("Booking details have been updated successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bookingDetails", booking.id],
      });
      onUpdateComplete();
    },
    onError: (error: any) =>
      toast.error(
        `Update Failed: ${error.response?.data?.detail || error.message}`
      ),
  });

  const checkOutMutation = useMutation({
    mutationFn: () =>
      axios.post(`${BOOKING_BASE_URL}bookings/${booking.id}/check_out`),
    onSuccess: () => {
      toast.success("Guest has been checked out successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bookingDetails", booking.id],
      });
      onUpdateComplete();
    },
    onError: (error: any) =>
      toast.error(
        `Check-out Failed: ${error.response?.data?.detail || error.message}`
      ),
  });

  const onUpdateSubmit = (data: Partial<Booking>) => {
    const changedData: Partial<Booking> = {};

    // Iterate over the keys of dirtyFields, which contains only the changed fields
    Object.keys(dirtyFields).forEach((key) => {
      const fieldName = key as keyof Partial<Booking>;
      changedData[fieldName] = data[fieldName];
    });

    if (Object.keys(changedData).length === 0) {
      toast.info("No changes were made.");
      onUpdateComplete();
      return;
    }

    setDataToSave(changedData);
    setShowSaveConfirmDialog(true);
  };

  const handleConfirmSave = () => {
    if (dataToSave) {
      updateBookingMutation.mutate(dataToSave);
    }
    setShowSaveConfirmDialog(false);
  };

  const handleCheckout = () => {
    if (isCheckoutRequested) {
      checkOutMutation.mutate();
    }
  };

  const isProcessing =
    updateBookingMutation.isPending || checkOutMutation.isPending;

  return (
    <div className="flex flex-col h-full bg-[#FFF] dark:bg-[#101828]">
      <SheetHeader className="px-6 pt-6 pb-4 border-b dark:border-b-[#1D2939]">
        <SheetTitle className="text-2xl font-bold text-[#1D2939] dark:text-[#D0D5DD]">
          Edit Booking: {booking.code}
        </SheetTitle>
        <SheetDescription className="text-base text-[#667085] dark:text-[#98A2B3]">
          Make changes to the booking details or perform a check-out.
        </SheetDescription>
      </SheetHeader>
      <Form {...form}>
        <form
          id="edit-booking-form"
          onSubmit={form.handleSubmit(onUpdateSubmit)}
          className="flex flex-col h-full min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Guest Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableFormField
                  control={form.control}
                  name="full_name"
                  label="Full Name"
                  placeholder="e.g., John Doe"
                  icon={User}
                />
                <EditableFormField
                  control={form.control}
                  name="email"
                  label="Email"
                  placeholder="e.g., john.doe@example.com"
                  icon={Mail}
                  type="email"
                />
                <EditableFormField
                  control={form.control}
                  name="phone_number"
                  label="Phone Number"
                  placeholder="e.g., 712 345 678"
                  icon={Phone}
                  type="tel"
                />
                <EditableFormField
                  control={form.control}
                  name="address"
                  label="Address"
                  placeholder="e.g., Dar es Salaam, Tanzania"
                  icon={MapPin}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Booking Status
                </h3>
              </div>
              <HookFormField
                control={form.control}
                name="booking_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">
                      Status
                    </FormLabel>
                    <Select
                      disabled={booking.booking_status === "Checked Out"}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(inputBaseClass, focusRingClass)}
                        >
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-[#101828] dark:border-[#1D2939]">
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Checked In">Checked In</SelectItem>
                        <SelectItem value="Checked Out">Checked Out</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {booking.booking_status === "Confirmed" && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-lg border border-amber-200 dark:border-amber-700/60">
                  <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    This booking is already confirmed. Reverting its status to
                    "Processing" or "Pending" is not recommended as it may
                    disrupt the booking lifecycle.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notes & Requests
                </h3>
              </div>
              <HookFormField
                control={form.control}
                name="special_requests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Guest's Special Requests</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., extra pillows, late check-in..."
                        rows={3}
                        {...field}
                        className={cn(inputBaseClass, focusRingClass)}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <HookFormField
                control={form.control}
                name="service_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Internal Service Notes</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., VIP guest, anniversary celebration..."
                        rows={3}
                        {...field}
                        className={cn(inputBaseClass, focusRingClass)}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {booking.checkin && !booking.checkout && (
              <>
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                    <h3 className="text-lg font-semibold text-rose-800 dark:text-rose-200">
                      Guest Check-out
                    </h3>
                  </div>
                  <p className="text-sm text-rose-700 dark:text-rose-300">
                    This action will mark the booking as "Completed" and cannot
                    be undone.
                  </p>
                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox
                      id="confirm-checkout"
                      checked={isCheckoutRequested}
                      onCheckedChange={(checked) =>
                        setIsCheckoutRequested(checked as boolean)
                      }
                      className="mt-0.5 border-black dark:border-white"
                    />
                    <div>
                      <label
                        htmlFor="confirm-checkout"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        I confirm I want to check this guest out now.
                      </label>
                    </div>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    disabled={!isCheckoutRequested || isProcessing}
                    variant="destructive"
                    className="w-full"
                  >
                    {checkOutMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Check Out Guest
                  </Button>
                </div>
              </>
            )}
          </div>

          <SheetFooter className="px-6 py-4 border-t dark:border-t-[#1D2939]">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="submit"
              form="edit-booking-form"
              disabled={isProcessing || !isDirty}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateBookingMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </Form>

      <AlertDialog
        open={showSaveConfirmDialog}
        onOpenChange={setShowSaveConfirmDialog}
      >
        <AlertDialogContent className="shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes to the booking?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleConfirmSave}
            >
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
