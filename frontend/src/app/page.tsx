"use client";

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { PaginatedItems, Item } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Package,
  X,
} from "lucide-react";
import Pagination from "@/components/ui/pagination";

type StockFilter = "all" | "in-stock" | "out-of-stock";
type SortKey = "name-asc" | "name-desc" | "qty-asc" | "qty-desc";

const PAGE_SIZE = 20;

export default function HomePage() {
  const { user, token } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<PaginatedItems>("/api/items/", {
        token,
        params: {
          page,
          page_size: PAGE_SIZE,
          search: debouncedSearch || undefined,
        },
      });
      let filtered = data.items;

      // Client-side filtering for stock status (backend doesn't support this filter)
      if (filter === "in-stock") {
        filtered = filtered.filter((i) => i.quantity > 0);
      } else if (filter === "out-of-stock") {
        filtered = filtered.filter((i) => i.quantity === 0);
      }

      // Client-side sorting
      filtered.sort((a, b) => {
        switch (sort) {
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          case "qty-asc":
            return a.quantity - b.quantity;
          case "qty-desc":
            return b.quantity - a.quantity;
          default:
            return 0;
        }
      });

      setItems(filtered);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch, filter, sort]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filterCounts = {
    all: items.length,
    "in-stock": items.filter((i) => i.quantity > 0).length,
    "out-of-stock": items.filter((i) => i.quantity === 0).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name}
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Browse available inventory items
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {total} item{total !== 1 ? "s" : ""} total
        </div>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            showFilters || filter !== "all" || sort !== "name-asc"
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {/* Filter / Sort Bar */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Stock filter */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Stock Status
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "in-stock", label: "In Stock" },
                    { key: "out-of-stock", label: "Out of Stock" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setFilter(f.key);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filter === f.key
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="sm:w-56">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Sort By
              </label>
              <div className="relative">
                <ArrowUpDown
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="w-full appearance-none pl-8 pr-4 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="name-asc">Name A → Z</option>
                  <option value="name-desc">Name Z → A</option>
                  <option value="qty-desc">Quantity: High → Low</option>
                  <option value="qty-asc">Quantity: Low → High</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="w-full h-44 bg-gray-100" />
              <div className="p-4">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No items found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {debouncedSearch
              ? `No results for "${debouncedSearch}"`
              : "No inventory items available"}
          </p>
          {(debouncedSearch || filter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="mt-4 text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Item cards grid */}
      {!loading && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  const [imgError, setImgError] = useState(false);
  const outOfStock = item.quantity === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 group">
      {/* Image */}
      <div className="relative w-full h-44 bg-gray-50 overflow-hidden">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-gray-300" />
          </div>
        )}

        {/* Stock badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              outOfStock
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {outOfStock ? "Out of Stock" : `Qty: ${item.quantity}`}
          </span>
        </div>

        {/* Processing badge */}
        {item.enroll_status === "processing" && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse-dot" />
              Processing
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">ID: {item.id}</p>
      </div>
    </div>
  );
}

