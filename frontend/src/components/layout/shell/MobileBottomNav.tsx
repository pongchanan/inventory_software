"use client";

import Link from 'next/link';
import { Home, Package, User } from 'lucide-react';
import { useInventory } from '../../../services/hooks/useInventory';

interface MobileBottomNavProps {
    currentPath: string;
}

export function MobileBottomNav({ currentPath }: MobileBottomNavProps) {
    const { borrowedItems } = useInventory(); // Keep dynamic count just for mobile nav
    const borrowedCount = borrowedItems.length;

    const isActive = (path: string) => {
        if (path === '/' && currentPath === '/') return true;
        if (path !== '/' && currentPath.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="fixed bottom-0 w-full max-w-md bg-white/80 backdrop-blur-xl border-t border-gray-100 flex justify-around p-4 pb-6 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <Link
                href="/"
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive('/') ? 'text-[#ee4d2d] scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Home size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
                <span className="text-[10px] font-bold">หน้าหลัก</span>
            </Link>

            <Link
                href={borrowedCount !== undefined ? "/borrowed" : "/login"} // borrowedCount !== undefined implies authentication context checks could run, alternatively check auth context.
                // Alternatively, relying strictly on authContext passed directly:
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${isActive('/borrowed') ? 'text-[#ee4d2d] scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Package size={22} strokeWidth={isActive('/borrowed') ? 2.5 : 2} />
                <span className="text-[10px] font-bold">ยืมของ</span>
                {borrowedCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                        {borrowedCount}
                    </span>
                )}
            </Link>

            <Link
                href="/profile"
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive('/profile') ? 'text-[#ee4d2d] scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <User size={22} strokeWidth={isActive('/profile') ? 2.5 : 2} />
                <span className="text-[10px] font-bold">โปรไฟล์</span>
            </Link>
        </div>
    );
}
