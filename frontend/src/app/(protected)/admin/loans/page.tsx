"use client";

import { useEffect, useState, useCallback } from "react";
import {
    fetchLoanDetails,
    fetchActiveLoanDetails,
    LoanDetail,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Wrench,
    Loader2,
    AlertCircle,
    X,
    History,
    Clock,
    AlertTriangle,
    User,
    CheckCircle2,
} from "lucide-react";
import { LoansDesktopShell } from "./_components/LoansDesktopShell";
import { LoansMobileShell } from "./_components/LoansMobileShell";

export default function LoansAdminPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loans, setLoans] = useState<LoanDetail[]>([]);
    const [loansTotal, setLoansTotal] = useState(0);
    const [loansTotalPages, setLoansTotalPages] = useState(0);
    const [loansCurrentPage, setLoansCurrentPage] = useState(1);
    const [activeLoans, setActiveLoans] = useState<LoanDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.replace("/login");
        }
    }, [authLoading, user, isAdmin, router]);

    const loadLoans = useCallback((page: number = 1) => {
        setLoading(true);
        Promise.all([
            fetchLoanDetails(page),
            fetchActiveLoanDetails()
        ])
            .then(([allLoansResult, active]) => {
                setLoans(allLoansResult.borrowings);
                setLoansTotal(allLoansResult.total);
                setLoansTotalPages(allLoansResult.total_pages);
                setLoansCurrentPage(allLoansResult.page);
                setActiveLoans(active);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadLoans();
    }, [loadLoans]);

    const handlePageChange = (newPage: number) => {
        loadLoans(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'returned':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-green-50 text-green-600 border border-green-100 uppercase tracking-wider">
                        <CheckCircle2 size={12} /> Returned
                    </span>
                );
            case 'overdue':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-100 uppercase tracking-wider">
                        <AlertTriangle size={12} /> Overdue
                    </span>
                );
            case 'damage_reported':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-100 uppercase tracking-wider">
                        <AlertTriangle size={12} /> Damage Reported
                    </span>
                );
            case 'damage_approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-50 text-orange-600 border border-orange-100 uppercase tracking-wider">
                        <AlertTriangle size={12} /> Damage Approved
                    </span>
                );
            case 'returning':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wider">
                        <Clock size={12} /> Returning
                    </span>
                );
            case 'active':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                        <Clock size={12} /> Active
                    </span>
                );
        }
    };

    if (authLoading || !user || !isAdmin) return null;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                    <Wrench className="w-8 h-8 text-[#ee4d2d]" />
                    Loans & Maintenance
                </h1>
                <p className="text-gray-500 font-medium mt-1">Track equipment borrowing status and manage maintenance reports from users</p>
            </div>

            {loading ? (
                <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-200" /></div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100">{error}</div>
            ) : (
                <>
                    {/* ACTIVE LOANS SECTION */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-black flex items-center gap-2 px-2">
                            <AlertTriangle className="text-orange-500" size={24} /> Items currently being borrowed ({activeLoans.length})
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {activeLoans.map(loan => (
                                <div key={loan.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border relative">
                                        <Image src={loan.item_image_url || "/placeholder.png"} alt={loan.item_name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900 leading-tight">{loan.item_name}</h4>
                                            <StatusBadge status={loan.status} />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 mb-3">
                                            <User size={12} /> {loan.user_name}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-50">
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">วันยืม</p>
                                                <p className="text-[11px] font-bold text-gray-700">{formatDate(loan.borrowed_at)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">กำหนดคืน</p>
                                                <p className="text-[11px] font-bold text-red-600">{formatDate(loan.due_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FULL HISTORY TABLE */}
                    <div className="space-y-4 pt-4">
                        <h3 className="text-xl font-black flex items-center gap-2 px-2">
                            <History className="text-gray-400" size={24} /> Complete Borrowing and Return History
                        </h3>
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <LoansDesktopShell loans={loans} formatDate={formatDate} StatusBadge={StatusBadge} />
                            <LoansMobileShell loans={loans} formatDate={formatDate} StatusBadge={StatusBadge} />
                        </div>

                        {/* PAGINATION CONTROLS */}
                        {loansTotalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 px-2">
                                <p className="text-sm font-bold text-gray-600">
                                    Page {loansCurrentPage} of {loansTotalPages} • Total: {loansTotal} loans
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(loansCurrentPage - 1)}
                                        disabled={loansCurrentPage === 1}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-bold text-gray-700"
                                    >
                                        ← Previous
                                    </button>
                                    <div className="flex gap-1">
                                        {Array.from({ length: loansTotalPages }, (_, i) => i + 1).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => handlePageChange(p)}
                                                className={`w-10 h-10 rounded-lg font-bold ${
                                                    loansCurrentPage === p
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(loansCurrentPage + 1)}
                                        disabled={loansCurrentPage === loansTotalPages}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-bold text-gray-700"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
