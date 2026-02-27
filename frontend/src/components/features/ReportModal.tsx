import { X, AlertTriangle, Camera } from 'lucide-react';
import Image from 'next/image';
import { BorrowedItem } from '../../domain/models/Item';

interface ReportModalProps {
    isOpen: boolean;
    selectedItem: BorrowedItem | null;
    reportImage: string | null;
    onClose: () => void;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: () => void;
    reportDetail: string;
    setReportDetail: (val: string) => void;
    onSubmit: () => void;
}

export function ReportModal({
    isOpen,
    selectedItem,
    reportImage,
    onClose,
    onImageChange,
    onRemoveImage,
    reportDetail,
    setReportDetail,
    onSubmit
}: ReportModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] p-4 pb-0">
            <div className="bg-white w-full rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar md:max-w-md mx-auto">
                <div className="sticky top-0 bg-white pt-4 pb-2 px-6 z-10 border-b">
                    <div
                        className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 cursor-pointer"
                        onClick={onClose}
                    ></div>
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">แจ้งรายละเอียดความเสียหาย</h3>
                        <button onClick={onClose} className="bg-gray-100 p-1 rounded-full hover:bg-gray-200 transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg mb-6 text-xs text-gray-700 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-500" />
                        <span>กำลังแจ้งปัญหาสำหรับ: <b>{selectedItem?.name}</b></span>
                    </div>

                    <label className="block text-xs font-bold text-gray-700 mb-2">รายละเอียดที่พบ</label>
                    <textarea
                        value={reportDetail}
                        onChange={(e) => setReportDetail(e.target.value)}
                        placeholder="เช่น ขาพินหัก, ไฟไม่เข้า, บอร์ดไหม้..."
                        className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm h-28 outline-none focus:border-[#ee4d2d] bg-gray-50 transition-all mb-6 resize-none"
                    ></textarea>

                    <label className="block text-xs font-bold text-gray-700 mb-2">แนบรูปภาพหลักฐาน (จำเป็น)</label>
                    {!reportImage ? (
                        <label className="border-2 border-dashed border-gray-300 rounded-xl h-36 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 hover:border-[#ee4d2d] transition-all mb-6 group">
                            <div className="bg-gray-100 p-3 rounded-full group-hover:bg-orange-100 transition-colors">
                                <Camera size={24} className="text-gray-500 group-hover:text-[#ee4d2d]" />
                            </div>
                            <span className="text-[11px] mt-2 font-medium group-hover:text-[#ee4d2d]">แตะเพื่อถ่ายรูป หรือเลือกจากคลัง</span>
                            <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
                        </label>
                    ) : (
                        <div className="relative h-48 bg-gray-900 rounded-xl overflow-hidden mb-6 border flex items-center justify-center group">
                            <Image
                                src={reportImage}
                                alt="Evidence Preview"
                                fill
                                style={{ objectFit: 'contain' }}
                                className="opacity-90"
                            />
                            <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:bg-black/40"></div>
                            <button
                                onClick={onRemoveImage}
                                className="absolute top-3 right-3 bg-white/90 p-2 rounded-full text-gray-700 hover:text-red-500 hover:bg-white shadow-sm transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2 border-t">
                        <button
                            className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-bold text-gray-500 active:bg-gray-100 hover:bg-gray-50 transition-colors"
                            onClick={onClose}
                        >
                            ยกเลิก
                        </button>
                        <button
                            className={`flex-[2] py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2
                ${reportImage ? 'bg-[#ee4d2d] text-white shadow-orange-100 active:scale-[0.98] hover:bg-[#d03b1e]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            disabled={!reportImage}
                            onClick={onSubmit}
                        >
                            <Camera size={18} /> ส่งรายงาน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
