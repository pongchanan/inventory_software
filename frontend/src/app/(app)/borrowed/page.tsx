"use client";

import { useInventory } from '../../../services/hooks/useInventory';
import { useDamageReport } from '../../../services/hooks/useDamageReport';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Package, MapPin, History, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { ReportModal } from '../../../components/features/ReportModal';
import { BorrowedItem } from '../../../domain/models/Item';

export default function BorrowedPage() {
    const { borrowedItems } = useInventory();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return null; // Or a loading spinner
    }

    const {
        isReportModalOpen,
        selectedItem,
        reportImage,
        openReportModal,
        closeReportModal,
        handleImageChange,
        handleRemoveImage,
        submitReport
    } = useDamageReport();

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <h2 className="text-3xl font-black mb-8">รายการยืมของฉัน</h2>

            <div className="space-y-4">
                {borrowedItems.map((item: BorrowedItem) => (
                    <div key={item.id} className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 border border-gray-50 hover:border-orange-100 transition-colors">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border relative">
                            <Image
                                src="https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=200"
                                alt={item.name}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 640px) 4rem, 6rem"
                            />
                        </div>
                        <div className="flex-grow">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">Status: Borrowed</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5"><MapPin size={14} className="text-[#ee4d2d]" /> {item.loc}</div>
                                <div className="flex items-center gap-1.5"><History size={14} className="text-[#ee4d2d]" /> ยืมเมื่อ {item.date}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => openReportModal(item)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-orange-50 text-[#ee4d2d] text-sm font-bold rounded-2xl hover:bg-[#ee4d2d] hover:text-white transition-all shadow-sm shrink-0"
                        >
                            <AlertTriangle size={18} /> แจ้งความเสียหาย
                        </button>
                    </div>
                ))}

                {borrowedItems.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <Package size={48} className="mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-400 font-bold">คุณยังไม่ได้ยืมอุปกรณ์ชิ้นใดเลยในขณะนี้</p>
                    </div>
                )}
            </div>

            <div className="mt-12 p-6 sm:p-8 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col sm:flex-row items-start gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-500 flex-shrink-0">
                    <Package size={24} />
                </div>
                <div>
                    <h4 className="font-black text-blue-900 mb-1">การคืนของอัตโนมัติ (Automated Trust System)</h4>
                    <p className="text-sm text-blue-700 leading-relaxed opacity-80">
                        ใน Milestone 3 และ 4 ระบบจะตรวจจับการคืนของผ่านเซนเซอร์ UHF/RFID หน้าตู้โดยตรง
                        คุณไม่จำเป็นต้องกดคืนของในแอปพลิเคชัน เพียงแค่นำของกลับมาแตะที่เซนเซอร์และวางคืนในตู้
                        ระบบจะอัปเดตสถานะของคุณให้โดยอัตโนมัติทันที
                    </p>
                </div>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                selectedItem={selectedItem}
                reportImage={reportImage}
                onClose={closeReportModal}
                onImageChange={handleImageChange}
                onRemoveImage={handleRemoveImage}
                onSubmit={submitReport}
            />
        </div>
    );
}
