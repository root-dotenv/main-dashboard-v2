import type { Control } from "react-hook-form";
import {
  FormControl,
  FormField as HookFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/custom/InputCustom";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface EditableFormFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  placeholder?: string;
}

const focusRingClass =
  "focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 focus:border-[#B4E6F5]500 dark:focus:border-[#B4E6F5]400 focus:outline-none";
const inputBaseClass =
  "bg-white dark:bg-[#171F2F] border border-[#DADCE0] dark:border-[#1D2939] dark:text-[#D0D5DD] dark:placeholder:text-[#5D636E] rounded-lg shadow-none h-10 px-3 py-2 text-sm";

export function EditableFormField({
  control,
  name,
  label,
  icon: Icon,
  type = "text",
  placeholder,
}: EditableFormFieldProps) {
  return (
    <HookFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span>{label}</span>
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              className={cn(inputBaseClass, focusRingClass)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
