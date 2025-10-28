"use client";
import GenericFeaturePage from "./GenericFeaturePage";
import { FaConciergeBell } from "react-icons/fa";
import { CardContent } from "@/components/ui/card";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

export default function HotelServices() {
  return (
    <GenericFeaturePage
      featureName="Services"
      featureNameSingular="service"
      endpoint="services"
      hotelDataKey="services"
      Icon={FaConciergeBell}
      renderExtraContent={(service) => (
        <CardContent className="flex-grow text-sm space-y-2 dark:text-gray-400 mt-4">
          {service.service_type_name && (
            <p className="text-[13px] text-[#667085]">
              <span className="font-semibold dark:text-gray-300">Type:</span>{" "}
              {service.service_type_name}
            </p>
          )}
          {service.service_scope_name && (
            <p className="text-[13px] text-[#667085]">
              <span className="font-semibold dark:text-gray-300">Scope:</span>{" "}
              {service.service_scope_name}
            </p>
          )}
        </CardContent>
      )}
    />
  );
}
