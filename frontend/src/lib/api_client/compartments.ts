import {
  fetchItemTypeById,
  fetchLocationsByUnit,
  fetchOccupancyByLocation,
  fetchStorageUnits,
  mapItemTypeToItem,
  parseLocationIdFromCompartment,
} from "./core";
import { Compartment, Item } from "./types";

export async function fetchCompartments(floor?: number): Promise<Compartment[]> {
  const units = await fetchStorageUnits();
  const drawerUnits = units.filter((u) => u.unit_type === "drawer" || u.layout_type === "grid");

  const perUnitLocations = await Promise.all(
    drawerUnits.map(async (unit) => ({
      unit,
      locations: await fetchLocationsByUnit(unit.id),
    }))
  );

  let compartments: Compartment[] = perUnitLocations.flatMap(({ unit, locations }) => {
    if (!locations.length) {
      return [
        {
          id: unit.id,
          floor: 0,
          locker_number: `UNIT-${unit.id}`,
          status: unit.active ? "available" : "maintenance",
          item_uid: null,
          user_uid: null,
          occupied_at: null,
          due_at: null,
        },
      ];
    }

    return locations.map((loc) => ({
      id: loc.id,
      floor: loc.level_no,
      locker_number: `LOC-${loc.id}`,
      status: loc.active ? "available" : "maintenance",
      item_uid: null,
      user_uid: null,
      occupied_at: null,
      due_at: null,
    }));
  });

  if (floor !== undefined) {
    compartments = compartments.filter((c) => c.floor === floor);
  }

  return compartments.sort((a, b) => {
    if (a.floor !== b.floor) return a.floor - b.floor;
    return a.locker_number.localeCompare(b.locker_number);
  });
}

export async function fetchCompartmentItems(
  lockerNumber: string,
  availableOnly = false
): Promise<Item[]> {
  const locationId = parseLocationIdFromCompartment(lockerNumber);
  if (!locationId) {
    return [];
  }

  const occupancy = await fetchOccupancyByLocation(locationId);
  if (!occupancy.item_type_id) {
    return [];
  }

  const itemType = await fetchItemTypeById(occupancy.item_type_id);
  if (!itemType) return [];

  const mapped: Item = {
    ...mapItemTypeToItem(itemType),
    location: lockerNumber,
    available: occupancy.state !== "occupied" ? false : itemType.active,
  };

  if (availableOnly && !mapped.available) {
    return [];
  }
  return [mapped];
}

export async function fetchFloorItems(floor: number, availableOnly = false): Promise<Item[]> {
  const compartments = await fetchCompartments(floor);
  const itemsByCompartment = await Promise.all(
    compartments.map((comp) => fetchCompartmentItems(comp.locker_number, availableOnly))
  );
  return itemsByCompartment.flat();
}
