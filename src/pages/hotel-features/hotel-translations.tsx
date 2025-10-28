"use client";
import GenericFeaturePage from "./GenericFeaturePage";
import { MdGTranslate } from "react-icons/md";

export default function HotelTranslations() {
  return (
    <GenericFeaturePage
      featureName="Translations"
      featureNameSingular="translation"
      endpoint="translations"
      hotelDataKey="translations"
      Icon={MdGTranslate}
      nameKey="language"
    />
  );
}
