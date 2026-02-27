"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function KioskRegistrationForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // The QR code on the kiosk should look like: https://your-domain.com/kiosk/register?kiosk_id=kiosk_demo_01
    const kioskId = searchParams.get("kiosk_id") || "kiosk_demo_01" // Default for testing if not provided

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [step, setStep] = useState<"FORM" | "WAITING" | "SUCCESS" | "ERROR">("FORM")
    const [errorMessage, setErrorMessage] = useState("")
    const [timeLeft, setTimeLeft] = useState(120) // 2 minutes to scan

    // Timer for the waiting step
    useEffect(() => {
        if (step === "WAITING" && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
            return () => clearTimeout(timer)
        }
        if (step === "WAITING" && timeLeft <= 0) {
            setStep("ERROR")
            setErrorMessage("หมดเวลาการทำรายการ กรุณาเริ่มทำรายการใหม่")
        }
    }, [step, timeLeft])

    // Polling check
    useEffect(() => {
        if (step !== "WAITING") return

        const checkStatus = async () => {
            try {
                const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/kiosk/status/${kioskId}`)

                if (!res.ok) return // Ignore network glitches during polling

                const data = await res.json()

                if (data.status === "success") {
                    // Store token and redirect
                    localStorage.setItem("token", data.access_token)
                    setStep("SUCCESS")
                    setTimeout(() => {
                        router.push("/") // Redirect to home/dashboard
                    }, 3000)
                } else if (data.status === "expired" || data.status === "not_found") {
                    setStep("ERROR")
                    setErrorMessage("เซสชั่นหมดอายุหรือไม่พบข้อมูลตู้ กรุณาเริ่มใหม่")
                }
            } catch (err) {
                console.error("Polling error:", err)
            }
        }

        // Poll every 1.5 seconds
        const interval = setInterval(checkStatus, 1500)
        return () => clearInterval(interval)
    }, [step, kioskId, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage("")

        try {
            const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/kiosk/prepare_registration`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kiosk_id: kioskId,
                    name,
                    email,
                    password
                })
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.detail || "เกิดข้อผิดพลาดในการส่งข้อมูล")
            }

            // Transition to Waiting Step
            setStep("WAITING")
            setTimeLeft(120)

        } catch (err: any) {
            setErrorMessage(err.message)
        }
    }

    // UI Components based on steps
    if (step === "WAITING") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-24 h-24 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <h2 className="text-2xl font-bold text-slate-800">กรุณานำบัตรนักศึกษามาแตะที่ตู้</h2>
                    <p className="text-slate-600">
                        ระบบกำลังรอรับข้อมูลจากตู้เบอร์ <span className="font-mono font-bold">{kioskId}</span>
                    </p>
                    <div className="text-4xl font-mono text-blue-600 font-bold">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <button
                        onClick={() => setStep("FORM")}
                        className="text-sm text-slate-400 hover:text-slate-600 underline"
                    >
                        ยกเลิกการทำรายการ
                    </button>
                </div>
            </div>
        )
    }

    if (step === "SUCCESS") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-green-600">ลงทะเบียนสำเร็จ!</h2>
                    <p className="text-slate-600">
                        กำลังพาท่านเข้าสู่ระบบอัตโนมัติ...
                    </p>
                </div>
            </div>
        )
    }

    if (step === "ERROR") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-red-600">เกิดข้อผิดพลาด</h2>
                    <p className="text-slate-600">{errorMessage}</p>
                    <button
                        onClick={() => setStep("FORM")}
                        className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition"
                    >
                        ลองใหม่อีกครั้ง
                    </button>
                </div>
            </div>
        )
    }

    // Default: FORM Step
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-slate-800">ลงทะเบียนบัตรใหม่</h1>
                    <p className="text-slate-500">กรอกข้อมูลให้ครบถ้วนเพื่อผูกกับบัตรนักศึกษา</p>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล / Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="e.g. John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล / Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="student@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน / Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="ตั้งรหัสผ่าน 6 ตัวขึ้นไป"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white rounded-lg py-3.5 font-semibold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md mt-4"
                    >
                        ขั้นตอนต่อไป: แตะบัตร
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-xs text-slate-400">สถานีลงทะเบียน: {kioskId}</p>
                </div>
            </div>
        </div>
    )
}

export default function KioskRegistrationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-gray-500 font-medium">กำลังโหลดแบบฟอร์ม...</p></div>}>
            <KioskRegistrationForm />
        </Suspense>
    )
}
