import React from "react";
import { cn } from "@/lib/utils";
import { Info, Building2, Settings, Link, BarChart3 } from "lucide-react";

// Define the possible views for type safety
export type CustomizationView =
  | "basic"
  | "property"
  | "features"
  | "other"
  | "current";

interface NavItem {
  id: CustomizationView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Define the navigation items for the sidebar
const navItems: NavItem[] = [
  { id: "basic", label: "Basic Information", icon: Info },
  { id: "property", label: "Property Details", icon: Building2 },
  { id: "features", label: "Features & Services", icon: Settings },
  { id: "other", label: "Other Properties", icon: Link },
  {
    id: "current",
    label: "Current Details & Stats",
    icon: BarChart3,
  },
];

interface HotelCustomizationLayoutProps {
  activeView: CustomizationView;
  setActiveView: (view: CustomizationView) => void;
  children: React.ReactNode;
}

const HotelCustomizationLayout: React.FC<HotelCustomizationLayoutProps> = ({
  activeView,
  setActiveView,
  children,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mt-8">
      {/* Left Side Navigation */}
      <aside className="w-full md:w-60 lg:w-64 flex-shrink-0">
        <nav className="space-y-1.5 sticky top-24 bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium rounded-lg transition-colors",
                activeView === item.id
                  ? "bg-[#0785CF] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-6 lg:p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
};

export default HotelCustomizationLayout;
