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
  CardContent,
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
  Clock,
  DollarSign,
  Users,
  MapPin,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import ErrorPage from "@/components/custom/error-page";
import { Skeleton } from "@/components/ui/skeleton";
import type { Activity, ActivityCategory } from "./features";
const categorySchema = z.object({
  name: z.string().min(3, "Category name is required."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
});

const activitySchema = z
  .object({
    name: z.string().min(3, "Activity name is required."),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters."),
    duration_minutes: z.coerce
      .number()
      .min(1, "Duration must be at least 1 minute."),
    price_per_person: z.coerce.number().min(0, "Price cannot be negative."),
    min_participants: z.coerce
      .number()
      .min(1, "Minimum participants must be at least 1."),
    max_participants: z.coerce
      .number()
      .min(1, "Maximum participants must be at least 1."),
    location: z.string().min(3, "Location is required."),
    is_indoor: z.boolean().default(false),
    is_outdoor: z.boolean().default(false),
    // --- MODIFICATION: Changed image to a URL string ---
    image: z.string().url("Please provide a valid image URL."),
    category: z.string().min(1, "Please select a category."),
  })
  .refine((data) => data.max_participants >= data.min_participants, {
    message:
      "Max participants must be greater than or equal to min participants.",
    path: ["max_participants"],
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
        <DialogFooter className="pt-8">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {category ? "Save Changes" : "Create Category"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
const ActivityForm = ({
  categories,
  activity,
  onComplete,
}: {
  hotelId: string;
  categories: ActivityCategory[];
  activity?: Activity;
  onComplete: () => void;
  hotelId: string;
}) => {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      is_indoor: false,
      is_outdoor: false,
      name: activity?.name || "",
      description: activity?.description || "",
      duration_minutes: activity?.duration_minutes || 0,
      price_per_person: parseFloat(activity?.price_per_person || "0"),
      min_participants: activity?.min_participants || 1,
      max_participants: activity?.max_participants || 1,
      location: activity?.location || "",
      image: activity?.image || "",
      category: activity?.category || "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof activitySchema>) => {
      const payload = { ...data, hotel: hotelId, is_active: true };
      return activity
        ? hotelClient.patch(`activities/${activity.id}/`, payload)
        : hotelClient.post("activities/", payload);
    },
    onSuccess: () => {
      toast.success(
        `Activity ${activity ? "updated" : "created"} successfully!`
      );
      queryClient.invalidateQueries({ queryKey: ["activities", hotelId] });
      onComplete();
    },
    onError: (err) =>
      toast.error(
        `Failed to ${activity ? "update" : "create"} activity: ${err.message}`
      ),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(mutate)} className="space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activity Details
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Guided Safari Tour" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the activity..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="category"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Logistics & Pricing
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="duration_minutes"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" /> Duration
                    (minutes)
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="price_per_person"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" /> Price per
                    Person (USD)
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="min_participants"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" /> Min Participants
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="max_participants"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" /> Max Participants
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            name="location"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" /> Location
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Serengeti National Park or Hotel Poolside"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Image
            </h3>
          </div>
          <FormField
            name="image"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/image.png"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch("image") && (
            <div className="mt-4">
              <FormLabel>Image Preview</FormLabel>
              <img
                src={form.watch("image")}
                alt="Activity preview"
                className="mt-2 w-full h-48 object-cover rounded-lg border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/600x400?text=Invalid+Image";
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {activity ? "Save Changes" : "Create Activity"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
export default function HotelActivities() {
  const {
    hotel,
    isLoading: isHotelLoading,
    isError: isHotelError,
    error: hotelError,
  } = useHotel();
  const [search, setSearch] = useState("");
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ActivityCategory | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<ActivityCategory | null>(null);
  const [deletingActivity, setDeletingActivity] =
    useState<ActivityCategory | null>(null);
  const queryClient = useQueryClient();

  // --- MODIFICATION: Fetch activities instead of categories ---
  const { data: activities = [], isLoading: areActivitiesLoading } = useQuery<
    Activity[]
  >({
    queryKey: ["activities", hotel?.id],
    queryFn: async () =>
      (await hotelClient.get(`activities/?hotel_id=${hotel!.id}`)).data.results,
    enabled: !!hotel,
  });

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

  const { mutate: deleteActivityMutate } = useMutation({
    mutationFn: (id: string) => hotelClient.delete(`activities/${id}/`),
    onSuccess: () => {
      toast.success("Activity deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["activities", hotel?.id] });
    },
    onError: (err) => toast.error(`Failed to delete activity: ${err.message}`),
  });

  const filteredActivities = useMemo(
    () =>
      activities.filter(
        (act) =>
          act.name.toLowerCase().includes(search.toLowerCase()) ||
          act.description.toLowerCase().includes(search.toLowerCase())
      ),
    [activities, search]
  );

  if (isHotelLoading || areActivitiesLoading) {
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
    <Dialog
      open={isFormOpen}
      onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingCategory(null);
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#D0D5DD]">
              Hotel Activities ({activities.length})
            </h2>
            <p className="text-gray-600 dark:text-[#98A2B3]">
              Create, view, and manage all activities offered at your hotel.
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
              <Input
                placeholder="Search activities..."
                className="h-10 pl-10 pr-4 w-full bg-white dark:bg-[#171F2F] border-[1.25px] border-[#E4E7EC] dark:border-[#1D2939] rounded-lg shadow-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <SheetTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryFormOpen(true);
                }}
                variant="outline"
                className="h-10 flex items-center gap-2"
              >
                <Palette className="h-4 w-4" />
                <span>Manage Categories</span>
              </Button>
            </SheetTrigger>
            <Button
              onClick={() => {
                setEditingActivity(undefined);
                setIsActivityFormOpen(true);
              }}
              className="h-10 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>New Activity</span>
            </Button>
          </div>
        </div>
        <Separator className="my-6 dark:bg-gray-700" />
        <div>
          {filteredActivities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((activity) => (
                <Card
                  key={activity.id}
                  className="flex flex-col justify-between bg-white dark:bg-[#171F2F] border border-[#DADCE0] dark:border-[#1D2939] shadow-none rounded-xl transition-colors hover:border-blue-500 dark:hover:border-blue-700"
                >
                  <div>
                    <img
                      src={activity.image}
                      alt={activity.name}
                      className="w-full h-40 object-cover rounded-t-xl"
                    />
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800 dark:text-[#D0D5DD]">
                        {activity.name}
                      </CardTitle>
                      <CardDescription className="pt-1 line-clamp-2 dark:text-[#98A2B3]">
                        <div style={{ paddingTop: "12px" }}>
                          {activity.description}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{activity.duration_minutes} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {activity.min_participants}-
                          {activity.max_participants} people
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{activity.location}</span>
                      </div>
                    </CardContent>
                  </div>
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
                        {/* TODO: Implement Edit/Delete for Activities */}
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingActivity(activity);
                            setIsActivityFormOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            onClick={() => setDeletingActivity(activity)}
                            className="text-rose-600 dark:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Activities Found"
              description={
                search
                  ? "No activities match your search."
                  : "Get started by creating a new activity."
              }
              icon={<Palette className="h-10 w-10 text-gray-400" />}
            />
          )}
        </div>
      </div>
      <DialogContent className="bg-white dark:bg-[#101828] dark:border-[#1D2939]">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Edit" : "Create"} Activity Category
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? "Update the details for this category."
              : "Add a new category for your hotel activities."}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          hotelId={hotel!.id}
          category={editingCategory || undefined}
          onComplete={() => setIsFormOpen(false)}
        />
      </DialogContent>
      <Dialog open={isActivityFormOpen} onOpenChange={setIsActivityFormOpen}>
        <DialogContent className="bg-white dark:bg-[#101828] dark:border-[#1D2939] max-w-2xl">
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
              onComplete={() => setIsCategoryFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent className="bg-white dark:bg-[#101828] dark:border-[#1D2939]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "
              <strong>{deletingCategory?.name}</strong>" category and all
              activities within it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutate(deletingCategory!.id)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!deletingActivity}
        onOpenChange={(open) => !open && setDeletingActivity(null)}
      >
        <AlertDialogContent className="bg-white dark:bg-[#101828] dark:border-[#1D2939]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "
              <strong>{deletingActivity?.name}</strong>" activity. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteActivityMutate(deletingActivity!.id)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
