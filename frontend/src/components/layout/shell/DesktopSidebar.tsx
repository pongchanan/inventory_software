"use client";

import Link from 'next/link';
import {
    Package,
    Home,
    History,
    LayoutDashboard,
    Settings,
    LogOut
} from 'lucide-react';
import { User } from '../../../domain/models/Item';

interface DesktopSidebarProps {
    currentUser: User | null;
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

                <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Control</div>

                <Link
                    href="/admin"
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/admin') ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <LayoutDashboard size={20} /> ตรวจสอบตู้ (M2)
                </Link>
                <Link
                    href="/cabinets"
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/cabinets') ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <Package size={20} /> รายการในตู้
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50">
                    <Settings size={20} /> ตั้งค่าระบบ
                </button>
            </nav>

            <div className="p-4 border-t">
                <Link href="/profile" className="block hover:bg-gray-100 rounded-2xl transition-colors">
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 justify-center">
                        <div className="w-10 h-10 bg-[#ee4d2d] rounded-full flex items-center justify-center text-white font-bold">{currentUser?.initial || 'U'}</div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold truncate">{currentUser?.name || "Loading..."}</p>
                            <p className="text-[10px] text-gray-500">{currentUser?.studentId || "-"}</p>
                        </div>
                    </div>
                </Link>
                <button
                    onClick={onLogout}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut size={16} /> ออกจากระบบ
                </button>
            </div>
        </aside>
    );
}
