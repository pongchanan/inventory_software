"use client";

import { useState } from "react";
import { Filter } from "lucide-react";

interface ItemFilterProps {
  onFilterChange: (available: boolean | undefined) => void;
  categories: string[];
  onCategoryChange: (category: string | undefined) => void;
}

export default function ItemFilter({
  onFilterChange,
  categories,
  onCategoryChange,
}: ItemFilterProps) {
  const [availability, setAvailability] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-border">
      <Filter className="w-4 h-4 text-muted" />
      <span className="text-sm font-medium text-foreground">Filter:</span>

      {/* Availability */}
      <select
        value={availability}
        onChange={(e) => {
          setAvailability(e.target.value);
          onFilterChange(
            e.target.value === "all"
              ? undefined
              : e.target.value === "available"
          );
        }}
        className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="all">All Status</option>
        <option value="available">Available</option>
        <option value="unavailable">Unavailable</option>
      </select>

      {/* Category */}
      {categories.length > 0 && (
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            onCategoryChange(e.target.value === "all" ? undefined : e.target.value);
          }}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
