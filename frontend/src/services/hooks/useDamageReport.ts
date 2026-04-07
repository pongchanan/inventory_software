import { useState } from 'react';
import { BorrowedItem } from '../../domain/models/Item';
import { submitDamageReport } from '../../lib/api_client/damaged_reports';

export function useDamageReport() {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<BorrowedItem | null>(null);
    const [reportImageFile, setReportImageFile] = useState<File | null>(null);
    const [reportImagePreview, setReportImagePreview] = useState<string | null>(null);
    const [reportDetail, setReportDetail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const openReportModal = (item: BorrowedItem) => {
        setSelectedItem(item);
        setIsReportModalOpen(true);
        setError(null);
    };

    const closeReportModal = () => {
        setIsReportModalOpen(false);
        // Notice that we reset states after opening to prevent flickering
        setTimeout(() => {
            if (reportImagePreview) {
                URL.revokeObjectURL(reportImagePreview);
            }
            setReportImageFile(null);
            setReportImagePreview(null);
            setReportDetail('');
            setSelectedItem(null);
            setError(null);
        }, 300);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReportImageFile(file);
            const imageUrl = URL.createObjectURL(file);
            setReportImagePreview(imageUrl);
        }
    };

    const handleRemoveImage = () => {
        if (reportImagePreview) {
            URL.revokeObjectURL(reportImagePreview);
        }
        setReportImageFile(null);
        setReportImagePreview(null);
    };

    const clearError = () => {
        setError(null);
    };

    const submitReport = async () => {
        if (!reportImageFile || !reportDetail.trim()) {
            setError('Please fill in all required fields (description and photo)');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await submitDamageReport(
                'Damage Report', // topic
                reportDetail,
                reportImageFile
            );
            alert('Damage report submitted successfully!');
            closeReportModal();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to submit damage report';
            setError(errorMessage);
            console.error('Damage report submission error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        isReportModalOpen,
        selectedItem,
        reportImagePreview,
        reportDetail,
        setReportDetail,
        isSubmitting,
        error,
        openReportModal,
        closeReportModal,
        handleImageChange,
        handleRemoveImage,
        clearError,
        submitReport
    };
}
