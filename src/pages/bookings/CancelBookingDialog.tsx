import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Ban } from "lucide-react";

interface CancelBookingDialogProps {
  bookingFullName: string;
  canCancel: boolean;
  onConfirm: () => void;
}

export function CancelBookingDialog({
  bookingFullName,
  canCancel,
  onConfirm,
}: CancelBookingDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div
          className={cn(
            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400",
            !canCancel &&
              "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent"
          )}
          onClick={(e) => !canCancel && e.preventDefault()}
        >
          <Ban className="mr-2 h-5 w-5" />
          <span>Cancel Booking</span>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent className="dark:bg-[#101828] dark:border-[#1D2939] rounded-xl shadow-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel the booking for '{bookingFullName}'?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, keep booking</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes, cancel booking
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
