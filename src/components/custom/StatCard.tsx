import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  count: number | undefined;
  icon: React.ElementType;
  isLoading: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  icon: Icon,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-[#FFF] dark:bg-[#171F2F] flex items-center border border-[#E4E7EC] dark:border-[#1D2939] rounded-md px-4 py-6 shadow-xs">
        <div className="flex items-center gap-3 w-full">
          <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-7 w-16 bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF] dark:bg-[#171F2F] flex items-center border border-[#E4E7EC] dark:border-[#1D2939] rounded-md px-4 py-6 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#D6EEF9] dark:bg-[#B4E6F5]/30 rounded-full">
          <Icon className="h-5 w-5 text-[#0785CF] dark:text-[#0785CF]" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-[#98A2B3]">{title}</p>
          <p className="text-2xl font-semibold text-[#1D2939] dark:text-[#D0D5DD]">
            {count?.toLocaleString() ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
};
