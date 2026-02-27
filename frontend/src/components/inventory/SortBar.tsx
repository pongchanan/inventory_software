import { ArrowDownWideNarrow } from 'lucide-react';
import { SortOption } from '../../services/hooks/useInventory';

interface SortBarProps {
    sortBy: SortOption;
    setSortBy: (sort: SortOption) => void;
}

export function SortBar({ sortBy, setSortBy }: SortBarProps) {
    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b sticky top-[64px] z-30">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">เรียงลำดับตาม</span>
            <div className="flex gap-2">
                <select
                    className="text-xs bg-gray-50 border-none outline-none font-medium text-gray-700 py-1 px-2 rounded cursor-pointer"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                    <option value="name">ชื่อ (A-Z)</option>
                    <option value="qty-desc">สต็อก (มากไปน้อย)</option>
                    <option value="qty-asc">สต็อก (น้อยไปมาก)</option>
                </select>
                <ArrowDownWideNarrow size={16} className="text-[#ee4d2d]" />
            </div>
        </div>
    );
}
