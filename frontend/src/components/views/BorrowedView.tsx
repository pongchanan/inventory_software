import { MapPin, History, AlertTriangle } from 'lucide-react';
import { BorrowedItem } from '../../domain/models/Item';

interface BorrowedViewProps {
    borrowedItems: BorrowedItem[];
    onReportClick: (item: BorrowedItem) => void;
}

export function BorrowedView({ borrowedItems, onReportClick }: BorrowedViewProps) {
    return (
        <div className="p-4 pb-24">
            <h2 className="font-bold text-lg mb-4 text-gray-800">รายการยืมของฉัน</h2>

            {borrowedItems.length > 0 ? (
                borrowedItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-lg border overflow-hidden flex-shrink-0">
                                <img
                                    src="https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=200"
                                    className="w-full h-full object-cover"
                                    alt={item.name}
                                    loading="lazy"
                                />
                            </div>
                            <div className="flex-grow py-1">
                                <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{item.name}</h4>
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                                        <MapPin size={12} className="text-gray-400" /> {item.loc}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                                        <History size={12} className="text-gray-400" /> ยืมเมื่อ: {item.date}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <button
                                onClick={() => onReportClick(item)}
                                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 py-2.5 rounded-lg active:scale-[0.98] transition-all"
                            >
                                <AlertTriangle size={14} /> แจ้งความเสียหาย (Milestone 4)
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="py-10 text-center text-gray-400 text-sm font-medium border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    คุณยังไม่มีรายการที่ยืมอยู่
                </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest">
                    การคืนของจะถูกบันทึกอัตโนมัติผ่านเซนเซอร์ที่หน้าตู้
                </p>
            </div>
        </div>
    );
}
