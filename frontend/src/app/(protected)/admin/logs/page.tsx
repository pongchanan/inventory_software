"use client";

import { useEffect, useState, useCallback } from "react";
import {
    fetchCabinetAccessLogs,
    AuditLogDetail,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
    FileText,
    Download,
    Search,
    Calendar,
} from "lucide-react";
import { LogsDesktopShell } from "./_components/LogsDesktopShell";
import { LogsMobileShell } from "./_components/LogsMobileShell";

export default function LogsAdminPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [cabinetLogs, setCabinetLogs] = useState<AuditLogDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push("/login");
        }
    }, [authLoading, user, isAdmin, router]);

    const loadCabinetLogs = useCallback(() => {
        setLoading(true);
        fetchCabinetAccessLogs(72) // Last 72 hours
            .then(setCabinetLogs)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadCabinetLogs();
    }, [loadCabinetLogs]);

    const exportToCSV = () => {
        if (cabinetLogs.length === 0) return;

        const headers = ["ID", "Time", "User", "User UID", "Type", "Item", "Status", "Message"];
        const rows = cabinetLogs.map(log => [
            log.id,
            new Date(log.timestamp).toISOString(),
            log.user_name || "Unknown",
            log.user,
            log.type,
            log.item || "",
            log.status,
            log.message
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `smart_inventory_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredLogs = cabinetLogs.filter(log =>
    (log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (authLoading || !user || !isAdmin) return null;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-[#ee4d2d]" />
                        ล็อกระบบ & รายงาน
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">บันทึกประวัติการเข้าใช้งานตู้และกิจกรรมสำคัญทั้งหมดในระบบ</p>
                </div>

                <button
                    onClick={exportToCSV}
                    disabled={cabinetLogs.length === 0}
                    className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl hover:bg-black transition-all shadow-md font-bold disabled:opacity-50"
                >
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อผู้ใช้, UID หรือข้อความกิจกรรม..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm"
                    />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm font-bold text-gray-500">
                    <Calendar size={18} /> ย้อนหลัง 72 ชม.
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <LogsDesktopShell loading={loading} filteredLogs={filteredLogs} />
                <LogsMobileShell loading={loading} filteredLogs={filteredLogs} />
            </div>
        </div>
    );
}
