import { X, AlertTriangle, Camera } from 'lucide-react';
import Image from 'next/image';
import { BorrowedItem } from '../../domain/models/Item';

interface ReportModalProps {
    isOpen: boolean;
    selectedItem: BorrowedItem | null;
    reportImagePreview: string | null;
    onClose: () => void;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: () => void;
    reportDetail: string;
    setReportDetail: (val: string) => void;
    onSubmit: () => void;
    isSubmitting?: boolean;
    error?: string | null;
    onClearError?: () => void;
}

export function ReportModal({
    isOpen,
    selectedItem,
    reportImagePreview,
    onClose,
    onImageChange,
    onRemoveImage,
    reportDetail,
    setReportDetail,
    onSubmit,
    isSubmitting = false,
    error = null,
    onClearError
}: ReportModalProps) {
    if (!isOpen) return null;
    
    const isFormValid = reportDetail.trim() && reportImagePreview;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white pt-6 pb-4 px-6 z-10 border-b">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Report Damage</h3>
                        <button 
                            onClick={() => {
                                onClearError?.();
                                onClose();
                            }} 
                            className="bg-gray-100 p-1 rounded-full hover:bg-gray-200 transition-colors" 
                            disabled={isSubmitting}
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4 text-xs text-blue-700 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-blue-500" />
                        <span>Report will be filed for your currently active borrowing</span>
                    </div>

                    <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg mb-6 text-xs text-gray-700 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-500" />
                        <span>Item: <b>{selectedItem?.name}</b></span>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-xs text-red-700 flex items-start gap-2">
                            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <span className="font-bold block mb-1">Error submitting report</span>
                                <span>{error}</span>
                                {error.includes("no active borrowing") && (
                                    <p className="mt-2 text-xs opacity-90">Try refreshing the page to ensure your borrowing status is up to date.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <label className="block text-xs font-bold text-gray-700 mb-2">Problem Description</label>
                    <textarea
                        value={reportDetail}
                        onChange={(e) => setReportDetail(e.target.value)}
                        placeholder="e.g. Broken pin, No power, Burnt board..."
                        disabled={isSubmitting}
                        className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm h-28 outline-none focus:border-[#ee4d2d] bg-gray-50 transition-all mb-6 resize-none disabled:opacity-50"
                    ></textarea>

                    <label className="block text-xs font-bold text-gray-700 mb-2">Attach Photo (Required)</label>
                    {!reportImagePreview ? (
                        <label className="border-2 border-dashed border-gray-300 rounded-xl h-36 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 hover:border-[#ee4d2d] transition-all mb-6 group disabled:opacity-50">
                            <div className="bg-gray-100 p-3 rounded-full group-hover:bg-orange-100 transition-colors">
                                <Camera size={24} className="text-gray-500 group-hover:text-[#ee4d2d]" />
                            </div>
                            <span className="text-[11px] mt-2 font-medium group-hover:text-[#ee4d2d]">Tap to take photo or select from library</span>
                            <input type="file" accept="image/*" className="hidden" onChange={onImageChange} disabled={isSubmitting} />
                        </label>
                    ) : (
                        <div className="relative h-48 bg-gray-900 rounded-xl overflow-hidden mb-6 border flex items-center justify-center group">
                            <Image
                                src={reportImagePreview}
                                alt="Evidence Preview"
                                fill
                                style={{ objectFit: 'contain' }}
                                className="opacity-90"
                            />
                            <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:bg-black/40"></div>
                            <button
                                onClick={onRemoveImage}
                                disabled={isSubmitting}
                                className="absolute top-3 right-3 bg-white/90 p-2 rounded-full text-gray-700 hover:text-red-500 hover:bg-white shadow-sm transition-all disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2 border-t">
                        <button
                            className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-bold text-gray-500 active:bg-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            onClick={() => {
                                onClearError?.();
                                onClose();
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            className={`flex-[2] py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2
                ${isFormValid && !isSubmitting ? 'bg-[#ee4d2d] text-white shadow-orange-100 active:scale-[0.98] hover:bg-[#d03b1e]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            disabled={!isFormValid || isSubmitting}
                            onClick={onSubmit}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin">
                                        <Camera size={18} />
                                    </div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Camera size={18} /> Submit Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
