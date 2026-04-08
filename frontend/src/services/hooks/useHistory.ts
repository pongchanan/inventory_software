import { useState, useEffect } from 'react';
import { getImageUrl } from '../../lib/api';
import { fetchMyBorrowings } from '../../lib/api_client/borrowings';
import { useAuth } from '../../context/AuthContext';

export interface HistoryItem {
    id: number;
    name: string;
    borrowedAt: Date;
    returnedAt: Date | null;
    dueAt: Date;
    status: string;
    img: string;
    category?: string;
}

export function useHistory() {
    const { user } = useAuth();
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchedUid, setLastFetchedUid] = useState<string | null>(null);

    // Filtering states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        if (!user?.uid) {
            if (historyItems.length === 0) setLoading(false);
            return;
        }

        // If we've already fetched for this user, don't fetch again
        if (lastFetchedUid === user.uid && historyItems.length > 0) {
            setLoading(false);
            return;
        }

        const loadHistory = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch user's own borrowings directly (not via admin endpoint)
                const data = await fetchMyBorrowings(1, 200);

                const formattedData: HistoryItem[] = data.map((loan) => ({
                    id: loan.id,
                    name: loan.item_name || loan.item?.name || `Item ${loan.item_id}`,
                    borrowedAt: new Date(loan.borrow_at),
                    returnedAt: loan.return_at ? new Date(loan.return_at) : null,
                    dueAt: new Date(loan.due_at || ''),
                    status: loan.status || 'active',
                    img: getImageUrl(loan.item?.image_url || null),
                }));

                setHistoryItems(formattedData);
                setLastFetchedUid(user.uid);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                console.error("useHistory: failed to load history:", errorMsg);
                setError("Failed to load history: " + errorMsg);
                setHistoryItems([]);
                setLastFetchedUid(user.uid);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [user?.uid]);

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
