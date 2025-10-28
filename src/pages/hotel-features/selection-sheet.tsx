// --- src/components/ui/feature-selection-sheet.tsx ---
"use client";
import { useState, useMemo } from "react";
import {
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Item {
  id: string;
  name: string;
}

interface FeatureSelectionSheetProps {
  title: string;
  description: string;
  items: Item[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, isSelected: boolean) => void;
  onSave: () => void;
  onClearSelection: () => void;
  isSaving: boolean;
}

export function FeatureSelectionSheet({
  title,
  description,
  items = [],
  selectedIds,
  onSelectionChange,
  onSave,
  onClearSelection,
  isSaving,
}: FeatureSelectionSheetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const handleSaveClick = () => {
    if (selectedIds.size === 0) {
      toast.warning("You must select at least one feature.", {
        description:
          "Your hotel needs to have at least one option available in this category.",
      });
      return;
    }
    onSave();
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#101828]">
      <SheetHeader className="px-6 pt-6 pb-4 border-b dark:border-b-[#1D2939]">
        <SheetTitle className="text-2xl font-bold text-[#1D2939] dark:text-[#D0D5DD]">
          {title}
        </SheetTitle>
        <SheetDescription className="dark:text-[#98A2B3] text-[#667085] text-[0.9375rem]">
          {description}
        </SheetDescription>
      </SheetHeader>

      <div className="p-6 border-b dark:border-b-[#1D2939]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
          <Input
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10 pr-4 w-full bg-white dark:bg-[#171F2F] border-[1.25px] border-[#E4E7EC] dark:border-[#1D2939] rounded-lg shadow-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-6">
          {filteredItems.map((item) => (
            <Label
              key={item.id}
              htmlFor={item.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors",
                "hover:bg-gray-100 dark:hover:bg-[#1C2433]",
                selectedIds.has(item.id) && "bg-blue-50 dark:bg-[#162142]"
              )}
            >
              <Checkbox
                id={item.id}
                checked={selectedIds.has(item.id)}
                onCheckedChange={(checked) =>
                  onSelectionChange(item.id, !!checked)
                }
                className="border-gray-400 dark:border-gray-500 rounded data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <span className="font-medium text-gray-800 dark:text-[#D0D5DD]">
                {item.name}
              </span>
            </Label>
          ))}
        </div>
      </ScrollArea>

      <SheetFooter className="px-6 py-4 border-t bg-white dark:bg-[#101828] dark:border-t-[#1D2939] space-y-4 sm:space-y-0">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 mb-4 mt-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            A hotel must have at least one feature in this category at all
            times.
          </p>
        </div>
        <div className="flex w-full justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClearSelection}>
            Clear Selection
          </Button>
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              className="dark:bg-transparent dark:border-[#1D2939] dark:hover:bg-[#1C2433] dark:text-[#D0D5DD]"
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            onClick={handleSaveClick}
            disabled={isSaving || selectedIds.size === 0}
            className="bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Hotel
          </Button>
        </div>
      </SheetFooter>
    </div>
  );
}
