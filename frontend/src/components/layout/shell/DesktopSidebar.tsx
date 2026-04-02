"use client";

import Link from 'next/link';
import {
    Package,
    Home,
    History,
    LayoutDashboard,
    Settings,
    LogOut,
    Cpu,
    Wrench,
    Users,
    FileText
} from 'lucide-react';
import { AuthUser } from '../../../lib/api';

interface DesktopSidebarProps {
    currentUser: AuthUser | null;
    onLogout: () => void;
    currentPath: string;
}

export function DesktopSidebar({ currentUser, onLogout, currentPath }: DesktopSidebarProps) {

    const isActive = (path: string) => {
        if (path === '/' && currentPath === '/') return true;
        if (path !== '/' && currentPath.startsWith(path)) return true;
        return false;
    };

    return (
        <aside className="w-64 bg-white border-r flex flex-col shadow-sm z-20 flex-shrink-0">
            <div className="p-6 flex items-center gap-3 text-[#ee4d2d]">
                <Package size={32} strokeWidth={2.5} />
                <h1 className="font-black text-xl tracking-tight leading-none uppercase">Smart<br /><span className="text-gray-900">Inventory</span></h1>
            </div>

            <nav className="flex-grow px-4 space-y-1">
                <Link
                    href="/"
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/') ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <Home size={20} /> หน้าหลัก
                </Link>



                {currentUser && (
                    <>
                        <Link
                            href="/borrowed"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/borrowed') ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Package size={20} /> รายการยืมของฉัน
                        </Link>
                        <Link
                            href="/history"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/history') ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <History size={20} /> ประวัติการใช้งาน
                        </Link>
                    </>
                )}

                {currentUser?.role === 'admin' && (
                    <>
                        <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Control</div>

                        <Link
                            href="/admin"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/admin') && currentPath === '/admin' ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <LayoutDashboard size={20} /> แดชบอร์ดภาพรวม
                        </Link>

                        <Link
                            href="/admin/inventory"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/admin/inventory') ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Settings size={20} /> จัดการอุปกรณ์ถาวร
                        </Link>

                        <Link
                            href="/admin/loans"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/admin/loans') ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Wrench size={20} /> ยืม-คืน & แจ้งซ่อม
                        </Link>

                        <Link
                            href="/admin/users"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/admin/users') ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Users size={20} /> จัดการสมาชิก
                        </Link>

                        <Link
                            href="/admin/logs"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/admin/logs') ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <FileText size={20} /> ล็อกระบบ & รายงาน
                        </Link>
                    </>
                )}
            </nav>

            <div className="p-4 border-t">
                {currentUser ? (
                    <>
                        <Link href="/profile" className="block hover:bg-gray-100 rounded-2xl transition-colors">
                            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 ">
                                <div className="w-10 h-10 bg-[#ee4d2d] rounded-full flex items-center justify-center text-white font-bold">{currentUser?.name?.[0]?.toUpperCase() || 'U'}</div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold truncate">{currentUser?.name || "Guest User"}</p>
                                    <p className="text-[10px] text-gray-500">{currentUser?.email ? currentUser.email.split('@')[0] : "-"}</p>
                                </div>
                            </div>
                        </Link>
                        <button
                            onClick={onLogout}
                            className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={16} /> ออกจากระบบ
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/login"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#ee4d2d] text-white rounded-xl font-bold text-sm hover:bg-[#ff7355] transition-colors"
                        >
                            เข้าสู่ระบบ
                        </Link>
                        <Link
                            href="/register"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
                        >
                            สมัครสมาชิก
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
