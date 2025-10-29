// --- src/pages/hotel/hotel-features-layout.tsx ---
"use client";
import { useState } from "react";
import HotelFacilities from "./hotel-facilities";
import HotelServices from "./hotel-services";
import HotelMealTypes from "./hotel-meals";
import HotelAmenities from "./hotel-amenities";
import HotelTranslations from "./hotel-translations";
import HotelThemes from "./hotel-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type FeatureView =
  | "amenities"
  | "facilities"
  | "services"
  | "mealTypes"
  | "translations"
  | "themes";

interface NavItem {
  id: FeatureView;
  label: string;
}

export default function HotelFeaturesLayout() {
  const [activeView, setActiveView] = useState<FeatureView>("amenities");

  const navItems: NavItem[] = [
    { id: "amenities", label: "Amenities" },
    { id: "facilities", label: "Facilities" },
    { id: "services", label: "Services" },
    { id: "mealTypes", label: "Meal Plans" },
    { id: "translations", label: "Translations" },
    { id: "themes", label: "Themes" },
  ];

  const renderContent = () => {
    switch (activeView) {
      case "amenities":
        return <HotelAmenities />;
      case "facilities":
        return <HotelFacilities />;
      case "services":
        return <HotelServices />;
      case "mealTypes":
        return <HotelMealTypes />;
      case "translations":
        return <HotelTranslations />;
      case "themes":
        return <HotelThemes />;
      default:
        return <HotelAmenities />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFDFD] dark:bg-[#101828]">
      <main className="container mx-auto p-4 md:p-6 space-y-6">
        {/* --- Redesigned Horizontal Navigation (Now Sticky) --- */}
        <div className="sticky top-0 z-10 bg-[#F9FAFB] dark:bg-[#101828] py-4 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-2 w-max">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold shadow-none transition-all duration-200",
                    activeView === item.id
                      ? "bg-[#0785CF] text-white hover:bg-[#0785CF]/90"
                      : "text-[#1D2939] border border-gray-200 bg-white hover:bg-gray-100 dark:text-[#98A2B3] dark:hover:bg-[#1C2433] dark:bg-[#171F2F] dark:border-[#1D2939]"
                  )}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Content Area --- */}
        <div className="min-w-0">{renderContent()}</div>
      </main>
    </div>
  );
}
