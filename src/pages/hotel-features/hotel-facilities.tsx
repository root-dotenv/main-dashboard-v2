"use client";
import GenericFeaturePage from "./GenericFeaturePage";
import { BsGridFill } from "react-icons/bs";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HotelFacilities() {
  return (
    <GenericFeaturePage
      featureName="Facilities"
      featureNameSingular="facility"
      endpoint="facilities"
      hotelDataKey="facilities"
      Icon={BsGridFill}
      renderExtraContent={(facility) => (
        <CardContent className="flex-grow mt-2">
          <div className="flex flex-wrap gap-2 pt-2">
            {facility.fee_applies && (
              <Badge className="dark:bg-[#171F2F] bg-[#EFF6FF] border border-[#B4E6F5]200 text-[#1547E5] rounded-full dark:text-[#98A2B3] dark:border-[#1D2939]">
                Fee Applies
              </Badge>
            )}
            {facility.reservation_required && (
              <Badge className="dark:bg-[#171F2F] bg-[#EFF6FF] border border-[#B4E6F5]200 text-[#1547E5] rounded-full dark:text-[#98A2B3] dark:border-[#1D2939]">
                Reservation Required
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    />
  );
}
