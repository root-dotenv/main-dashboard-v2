import React from "react";
import { Save, Loader2 } from "lucide-react";

interface HeaderProps {
  hotelName: string;
  onSave: () => void;
  isSaving: boolean;
}

const HotelCustomizationHeader: React.FC<HeaderProps> = ({
  hotelName,
  onSave,
  isSaving,
}) => (
  <div className="mb-8 w-6xl">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Hotel Customization
        </h1>
        <p className="text-gray-600 mt-2">
          Manage and edit details for {hotelName}
        </p>
      </div>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 bg-[#0081FB] text-[#FFF] cursor-pointer hover:bg-[#0785CF]/90 transition-all rounded-md"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  </div>
);

export default HotelCustomizationHeader;
