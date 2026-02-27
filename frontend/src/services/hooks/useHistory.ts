import { useState, useEffect } from 'react';
import { fetchUserLoanDetails, LoanDetail, getImageUrl } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export interface HistoryItem {
    id: number;
    name: string;
    borrowedAt: Date;
    returnedAt: Date | null;
    dueAt: Date;
    status: string;
    img: string;
    category: string;
}

export function useHistory() {
    const { user } = useAuth();
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtering states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        const loadHistory = async () => {
            if (!user?.uid) return;

            try {
                setLoading(true);
                const data = await fetchUserLoanDetails(user.uid, true);

                const formattedData: HistoryItem[] = data.map((loan: LoanDetail) => ({
                    id: loan.id,
                    name: loan.item_name,
                    borrowedAt: new Date(loan.borrowed_at),
                    returnedAt: loan.returned_at ? new Date(loan.returned_at) : null,
                    dueAt: new Date(loan.due_at),
                    status: loan.status,
                    img: getImageUrl(loan.item_image_url),
                    category: loan.item_category || 'ไม่ระบุ'
                }));

                setHistoryItems(formattedData);
            } catch (err) {
                console.error("Failed to load history:", err);
                setError("ไม่สามารถโหลดข้อมูลประวัติการใช้งานได้");
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [user]);

    const filteredHistory = historyItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: historyItems.length,
        returned: historyItems.filter(i => i.status === 'returned').length,
        active: historyItems.filter(i => i.status === 'active').length,
        overdue: historyItems.filter(i => i.status === 'overdue').length,
        returnRate: historyItems.length > 0
            ? Math.round((historyItems.filter(i => i.status === 'returned').length / historyItems.length) * 100)
            : 0
    };

    return {
        historyItems: filteredHistory,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        stats
    };
}
