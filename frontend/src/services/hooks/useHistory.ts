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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchedUid, setLastFetchedUid] = useState<string | null>(null);

    // Filtering states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        console.log("useHistory: useEffect triggered, user.uid =", user?.uid, "lastFetchedUid =", lastFetchedUid);
        
        // If user is not available or hasn't changed, don't fetch
        if (!user?.uid) {
            console.log("useHistory: No user data available yet");
            if (historyItems.length === 0) {
                setLoading(false);
            }
            return;
        }

        // If we've already fetched for this user, don't fetch again
        if (lastFetchedUid === user.uid && historyItems.length > 0) {
            console.log("useHistory: Already fetched data for user", user.uid);
            setLoading(false);
            return;
        }

        const loadHistory = async () => {
            try {
                console.log("useHistory: Starting fetch for user", user.uid);
                setLoading(true);
                setError(null);
                
                // Add timeout to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Data fetch timeout after 30 seconds")), 30000)
                );
                
                console.log("useHistory: About to call fetchUserLoanDetails...");
                const dataPromise = fetchUserLoanDetails(user.uid, true);
                console.log("useHistory: fetchUserLoanDetails promise created");
                
                const data = await Promise.race([dataPromise, timeoutPromise]) as LoanDetail[];
                
                console.log("useHistory: Promise.race completed!");
                console.log("useHistory: Fetch completed, received", data);
                console.log("useHistory: Data length:", data?.length, "Type:", typeof data);

                if (!Array.isArray(data)) {
                    console.error("useHistory: Data is not an array!", typeof data, data);
                    setError("Invalid data format from server");
                    setHistoryItems([]);
                    setLastFetchedUid(user.uid);
                    setLoading(false);
                    return;
                }

                console.log("useHistory: Data is an array with", data.length, "items");
                if (data.length === 0) {
                    console.log("useHistory: Data array is empty!");
                    setHistoryItems([]);
                    setLastFetchedUid(user.uid);
                    setLoading(false);
                    return;
                }

                console.log("useHistory: Starting data transformation for", data.length, "items...");
                const formattedData: HistoryItem[] = data.map((loan: LoanDetail, index: number) => {
                    try {
                        if (!loan || !loan.item_name) {
                            console.warn(`useHistory: Loan ${index} has missing data:`, loan);
                        }
                        const item = {
                            id: loan.id,
                            name: loan.item_name,
                            borrowedAt: new Date(loan.borrowed_at),
                            returnedAt: loan.returned_at ? new Date(loan.returned_at) : null,
                            dueAt: new Date(loan.due_at),
                            status: loan.status,
                            img: getImageUrl(loan.item_image_url),
                            category: loan.item_category || 'Unspecified'
                        };
                        if (index === 0) console.log("useHistory: First transformed item:", item);
                        return item;
                    } catch (itemError) {
                        console.error(`useHistory: Error transforming item ${index}:`, itemError);
                        throw itemError;
                    }
                });

                console.log("useHistory: Transformation complete!");
                console.log("useHistory: Formatted data:", formattedData);
                console.log("useHistory: About to call setHistoryItems with", formattedData.length, "items");
                
                setHistoryItems(formattedData);
                setLastFetchedUid(user.uid);
                
                console.log("useHistory: setHistoryItems called, data set successfully");
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                console.error("useHistory: CAUGHT ERROR in loadHistory:", errorMsg);
                console.error("useHistory: Full error object:", err);
                setError("Failed to load history: " + errorMsg);
                setHistoryItems([]);
                setLastFetchedUid(user.uid);
            } finally {
                console.log("useHistory: In finally block, setting loading to false");
                setLoading(false);
                console.log("useHistory: Loading set to false");
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
