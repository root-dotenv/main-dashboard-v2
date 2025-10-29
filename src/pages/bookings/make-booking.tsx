// src/pages/bookings/make-booking.tsx
"use client";
import { useBookingStore } from "@/store/booking.store";
import { cn } from "@/lib/utils";
import { Check, Clock, Loader2 } from "lucide-react";
import Step1_SelectRoom from "./Step1_SelectRoom";
import Step2_GuestDetails from "./Step2_GuestDetails";
import Step3_ConfirmBooking from "./Step3_ConfirmBooking";
import Step4_MobilePayment from "./Step4_MobilePayment";
import Step4_ReceivePayment from "./Step4_ReceivePayment";
import Step5_CheckInAndFinish from "./Step5_CheckInAndFinish";
import { useHotel } from "@/providers/hotel-provider";

// Enhanced Professional Stepper UI Component
const BookingStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, label: "Select Room", description: "Choose accommodation" },
    { number: 2, label: "Guest Details", description: "Personal information" },
    { number: 3, label: "Confirmation", description: "Review booking" },
    { number: 4, label: "Payment", description: "Secure payment" },
    { number: 5, label: "Check-In", description: "Complete process" },
  ];

  const currentStepLabel = steps.find(
    (step) => step.number === currentStep
  )?.label;

  return (
    <div className="w-full">
      {/* Mobile View */}
      <div className="md:hidden text-center">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          Step {currentStep} of 5
        </p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {currentStepLabel}
        </p>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block w-full max-w-4xl mx-auto">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
            <div
              className="h-full bg-[#0785CF] transition-all duration-500 ease-in-out"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          <div className="flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              const isUpcoming = currentStep < step.number;

              return (
                <div
                  key={step.number}
                  className="flex flex-col items-center flex-1"
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 mb-3",
                      isCompleted && "bg-[#0785CF] border-[#0785CF]",
                      isCurrent &&
                        "border-[#0785CF] bg-white dark:bg-gray-800 shadow-lg scale-110",
                      isUpcoming &&
                        "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isCurrent && "text-[#0785CF]",
                          isUpcoming && "text-gray-400"
                        )}
                      >
                        {step.number}
                      </span>
                    )}

                    {/* Active Pulse Animation */}
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full bg-[#0785CF] animate-ping opacity-20" />
                    )}
                  </div>

                  {/* Step Labels */}
                  <div className="text-center px-2">
                    <p
                      className={cn(
                        "text-sm font-semibold mb-1",
                        isCompleted || isCurrent
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        "text-xs hidden sm:block",
                        isCompleted || isCurrent
                          ? "text-gray-600 dark:text-gray-300"
                          : "text-gray-400 dark:text-gray-500"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modified Header Component
const BookingHeader = () => {
  const { hotel } = useHotel();

  return (
    <div className="bg-gradient-to-r from-[#0785CF] via-[#B4E6F5] to-[#D6EEF9] text-white sticky top-0 z-30">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-[#D6EEF9] text-sm mb-4">
            <span>Bookings</span>
            <span className="text-white/60">/</span>
            <span className="text-white font-medium">New Booking</span>
          </nav>

          {/* Main Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                Create New Booking
              </h1>
            </div>
            {hotel && (
              <div className="flex items-center gap-2 text-sm text-[#D6EEF9]">
                <Clock className="h-4 w-4" />
                <span>Check-in: 3:00 PM • Check-out: 11:00 AM</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MakeBookingPage() {
  const { step, bookingDetails, createdBooking } = useBookingStore();

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1_SelectRoom />;
      case 2:
        return <Step2_GuestDetails />;
      case 3:
        return <Step3_ConfirmBooking />;
      case 4: {
        const paymentMethod =
          bookingDetails?.payment_method || createdBooking?.payment_method;

        if (paymentMethod === "Mobile") {
          return <Step4_MobilePayment />;
        } else if (paymentMethod === "Cash") {
          return <Step4_ReceivePayment />;
        } else {
          return (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[#0785CF]" />
            </div>
          );
        }
      }
      case 5:
        return <Step5_CheckInAndFinish />;
      default:
        return <Step1_SelectRoom />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <BookingHeader />

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Full-width Sticky Stepper Bar */}
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-4xl mx-auto p-8">
            <BookingStepper currentStep={step} />
          </div>
        </div>

        {/* Centered Content Area */}
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Step Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-none border border-gray-200 dark:border-gray-700">
            {renderStep()}
          </div>

          {/* Assistance Section */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Need assistance?{" "}
              <button className="text-[#0785CF] dark:text-[#0785CF] hover:text-[#0785CF] dark:hover:text-[#0785CF] font-medium underline">
                Contact our support team
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
