"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, AlertCircle, Package, ArrowRight } from "lucide-react";
import Image from "next/image";

// Normally you'd import a specific prepare_registration API call from lib/api.ts
// We'll add that to api.ts shortly.
import { API_BASE } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "", // Used as username/student ID
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Call the preparation API
            const res = await fetch(`${API_BASE}/api/auth/kiosk/prepare_registration`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: "user"
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.detail || "Registration failed. Please try again.");
            }

            // If successful, push to the tap-card waiting screen
            router.push("/register/tap-card");
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const registerForm = (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-2xl border border-red-100 text-sm animate-in fade-in slide-in-from-bottom-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 ml-1">
                    ชื่อ - นามสกุล
                </label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-[#ee4d2d] focus:bg-white transition-all"
                    placeholder="สมชาย ใจดี"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 ml-1">
                    รหัสนักศึกษา / อีเมล
                </label>
                <input
                    type="text"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-[#ee4d2d] focus:bg-white transition-all"
                    placeholder="s64xxxxxxxx@kmitl.ac.th"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 ml-1">
                    รหัสผ่าน
                </label>
                <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-[#ee4d2d] focus:bg-white transition-all"
                    placeholder="••••••••"
                    minLength={6}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ee4d2d] to-[#ff7355] text-white py-4 rounded-2xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black disabled:opacity-50 shadow-lg shadow-orange-500/20 mt-6"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        ดำเนินการต่อ
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>

            <div className="text-center pt-4">
                <span className="text-gray-500 text-sm">มีบัญชีอยู่แล้ว? </span>
                <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-[#ee4d2d] text-sm font-bold hover:underline"
                >
                    เข้าสู่ระบบ
                </button>
            </div>
        </form>
    );

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex">
            {/* 
        ------------------------------------------
        DESKTOP VIEW: Split Screen (Left Panel)
        ------------------------------------------
      */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden text-white flex-col justify-between p-12">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop"
                        alt="Laboratory equipment"
                        fill
                        className="object-cover opacity-30"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900" />
                </div>

                <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                        <Package size={24} className="text-[#ee4d2d]" />
                    </div>
                    <h1 className="font-black text-2xl tracking-tight leading-none uppercase">
                        Smart<br /><span className="text-gray-400">Inventory</span>
                    </h1>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h2 className="text-5xl font-black mb-6 leading-tight">สมัครสมาชิก<br />เพื่อเริ่มต้นใช้งาน</h2>
                    <ul className="text-gray-400 text-lg space-y-3">
                        <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ee4d2d]" />ยืม-คืน อุปกรณ์อัตโนมัติ 24 ชม.</li>
                        <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ee4d2d]" />ใช้เพียงบัตรนักศึกษาใบเดียว</li>
                        <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ee4d2d]" />ตรวจสอบประวัติผ่านแอปพลิเคชัน</li>
                    </ul>
                </div>
            </div>

            {/* 
        ------------------------------------------
        MOBILE/DESKTOP VIEW: Form (Right Panel)
        ------------------------------------------
      */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                <div className="lg:hidden absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-[#ee4d2d] to-[#ff7355] -skew-y-6 transform origin-top-left -z-10" />

                <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-100 rounded-full blur-[100px] opacity-50 pointer-events-none z-0" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-50 pointer-events-none z-0" />

                <div className="w-full max-w-md relative z-10">
                    <div className="lg:hidden text-center mb-8 text-white">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md mb-6 border border-white/30 shadow-xl" onClick={() => router.push('/')}>
                            <UserPlus className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight uppercase">ลงทะเบียน</h1>
                        <p className="mt-2 text-white/80">ระบบลงทะเบียน (1/2)</p>
                    </div>

                    <div className="hidden lg:block mb-10">
                        <h2 className="text-4xl font-black text-gray-900 mb-2">สร้างบัญชีใหม่ ✨</h2>
                        <p className="text-gray-500">ขั้นตอนที่ 1: กรอกข้อมูลเบื้องต้น</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-2xl border border-white/50 relative overflow-hidden">
                        <div className="absolute inset-0 rounded-[2rem] border-2 border-white/60 pointer-events-none" />
                        {registerForm}
                    </div>
                </div>
            </div>
        </div>
    );
}
