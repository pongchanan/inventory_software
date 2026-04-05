"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
    Cpu,
    Loader2,
    Lock,
    Unlock,
    Zap,
    Wifi,
    RefreshCcw,
    LayoutGrid,
    Info
} from "lucide-react";

export default function HardwareAdminPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [unlocking, setUnlocking] = useState<string | null>(null);

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push("/login");
        }
    }, [authLoading, user, isAdmin, router]);

    const lockers = [
        { id: "A1", status: "locked", signal: "strong", temp: "28°C", items: 2 },
        { id: "A2", status: "unlocked", signal: "medium", temp: "29°C", items: 1 },
        { id: "A3", status: "locked", signal: "strong", temp: "27°C", items: 0 },
        { id: "A4", status: "locked", signal: "weak", temp: "31°C", items: 5 },
        { id: "B1", status: "locked", signal: "strong", temp: "28°C", items: 3 },
        { id: "B2", status: "locked", signal: "medium", temp: "28°C", items: 0 },
    ];

    const handleRemoteUnlock = (id: string) => {
        setUnlocking(id);
        // Simulate remote command to ESP32
        setTimeout(() => {
            setUnlocking(null);
            alert(`สั่งปลดล็อกตู้ช่อง ${id} เรียบร้อยแล้ว (ESP32 Command Sent)`);
        }, 1500);
    };

    if (authLoading || !user || !isAdmin) return null;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                        <Cpu className="w-8 h-8 text-[#ee4d2d]" />
                        Manage Cabinets & Hardware
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Monitor temperature, WiFi signal, and remotely unlock cabinets</p>
                </div>

                <button className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl hover:bg-black transition-all shadow-md font-bold">
                    <RefreshCcw size={18} /> Firmware Update (OTA)
                </button>
            </div>

            {/* HARDWARE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lockers.map((locker) => (
                    <div key={locker.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className={`p-6 flex items-center justify-between ${locker.status === 'unlocked' ? 'bg-orange-50' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${locker.status === 'unlocked' ? 'bg-[#ee4d2d] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {locker.status === 'unlocked' ? <Unlock size={24} /> : <Lock size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900">ช่อง {locker.id}</h3>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${locker.status === 'unlocked' ? 'text-[#ee4d2d]' : 'text-gray-400'}`}>
                                        {locker.status === 'unlocked' ? 'ระบบเปิดอยู่' : 'ล็อกแน่นหนา'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoteUnlock(locker.id)}
                                disabled={unlocking !== null}
                                className="p-3 bg-white hover:bg-gray-100 rounded-xl shadow-sm border border-gray-100 transition-all text-gray-700 disabled:opacity-50"
                                title="สั่งปลดล็อกระยะไกล"
                            >
                                {unlocking === locker.id ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                            </button>
                        </div>

                        <div className="p-6 space-y-4 flex-grow">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WiFi Signal</p>
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                                        <Wifi size={14} className={locker.signal === 'weak' ? 'text-red-400' : 'text-green-500'} /> {locker.signal}
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temperature</p>
                                    <p className="text-sm font-bold text-gray-700">{locker.temp}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid size={16} className="text-gray-300" />
                                    <span className="text-xs font-bold text-gray-500">Contents: <span className="text-gray-900">{locker.items} items</span></span>
                                </div>
                                <button className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1">
                                    Details <Info size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
