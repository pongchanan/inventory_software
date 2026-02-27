import { Search } from 'lucide-react';

interface HeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
    return (
        <div className="bg-[#ee4d2d] text-white p-4 sticky top-0 z-40 shadow-md">
            <div className="flex items-center gap-3 bg-white rounded-sm px-3 py-2 text-gray-400">
                <Search size={18} />
                <input
                    type="text"
                    placeholder="ค้นหาอุปกรณ์..."
                    className="bg-transparent text-sm w-full outline-none text-gray-800"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
    );
}
