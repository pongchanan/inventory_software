'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMe } from '@/lib/api';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  nfc_card_uid: string;
  role: string;
}

export default function MyCardsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetchMe();
      setUser(response);
      setError('');
    } catch (err) {
      setError('Failed to load user data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold mb-4"
          >
            <span className="mr-2">←</span>
            กลับไปที่โปรไฟล์
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">การ์ดที่เชื่อมต่อ</h1>
          <p className="text-gray-600 mt-2">ดูและจัดการการ์ด NFC ของคุณ</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Linked Card Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">✓ การ์ดที่เชื่อมต่ออยู่</h2>
            </div>

            {user?.nfc_card_uid ? (
              <div className="p-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      Card ID
                    </label>
                    <div className="bg-white rounded px-4 py-3 font-mono text-lg font-bold text-indigo-600 break-all">
                      {user.nfc_card_uid}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-semibold">สถานะ</p>
                      <p className="text-green-600 font-bold">🟢 เชื่อมต่ออยู่</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">จำนวนการ์ด</p>
                      <p className="text-indigo-600 font-bold">1 ใบ</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-green-200">
                    <Link
                      href="/profile/link-nfc"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      <span className="mr-2">📝</span>
                      เปลี่ยนการ์ด
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="bg-orange-50 rounded-lg p-6 border-2 border-orange-200 text-center">
                  <p className="text-orange-700 font-semibold mb-4">ยังไม่มีการ์ดเชื่อมต่อ</p>
                  <Link
                    href="/profile/link-nfc"
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    <span className="mr-2">➕</span>
                    เชื่อมต่อการ์ด NFC
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Card Information Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ℹ️ ข้อมูลการ์ด</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p className="flex items-start">
                <span className="font-semibold text-indigo-600 mr-2">•</span>
                <span>Card ID จะใช้ในการระบุบัญชีของคุณเมื่ออ่านการ์ด NFC</span>
              </p>
              <p className="flex items-start">
                <span className="font-semibold text-indigo-600 mr-2">•</span>
                <span>คุณสามารถเปลี่ยน Card ID ได้ทุกเมื่อ</span>
              </p>
              <p className="flex items-start">
                <span className="font-semibold text-indigo-600 mr-2">•</span>
                <span>Card ID จะต้องไม่ซ้ำกับบัญชีผู้ใช้อื่น</span>
              </p>
              <p className="flex items-start">
                <span className="font-semibold text-indigo-600 mr-2">•</span>
                <span>ระบบจะใช้ Card ID เพื่อติดตามการเข้าถึงสต็อกและประวัติการบันทึก</span>
              </p>
            </div>
          </div>

          {/* Account Info Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ข้อมูลบัญชี</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  ชื่อ
                </label>
                <p className="text-gray-800">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  อีเมล
                </label>
                <p className="text-gray-800">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  ประเภท
                </label>
                <p className="text-gray-800 capitalize">
                  {user?.role === 'admin' ? '👑 แอดมิน' : '👤 ผู้ใช้ทั่วไป'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
