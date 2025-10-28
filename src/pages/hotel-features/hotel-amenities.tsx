"use client";
import GenericFeaturePage from "./GenericFeaturePage";
import { FaStar } from "react-icons/fa";

export default function HotelAmenities() {
  return (
    <GenericFeaturePage
      featureName="Amenities"
      featureNameSingular="amenity"
      endpoint="amenities"
      hotelDataKey="amenities"
      Icon={FaStar}
    />
  );
}
