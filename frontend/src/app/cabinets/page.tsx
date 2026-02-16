"use client";

import { useEffect, useState } from "react";
import {
  fetchCompartments,
  fetchCompartmentItems,
  Compartment,
  Item,
} from "@/lib/api";
import ItemCard from "@/components/ItemCard";
import {
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Package,
} from "lucide-react";

interface FloorData {
  floor: number;
  compartments: Compartment[];
}

const statusColor: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
  maintenance: "bg-gray-200 text-gray-600",
};

export default function CabinetsPage() {
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCompartments, setExpandedCompartments] = useState<
    Record<string, boolean>
  >({});
  const [compartmentItems, setCompartmentItems] = useState<
    Record<string, Item[]>
  >({});
  const [itemLoading, setItemLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCompartments()
      .then((compartments) => {
        // Group by floor
        const floorMap = new Map<number, Compartment[]>();
        compartments.forEach((c) => {
          const list = floorMap.get(c.floor) || [];
          list.push(c);
          floorMap.set(c.floor, list);
        });
        const sorted = Array.from(floorMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([floor, comps]) => ({ floor, compartments: comps }));
        setFloors(sorted);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleCompartment = async (lockerNumber: string) => {
    const isOpen = expandedCompartments[lockerNumber];
    setExpandedCompartments((prev) => ({
      ...prev,
      [lockerNumber]: !isOpen,
    }));

    // Load items if not already loaded
    if (!isOpen && !compartmentItems[lockerNumber]) {
      setItemLoading((prev) => ({ ...prev, [lockerNumber]: true }));
      try {
        const items = await fetchCompartmentItems(lockerNumber);
        setCompartmentItems((prev) => ({ ...prev, [lockerNumber]: items }));
      } catch {
        setCompartmentItems((prev) => ({ ...prev, [lockerNumber]: [] }));
      }
      setItemLoading((prev) => ({ ...prev, [lockerNumber]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading cabinets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-danger gap-2">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <LayoutGrid className="w-7 h-7 text-primary" />
          Cabinets
        </h1>
        <p className="text-sm text-muted mt-1">
          Browse items organized by cabinet level and compartment
        </p>
      </div>

      {floors.length === 0 && (
        <div className="text-center py-20 text-muted">
          <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No cabinets found</p>
        </div>
      )}

      {/* Floor sections */}
      {floors.map(({ floor, compartments }) => (
        <div key={floor} className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Level {floor}
            <span className="ml-2 text-sm font-normal text-muted">
              ({compartments.length} compartment{compartments.length !== 1 ? "s" : ""})
            </span>
          </h2>

          <div className="space-y-2">
            {compartments.map((comp) => {
              const open = expandedCompartments[comp.locker_number];
              const items = compartmentItems[comp.locker_number];
              const isItemLoading = itemLoading[comp.locker_number];

              return (
                <div
                  key={comp.locker_number}
                  className="bg-white rounded-xl border border-border overflow-hidden"
                >
                  {/* Compartment Header */}
                  <button
                    onClick={() => toggleCompartment(comp.locker_number)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {open ? (
                        <ChevronDown className="w-5 h-5 text-muted" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted" />
                      )}
                      <span className="font-medium text-foreground">
                        {comp.locker_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColor[comp.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {comp.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted">
                      Click to {open ? "collapse" : "expand"}
                    </span>
                  </button>

                  {/* Compartment Items */}
                  {open && (
                    <div className="border-t border-border px-5 py-4">
                      {isItemLoading && (
                        <div className="flex items-center text-muted text-sm py-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading items...
                        </div>
                      )}

                      {!isItemLoading && items && items.length === 0 && (
                        <div className="text-center py-6 text-muted">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No items in this compartment</p>
                        </div>
                      )}

                      {!isItemLoading && items && items.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {items.map((item) => (
                            <ItemCard key={item.id} item={item} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
