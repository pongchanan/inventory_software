"use client";

import { Search } from 'lucide-react';
import { useInventory, SortOption } from '../../../services/hooks/useInventory';
import { NotificationDropdown } from '../../notifications/NotificationDropdown';

export function TopHeader() {
    const { searchQuery, setSearchQuery, sortBy, setSortBy } = useInventory();

    return (
        <header className="h-20 bg-white border-b flex items-center justify-between px-8 z-10 shadow-sm flex-shrink-0">
            <div className="relative w-96 group text-gray-800">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ee4d2d] transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="ค้นหาอุปกรณ์ IOT หรือ เซ็นเซอร์..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-2xl border-2 border-transparent focus:bg-white focus:border-[#ee4d2d] outline-none text-sm transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">เรียงตาม:</span>
                    <select
                        className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                    >
                        <option value="name">ชื่อ (A-Z)</option>
                        <option value="qty-desc">คงเหลือมากที่สุด</option>
                        <option value="qty-asc">สต็อกใกล้หมด</option>
                    </select>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <NotificationDropdown />
            </div>
        </header>
    );
}
