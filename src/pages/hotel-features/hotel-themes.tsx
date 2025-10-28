"use client";
import GenericFeaturePage from "./GenericFeaturePage";
import { Palette } from "lucide-react";

export default function HotelThemes() {
  return (
    <GenericFeaturePage
      featureName="Themes"
      featureNameSingular="theme"
      endpoint="themes"
      hotelDataKey="themes"
      Icon={Palette}
    />
  );
}
