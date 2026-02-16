"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchItems, Item } from "@/lib/api";
import ItemCard from "@/components/ItemCard";
import ItemFilter from "@/components/ItemFilter";
import { Package, Loader2, AlertCircle } from "lucide-react";

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availFilter, setAvailFilter] = useState<boolean | undefined>(undefined);
  const [catFilter, setCatFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchItems()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))] as string[],
    [items]
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (availFilter !== undefined && item.available !== availFilter) return false;
      if (catFilter && item.category !== catFilter) return false;
      if (
        search &&
        !item.name.toLowerCase().includes(search.toLowerCase()) &&
        !(item.description ?? "").toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [items, availFilter, catFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" />
            All Items
          </h1>
          <p className="text-sm text-muted mt-1">
            Browse all items across every cabinet and level
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 text-sm border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Filters */}
      <ItemFilter
        onFilterChange={setAvailFilter}
        categories={categories}
        onCategoryChange={setCatFilter}
      />

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-muted">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading items...
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-20 text-danger gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-muted">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm">Try changing your filters or search term.</p>
        </div>
      )}

      {/* Item Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
