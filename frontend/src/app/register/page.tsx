"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus, CreditCard, Check, Loader2 } from "lucide-react";

type Step = "form" | "scanning" | "done";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [scanNow, setScanNow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [cardLinked, setCardLinked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (scanNow) {
        // Show scanning UI immediately, backend waits 15s for card
        setStep("scanning");
      }

      const data = await register(name, email, password, scanNow);

      if (scanNow) {
        // If we get here, registration succeeded
        // Check if card was actually linked
        const hasCard = data.user.card_id !== null;
        setCardLinked(hasCard);
        setStep("done");

        // Auto-redirect after 2s
        setTimeout(() => {
          router.replace("/");
        }, 2000);
      } else {
        // No card scan, go directly to home
        router.replace("/");
      }
    } catch (err) {
      setStep("form");
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Scanning state ──
  if (step === "scanning") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
              <CreditCard size={36} className="text-blue-600 animate-pulse-dot" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Waiting for Card Scan
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                Please tap your NFC card on the reader within 15 seconds…
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Listening for card…
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Done state ──
  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-6">
            <div
              className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                cardLinked ? "bg-green-50" : "bg-yellow-50"
              }`}
            >
              {cardLinked ? (
                <Check size={36} className="text-green-600" />
              ) : (
                <CreditCard size={36} className="text-yellow-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {cardLinked ? "Card Linked!" : "Registration Complete"}
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                {cardLinked
                  ? "Your NFC card has been successfully linked to your account."
                  : "No card was detected. You can link a card later from your profile."}
              </p>
            </div>
            <p className="text-xs text-gray-400">Redirecting…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <PackageIcon className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1">
            Join the inventory management system
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5"
        >
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Card scan checkbox */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={scanNow}
                onChange={(e) => setScanNow(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-gray-700">
                  Link NFC card now
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  After registering, the system will wait 15 seconds for you to
                  tap your card on the reader. You can also link it later.
                </span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && !scanNow ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                {scanNow ? "Register & Scan Card" : "Register"}
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function PackageIcon(props: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 24}
      height={props.size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
