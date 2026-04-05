"use client";

import { useInventory } from '../../services/hooks/useInventory';
import { ItemCard } from '../../components/inventory/ItemCard';
import { Item } from '../../domain/models/Item';

export default function HomePage() {
  const { sortedItems } = useInventory();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black mb-1">All Devices</h2>
          <p className="text-gray-500 text-sm">Browse the available equipment for loan in the Smart Inventory cabinet.</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <div className="px-4 py-2 bg-white border rounded-xl text-xs font-bold flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div> Available
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 pb-24">
        {sortedItems.map((item: Item) => (
          <ItemCard key={item.id} item={item} />
        ))}
        {sortedItems.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 font-medium bg-white rounded-xl border border-dashed border-gray-200">
            No devices found matching your search
          </div>
        )}
      </div>
    </div>
  );
}
