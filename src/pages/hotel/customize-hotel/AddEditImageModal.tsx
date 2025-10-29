// src/components/AddEditImageModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import hotelClient from "@/api/hotel-client";
import type { HotelImage } from "@/types/hotel-types";

interface ImageCategory {
  id: string;
  name: string;
}

interface AddEditImageModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  image: HotelImage | null;
  hotelId: string;
}

export function AddEditImageModal({
  isOpen,
  onOpenChange,
  image,
  hotelId,
}: AddEditImageModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!image;

  const [tag, setTag] = useState("");
  const [original, setOriginal] = useState("");
  const [category, setCategory] = useState("");

  // Fetch image categories for the dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery<{
    results: ImageCategory[];
  }>({
    queryKey: ["imageCategories"],
    queryFn: () =>
      hotelClient.get("/image-categories/").then((res) => res.data),
  });

  // Pre-fill form if in edit mode
  useEffect(() => {
    if (isEditMode && image) {
      setTag(image.tag || "");
      setOriginal(image.original);
      setCategory(image.category);
    } else {
      // Reset form for add mode
      setTag("hotel-images");
      setOriginal("");
      setCategory("");
    }
  }, [image, isEditMode, isOpen]);

  const mutationConfig = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelImages", hotelId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Failed to save image:", error);
      alert(
        `Error: ${error.response?.data?.detail || "Could not save the image."}`
      );
    },
  };

  // Mutation for creating a new image
  const createMutation = useMutation({
    mutationFn: (newImage: Omit<HotelImage, "id">) =>
      hotelClient.post("/hotel-images/", newImage),
    ...mutationConfig,
  });

  // Mutation for updating an existing image
  const updateMutation = useMutation({
    mutationFn: (updatedImage: Partial<HotelImage>) =>
      hotelClient.patch(`/hotel-images/${image?.id}/`, updatedImage),
    ...mutationConfig,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tag,
      original,
      category,
      hotel: hotelId,
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Image" : "Add New Image"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details for this image."
              : "Upload a new image by providing its URL and details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tag" className="text-right">
                Tag
              </Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="original" className="text-right">
                Image URL
              </Label>
              <Input
                id="original"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                className="col-span-3"
                type="url"
                required
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    categoriesData?.results.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="transition-all cursor-pointer hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0081FB] transition-all cursor-pointer hover:bg-[#0785CF]"
              type="submit"
              disabled={isPending}
            >
              {isPending
                ? "Saving..."
                : isEditMode
                ? "Save Changes"
                : "Add Image"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
