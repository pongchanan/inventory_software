"use client";

import { useState } from 'react';
import { useInventory } from '../../services/hooks/useInventory';
import { ItemCard } from '../../components/inventory/ItemCard';
import { Item } from '../../domain/models/Item';
import { Search, Filter } from 'lucide-react';

export default function HomePage() {
  const { sortedItems, searchQuery, setSearchQuery, sortBy, setSortBy } = useInventory();
  const [showFilters, setShowFilters] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');

  // Filter items by search query and availability
  const filteredItems = sortedItems.filter((item: Item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (availabilityFilter === 'in-stock') {
      return matchesSearch && item.qty > 0;
    } else if (availabilityFilter === 'out-of-stock') {
      return matchesSearch && item.qty === 0;
    }
    
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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

      {/* Search and Filter Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm w-full sm:w-auto"
          >
            <option value="name">Name (A-Z)</option>
            <option value="qty-desc">Highest Stock</option>
            <option value="qty-asc">Low Stock</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Filter size={18} /> {showFilters ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Filter Badge - Shows active filters */}
        {(searchQuery || availabilityFilter !== 'all') && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full flex items-center gap-2">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 text-blue-500 hover:text-blue-800"
                >
                  ✕
                </button>
              </div>
            )}
            {availabilityFilter !== 'all' && (
              <div className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full flex items-center gap-2">
                {availabilityFilter === 'in-stock' ? 'In Stock' : 'Out of Stock'}
                <button
                  onClick={() => setAvailabilityFilter('all')}
                  className="ml-1 text-purple-500 hover:text-purple-800"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-2xl border border-orange-100 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Availability</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAvailabilityFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    availabilityFilter === 'all'
                      ? 'bg-[#ee4d2d] text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-[#ee4d2d]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAvailabilityFilter('in-stock')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    availabilityFilter === 'in-stock'
                      ? 'bg-[#ee4d2d] text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-[#ee4d2d]'
                  }`}
                >
                  In Stock
                </button>
                <button
                  onClick={() => setAvailabilityFilter('out-of-stock')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    availabilityFilter === 'out-of-stock'
                      ? 'bg-[#ee4d2d] text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-[#ee4d2d]'
                  }`}
                >
                  Out of Stock
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 pb-24">
        {filteredItems.map((item: Item) => (
          <ItemCard key={item.id} item={item} />
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 font-medium bg-white rounded-xl border border-dashed border-gray-200">
            No devices found matching your search
          </div>
        )}
      </div>
    </div>
  );
}
