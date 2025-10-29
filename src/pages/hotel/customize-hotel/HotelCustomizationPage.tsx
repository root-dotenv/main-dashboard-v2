import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type {
  Amenity,
  Country,
  Facility,
  Hotel,
  MealType,
  Service,
  Theme,
  Translation,
  Region,
  HotelType,
} from "./hotel";
import HotelCustomizationHeader from "./HotelCustomizationHeader";
import BasicInfoSection from "./BasicInfoSection";
import PropertyDetailsSection from "./PropertyDetailsSection";
import FeaturesSection from "./FeaturesSection";
import OtherPropertiesSection from "./OtherPropertiesSection";
import CurrentDetailsSection from "./CurrentDetailsSection";
import HotelCustomizationLayout, {
  type CustomizationView,
} from "./HotelCustomizationLayout";
import { useAuthStore } from "@/store/auth.store";
import { Loader2 } from "lucide-react";

const BASE_URL = "http://hotel.safaripro.net/api/v1/";

// --- API and Constants ---
const apiClient = axios.create({ baseURL: BASE_URL });

// --- Helper function for fetching data ---
const fetchResource = async <T,>(url: string): Promise<{ results: T[] }> => {
  const response = await apiClient.get<{ results: T[] } | T[]>(url);
  if (Array.isArray(response.data)) {
    return { results: response.data };
  }
  return response.data as { results: T[] };
};

export default function CustomizeHotel() {
  const [editData, setEditData] = useState<Partial<Hotel>>({});
  const [activeView, setActiveView] = useState<CustomizationView>("basic");
  const queryClient = useQueryClient();
  const { hotelId } = useAuthStore(); // --- DYNAMIC HOTEL ID ---

  // --- Data Fetching with React Query ---
  const {
    data: hotelData,
    isLoading: isLoadingHotel,
    error,
  } = useQuery<Hotel>({
    queryKey: ["hotel", hotelId],
    queryFn: async () => (await apiClient.get(`hotels/${hotelId}`)).data,
    enabled: !!hotelId, // --- Ensures query runs only when hotelId is available ---
  });

  const { data: countriesData, isLoading: isLoadingCountries } = useQuery({
    queryKey: ["countries"],
    queryFn: () => fetchResource<Country>("countries/"),
  });
  const { data: themesData, isLoading: isLoadingThemes } = useQuery({
    queryKey: ["themes"],
    queryFn: () => fetchResource<Theme>("themes/"),
  });
  const { data: mealTypesData, isLoading: isLoadingMealTypes } = useQuery({
    queryKey: ["mealTypes"],
    queryFn: () => fetchResource<MealType>("meal-types/"),
  });
  const { data: amenitiesData, isLoading: isLoadingAmenities } = useQuery({
    queryKey: ["amenities"],
    queryFn: () => fetchResource<Amenity>("amenities/"),
  });
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: () => fetchResource<Service>("services/"),
  });
  const { data: facilitiesData, isLoading: isLoadingFacilities } = useQuery({
    queryKey: ["facilities"],
    queryFn: () => fetchResource<Facility>("facilities/"),
  });
  const { data: translationsData, isLoading: isLoadingTranslations } = useQuery(
    {
      queryKey: ["translations"],
      queryFn: () => fetchResource<Translation>("translations/"),
    }
  );
  const { data: regionsData, isLoading: isLoadingRegions } = useQuery({
    queryKey: ["regions"],
    queryFn: () => fetchResource<Region>("regions/"),
  });
  const { data: hotelTypesData, isLoading: isLoadingHotelTypes } = useQuery({
    queryKey: ["hotelTypes"],
    queryFn: () => fetchResource<HotelType>("hotel-types/"),
  });

  const isLoading =
    isLoadingHotel ||
    isLoadingCountries ||
    isLoadingThemes ||
    isLoadingMealTypes ||
    isLoadingAmenities ||
    isLoadingServices ||
    isLoadingFacilities ||
    isLoadingTranslations ||
    isLoadingRegions ||
    isLoadingHotelTypes;

  // --- Mutation for Updating Hotel ---
  const updateHotelMutation = useMutation({
    mutationFn: async (changes: Partial<Hotel>) =>
      (await apiClient.patch(`hotels/${hotelId}/`, changes)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel", hotelId] });
      alert("Hotel details updated successfully! ✅");
    },
    onError: (err: any) => {
      alert(
        `Failed to update hotel: ${err.response?.data?.message || err.message}`
      );
    },
  });

  useEffect(() => {
    if (hotelData) setEditData(hotelData);
  }, [hotelData]);

  const handleFieldChange = (field: keyof Hotel, value: any) =>
    setEditData((prev) => ({ ...prev, [field]: value }));
  const handleArrayFieldChange = (field: keyof Hotel, value: string[]) =>
    setEditData((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!hotelData) return;
    const changes: Partial<Hotel> = {};
    Object.keys(editData).forEach((key) => {
      const k = key as keyof Hotel;
      if (JSON.stringify(editData[k]) !== JSON.stringify(hotelData[k])) {
        changes[k] = editData[k] as any;
      }
    });

    if (Object.keys(changes).length === 0) {
      alert("No changes to save.");
      return;
    }
    updateHotelMutation.mutate(changes);
  };

  const renderActiveSection = () => {
    switch (activeView) {
      case "basic":
        return (
          <BasicInfoSection
            editData={editData}
            handleFieldChange={handleFieldChange}
          />
        );
      case "property":
        return (
          <PropertyDetailsSection
            editData={editData}
            handleFieldChange={handleFieldChange}
            countries={countriesData?.results || []}
            hotelTypes={hotelTypesData?.results || []}
          />
        );
      case "features":
        return (
          <FeaturesSection
            editData={editData}
            handleArrayFieldChange={handleArrayFieldChange}
            themes={themesData?.results || []}
            mealTypes={mealTypesData?.results || []}
            amenities={amenitiesData?.results || []}
            services={servicesData?.results || []}
            facilities={facilitiesData?.results || []}
            translations={translationsData?.results || []}
            regions={regionsData?.results || []}
          />
        );
      case "other":
        return (
          <OtherPropertiesSection
            editData={editData}
            handleFieldChange={handleFieldChange}
          />
        );
      case "current":
        return <CurrentDetailsSection hotelData={hotelData} />;
      default:
        return null;
    }
  };

  if (!hotelId || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-none text-gray-700">
        <Loader2 className="animate-spin h-12 w-12 text-[#0785CF] mb-4" />
        <p>Loading hotel data...</p>
      </div>
    );
  }

  if (error || !hotelData) {
    return (
      <p className="p-8 text-center text-red-600">
        Error: Failed to load hotel data. Please try refreshing the page.
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-none min-h-screen">
      <HotelCustomizationHeader
        hotelName={hotelData.name}
        onSave={handleSave}
        isSaving={updateHotelMutation.isPending}
      />
      <HotelCustomizationLayout
        activeView={activeView}
        setActiveView={setActiveView}
      >
        {renderActiveSection()}
      </HotelCustomizationLayout>
    </div>
  );
}
