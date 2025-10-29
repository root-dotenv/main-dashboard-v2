// src/components/ui/input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

// --- FIX 1: Used Omit to resolve the 'prefix' prop type conflict ---
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  prefix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefix, ...props }, ref) => {
    return (
      <div
        className={cn(
          // --- STYLES FOR THE WRAPPER ---
          "flex h-11 w-full items-center rounded-md border-[1.125px] border-input shadow-none transition-colors",
          "focus-within:border-[#0785CF] focus-within:ring-[1px] focus-within:ring-blue-600",
          "aria-[invalid=true]:border-destructive",
          "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
          className
        )}
      >
        {prefix && (
          <div className="flex h-full items-center border-r border-input bg-transparent px-3">
            <span className="text-sm text-slate-500">{prefix}</span>
          </div>
        )}
        <input
          type={type}
          className={cn(
            "h-full w-full min-w-0 flex-1 rounded-md bg-transparent px-3 py-1 text-base outline-none",
            "placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm",
            "border-none ring-0 focus:ring-0 focus:border-none"
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
