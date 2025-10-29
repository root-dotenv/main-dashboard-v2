import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-normal transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "cursor-pointer bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all duration-200",
        destructive:
          "cursor-pointer bg-destructive text-white hover:bg-destructive/90 active:scale-[0.98] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "cursor-pointer border-2 border-primary text-primary bg-transparent hover:bg-primary/10 hover:border-primary/80 active:scale-[0.98] dark:border-primary dark:hover:bg-primary/10 transition-all duration-200",
        secondary:
          "cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        ghost:
          "cursor-pointer hover:bg-primary/10 hover:text-primary active:scale-[0.98] dark:hover:bg-primary/10 dark:hover:text-primary transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 transition-colors duration-200",
        main: "cursor-pointer bg-[#0785CF] hover:bg-[#0785CF]/90 text-white leading-[20px] flex items-center justify-center rounded-2xl border-none text-[0.9375rem] transition-all duration-200 active:scale-[0.98]",
        available:
          "cursor-pointer bg-[#039855] hover:bg-[#039855]/90 text-white leading-[20px] flex items-center justify-center rounded-2xl text-[0.9375rem] transition-all duration-200 active:scale-[0.98]",
        booked:
          "cursor-pointer bg-yellow-600 hover:bg-yellow-600/90 text-white leading-[20px] flex items-center justify-center rounded-2xl text-[0.9375rem] transition-all duration-200 active:scale-[0.98]",
        maintenance:
          "cursor-pointer bg-red-500 hover:bg-red-500/90 text-white leading-[20px] flex items-center justify-center rounded-2xl text-[0.9375rem] transition-all duration-200 active:scale-[0.98]",
      },

      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-9 rounded-2xl gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-2xl px-8 has-[>svg]:px-6",
        icon: "size-10 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
