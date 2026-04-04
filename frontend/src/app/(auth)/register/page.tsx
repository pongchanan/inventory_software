"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { RegisterDesktopShell } from "./_components/RegisterDesktopShell";
import { RegisterMobileShell } from "./_components/RegisterMobileShell";
import { register } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [withNFC, setWithNFC] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await register(
                formData.name,
                formData.email,
                formData.password
            );

            if (withNFC) {
                // Store JWT token for use in tap-card page
                localStorage.setItem("token", response.access_token);
                // Redirect to tap-card page to link card using /link-card endpoint
                router.push("/register/tap-card");
            } else {
                // Store token and redirect to home
                localStorage.setItem("token", response.access_token);
                router.push("/");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
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
                    Full Name
                </label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-[#ee4d2d] focus:bg-white transition-all"
                    placeholder="John Doe"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 ml-1">
                    Student ID / Email
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
                    Password
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
                        setError(null);
                    }}
                    className="w-5 h-5 rounded-lg border-2 border-gray-300 cursor-pointer accent-[#ee4d2d]"
                />
                <label htmlFor="withNFC" className="text-sm font-bold text-gray-700 cursor-pointer">
                    Scan NFC Card Now
                </label>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-[#ee4d2d] to-[#ff7355] text-white py-3 rounded-2xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        Sign Up
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>

            <div className="text-center pt-4">
                <span className="text-gray-500 text-sm">Already have an account? </span>
                <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-[#ee4d2d] text-sm font-bold hover:underline"
                >
                    Sign In
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
