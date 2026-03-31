"use client";

import { useAuth } from '@/context/AuthContext';
import { User, Mail, LogOut, Clock, ShieldCheck, Settings, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
    const { user, isAdmin, logout, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <h2 className="text-3xl font-black mb-8">โปรไฟล์ส่วนตัว</h2>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-[#ee4d2d] to-[#ff7355]"></div>

                <div className="px-8 pb-8 flex flex-col items-center sm:items-start sm:flex-row gap-6 -mt-16">
                    <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg shrink-0">
                        <div className="w-full h-full bg-orange-100 rounded-full flex items-center justify-center text-[#ee4d2d] text-4xl font-black">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </div>

                    <div className="pt-4 sm:pt-16 text-center sm:text-left flex-grow">
                        <h3 className="text-2xl font-black text-gray-900">{user?.name || 'Guest User'}</h3>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                            <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                                <Mail size={16} />
                                {user?.email || 'N/A'}
                            </span>
                            {isAdmin && (
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <ShieldCheck size={14} /> Admin
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-8 flex flex-col gap-2 pb-8">
                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors group">
                        <div className="flex items-center gap-3 text-gray-700 font-medium">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Clock size={20} />
                            </div>
                            ประวัติที่เคยยืมทั้งหมด
                        </div>
                    </button>

                    <Link href="/profile/cards" className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl transition-colors group border border-blue-200">
                        <div className="flex items-center gap-3 text-gray-700 font-medium">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Smartphone size={20} />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold">การ์ด NFC ของฉัน</div>
                                <div className="text-xs text-gray-600 font-normal">
                                    {user?.nfc_card_uid ? (
                                        <span className="text-green-600 font-semibold">✓ 1 ใบ เชื่อมต่ออยู่</span>
                                    ) : (
                                        <span className="text-orange-600 font-semibold">ยังไม่มีการ์ดเชื่อมต่อ</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-blue-500">
                                {user?.nfc_card_uid ? '1' : '0'}
                            </div>
                            <div className="text-xs text-gray-600">ใบ</div>
                        </div>
                    </Link>

                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors group">
                        <div className="flex items-center gap-3 text-gray-700 font-medium">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-500 group-hover:scale-110 transition-transform">
                                <Settings size={20} />
                            </div>
                            ตั้งค่าการแจ้งเตือน
                        </div>
                    </button>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors group mt-4"
                    >
                        <div className="flex items-center gap-3 text-red-600 font-medium">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                <LogOut size={20} />
                            </div>
                            ออกจากระบบ
                        </div>
                    </button>

                    {isAdmin && (
                        <Link href="/admin" className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors group mt-2">
                            <div className="flex items-center gap-3 text-purple-700 font-medium">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={20} />
                                </div>
                                เข้าสู่ระบบจัดการ Admin
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
