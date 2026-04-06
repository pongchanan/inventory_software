"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Home, Package, User, History, Cpu, Users, LayoutDashboard, Wrench, FileText, Box, AlertTriangle, Menu } from 'lucide-react';
import { useInventory } from '../../../services/hooks/useInventory';
import { useAuth } from '@/context/AuthContext';
import { useAdminMode } from '@/context/AdminModeContext';

interface MobileBottomNavProps {
    currentPath: string;
}

export function MobileBottomNav({ currentPath }: MobileBottomNavProps) {
    const { user, isAdmin } = useAuth();
    const { isAdminMode } = useAdminMode();
    const { borrowedItems } = useInventory();
    const borrowedCount = borrowedItems.length;

    const isActive = (path: string) => {
        if (path === '/' && currentPath === '/') return true;
        if (path !== '/' && currentPath.startsWith(path)) return true;
        return false;
    };

    if (!user) return null;

    // Show admin navbar only if user is admin AND in admin mode
    const showAdminNav = isAdmin && isAdminMode;

    if (showAdminNav) {
    const [moreOpen, setMoreOpen] = useState(false);

    return (
        <div className="fixed bottom-0 w-full z-50">
            {/* More sheet */}
            {moreOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMoreOpen(false)}
                    />
                    <div className="absolute bottom-full mb-2 right-2 z-50 bg-white rounded-2xl border border-gray-100 shadow-lg py-2 min-w-[160px]">
                        <Link href="/admin/damaged-reports" onClick={() => setMoreOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isActive('/admin/damaged-reports') ? 'text-amber-500' : 'text-gray-500'}`}>
                            <AlertTriangle size={18} strokeWidth={isActive('/admin/damaged-reports') ? 2.5 : 2} />
                            Damage
                        </Link>
                        <Link href="/admin/logs" onClick={() => setMoreOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isActive('/admin/logs') ? 'text-green-500' : 'text-gray-500'}`}>
                            <FileText size={18} strokeWidth={isActive('/admin/logs') ? 2.5 : 2} />
                            Activity
                        </Link>
                        <Link href="/profile" onClick={() => setMoreOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isActive('/profile') ? 'text-gray-900' : 'text-gray-500'}`}>
                            <User size={18} strokeWidth={isActive('/profile') ? 2.5 : 2} />
                            Profile
                        </Link>
                    </div>
                </>
            )}

            {/* Bottom bar */}
            <div className="w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] grid grid-cols-5 px-2 pt-3 pb-6">
                <Link href="/admin"
                    className={`flex flex-col items-center gap-1 py-2 transition-all duration-300 ${isActive('/admin') && currentPath === '/admin' ? 'text-gray-900 scale-110' : 'text-gray-400'}`}>
                    <LayoutDashboard size={22} strokeWidth={isActive('/admin') && currentPath === '/admin' ? 2.5 : 2} />
                    <span className="text-[9px] font-bold">Summary</span>
                </Link>
                <Link href="/admin/inventory"
                    className={`flex flex-col items-center gap-1 py-2 transition-all duration-300 ${isActive('/admin/inventory') ? 'text-orange-500 scale-110' : 'text-gray-400'}`}>
                    <Box size={22} strokeWidth={isActive('/admin/inventory') ? 2.5 : 2} />
                    <span className="text-[9px] font-bold">Equipment</span>
                </Link>
                <Link href="/admin/users"
                    className={`flex flex-col items-center gap-1 py-2 transition-all duration-300 ${isActive('/admin/users') ? 'text-blue-500 scale-110' : 'text-gray-400'}`}>
                    <Users size={22} strokeWidth={isActive('/admin/users') ? 2.5 : 2} />
                    <span className="text-[9px] font-bold">Members</span>
                </Link>
                <Link href="/admin/loans"
                    className={`flex flex-col items-center gap-1 py-2 transition-all duration-300 ${isActive('/admin/loans') ? 'text-orange-500 scale-110' : 'text-gray-400'}`}>
                    <Wrench size={22} strokeWidth={isActive('/admin/loans') ? 2.5 : 2} />
                    <span className="text-[9px] font-bold">Borrowed</span>
                </Link>
                <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className={`flex flex-col items-center gap-1 py-2 transition-all duration-300 ${moreOpen ? 'text-gray-900 scale-110' : 'text-gray-400'}`}>
                    <Menu size={22} strokeWidth={moreOpen ? 2.5 : 2} />
                    <span className="text-[9px] font-bold">More</span>
                </button>
            </div>
        </div>
    );
}

    return (
        <div className="fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 flex justify-around p-4 pb-6 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <Link
                href="/"
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive('/') ? 'text-[#ee4d2d] scale-110' : 'text-gray-400'}`}
            >
                <Home size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Items</span>
            </Link>

            <Link
                href="/borrowed"
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${isActive('/borrowed') ? 'text-[#ee4d2d] scale-110' : 'text-gray-400'}`}
            >
                <Package size={22} strokeWidth={isActive('/borrowed') ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Borrowed</span>
                {borrowedCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#ee4d2d] text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                        {borrowedCount}
                    </span>
                )}
            </Link>

            <Link
                href="/history"
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive('/history') ? 'text-[#ee4d2d] scale-110' : 'text-gray-400'}`}
            >
                <History size={22} strokeWidth={isActive('/history') ? 2.5 : 2} />
                <span className="text-[10px] font-bold">History</span>
            </Link>

            <Link
                href="/profile"
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive('/profile') ? 'text-[#ee4d2d] scale-110' : 'text-gray-400'}`}
            >
                <User size={22} strokeWidth={isActive('/profile') ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Profile</span>
            </Link>
        </div>
    );
}

