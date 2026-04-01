"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAllUsers, updateUserRole } from "@/lib/api";
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
    X,
    AlertCircle
} from "lucide-react";

interface User {
    id: number;
    name: string;
    uid?: string;
    email: string | null;
    role: "admin" | "user";
    nfc_card_uid?: string;
}

export default function UsersAdminPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push("/login");
        }
    }, [authLoading, user, isAdmin, router]);

    // Fetch users from API
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getAllUsers();
                if (Array.isArray(response)) {
                    setUsers(response);
                }
            } catch (err) {
                console.error("Failed to fetch users:", err);
                setError("ไม่สามารถโหลดรายชื่อสมาชิก กรุณาลองใหม่อีกครั้ง");
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && isAdmin) {
            fetchUsers();
        }
    }, [authLoading, isAdmin]);

    // Handle role change
    const handleRoleChange = async (userId: number, newRole: "admin" | "user") => {
        try {
            setUpdatingUserId(userId);
            await updateUserRole(userId, newRole);
            
            // Update UI
            setUsers(users.map(u => 
                u.id === userId ? { ...u, role: newRole } : u
            ));
            
            setSuccessMessage(`สิทธิ์ของ ${users.find(u => u.id === userId)?.name} อัปเดตสำเร็จ`);
            setTimeout(() => setSuccessMessage(null), 3000);
            setOpenMenuId(null);
        } catch (err) {
            console.error("Failed to update user role:", err);
            setError("ไม่สามารถอัปเดตสิทธิ์ของผู้ใช้");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.uid?.includes(searchQuery)) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading || !user || !isAdmin) return null;

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-96">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ee4d2d] mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">กำลังโหลดรายชื่อสมาชิก...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            {/* SUCCESS MESSAGE */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm font-bold text-green-700">{successMessage}</p>
                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm font-bold text-red-700">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="w-4 h-4 text-red-600" />
                    </button>
                </div>
            )}

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
                    <Filter size={18} /> {filteredUsers.length} คน
                </div>
            </div>

            {/* USERS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">ไม่พบสมาชิก</p>
                    </div>
                ) : (
                    filteredUsers.map((u) => (
                        <div key={u.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col p-6 hover:shadow-lg hover:border-orange-100 transition-all group relative">
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
                                    <div className="relative">
                                        <button 
                                            onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                                            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 disabled:opacity-50"
                                            disabled={updatingUserId === u.id}
                                        >
                                            {updatingUserId === u.id ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <MoreVertical size={18} />
                                            )}
                                        </button>
                                        
                                        {/* DROPDOWN MENU */}
                                        {openMenuId === u.id && (
                                            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-48">
                                                {u.role === 'admin' ? (
                                                    <button
                                                        onClick={() => handleRoleChange(u.id, 'user')}
                                                        className="w-full text-left px-4 py-3 hover:bg-orange-50 text-red-600 font-bold text-sm flex items-center gap-2 border-b border-gray-100"
                                                    >
                                                        <UserIcon size={14} /> ยกเลิกสิทธิ์ Admin
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRoleChange(u.id, 'admin')}
                                                        className="w-full text-left px-4 py-3 hover:bg-purple-50 text-purple-600 font-bold text-sm flex items-center gap-2 border-b border-gray-100"
                                                    >
                                                        <Shield size={14} /> ให้สิทธิ์ Admin
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 flex-grow">
                                <div>
                                    <h3 className="font-black text-lg text-gray-900 leading-tight">{u.name}</h3>
                                    {u.uid && (
                                        <p className="text-xs font-bold text-gray-400 font-mono">UID: {u.uid}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                        <Mail size={12} /> {u.email}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${u.nfc_card_uid ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-400'}`}>
                                        <CreditCard size={16} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${u.nfc_card_uid ? 'text-green-600' : 'text-red-500'}`}>
                                        {u.nfc_card_uid ? 'RFID Mapped' : 'No Card Linked'}
                                    </span>
                                </div>

                                {!u.nfc_card_uid && (
                                    <button className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-700 underline underline-offset-4 tracking-wider">
                                        Link Now
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
