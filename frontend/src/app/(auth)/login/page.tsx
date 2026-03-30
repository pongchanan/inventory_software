"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { LoginDesktopShell } from "./_components/LoginDesktopShell";
import { LoginMobileShell } from "./_components/LoginMobileShell";

export default function LoginPage() {
  const router = useRouter();
  const { loginStore, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const res = await login(email, password);
      loginStore(res.access_token, res.user);
      if (res.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
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

      <div className="text-center pt-4">
        <span className="text-gray-500 text-sm">ยังไม่มีบัญชี? </span>
        <button
          type="button"
          onClick={() => router.push("/register")}
          className="text-[#ee4d2d] text-sm font-bold hover:underline"
        >
          สมัครสมาชิก
        </button>
      </div>
    </form>
  );

  return (
    <>
      <LoginDesktopShell form={loginForm} />
      <LoginMobileShell form={loginForm} />
    </>
  );
}
