"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Shield,
    User as UserIcon,
    CreditCard,
    Mail,
    Loader2,
    CheckCircle2,
    X,
    Package,
    Calendar,
    Check,
    Clock,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { fetchUsers, fetchUserBorrowings } from "@/lib/api";

export default function UsersAdminPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userHistory, setUserHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const itemsPerPage = 10;

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push("/login");
        }
    }, [authLoading, user, isAdmin, router]);

    // Fetch users
    useEffect(() => {
        if (!authLoading && user && isAdmin) {
            loadUsers();
        }
    }, [authLoading, user, isAdmin]);

    async function loadUsers() {
        try {
            setLoadingUsers(true);
            const data = await fetchUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoadingUsers(false);
        }
    }

    async function handleViewUserHistory(selectedUserData: any) {
        setSelectedUser(selectedUserData);
        setHistoryPage(1);
        setLoadingHistory(true);
        try {
            const history = await fetchUserBorrowings(selectedUserData.id);
            setUserHistory(history);
        } catch (err) {
            console.error("Failed to fetch user history:", err);
            setUserHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    }

    const filteredUsers = users.filter(u =>
        u.name.includes(searchQuery) || u.uid.includes(searchQuery) || u.email?.includes(searchQuery)
    );

    const paginatedHistory = userHistory.slice(
        (historyPage - 1) * itemsPerPage,
        historyPage * itemsPerPage
    );
    const totalHistoryPages = Math.ceil(userHistory.length / itemsPerPage);

    if (authLoading || !user || !isAdmin) return null;

    if (loadingUsers) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#ee4d2d]" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                        <Users className="w-8 h-8 text-[#ee4d2d]" />
                        Manage Members
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Control user access rights, link student ID cards, and check user status.</p>
                </div>
            </div>

            {/* FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, student ID or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm"
                    />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Filter size={18} /> filter
                </div>
            </div>

            {/* USERS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.map((u) => (
                    <div 
                        key={u.id} 
                        onClick={() => handleViewUserHistory(u)}
                        className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col p-6 hover:shadow-lg hover:border-orange-100 transition-all group cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-black text-xl border border-gray-100 uppercase">
                                {u.name[0]}
                            </div>
                            <div className="flex items-center gap-1.5">
                                {u.role === 'admin' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-widest">
                                        <Shield size={12} /> Admin
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-gray-50 text-gray-500 border border-gray-100 uppercase tracking-widest">
                                        <UserIcon size={12} /> Student
                                    </span>
                                )}
                                <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6 flex-grow">
                            <div>
                                <h3 className="font-black text-lg text-gray-900 leading-tight">{u.name}</h3>
                                <p className="text-xs font-bold text-gray-400 font-mono">UID: {u.uid}</p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                    <Mail size={12} /> {u.email}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${u.nfc_card_uid ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-400'}`}>
                                    <CreditCard size={16} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${u.nfc_card_uid ? 'text-green-600' : 'text-red-500'}`}>
                                    {u.nfc_card_uid ? 'RFID Mapped' : 'No Card Linked'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* USER HISTORY MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 sm:slide-in-from-center">
                        {/* Header */}
                        <div className="border-b border-gray-100 p-6 flex items-center justify-between sticky top-0 bg-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#ee4d2d] to-[#ff7355] rounded-2xl flex items-center justify-center text-white font-black text-lg uppercase">
                                    {selectedUser.name[0]}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">{selectedUser.name}</h2>
                                    <p className="text-sm text-gray-500 font-medium">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1">
                            {loadingHistory ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#ee4d2d]" />
                                </div>
                            ) : userHistory.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No borrowing history</p>
                                </div>
                            ) : (
                                <div className="hidden md:block">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50">
                                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">Item</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">Borrowed</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">Due</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">Returned</th>
                                                <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-gray-500">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedHistory.map((record) => (
                                                <tr key={record.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Package size={16} className="text-[#ee4d2d]" />
                                                            <h4 className="font-bold text-gray-900">{record.item_name || `Item #${record.item_id}`}</h4>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                                        {new Date(record.borrow_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                                        {record.due_at ? new Date(record.due_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium">
                                                        {record.return_at ? (
                                                            <span className="text-green-600">
                                                                {new Date(record.return_at).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {record.return_at ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100 uppercase tracking-wider">
                                                                <Check size={12} /> Returned
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                                                                <Clock size={12} /> Active
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Mobile view - cards format */}
                            {!loadingHistory && userHistory.length > 0 && (
                                <div className="md:hidden space-y-3 p-6">
                                    {paginatedHistory.map((record) => (
                                        <div key={record.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div className="flex items-start justify-between mb-3">
                                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                    <Package size={16} className="text-[#ee4d2d]" />
                                                    {record.item_name || `Item #${record.item_id}`}
                                                </h4>
                                                {record.return_at ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                                                        <Check size={12} /> Returned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                        <Clock size={12} /> Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 font-medium">Borrowed:</span>
                                                    <span className="font-bold text-gray-900">{new Date(record.borrow_at).toLocaleDateString('en-US')}</span>
                                                </div>
                                                {record.due_at && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 font-medium">Due:</span>
                                                        <span className="font-bold text-gray-900">{new Date(record.due_at).toLocaleDateString('en-US')}</span>
                                                    </div>
                                                )}
                                                {record.return_at && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 font-medium">Returned:</span>
                                                        <span className="font-bold text-green-600">{new Date(record.return_at).toLocaleDateString('en-US')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination Footer */}
                        {userHistory.length > 0 && (
                            <div className="border-t border-gray-100 p-6 flex items-center justify-between bg-gray-50">
                                <button
                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                    disabled={historyPage === 1}
                                    className="p-2 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-600 border border-gray-200"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm font-bold text-gray-600">
                                    Page {historyPage} of {totalHistoryPages} • {userHistory.length} total items
                                </span>
                                <button
                                    onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                                    disabled={historyPage === totalHistoryPages}
                                    className="p-2 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-600 border border-gray-200"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
