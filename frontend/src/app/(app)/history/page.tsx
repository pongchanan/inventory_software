"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { useHistory } from '@/services/hooks/useHistory';
import { Search, Filter, History, MapPin, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const {
        historyItems,
        loading: historyLoading,
        error,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        stats
    } = useHistory();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return null; // Or a fancy skeleton loader
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'returned':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100 uppercase tracking-wider">
                        <CheckCircle2 size={12} /> ยืนยันการคืนสำเร็จ
                    </span>
                );
            case 'overdue':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100 uppercase tracking-wider">
                        <XCircle size={12} /> เลยกำหนดคืน
                    </span>
                );
            case 'active':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                        <Clock size={12} /> กำลังยืมอยู่
                    </span>
                );
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <h2 className="text-3xl font-black mb-2">ประวัติการใช้งาน</h2>
            <p className="text-gray-500 font-medium mb-8">ภาพรวมสถิติและประวัติการยืม-คืนอุปกรณ์ของคุณทั้งหมด</p>

            {/* QUICK STATS DASHBOARD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 font-bold text-sm">การยืมทั้งหมด</span>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500"><History size={16} /></div>
                    </div>
                    <div>
                        <span className="text-2xl font-black text-gray-900">{stats.total}</span> <span className="text-gray-400 text-sm font-medium">ครั้ง</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-500 font-bold text-sm">กำลังยืมอยู่</span>
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Clock size={16} /></div>
                    </div>
                    <div>
                        <span className="text-2xl font-black text-blue-600">{stats.active}</span> <span className="text-blue-300 text-sm font-medium">รายการ</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-green-500 font-bold text-sm">คืนเสร็จสิ้น</span>
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500"><CheckCircle2 size={16} /></div>
                    </div>
                    <div>
                        <span className="text-2xl font-black text-green-600">{stats.returned}</span> <span className="text-green-300 text-sm font-medium">รายการ</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-red-500 font-bold text-sm">เลยกำหนดคืน</span>
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500"><AlertCircle size={16} /></div>
                    </div>
                    <div>
                        <span className="text-2xl font-black text-red-600">{stats.overdue}</span> <span className="text-red-300 text-sm font-medium">รายการ</span>
                    </div>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาตามชื่ออุปกรณ์..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm"
                    />
                </div>

                <div className="relative min-w-[160px]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Filter size={18} />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-11 pr-8 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm appearance-none cursor-pointer"
                    >
                        <option value="all">สถานะทั้งหมด</option>
                        <option value="active">กำลังยืมอยู่</option>
                        <option value="returned">คืนสำเร็จ</option>
                        <option value="overdue">เลยกำหนดคืน</option>
                    </select>
                </div>
            </div>

            {/* DATA VIEW */}
            {historyLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm border border-gray-50">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-[#ee4d2d] rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-bold">กำลังโหลดประวัติการใช้งาน...</p>
                </div>
            ) : error ? (
                <div className="py-6 px-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-center font-bold">
                    {error}
                </div>
            ) : historyItems.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <History size={48} className="mx-auto mb-4 text-gray-200" />
                    <p className="text-gray-400 font-bold text-lg mb-1">ไม่พบประวัติการใช้งาน</p>
                    <p className="text-gray-400 text-sm">ลองเปลี่ยนเงื่อนไขการค้นหาดูอีกครั้ง</p>
                </div>
            ) : (
                <>
                    {/* DESKTOP VIEW (Table) */}
                    <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider w-20">รูปภาพ</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">อุปกรณ์ที่ยืม</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-center">วันที่ทำรายการยืม</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-center">สถานะปัจจุบัน</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyItems.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden border relative">
                                                <Image src={item.img} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="3rem" />
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <h4 className="font-bold text-gray-900 mb-0.5">{item.name}</h4>
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                <MapPin size={10} className="text-gray-300" /> {item.category}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center text-sm font-medium text-gray-600">
                                            {formatDate(item.borrowedAt)}
                                            {item.returnedAt && (
                                                <div className="text-[11px] text-green-600 mt-1 font-bold">
                                                    (คืนเมื่อ: {formatDate(item.returnedAt)})
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={item.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE VIEW (Card Timeline) */}
                    <div className="md:hidden flex flex-col gap-4 relative">
                        {/* Timeline line connecting cards */}
                        <div className="absolute left-[24px] top-6 bottom-6 w-0.5 bg-gray-100 z-0"></div>

                        {historyItems.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 relative z-10 w-full ml-4 w-[calc(100%-1rem)]">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[20px] top-6 w-3 h-3 rounded-full border-2 border-white shadow-sm
                                    ${item.status === 'returned' ? 'bg-green-500' : item.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'}
                                `}></div>

                                <div className="flex items-start gap-4 mb-3">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl overflow-hidden border relative shrink-0">
                                        <Image src={item.img} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="3.5rem" />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-gray-900 leading-tight mb-1">{item.name}</h4>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                            <MapPin size={10} className="text-gray-300" /> {item.category}
                                        </div>
                                        <StatusBadge status={item.status} />
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-[11px] font-medium text-gray-500 space-y-1.5 flex flex-col">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider">วันยืม</span>
                                        <span className="text-gray-700">{formatDate(item.borrowedAt)}</span>
                                    </div>
                                    {item.status === 'returned' && item.returnedAt ? (
                                        <div className="flex justify-between items-center pt-1.5 border-t border-gray-200/60">
                                            <span className="text-green-500/80 font-bold uppercase tracking-wider flex items-center gap-1">
                                                วันคืน
                                            </span>
                                            <span className="text-green-700 font-bold">{formatDate(item.returnedAt)}</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center pt-1.5 border-t border-gray-200/60">
                                            <span className="text-orange-500/80 font-bold uppercase tracking-wider">กำหนดคืน</span>
                                            <span className="text-orange-700 font-bold">{formatDate(item.dueAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
