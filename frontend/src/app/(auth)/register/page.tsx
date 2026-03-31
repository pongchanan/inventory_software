"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { RegisterDesktopShell } from "./_components/RegisterDesktopShell";
import { RegisterMobileShell } from "./_components/RegisterMobileShell";
import { register } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
    const router = useRouter();
    const { loginStore, user } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        email: "", // Email/username for login
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Already logged in — redirect to admin or home based on role.
    useEffect(() => {
        if (user) {
            if (user.role === "admin") {
                router.push("/admin");
            } else {
                router.push("/");
            }
        }
    }, [user, router]);

    if (user) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Call the standard registration API
            const res = await register(formData.name, formData.email, formData.password);
            
            // Store the token and user in auth context
            loginStore(res.access_token, res.user);
            
            // Redirect to home page
            router.push("/");
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
                    อีเมล
                </label>
                <input
                    type="email"
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
                        ลงทะเบียน
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
            <RegisterDesktopShell form={registerForm} onLogoClick={() => router.push('/')} />
            <RegisterMobileShell form={registerForm} onLogoClick={() => router.push('/')} />
        </>
    );
}
