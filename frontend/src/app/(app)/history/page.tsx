"use client";

import { Package } from 'lucide-react';

export default function HistoryPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <h2 className="text-3xl font-black mb-8">ประวัติการใช้งาน</h2>

            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <Package size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400 font-bold">ฟังก์ชั่นประวัติการใช้งานจะเปิดให้ใช้งานในเร็วๆนี้</p>
            </div>
        </div>
    );
}
