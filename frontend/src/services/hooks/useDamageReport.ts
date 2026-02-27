import { useState } from 'react';
import { BorrowedItem } from '../../domain/models/Item';

export function useDamageReport() {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<BorrowedItem | null>(null);
    const [reportImage, setReportImage] = useState<string | null>(null);
    const [reportDetail, setReportDetail] = useState('');

    const openReportModal = (item: BorrowedItem) => {
        setSelectedItem(item);
        setIsReportModalOpen(true);
    };

    const closeReportModal = () => {
        setIsReportModalOpen(false);
        // Notice that we reset states after opening to prevent flickering
        setTimeout(() => {
            setReportImage(null);
            setReportDetail('');
            setSelectedItem(null);
        }, 300);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setReportImage(imageUrl);
        }
    };

    const handleRemoveImage = () => {
        if (reportImage) {
            URL.revokeObjectURL(reportImage); // Clean up memory
        }
        setReportImage(null);
    };

    const submitReport = async () => {
        // In a real app: await repairRepository.submitDamageReport(...)
        alert('กำลังอัปโหลดรูปภาพและส่งข้อมูลไปยัง Server... (Function: Firebase Storage Upload)');
        closeReportModal();
    };

    return {
        isReportModalOpen,
        selectedItem,
        reportImage,
        reportDetail,
        setReportDetail,
        openReportModal,
        closeReportModal,
        handleImageChange,
        handleRemoveImage,
        submitReport
    };
}
