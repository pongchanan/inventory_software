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
    Loader2,
    AlertCircle,
    X,
    History,
    Download,
    Search,
    Calendar,
} from "lucide-react";

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
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">วัน-เวลา</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">ผู้ใช้งาน</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">ประเภทกิจกรรม</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-200" /></td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-bold">ไม่พบบันทึกกิจกรรม</td></tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-bold text-gray-600">
                                        {new Date(log.timestamp).toLocaleString('th-TH')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 text-sm leading-none mb-1">{log.user_name || "Unknown"}</p>
                                        <p className="font-mono text-[9px] text-gray-400 font-bold uppercase tracking-wider">{log.user}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${log.type === "unlock" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                            log.type === "lock" ? "bg-gray-50 text-gray-600 border-gray-100" :
                                                "bg-purple-50 text-purple-600 border-purple-100"
                                            }`}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.status === "success" ? "text-green-600" : "text-red-600"
                                            }`}>
                                            ● {log.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-medium text-gray-500 max-w-xs">{log.message}</p>
                                        {log.item && <p className="text-[10px] font-mono text-orange-500 font-bold mt-1">Item: {log.item}</p>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-50">
                    {loading ? (
                        <div className="py-10 text-center"><Loader2 size={24} className="animate-spin text-gray-200 mx-auto" /></div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 font-bold text-sm">ไม่พบบันทึก</div>
                    ) : filteredLogs.map((log) => (
                        <div key={log.id} className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-gray-400">{new Date(log.timestamp).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${log.type === "unlock" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-gray-50 text-gray-600"}`}>
                                    {log.type}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{log.user_name || "Unknown"}</p>
                                <p className="text-[10px] font-medium text-gray-500 mt-1 line-clamp-2">{log.message}</p>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                {log.item ? <span className="text-[9px] font-mono font-bold text-orange-500">#{log.item}</span> : <span></span>}
                                <span className={`text-[9px] font-black uppercase ${log.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                    ● {log.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
