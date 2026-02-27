import { Item } from '../../domain/models/Item';

interface ItemCardProps {
    item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
    const isOutOfStock = item.qty === 0;

    return (
        <div className="bg-white rounded shadow-sm overflow-hidden flex flex-col border border-transparent active:border-[#ee4d2d] transition-colors">
            <div className="relative pt-[100%] bg-gray-50">
                <img
                    src={item.img}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt={item.name}
                    loading="lazy"
                />
                <div className="absolute top-1 left-1 bg-white/90 text-[#ee4d2d] text-[8px] px-1 rounded-sm font-bold border border-orange-100 shadow-sm">
                    {item.cabinet}
                </div>
            </div>

            <div className="p-2 flex-grow flex flex-col justify-between gap-2">
                <h3 className="text-[11px] line-clamp-2 leading-tight font-medium text-gray-800">
                    {item.name}
                </h3>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-gray-400' : 'text-[#ee4d2d]'}`}>
                            {isOutOfStock ? 'สินค้าหมด' : `คงเหลือ ${item.qty}`}
                        </span>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${isOutOfStock ? 'bg-gray-300' : 'bg-[#ee4d2d]'}`}
                            style={{ width: `${(item.qty / item.total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
