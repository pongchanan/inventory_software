"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { LogIn, Loader2, AlertCircle, Package, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { loginStore, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in — redirect to admin or home based on role later. For now just admin.
  useEffect(() => {
    if (user) {
      router.push("/admin");
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
      const res = await login(email, password);
      loginStore(res.access_token, res.user);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
    setLoading(false);
  };

  const loginForm = (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-2xl border border-red-100 text-sm animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-gray-700 ml-1">
          อีเมลอาจารย์ / ผู้ดูแลระบบ
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-[#ee4d2d] focus:bg-white transition-all"
          placeholder="admin@inventory.local"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-gray-700 ml-1">
          รหัสผ่าน
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-[#ee4d2d] focus:bg-white transition-all"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ee4d2d] to-[#ff7355] text-white py-4 rounded-2xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black disabled:opacity-50 shadow-lg shadow-orange-500/20 mt-8"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            เข้าสู่ระบบ
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
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
        {/* Background Image with Overlay */}
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

        {/* Branding (Top) */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <Package size={24} className="text-[#ee4d2d]" />
          </div>
          <h1 className="font-black text-2xl tracking-tight leading-none uppercase">
            Smart<br /><span className="text-gray-400">Inventory</span>
          </h1>
        </div>

        {/* Hero Text (Bottom) */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-5xl font-black mb-6 leading-tight">ระบบจัดการ<br />ยืมคืนอุปกรณ์ IoT</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            ระบบลงทะเบียน ยืม และ คืน อุปกรณ์อัตโนมัติ ใช้งานง่าย รองรับการยืนยันตัวตนด้วยบัตรนักศึกษา และการแจ้งเตือนแบบเรียลไทม์
          </p>
        </div>
      </div>

      {/* 
        ------------------------------------------
        MOBILE/DESKTOP VIEW: Login Form (Right Panel)
        ------------------------------------------
      */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Mobile App Background Elements (Hidden on Desktop) */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-[#ee4d2d] to-[#ff7355] -skew-y-6 transform origin-top-left -z-10" />

        {/* Decorative Circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-100 rounded-full blur-[100px] opacity-50 pointer-events-none z-0" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-50 pointer-events-none z-0" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Branding (Only visible on mobile) */}
          <div className="lg:hidden text-center mb-10 text-white">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md mb-6 border border-white/30 shadow-xl">
              <Package className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight uppercase">Smart Inventory</h1>
            <p className="mt-2 text-white/80">ลงชื่อเข้าใช้งานระบบ</p>
          </div>

          {/* Desktop Heading (Only visible on Desktop) */}
          <div className="hidden lg:block mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-2">ยินดีต้อนรับกลับ! 👋</h2>
            <p className="text-gray-500">กรุณาลงชื่อเข้าใช้เพื่อจัดการระบบ</p>
          </div>

          {/* The Unified Form */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-2xl border border-white/50 relative overflow-hidden">
            {/* Subtle shiny edge effect */}
            <div className="absolute inset-0 rounded-[2rem] border-2 border-white/60 pointer-events-none" />

            {loginForm}
          </div>

          <div className="text-center mt-8 space-x-1 text-sm">
            <span className="text-gray-500 font-medium">พบปัญหา?</span>
            <a href="#" className="font-bold text-[#ee4d2d] hover:underline">ติดต่อผู้ดูแลระบบ</a>
          </div>
        </div>
      </div>
    </div>
  );
}
