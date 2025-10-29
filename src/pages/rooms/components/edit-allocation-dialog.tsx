// src/pages/rooms/components/edit-allocation-dialog.tsx
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO, isValid } from "date-fns";
import { Loader2 } from "lucide-react";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

// --- Utils & API ---
import { cn } from "@/lib/utils";
import hotelClient from "@/api/hotel-client";
import {
  type Allocation,
  type EditAllocationPayload,
} from "@/types/allocation-types";

// --- Type Definitions ---
interface EditAllocationDialogProps {
  allocation: Allocation;
  onSuccess: () => void;
}

// --- Validation Schema (Updated for string dates) ---
const allocationSchema = yup.object().shape({
  name: yup.string().required("Allocation name is required."),
  total_rooms: yup
    .number()
    .typeError("Please enter a valid number.")
    .min(1, "You must allocate at least one room.")
    .required("Number of rooms is required."),
  start_date: yup
    .string()
    .required("Start date is required.")
    .test(
      "is-valid-date",
      "Invalid start date format",
      (value) => !!value && isValid(parseISO(value))
    ),
  end_date: yup
    .string()
    .required("End date is required.")
    .test(
      "is-valid-date",
      "Invalid end date format",
      (value) => !!value && isValid(parseISO(value))
    )
    .test(
      "is-after-start",
      "End date must be on or after start date", // Adjusted validation message
      function (value) {
        const { start_date } = this.parent;
        if (
          !value ||
          !start_date ||
          !isValid(parseISO(value)) ||
          !isValid(parseISO(start_date))
        )
          return true; // Let required/format handle empty/invalid
        return parseISO(value) >= parseISO(start_date); // Allow same day
      }
    ),
  notes: yup.string().optional(),
});

type AllocationFormData = yup.InferType<typeof allocationSchema>;

// --- Main Component ---
export function EditAllocationForm({
  allocation,
  onSuccess,
}: EditAllocationDialogProps) {
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const form = useForm<AllocationFormData>({
    resolver: yupResolver(allocationSchema),
    // Format dates to string for default values
    defaultValues: {
      name: allocation.name,
      total_rooms: allocation.total_rooms,
      start_date: format(parseISO(allocation.start_date), "yyyy-MM-dd"), // Format to string
      end_date: format(parseISO(allocation.end_date), "yyyy-MM-dd"), // Format to string
      notes: allocation.notes || "",
    },
    mode: "onChange",
  });

  const updateAllocationMutation = useMutation({
    mutationFn: (payload: EditAllocationPayload) =>
      hotelClient.patch(`/allocations/${allocation.id}/`, payload),
    onSuccess: () => {
      toast.success("Allocation updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({
        queryKey: ["allocation", allocation.id],
      });
      onSuccess(); // Close sheet on success
    },
    onError: (error: any) => {
      toast.error(
        `Update failed: ${error.response?.data?.detail || error.message}`
      );
    },
  });

  const onSubmit = (data: AllocationFormData) => {
    // Dates are already strings
    const payload: EditAllocationPayload = {
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      total_rooms: data.total_rooms,
      notes: data.notes,
      // status: data.status, // Add status if it becomes editable
    };
    updateAllocationMutation.mutate(payload);
  };

  // Consistent input styling
  const inputBaseClass =
    "h-10 bg-white dark:bg-[#101828] border border-gray-200 dark:border-[#1D2939] text-gray-800 dark:text-[#D0D5DD] rounded-md shadow-none focus:ring-2 focus:ring-blue-500 focus:border-[#0785CF] transition-all dark:placeholder:text-[#5D636E]";

  // --- STYLING FIX: Create disabled class that includes padding ---
  const disabledInputClass = cn(
    inputBaseClass,
    "opacity-70 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50",
    "flex items-center px-3" // Add padding to match <Input> component's internal padding
  );
  // --- END FIX ---

  return (
    // Applied shadow-none
    <div className="flex flex-col h-full bg-[#FFF] dark:bg-[#101828] shadow-none">
      {/* Applied shadow-none */}
      <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-6 bg-[#F9FAFB] dark:bg-[#101828] border-b border-[#E4E7EC] dark:border-b-[#1D2939] shadow-none">
        <SheetTitle className="text-2xl font-bold text-[#1D2939] dark:text-[#D0D5DD]">
          Edit Room Allocation
        </SheetTitle>
        <SheetDescription className="text-base text-[#667085] dark:text-[#98A2B3] mt-2">
          Update the details for the "{allocation.name}" allocation. Room type
          cannot be changed.
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col h-full min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-[#98A2B3]">
                      Allocation Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={cn(inputBaseClass)} // Use consistent class
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Disabled Room Type Input */}
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-[#98A2B3]">
                    Room Type (Cannot be changed){" "}
                  </FormLabel>
                  {/* --- STYLING FIX: Applied new disabledInputClass --- */}
                  <div className={cn(disabledInputClass)}>
                    {allocation.room_type_name ||
                      allocation.room_type.slice(0, 8)}
                  </div>
                </FormItem>
                {/* --- END FIX --- */}

                {/* Number of Rooms */}
                <FormField
                  control={form.control}
                  name="total_rooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-[#98A2B3]">
                        Number of Rooms
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          // Handle number conversion
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseInt(val, 10)
                            );
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          min="1"
                          className={cn(inputBaseClass)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- Native Date Inputs --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-[#98A2B3]">
                        Start Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className={cn(inputBaseClass)}
                          min={todayStr} // Prevent selecting past dates
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-[#98A2B3]">
                        End Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className={cn(inputBaseClass)}
                          min={form.watch("start_date") || todayStr} // Prevent end before start
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* --- End Native Date Inputs --- */}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-[#98A2B3]">
                      Notes (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any internal notes..."
                        {...field}
                        // Use consistent styling, shadow-none
                        className={cn(
                          "min-h-[100px] text-base resize-none rounded-md shadow-none",
                          inputBaseClass // Reuse base input class styling
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Applied shadow-none */}
          <SheetFooter className="flex-shrink-0 px-6 py-4 border-t bg-white dark:bg-[#101828] dark:border-t-[#1D2939] shadow-none">
            <div className="flex items-center justify-end gap-3 w-full">
              <SheetClose asChild>
                {/* Adjusted button style, added shadow-none */}
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg shadow-none border-gray-300 dark:border-[#1D2939] dark:bg-[#171F2F] dark:text-[#D0D5DD] dark:hover:bg-[#1C2433]"
                >
                  Cancel
                </Button>
              </SheetClose>
              {/* Adjusted button style, added shadow-none */}
              <Button
                className="bg-[#0785CF] hover:bg-[#0785CF]/90 text-[#FFF] rounded-lg shadow-none"
                type="submit"
                disabled={
                  updateAllocationMutation.isPending || !form.formState.isDirty
                } // Use form state for dirty check
              >
                {updateAllocationMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </SheetFooter>
        </form>
      </Form>
    </div>
  );
}
