// --- src/pages/hotel/empty-state.tsx ---
import { type ReactNode } from "react";
import { FaInbox } from "react-icons/fa";
import { fa } from "zod/v4/locales";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
}

export function EmptyState({
  icon = <FaInbox className="h-10 w-10 text-gray-400" />,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center bg-transparent dark:bg-transparent my-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800/50">
        {icon}
      </div>
      <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-gray-200">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
