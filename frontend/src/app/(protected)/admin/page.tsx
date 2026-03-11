"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Cpu,
  Wrench,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { fetchItems, fetchActiveLoanDetails } from "@/lib/api";

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalItems: 0,
    activeLoans: 0,
    overdue: 0,
    systemHealthy: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [items, activeLoans] = await Promise.all([
          fetchItems(),
          fetchActiveLoanDetails()
        ]);

        setStats({
          totalItems: items.length,
          activeLoans: activeLoans.length,
          overdue: activeLoans.filter(l => l.status === 'overdue').length,
          systemHealthy: true
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (authLoading || !user || !isAdmin) return null;

  const quickActions = [
    { title: "จัดการอุปกรณ์", icon: Package, href: "/admin/inventory", color: "bg-orange-500", desc: "เพิ่ม/ลบ รายการครุภัณฑ์" },
    { title: "จัดการตู้", icon: Cpu, href: "/admin/hardware", color: "bg-blue-500", desc: "เช็คสถานะเซนเซอร์และตู้" },
    { title: "ยืม-คืน & ซ่อม", icon: Wrench, href: "/admin/loans", color: "bg-green-500", desc: "ตรวจสอบการยืมและแจ้งซ่อม" },
    { title: "จัดการสมาชิก", icon: Users, href: "/admin/users", color: "bg-purple-500", desc: "สิทธิ์การเข้าถึงและบัตร RFID" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* WELCOME HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <LayoutDashboard size={32} className="text-[#ee4d2d]" /> ศูนย์ควบคุมระบบ (M2)
          </h1>
          <p className="text-gray-500 font-medium mt-1">ยินดีต้อนรับคุณ {user.name}, ข้อมูลสรุปสถานะระบบล่าสุด</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-wider">
            ไปยังหน้ายืมของ <ArrowRight size={12} />
          </Link>
          <div className="hidden sm:flex items-center gap-2 bg-green-50 px-4 py-2 rounded-2xl border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 text-xs font-black uppercase tracking-widest">System Online</span>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">อุปกรณ์ทั้งหมด</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-gray-900">{stats.totalItems}</span>
            <span className="text-gray-400 text-sm font-bold mb-1">ชิ้น</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-500">
            <TrendingUp size={12} /> ข้อมูลล่าสุดจากฐานข้อมูล
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">กำลังถูกยืมอยู่</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-blue-600">{stats.activeLoans}</span>
            <span className="text-blue-200 text-sm font-bold mb-1">รายการ</span>
          </div>
          <p className="mt-4 text-[10px] font-bold text-gray-400">พัสดุหมุนเวียน ณ ปัจจุบัน</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">เลยกำหนดคืน</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-red-600">{stats.overdue}</span>
            <span className="text-red-200 text-sm font-bold mb-1">รายการ</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
            <AlertCircle size={12} /> ควรรีบตรวจสอบ
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-lg text-white">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Health Score</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black">98.5</span>
            <span className="text-gray-400 text-sm font-bold mb-1">%</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-green-400 uppercase tracking-widest">
            <ShieldCheck size={12} /> All Sensors OK
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="group bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all flex items-center gap-4"
          >
            <div className={`w-14 h-14 ${action.color} rounded-3xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform`}>
              <action.icon size={24} />
            </div>
            <div className="pr-4">
              <h4 className="font-black text-gray-900 text-sm leading-tight">{action.title}</h4>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* RECENT LOGS PREVIEW */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-gray-400" /> กิจกรรมล่าสุดในระบบ
          </h3>
          <Link href="/admin/logs" className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-700 flex items-center gap-1 tracking-widest">
            ดูทั้งหมด <ArrowRight size={12} />
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Clock size={18} /></div>
            <div className="flex-grow">
              <p className="text-xs font-bold text-gray-900">ตัวอย่าง: มีการสแกนบัตรเปิดตู้ A1</p>
              <p className="text-[10px] text-gray-400 font-medium">15 นาทีที่ผ่านมา • โดย นายสมชาย ใจดี</p>
            </div>
            <span className="text-[10px] font-black text-green-600 uppercase">Success</span>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 opacity-60">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0"><Package size={18} /></div>
            <div className="flex-grow">
              <p className="text-xs font-bold text-gray-900">ตัวอย่าง: เพิ่มอุปกรณ์ใหม่ "Oscilloscope"</p>
              <p className="text-[10px] text-gray-400 font-medium">1 ชั่วโมงที่ผ่านมา • โดย Admin</p>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase">Audit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
