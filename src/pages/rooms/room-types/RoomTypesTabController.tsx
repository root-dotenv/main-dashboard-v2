// src/pages/rooms/RoomTypesTabController.tsx
"use client";
import { useState } from "react";
import HotelRoomTypes from "./HotelRoomTypes";
import SafariProRoomTypes from "./SafariProRoomTypes";
import { useHotel } from "@/providers/hotel-provider";
import { cn } from "@/lib/utils";

type TabId = "hotel" | "safaripro";

export default function RoomTypesTabController() {
  const { hotel } = useHotel();
  const [activeTab, setActiveTab] = useState<TabId>("hotel");

  const TABS_CONFIG = [
    { id: "hotel", label: `${hotel?.name || "Hotel"} Types` },
    { id: "safaripro", label: "SafariPro Global Types" },
  ];

  return (
    // Applied consistent background
    <div className="min-h-screen bg-gray-50 dark:bg-[#101828]">
      {/* --- START: Redesigned Sticky Header --- */}
      {/* Applied shadow-none, adjusted height and font size for lg screens */}
      <div className="bg-white/80 dark:bg-[#101828]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#1D2939] sticky top-0 z-30 shadow-none lg:h-[132px]">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Adjusted padding/layout for consistent height */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 lg:pt-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-[#D0D5DD] lg:text-[30px] lg:leading-[36px] lg:font-bold">
                Room Types
              </h1>
              <p className="text-base text-gray-600 dark:text-[#98A2B3]">
                Manage room categories and browse the global SafariPro catalog.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* --- END: Redesigned Sticky Header --- */}

      {/* Main content area */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Applied shadow-none to tab container */}
        <div className="flex items-center gap-2 bg-[#FFF] dark:bg-[#171F2F] border border-[#E4E7EC] dark:border-[#1D2939] rounded-md shadow-none p-[6px] w-fit mb-6">
          {TABS_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                activeTab === tab.id
                  ? // Applied shadow-none to active tab
                    "bg-[#0785CF] text-white shadow-none"
                  : "bg-transparent text-gray-600 dark:text-[#98A2B3] hover:text-gray-800 dark:hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applied shadow-none to content wrapper */}
        <div className="shadow-none">
          {activeTab === "hotel" && <HotelRoomTypes />}
          {activeTab === "safaripro" && <SafariProRoomTypes />}
        </div>
      </div>
    </div>
  );
}
