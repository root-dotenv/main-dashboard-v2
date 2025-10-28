"use client";
import GenericFeaturePage from "./GenericFeaturePage";
import { GiMeal } from "react-icons/gi";
import { CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function HotelMealTypes() {
  return (
    <GenericFeaturePage
      featureName="Meal Plans"
      featureNameSingular="meal plan"
      endpoint="meal-types"
      hotelDataKey="meal_types"
      Icon={GiMeal}
      renderExtraContent={(mealType) => (
        <CardContent className="flex-grow mt-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Star className="mr-2 h-4 w-4 text-yellow-500" />
            <span className="font-semibold dark:text-gray-300">Score:</span>
            <span className="ml-1.5 font-bold text-gray-700 dark:text-gray-200">
              {mealType.score}
            </span>
          </div>
        </CardContent>
      )}
    />
  );
}
