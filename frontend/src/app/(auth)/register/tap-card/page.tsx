"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Nfc, CheckCircle, AlertCircle } from "lucide-react";
import { linkCardForUser } from "@/lib/api";

export default function TapCardPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"waiting" | "success" | "error">("waiting");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const initializeLinkCard = async () => {
            try {
                // Get JWT token from localStorage
                const token = localStorage.getItem("token");
                if (!token) {
                    setStatus("error");
                    setErrorMsg("Authentication token not found. Please register again.");
                    return;
                }

                // Call link-card endpoint - this tells IoT to enter register mode and waits for card scan
                const user = await linkCardForUser();
                
                // Card successfully linked
                setStatus("success");

                // After showing success, redirect to home
                setTimeout(() => {
                    router.push("/");
                }, 2000);
            } catch (err: any) {
                // Card was not scanned or link failed
                setStatus("error");
                setErrorMsg(err.message || "Card scan timeout or failed. Please try again.");
            }
        };

        initializeLinkCard();
    }, [router]);

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden text-center z-10">

            {/* Decorative Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-[#ee4d2d] to-[#ff7355] -skew-y-6 transform origin-top-left opacity-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-100/40 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-2xl border border-white/50">

                {status === "waiting" && (
                    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="relative mb-8">
                            {/* Pulsing ring animation */}
                            <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-75"></div>
                            <div className="relative w-32 h-32 bg-gradient-to-br from-[#ee4d2d] to-[#ff7355] rounded-full flex items-center justify-center shadow-xl shadow-orange-500/30 text-white">
                                <Nfc size={48} strokeWidth={2} className="animate-pulse" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Verify Your Identity</h1>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                            Please tap your <span className="text-[#ee4d2d] font-bold">student card</span> on the scanner in front of the cabinet to link your account
                        </p>

                        <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-6 py-3 rounded-full border border-gray-100">
                            <Loader2 className="w-5 h-5 animate-spin text-[#ee4d2d]" />
                            Waiting for card scan...
                        </div>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                            <CheckCircle size={48} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Registration Successful!</h1>
                        <p className="text-gray-500 font-medium">Card linked successfully.<br />Redirecting to home...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                            <AlertCircle size={48} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Card Scan Failed</h1>
                        <p className="text-gray-500 font-medium mb-8 text-sm">{errorMsg}</p>
                        <button
                            onClick={() => router.push("/register")}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
