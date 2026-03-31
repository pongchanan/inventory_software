"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { linkNFCCard } from '@/lib/api';
import { Smartphone, ArrowLeft, Check } from 'lucide-react';

export default function LinkNFCCardPage() {
    const { user, isLoading: authLoading, token, refetchUser } = useAuth();
    const router = useRouter();
    const [nfcCardUID, setNfcCardUID] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const handleLinkNFC = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const updatedUser = await linkNFCCard(nfcCardUID, token);
            setSuccess(true);
            setNfcCardUID('');
            // Refresh user data
            refetchUser();
            // Redirect to cards page after success
            setTimeout(() => {
                router.push('/profile/cards');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to link NFC card');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
            >
                <ArrowLeft size={20} />
                กลับไป
            </button>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>

                <div className="px-8 pb-8 -mt-16 pt-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-500">
                            <Smartphone size={40} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">เชื่อมต่อการ์ด NFC</h2>
                            <p className="text-gray-600 text-sm mt-1">ล็อค NFC Card ของคุณกับบัญชีของคุณ</p>
                        </div>
                    </div>

                    <form onSubmit={handleLinkNFC} className="space-y-6">
                        <div>
                            <label htmlFor="nfc-uid" className="block text-sm font-bold text-gray-700 mb-2">
                                NFC Card UID
                            </label>
                            <input
                                id="nfc-uid"
                                type="text"
                                value={nfcCardUID}
                                onChange={(e) => setNfcCardUID(e.target.value)}
                                placeholder="รหัสการ์ด NFC (เช่น 123ABC456DEF)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                required
                                disabled={loading}
                            />
                            <p className="text-gray-500 text-xs mt-2">
                                ป้อนหรือสแกน NFC Card UID ของคุณที่นี่
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                <Check size={20} className="text-green-600" />
                                <div>
                                    <p className="text-green-600 text-sm font-medium">เชื่อมต่อสำเร็จ!</p>
                                    <p className="text-green-600 text-xs">การ์ด NFC ของคุณเชื่อมต่อกับบัญชีของคุณแล้ว</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading || !nfcCardUID || success}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors"
                            >
                                {loading ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อการ์ด NFC'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </form>

                    {user?.nfc_card_uid && (
                        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700 text-sm font-bold mb-3">✓ ดำเนินการเชื่อมต่อสำเร็จ</p>
                            <div className="bg-white rounded-lg p-3 border border-green-300">
                                <p className="text-xs text-gray-600 mb-1">NFC Card UID ที่ลงทะเบียน:</p>
                                <p className="text-lg font-mono font-bold text-green-600 break-all">{user.nfc_card_uid}</p>
                            </div>
                            <p className="text-green-600 text-xs mt-3">
                                จำนวนการ์ดที่เชื่อมต่อกับบัญชีของคุณ: <span className="font-bold text-lg">1 ใบ</span>
                            </p>
                        </div>
                    )}

                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-700 text-sm font-medium mb-2">💡 วิธีการใช้:</p>
                        <ul className="text-blue-600 text-xs space-y-1 ml-4 list-disc">
                            <li>สแกน NFC Card ของคุณหากอุปกรณ์รองรับ หรือป้อน UID แบบแมนนวล</li>
                            <li>ระบบจะตรวจสอบเพื่อให้แน่ใจว่าการ์ดยังไม่ได้ลงทะเบียน</li>
                            <li>หลังจากเชื่อมต่อเสร็จ คุณจะสามารถใช้การ์ดนี้ในอุปกรณ์ทั้งหมดของระบบได้</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
