"use client";
import { useRef, useEffect, useState, useCallback } from "react";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: string) => void;
  placeholder?: string;
  types?: string[];
  componentRestrictions?: { country?: string | string[] };
}

declare global {
  interface Window {
    google: any;
  }
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Search...",
  types = [],
  componentRestrictions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [apiKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPlaces = useCallback(
    async (query: string) => {
      if (
        !query ||
        !window.google ||
        !window.google.maps ||
        !window.google.maps.places
      ) {
        setSuggestions([]);
        return;
      }

      try {
        const service = new window.google.maps.places.AutocompleteService();
        const request: any = {
          input: query,
          types: types.length > 0 ? types : undefined,
        };

        if (componentRestrictions) {
          request.componentRestrictions = componentRestrictions;
        }

        service.getPlacePredictions(
          request,
          (predictions: any[], status: string) => {
            setIsLoading(false);
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              const results = predictions
                .slice(0, 5)
                .map((prediction) => prediction.description);
              setSuggestions(results);
            } else {
              setSuggestions([]);
            }
          }
        );
      } catch (error) {
        console.error("Error searching places:", error);
        setIsLoading(false);
        setSuggestions([]);
      }
    },
    [componentRestrictions, types]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsLoading(true);
    setShowSuggestions(true);
    searchPlaces(newValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    if (onSelect) {
      onSelect(suggestion);
    }
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={value || ""}
        onChange={handleInputChange}
        placeholder={placeholder}
        onFocus={() => setShowSuggestions(true)}
        // --- UPDATED THIS LINE ---
        className="w-full h-11 px-3 py-2 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none"
      />
      {showSuggestions && (
        <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading && <li className="px-4 py-2 text-gray-500">Loading...</li>}
          {!isLoading &&
            suggestions.length > 0 &&
            suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {suggestion}
              </li>
            ))}
          {!isLoading &&
            suggestions.length === 0 &&
            value &&
            value.length > 0 && (
              <li className="px-4 py-2 text-gray-500">No results found</li>
            )}
        </ul>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
