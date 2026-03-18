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
    X
} from "lucide-react";

export default function UsersAdminPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push("/login");
        }
    }, [authLoading, user, isAdmin, router]);

    // Mock users for UI demonstration
    const users = [
        { id: 1, name: "นายสมพงษ์ เรียนดี", uid: "64010123", email: "sompong@uni.ac.th", role: "user", cardMapped: true },
        { id: 2, name: "นางสาวสมหญิง รักเรียน", uid: "64010567", email: "somying@uni.ac.th", role: "admin", cardMapped: true },
        { id: 3, name: "นายสิริกร วิศวะ", uid: "64010999", email: "sirikorn@uni.ac.th", role: "user", cardMapped: false },
        { id: 4, name: "นายสมชาย ใจดี", uid: "UID-GUEST", email: "somchai@gmail.com", role: "user", cardMapped: true },
    ];

    const filteredUsers = users.filter(u =>
        u.name.includes(searchQuery) || u.uid.includes(searchQuery) || u.email.includes(searchQuery)
    );

    if (authLoading || !user || !isAdmin) return null;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                        <Users className="w-8 h-8 text-[#ee4d2d]" />
                        จัดการสมาชิก
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">คุมสิทธิ์การใช้งาน ผูกบัตรนักศึกษา และตรวจสอบสถานะผู้ใช้ระบบ</p>
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
                        placeholder="ค้นหาชื่อ, รหัสนักศึกษา หรืออีเมล..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm"
                    />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Filter size={18} /> กรองตามสิทธิ์
                </div>
            </div>

            {/* USERS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.map((u) => (
                    <div key={u.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col p-6 hover:shadow-lg hover:border-orange-100 transition-all group">
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
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${u.cardMapped ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-400'}`}>
                                    <CreditCard size={16} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${u.cardMapped ? 'text-green-600' : 'text-red-500'}`}>
                                    {u.cardMapped ? 'RFID Mapped' : 'No Card Linked'}
                                </span>
                            </div>

                            {!u.cardMapped && (
                                <button className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-700 underline underline-offset-4 tracking-wider">
                                    Link Now
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
