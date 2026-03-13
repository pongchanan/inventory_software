"use client";

import { useEffect, useState } from "react";
import {
  fetchItemByUid,
  fetchLocationsByUnit,
  fetchOccupancyByLocation,
  fetchStorageUnits,
  StorageLocationApi,
  StorageUnitApi,
} from "@/lib/api";
import { Item } from "@/domain/models/Item";
import { ItemCard } from "@/components/inventory/ItemCard";
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
  locations: StorageLocationApi[];
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
  const [expandedLocations, setExpandedLocations] = useState<
    Record<string, boolean>
  >({});
  const [locationItems, setLocationItems] = useState<
    Record<string, Item[]>
  >({});
  const [itemLoading, setItemLoading] = useState<Record<string, boolean>>({});
  const [locationMeta, setLocationMeta] = useState<
    Record<string, { unit: StorageUnitApi; location: StorageLocationApi }>
  >({});

  useEffect(() => {
    const load = async () => {
      const units = await fetchStorageUnits();
      const allByUnit = await Promise.all(
        units.map(async (unit) => ({ unit, locations: await fetchLocationsByUnit(unit.id) }))
      );

      const meta: Record<string, { unit: StorageUnitApi; location: StorageLocationApi }> = {};
      const floorMap = new Map<number, StorageLocationApi[]>();

      allByUnit.forEach(({ unit, locations }) => {
        locations.forEach((location) => {
          const key = String(location.id);
          meta[key] = { unit, location };
          const list = floorMap.get(location.level_no) || [];
          list.push(location);
          floorMap.set(location.level_no, list);
        });
      });

      const sorted = Array.from(floorMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([floor, locations]) => ({ floor, locations }));

      setLocationMeta(meta);
      setFloors(sorted);
    };

    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const locationLabel = (location: StorageLocationApi): string => {
    if (location.zone_code) return `Zone ${location.zone_code}`;
    if (location.row_no !== null && location.col_no !== null) {
      return `R${location.row_no} C${location.col_no}`;
    }
    return `Location ${location.id}`;
  };

  const toggleLocation = async (location: StorageLocationApi) => {
    const key = String(location.id);
    const isOpen = expandedLocations[key];
    setExpandedLocations((prev) => ({
      ...prev,
      [key]: !isOpen,
    }));

    if (!isOpen && !locationItems[key]) {
      setItemLoading((prev) => ({ ...prev, [key]: true }));
      try {
        const occupancy = await fetchOccupancyByLocation(location.id);
        if (!occupancy.item_type_id) {
          setLocationItems((prev) => ({ ...prev, [key]: [] }));
        } else {
          const item = await fetchItemByUid(`TYPE-${occupancy.item_type_id}`);
          const mapped: Item = {
            id: item.id,
            name: item.name,
            qty: item.quantity,
            total: item.quantity,
            cabinet: locationLabel(location),
            img: item.image_url || "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=200",
          };
          setLocationItems((prev) => ({ ...prev, [key]: [mapped] }));
        }
      } catch {
        setLocationItems((prev) => ({ ...prev, [key]: [] }));
      }
      setItemLoading((prev) => ({ ...prev, [key]: false }));
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
          Browse items organized by cabinet level and location
        </p>
      </div>

      {floors.length === 0 && (
        <div className="text-center py-20 text-muted">
          <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No cabinets found</p>
        </div>
      )}

      {/* Floor sections */}
      {floors.map(({ floor, locations }) => (
        <div key={floor} className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Level {floor}
            <span className="ml-2 text-sm font-normal text-muted">
              ({locations.length} location{locations.length !== 1 ? "s" : ""})
            </span>
          </h2>

          <div className="space-y-2">
            {locations.map((location) => {
              const key = String(location.id);
              const open = expandedLocations[key];
              const items = locationItems[key];
              const isItemLoading = itemLoading[key];
              const meta = locationMeta[key];
              const status = location.active ? "available" : "maintenance";

              return (
                <div
                  key={location.id}
                  className="bg-white rounded-xl border border-border overflow-hidden"
                >
                  {/* Compartment Header */}
                  <button
                    onClick={() => toggleLocation(location)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {open ? (
                        <ChevronDown className="w-5 h-5 text-muted" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted" />
                      )}
                      <span className="font-medium text-foreground">
                        Unit {meta?.unit.id ?? "-"} - {locationLabel(location)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[status] || "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {status}
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
                          <p className="text-sm">No items in this location</p>
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
