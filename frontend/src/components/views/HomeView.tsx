import { Item } from '../../domain/models/Item';
import { SortOption } from '../../services/hooks/useInventory';
import { Header } from '../layout/Header';
import { SortBar } from '../inventory/SortBar';
import { ItemCard } from '../inventory/ItemCard';

interface HomeViewProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortBy: SortOption;
    setSortBy: (sort: SortOption) => void;
    items: Item[];
}

export function HomeView({ searchQuery, setSearchQuery, sortBy, setSortBy, items }: HomeViewProps) {
    return (
        <>
            <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <SortBar sortBy={sortBy} setSortBy={setSortBy} />

            <div className="grid grid-cols-2 gap-2 p-2 pb-24">
                {items.length > 0 ? (
                    items.map(item => (
                        <ItemCard key={item.id} item={item} />
                    ))
                ) : (
                    <div className="col-span-2 py-10 text-center text-gray-400 text-sm font-medium">
                        ไม่พบอุปกรณ์ที่ค้นหา
                    </div>
                )}
            </div>
        </>
    );
}
