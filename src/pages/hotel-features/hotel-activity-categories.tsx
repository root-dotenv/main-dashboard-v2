"use client";
import { useState, useMemo } from "react";
import { useHotel } from "../../providers/hotel-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import hotelClient from "../../api/hotel-client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "./empty-state";
import {
  MoreHorizontal,
  Trash2,
  Search,
  Plus,
  Edit,
  Loader2,
  Palette,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import ErrorPage from "@/components/custom/error-page";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityCategory } from "./features";

const categorySchema = z.object({
  name: z.string().min(3, "Category name is required."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
});

const CategoryForm = ({
  hotelId,
  category,
  onComplete,
}: {
  hotelId: string;
  category?: ActivityCategory;
  onComplete: () => void;
}) => {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof categorySchema>) => {
      const payload = { ...data, hotel: hotelId, is_active: true };
      return category
        ? hotelClient.patch(`activity-categories/${category.id}/`, payload)
        : hotelClient.post("activity-categories/", payload);
    },
    onSuccess: () => {
      toast.success(
        `Activity category ${category ? "updated" : "created"} successfully!`
      );
      queryClient.invalidateQueries({
        queryKey: ["activityCategories", hotelId],
      });
      onComplete();
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(mutate)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Water Sports" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the category..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SheetFooter className="pt-8">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {category ? "Save Changes" : "Create Category"}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
};

export default function HotelActivityCategories() {
  const {
    hotel,
    isLoading: isHotelLoading,
    isError: isHotelError,
    error: hotelError,
  } = useHotel();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ActivityCategory | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<ActivityCategory | null>(null);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: areCategoriesLoading } = useQuery<
    ActivityCategory[]
  >({
    queryKey: ["activityCategories", hotel?.id],
    queryFn: async () =>
      (await hotelClient.get(`activity-categories/?hotel_id=${hotel!.id}`)).data
        .results,
    enabled: !!hotel,
  });

  const { mutate: deleteMutate } = useMutation({
    mutationFn: (id: string) =>
      hotelClient.delete(`activity-categories/${id}/`),
    onSuccess: () => {
      toast.success("Category deleted successfully.");
      queryClient.invalidateQueries({
        queryKey: ["activityCategories", hotel?.id],
      });
      setDeletingCategory(null);
    },
    onError: (err) => toast.error(`Failed to delete: ${err.message}`),
  });

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(search.toLowerCase()) ||
          cat.description.toLowerCase().includes(search.toLowerCase())
      ),
    [categories, search]
  );

  if (isHotelLoading || areCategoriesLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isHotelError) return <ErrorPage error={hotelError as Error} />;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#D0D5DD]">
              Activity Categories ({categories.length})
            </h2>
            <p className="text-gray-600 dark:text-[#98A2B3]">
              Manage categories for your hotel's activities.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
              <Input
                placeholder="Search categories..."
                className="h-10 pl-10 pr-4 w-full bg-white dark:bg-[#171F2F] border-[1.25px] border-[#E4E7EC] dark:border-[#1D2939] rounded-lg shadow-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setIsFormOpen(true);
              }}
              className="h-10 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>New Category</span>
            </Button>
          </div>
        </div>
        <Separator className="my-6 dark:bg-gray-700" />
        <div>
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="flex flex-col justify-between bg-white dark:bg-[#171F2F] border border-[#DADCE0] dark:border-[#1D2939] shadow-none rounded-xl transition-colors hover:border-blue-500 dark:hover:border-blue-700"
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-800 dark:text-[#D0D5DD]">
                      {category.name}
                    </CardTitle>
                    <CardDescription className="pt-1 line-clamp-2 dark:text-[#98A2B3]">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-end items-center p-4 mt-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-9 w-9 p-0 rounded-full dark:hover:bg-[#1D2939]"
                        >
                          <MoreHorizontal className="h-5 w-5 dark:text-[#98A2B3]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="dark:bg-[#101828] dark:border-[#1D2939]"
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingCategory(category);
                            setIsFormOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-rose-600 dark:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-[#101828] dark:border-[#1D2939]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the "
                                <strong>{category.name}</strong>" category. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutate(category.id)}
                                className="bg-rose-600 hover:bg-rose-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Activity Categories Found"
              description={
                search
                  ? "No categories match your search."
                  : "Get started by creating a new category."
              }
              icon={<Palette className="h-10 w-10 text-gray-400" />}
            />
          )}
        </div>
      </div>
      <Sheet
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCategory(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-lg p-0 bg-white dark:bg-[#101828] border-l dark:border-l-[#1D2939]">
          <SheetHeader className="px-6 pt-6 pb-4 border-b dark:border-b-[#1D2939]">
            <SheetTitle>
              {editingCategory ? "Edit" : "Create"} Activity Category
            </SheetTitle>
            <SheetDescription>
              {editingCategory
                ? "Update the details for this category."
                : "Add a new category for your hotel activities."}
            </SheetDescription>
          </SheetHeader>
          <div className="p-6">
            <CategoryForm
              hotelId={hotel!.id}
              category={editingCategory || undefined}
              onComplete={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
