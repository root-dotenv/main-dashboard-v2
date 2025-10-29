import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-3 py-1 text-sm font-normal w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-primary text-primary bg-transparent hover:bg-primary/10 hover:text-primary dark:border-primary dark:hover:bg-primary/10",
        //  - - - custom themed "badge variant"
        success:
          "bg-[#ECFDF3] border border-green-300 text-[#039855] dark:bg-[#064E3B]/30 dark:border-green-700 dark:text-green-400",
        pending:
          "bg-[#FEF9C2] border border-yellow-300 text-[#CA8A04] dark:bg-[#78350F]/30 dark:border-yellow-700 dark:text-yellow-400",
        failed:
          "bg-[#FEF3F2] border border-red-300 text-[#DC2626] dark:bg-[#7F1D1D]/30 dark:border-red-700 dark:text-red-400",
        info:
          "bg-[#D6EEF9] border border-[#B4E6F5] text-[#0785CF] dark:bg-[#B4E6F5]/30 dark:border-[#0785CF] dark:text-[#0785CF]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
