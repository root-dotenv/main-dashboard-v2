"use client";
import { useState, useMemo } from "react";
import { useHotel } from "../../providers/hotel-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import hotelClient from "../../api/hotel-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "./empty-state";
import { MoreHorizontal, Trash2, Search, Plus } from "lucide-react";
import { FeatureSelectionSheet } from "./selection-sheet";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
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
import ErrorPage from "@/components/custom/error-page";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Amenity,
  Facility,
  Service,
  MealType,
  Theme,
  Translation,
} from "./features";

type Feature = Amenity | Facility | Service | MealType | Theme | Translation;

interface GenericFeaturePageProps {
  featureName: string; // e.g., "Amenities"
  endpoint:
    | "amenities"
    | "facilities"
    | "services"
    | "meal-types"
    | "themes"
    | "translations";
  hotelDataKey:
    | "amenities"
    | "facilities"
    | "services"
    | "meal_types"
    | "themes"
    | "translations";
  Icon: React.ElementType;
  renderExtraContent?: (feature: any) => React.ReactNode;
  nameKey?: string;
}

export default function GenericFeaturePage({
  featureName,
  endpoint,
  hotelDataKey,
  Icon,
  renderExtraContent,
  nameKey = "name",
}: GenericFeaturePageProps) {
  const queryClient = useQueryClient();
  const {
    hotel,
    isLoading: isHotelLoading,
    isError: isHotelError,
    error: hotelError,
    refetch: refetchHotel,
  } = useHotel();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [featureToRemove, setFeatureToRemove] = useState<Feature | null>(null);

  const { data: allFeatures, isLoading: areAllFeaturesLoading } = useQuery<
    Feature[]
  >({
    queryKey: [`all${featureName}`],
    queryFn: async () => (await hotelClient.get(`${endpoint}/`)).data.results,
  });

  const hotelFeatureIds = useMemo(
    () => new Set(hotel?.[hotelDataKey] || []),
    [hotel, hotelDataKey]
  );

  const features = useMemo(
    () =>
      allFeatures?.filter((feature) => hotelFeatureIds.has(feature.id)) || [],
    [allFeatures, hotelFeatureIds]
  );

  const updateHotelMutation = useMutation({
    mutationFn: (newFeatureIds: string[]) =>
      hotelClient.patch(`hotels/${hotel!.id}/`, {
        [hotelDataKey]: newFeatureIds,
      }),
    onSuccess: () => {
      toast.success(`Hotel ${featureName.toLowerCase()} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["hotel", hotel!.id] });
      setIsSheetOpen(false);
    },
    onError: (err) =>
      toast.error(
        `Failed to update ${featureName.toLowerCase()}: ${err.message}`
      ),
  });

  const handleOpenSheet = () => {
    setSelectedIds(hotelFeatureIds);
    setIsSheetOpen(true);
  };

  const handleSelectionChange = (id: string, isSelected: boolean) => {
    const newIds = new Set(selectedIds);
    isSelected ? newIds.add(id) : newIds.delete(id);
    setSelectedIds(newIds);
  };

  const handleSave = () => {
    updateHotelMutation.mutate(Array.from(selectedIds));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const confirmRemove = () => {
    if (featureToRemove) {
      const currentIds = new Set(hotel?.[hotelDataKey] || []);
      currentIds.delete(featureToRemove.id);
      updateHotelMutation.mutate(Array.from(currentIds));
      setFeatureToRemove(null);
    }
  };

  const filteredFeatures = features.filter(
    (feature) =>
      feature[nameKey].toLowerCase().includes(search.toLowerCase()) ||
      (feature.description &&
        feature.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (isHotelLoading || areAllFeaturesLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isHotelError)
    return <ErrorPage error={hotelError as Error} onRetry={refetchHotel} />;

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#D0D5DD]">
              Hotel {featureName} ({features.length})
            </h2>
            <p className="text-gray-600 dark:text-[#98A2B3]">
              Manage the {featureName.toLowerCase()} available at your hotel.
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#5D636E]" />
              <Input
                placeholder={`Search ${featureName.toLowerCase()}...`}
                className="h-10 pl-10 pr-4 w-full bg-white dark:bg-[#171F2F] border-[1.25px] border-[#E4E7EC] dark:border-[#1D2939] rounded-lg shadow-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <SheetTrigger asChild>
              <Button
                onClick={handleOpenSheet}
                className="h-10 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-[#FFF] hover:text-[#FFF] px-4 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add or Remove</span>
              </Button>
            </SheetTrigger>
          </div>
        </div>

        <div>
          {filteredFeatures.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatures.map((feature) => (
                <Card
                  key={feature.id}
                  className="flex flex-col justify-between bg-white dark:bg-[#171F2F] border border-[#DADCE0] dark:border-[#1D2939] shadow-none rounded-xl transition-colors hover:border-blue-500 dark:hover:border-blue-700"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-800 dark:text-[#D0D5DD]">
                        {feature[nameKey]}
                      </CardTitle>
                      <Badge
                        className={cn(
                          "text-xs font-medium border",
                          feature.is_active
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700/60"
                            : "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-700/60"
                        )}
                      >
                        {feature.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {feature.description && (
                      <CardDescription className="pt-2 line-clamp-3 dark:text-[#98A2B3]">
                        {feature.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {renderExtraContent && renderExtraContent(feature)}
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
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            onClick={() => setFeatureToRemove(feature)}
                            className="text-rose-600 dark:text-rose-400 dark:focus:bg-rose-900/50 dark:focus:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
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
              title={`No ${featureName} Found`}
              description={
                search
                  ? `No ${featureName.toLowerCase()} match your search.`
                  : `This hotel has no ${featureName.toLowerCase()} listed yet.`
              }
              icon={<Icon className="h-10 w-10 text-gray-400" />}
            />
          )}
        </div>
      </div>
      <SheetContent className="w-full sm:max-w-lg p-0 bg-[#FFF] dark:bg-[#101828] border-l dark:border-l-[#1D2939]">
        <FeatureSelectionSheet
          title={`Manage Hotel ${featureName}`}
          description={`Select the ${featureName.toLowerCase()} available to attract more guests.`}
          items={allFeatures || []}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          onSave={handleSave}
          onClearSelection={handleClearSelection}
          isSaving={updateHotelMutation.isPending}
        />
      </SheetContent>
      <AlertDialog
        open={!!featureToRemove}
        onOpenChange={(open) => !open && setFeatureToRemove(null)}
      >
        <AlertDialogContent className="bg-white dark:bg-[#101828] dark:border-[#1D2939] rounded-xl shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-gray-900 dark:text-[#D0D5DD]">
              Confirm Removal
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-[#98A2B3]">
              Are you sure you want to remove the feature "
              <strong>{featureToRemove?.[nameKey]}</strong>" from your hotel?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
