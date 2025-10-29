// src/components/custom/error-page.tsx
import { Button } from "@/components/ui/button";
import { CircleX } from "lucide-react";

interface ErrorPageProps {
  error: Error;
  onRetry: () => void;
}

export default function ErrorPage({ error, onRetry }: ErrorPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <CircleX className="w-12 h-12 text-red-600 mb-6" />
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        An Error Occurred
      </h2>
      <p className="text-sm text-gray-600 mb-5 max-w-md">
        We apologize for the inconvenience. An issue occurred while processing
        your request. Please try again.
      </p>
      <p className="text-xs text-red-700 bg-red-50 px-4 py-2 rounded-lg mb-6 max-w-md">
        <strong>Error:</strong> {error.message}
      </p>
      <Button
        onClick={onRetry}
        className="bg-[#0785CF] hover:bg-[#0785CF]/90 text-white font-medium px-6 py-2 rounded-md transition-colors"
      >
        Retry
      </Button>
    </div>
  );
}
