"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { RegisterDesktopShell } from "./_components/RegisterDesktopShell";
import { RegisterMobileShell } from "./_components/RegisterMobileShell";
import { register, registerWithCard } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        cardId: "",
    });
    const [withNFC, setWithNFC] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (withNFC) {
                // Register with NFC card - proceed to tap-card screen to scan
                if (!formData.cardId.trim()) {
                    setError("กรุณาสแกนบัตร NFC");
                    setLoading(false);
                    return;
                }
                const registrationData = await registerWithCard(formData.name, formData.email, formData.password, formData.cardId);
                sessionStorage.setItem("registrationId", registrationData.id.toString());
                router.push("/register/tap-card");
            } else {
                // Register without card - continue through explicit login flow
                await register(formData.name, formData.email, formData.password);
                router.push("/login");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };


    const registrationForm = (
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

            {/* NFC Card Toggle */}
            <div className="flex items-center gap-3 py-2">
                <input
                    type="checkbox"
                    id="withNFC"
                    checked={withNFC}
                    onChange={(e) => {
                        setWithNFC(e.target.checked);
                        setFormData({ ...formData, cardId: "" });
                        setError(null);
                    }}
                    className="w-5 h-5 rounded-lg border-2 border-gray-300 cursor-pointer accent-[#ee4d2d]"
                />
                <label htmlFor="withNFC" className="text-sm font-bold text-gray-700 cursor-pointer">
                    สแกนบัตร NFC ทันที
                </label>
            </div>

            {/* NFC Card ID Field - Only visible when checkbox is checked */}
            {withNFC && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">
                        รหัสบัตร NFC
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.cardId}
                        onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                        className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-[#ee4d2d] focus:bg-white transition-all"
                        placeholder="กรุณาสแกนบัตร NFC"
                        autoFocus
                    />
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-[#ee4d2d] to-[#ff7355] text-white py-3 rounded-2xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        สมัครสมาชิก
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
        <>
            <RegisterDesktopShell 
                form={registrationForm} 
                onLogoClick={() => router.push('/')} 
            />
            <RegisterMobileShell 
                form={registrationForm} 
                onLogoClick={() => router.push('/')} 
            />
        </>
    );
}
