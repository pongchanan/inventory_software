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
  ShieldCheck,
  Download
} from "lucide-react";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { fetchItems, fetchActiveLoanDetails, fetchMostBorrowedItems, fetchMostDamagedItems, ItemStatistic } from "@/lib/api";
import * as XLSX from "xlsx";

const exportToExcel = (stats: any, userName: string) => {
  const now = new Date();
  const timestamp = now.toLocaleString("th-TH");
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Dashboard Summary
  const summaryData = [
    ["ศูนย์ควบคุมระบบ - รายงานสรุป", "", ""],
    ["", "", ""],
    ["วันที่ & เวลา", timestamp, ""],
    ["ผู้ส่งออก", userName, ""],
    ["", "", ""],
    ["สรุปข้อมูลระบบ", "", ""],
    ["รายการ", "ปริมาณ", "หน่วย"],
    ["อุปกรณ์ทั้งหมด", stats.totalItems, "ชิ้น"],
    ["กำลังถูกยืมอยู่", stats.activeLoans, "รายการ"],
    ["เลยกำหนดคืน", stats.overdue, "รายการ"],
    ["Health Score", "98.5", "%"],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  ws["!cols"] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 15 }
  ];
  
  // Style header rows
  for (let i = 0; i <= 10; i++) {
    const cellRef = XLSX.utils.encode_col(0) + (i + 1);
    if (ws[cellRef]) {
      ws[cellRef].s = { font: { bold: true } };
    }
  }
  
  XLSX.utils.book_append_sheet(wb, ws, "Summary");
  
  // Generate filename with timestamp
  const filename = `Admin_Report_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.xlsx`;
  
  // Write file
  XLSX.writeFile(wb, filename);
};

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalItems: 0,
    activeLoans: 0,
    overdue: 0,
    systemHealthy: true
  });
  const [mostBorrowedItems, setMostBorrowedItems] = useState<ItemStatistic[]>([]);
  const [mostDamagedItems, setMostDamagedItems] = useState<ItemStatistic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [items, activeLoans, borrowed, damaged] = await Promise.all([
          fetchItems(),
          fetchActiveLoanDetails(),
          fetchMostBorrowedItems(5),
          fetchMostDamagedItems(5)
        ]);

        setStats({
          totalItems: items.length,
          activeLoans: activeLoans.length,
          overdue: activeLoans.filter(l => l.status === 'overdue').length,
          systemHealthy: true
        });
        setMostBorrowedItems(borrowed);
        setMostDamagedItems(damaged);
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportToExcel(stats, user.name)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
          >
            <Download size={14} /> Export Excel
          </button>
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

      {/* STATISTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Borrowed Items */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
            <Package size={20} className="text-orange-500" /> อุปกรณ์ที่ยืมมากที่สุด
          </h3>
          {mostBorrowedItems.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mostBorrowedItems}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {mostBorrowedItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#ee4d2d'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${value} ครั้ง`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 w-full">
                {mostBorrowedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color || '#ee4d2d' }}
                      ></div>
                      <span className="font-medium text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-black text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>ไม่มีข้อมูล</p>
            </div>
          )}
        </div>

        {/* Most Damaged Items */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" /> อุปกรณ์ที่ชำรุดมากที่สุด
          </h3>
          {mostDamagedItems.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mostDamagedItems}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {mostDamagedItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#ef5350'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${value} รายการ`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 w-full">
                {mostDamagedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color || '#ef5350' }}
                      ></div>
                      <span className="font-medium text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-black text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>ไม่มีข้อมูล</p>
            </div>
          )}
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
