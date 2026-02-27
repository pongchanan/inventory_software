"use client";

import { useState } from 'react';
import { useInventory, SortOption } from '../../services/hooks/useInventory';
import { useDamageReport } from '../../services/hooks/useDamageReport';
import { useAuth } from '@/context/AuthContext';
import {
    Search,
    Package,
    History,
    AlertTriangle,
    Home,
    LayoutDashboard,
    Settings,
    Bell,
    LogOut,
    MapPin,
    Camera,
    X
} from 'lucide-react';

export function DesktopApp() {
    const [activeTab, setActiveTab] = useState('home');
    const { logout } = useAuth();

    const {
        borrowedItems,
        currentUser,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        sortedItems,
    } = useInventory();

    const {
        isReportModalOpen,
        selectedItem,
        reportImage,
        openReportModal,
        closeReportModal,
        handleImageChange,
        handleRemoveImage,
        submitReport
    } = useDamageReport();

    return (
        <div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-800 overflow-hidden">

            {/* Sidebar - Desktop Layout */}
            <aside className="w-64 bg-white border-r flex flex-col shadow-sm z-20">
                <div className="p-6 flex items-center gap-3 text-[#ee4d2d]">
                    <Package size={32} strokeWidth={2.5} />
                    <h1 className="font-black text-xl tracking-tight leading-none uppercase">Smart<br /><span className="text-gray-900">Inventory</span></h1>
                </div>

                <nav className="flex-grow px-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'home' ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <Home size={20} /> หน้าหลัก
                    </button>
                    <button
                        onClick={() => setActiveTab('borrowed')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'borrowed' ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <Package size={20} /> รายการยืมของฉัน
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <History size={20} /> ประวัติการใช้งาน
                    </button>
                    <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Control</div>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50">
                        <LayoutDashboard size={20} /> ตรวจสอบตู้ (M2)
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50">
                        <Settings size={20} /> ตั้งค่าระบบ
                    </button>
                </nav>

                <div className="p-4 border-t">
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 justify-center">
                        <div className="w-10 h-10 bg-[#ee4d2d] rounded-full flex items-center justify-center text-white font-bold">{currentUser?.initial || 'U'}</div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold truncate">{currentUser?.name || "Loading..."}</p>
                            <p className="text-[10px] text-gray-500">{currentUser?.studentId || "-"}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={16} /> ออกจากระบบ
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-grow flex flex-col h-full overflow-hidden">

                {/* Top Header */}
                <header className="h-20 bg-white border-b flex items-center justify-between px-8 z-10 shadow-sm flex-shrink-0">
                    <div className="relative w-96 group text-gray-800">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ee4d2d] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาอุปกรณ์ IOT หรือ เซ็นเซอร์..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-2xl border-2 border-transparent focus:bg-white focus:border-[#ee4d2d] outline-none text-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">เรียงตาม:</span>
                            <select
                                className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                            >
                                <option value="name">ชื่อ (A-Z)</option>
                                <option value="qty-desc">คงเหลือมากที่สุด</option>
                                <option value="qty-asc">สต็อกใกล้หมด</option>
                            </select>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <button className="relative p-2 text-gray-400 hover:text-[#ee4d2d] transition-colors">
                            <Bell size={24} />
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ee4d2d] border-2 border-white rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-grow overflow-y-auto p-8 no-scrollbar bg-[#f8f9fa]">

                    {activeTab === 'home' && (
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-end justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-black mb-1">อุปกรณ์ทั้งหมด</h2>
                                    <p className="text-gray-500 text-sm">เลือกดูอุปกรณ์ที่มีพร้อมให้ยืมในตู้ Smart Inventory</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="px-4 py-2 bg-white border rounded-xl text-xs font-bold flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div> ยืมได้ปกติ
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-24">
                                {sortedItems.map(item => (
                                    <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group border border-gray-50">
                                        <div className="relative h-48 bg-gray-50 overflow-hidden">
                                            <img src={item.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.name} />
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black text-gray-800 shadow-sm uppercase tracking-tighter">
                                                    {item.cabinet}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                                            <h3 className="font-bold text-sm leading-tight text-gray-900 group-hover:text-[#ee4d2d] transition-colors line-clamp-2">{item.name}</h3>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className={`text-xs font-black ${item.qty === 0 ? 'text-gray-300' : 'text-[#ee4d2d]'}`}>
                                                        {item.qty === 0 ? 'สินค้าหมด' : `คงเหลือ ${item.qty} ชิ้น`}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400">ทั้งหมด {item.total}</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${item.qty === 0 ? 'bg-gray-300' : 'bg-[#ee4d2d]'}`}
                                                        style={{ width: `${(item.qty / item.total) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'borrowed' && (
                        <div className="max-w-4xl mx-auto pb-24">
                            <h2 className="text-3xl font-black mb-8">รายการยืมของฉัน</h2>

                            <div className="space-y-4">
                                {borrowedItems.map(item => (
                                    <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm flex items-center gap-8 border border-gray-50 hover:border-orange-100 transition-colors">
                                        <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border">
                                            <img src="https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=200" className="w-full h-full object-cover" alt={item.name} />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">Status: Borrowed</span>
                                            </div>
                                            <div className="flex gap-6 text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5"><MapPin size={14} className="text-[#ee4d2d]" /> {item.loc}</div>
                                                <div className="flex items-center gap-1.5"><History size={14} className="text-[#ee4d2d]" /> ยืมเมื่อ {item.date}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openReportModal(item)}
                                            className="flex items-center gap-2 px-6 py-3 bg-orange-50 text-[#ee4d2d] text-sm font-bold rounded-2xl hover:bg-[#ee4d2d] hover:text-white transition-all shadow-sm"
                                        >
                                            <AlertTriangle size={18} /> แจ้งความเสียหาย
                                        </button>
                                    </div>
                                ))}

                                {borrowedItems.length === 0 && (
                                    <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                        <Package size={48} className="mx-auto mb-4 text-gray-200" />
                                        <p className="text-gray-400 font-bold">คุณยังไม่ได้ยืมอุปกรณ์ชิ้นใดเลยในขณะนี้</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 p-8 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                                <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-500 flex-shrink-0">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-blue-900 mb-1">การคืนของอัตโนมัติ (Automated Trust System)</h4>
                                    <p className="text-sm text-blue-700 leading-relaxed opacity-80">
                                        ใน Milestone 3 และ 4 ระบบจะตรวจจับการคืนของผ่านเซนเซอร์ UHF/RFID หน้าตู้โดยตรง
                                        คุณไม่จำเป็นต้องกดคืนของในแอปพลิเคชัน เพียงแค่นำของกลับมาแตะที่เซนเซอร์และวางคืนในตู้
                                        ระบบจะอัปเดตสถานะของคุณให้โดยอัตโนมัติทันที
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="max-w-4xl mx-auto py-20 text-center text-gray-400 font-bold bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            ฟังก์ชั่นประวัติการใช้งานจะเปิดให้ใช้งานในเร็วๆนี้
                        </div>
                    )}

                </main>
            </div>

            {/* Centered Modal - Damage Reporting */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeReportModal}></div>

                    <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b flex justify-between items-center bg-white z-10">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">แจ้งความเสียหาย</h3>
                                <p className="text-sm text-gray-500">รายงานปัญหาที่พบเพื่อให้ทีมงานเข้าแก้ไข</p>
                            </div>
                            <button onClick={closeReportModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="w-16 h-16 bg-white rounded-xl border overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=200" className="w-full h-full object-cover" alt="Selected" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">อุปกรณ์ที่กำลังรายงาน</p>
                                    <p className="font-black text-gray-900">{selectedItem?.name}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">รายละเอียดความเสียหาย</label>
                                <textarea
                                    placeholder="ระบุปัญหาที่พบ เช่น ไฟสถานะไม่ติด, พอร์ตเชื่อมต่อหัก..."
                                    className="w-full border-2 border-gray-100 rounded-2xl p-4 text-sm h-32 outline-none focus:border-[#ee4d2d] bg-gray-50 transition-all resize-none"
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">แนบรูปภาพหลักฐาน (Required)</label>
                                {!reportImage ? (
                                    <label className="border-2 border-dashed border-gray-200 rounded-3xl h-44 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-orange-50 hover:border-[#ee4d2d] hover:text-[#ee4d2d] transition-all group bg-gray-50/50">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                            <Camera size={32} />
                                        </div>
                                        <span className="text-sm font-bold">เลือกรูปภาพ หรือ ลากไฟล์มาวางที่นี่</span>
                                        <p className="text-[10px] mt-1 opacity-60">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                ) : (
                                    <div className="relative h-44 bg-gray-900 rounded-3xl overflow-hidden border-4 border-white shadow-lg flex items-center justify-center group">
                                        <img src={reportImage} alt="Evidence" className="w-full h-full object-contain opacity-80" />
                                        <button
                                            onClick={handleRemoveImage}
                                            className="absolute top-4 right-4 bg-white p-2 rounded-full text-red-500 shadow-xl hover:scale-110 transition-transform"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    className="flex-1 py-4 rounded-2xl font-black text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                                    onClick={closeReportModal}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    className={`flex-[2] py-4 rounded-2xl font-black text-white shadow-xl transition-all
                    ${reportImage ? 'bg-[#ee4d2d] shadow-orange-200 hover:scale-[1.02] active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}
                                    disabled={!reportImage}
                                    onClick={submitReport}
                                >
                                    ส่งข้อมูลรายงาน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Decorative Background Circles */}
            <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-orange-100 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
            <div className="fixed -top-32 -right-32 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
        </div>
    );
};
