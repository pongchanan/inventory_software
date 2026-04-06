"use client";

import { useAuth } from '@/context/AuthContext';
import { useAdminMode } from '@/context/AdminModeContext';
import { User, Mail, LogOut, Clock, ShieldCheck, Settings, CreditCard, Loader2, ToggleRight, ToggleLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { linkCardForUser, unlinkCardForUser, fetchMe } from '@/lib/api';

export default function ProfilePage() {
    const { user, isAdmin, logout, updateUser, token, loading: authLoading } = useAuth();
    const { isAdminMode, toggleAdminMode } = useAdminMode();
    const router = useRouter();
    const [isLinking, setIsLinking] = useState(false);
    const [isUnlinking, setIsUnlinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<'error' | 'info' | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Fetch latest user data when page loads
    useEffect(() => {
        const loadLatestUserData = async () => {
            if (!token) return;
            try {
                const latestUser = await fetchMe(token);
                updateUser(latestUser);
            } catch (err) {
                console.error('Failed to fetch latest user data:', err);
            }
        };

        if (user && !authLoading) {
            loadLatestUserData();
        }
    }, []); // Run once on mount

    // Derive cardLinked directly from user object
    const cardLinked = !!user?.nfc_card_uid;

    const handleLinkCard = async () => {
        setIsLinking(true);
        setError(null);
        try {
            const updatedUser = await linkCardForUser();
            updateUser(updatedUser);
            setErrorType(null);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to link card";
            
            // If card is already linked, show info message
            if (errorMsg.includes("You already have a card linked")) {
                setError(errorMsg);
                setErrorType('info');
            } else {
                setError(errorMsg);
                setErrorType('error');
            }
        } finally {
            setIsLinking(false);
        }
    };

    const handleUnlinkCard = async () => {
        setIsUnlinking(true);
        setError(null);
        try {
            const updatedUser = await unlinkCardForUser();
            updateUser(updatedUser);
            setErrorType(null);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to unlink card";
            setError(errorMsg);
            setErrorType('error');
        } finally {
            setIsUnlinking(false);
        }
    };

    // Clear error when user data changes
    useEffect(() => {
        setError(null);
        setErrorType(null);
    }, [user?.nfc_card_uid]);

    if (authLoading || !user) {
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <h2 className="text-3xl font-black mb-8">Profile</h2>

            {/* Error/Info Alert */}
            {error && (
                <div className={`mb-6 p-4 rounded-2xl border-2 flex items-center justify-between ${
                    errorType === 'info'
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    <p className="font-medium text-sm">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-lg font-bold hover:opacity-70"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-[#ee4d2d] to-[#ff7355]"></div>

                <div className="px-8 pb-8 flex flex-col items-center sm:items-start sm:flex-row gap-6 -mt-16">
                    <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg shrink-0">
                        <div className="w-full h-full bg-orange-100 rounded-full flex items-center justify-center text-[#ee4d2d] text-4xl font-black">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </div>

                    <div className="pt-4 sm:pt-16 text-center sm:text-left flex-grow">
                        <h3 className="text-2xl font-black text-gray-900">{user?.name || 'Guest User'}</h3>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                            <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                                <Mail size={16} />
                                {user?.email || 'N/A'}
                            </span>
                            {isAdmin && (
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <ShieldCheck size={14} /> Admin
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-8 flex flex-col gap-2 pb-8">
                    {/* NFC Card Section */}
                    <div className={`w-full p-4 rounded-2xl transition-colors ${cardLinked ? 'bg-green-50 border-2 border-green-100' : 'bg-yellow-50 border-2 border-yellow-100'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center ${cardLinked ? 'bg-white text-green-500' : 'bg-white text-yellow-500'}`}>
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <p className={`font-bold uppercase tracking-widest text-xs ${cardLinked ? 'text-green-700' : 'text-yellow-700'}`}>
                                        {cardLinked ? '✓ The RFID card has been linked.' : '⚠ The RFID card is not linked.'}
                                    </p>
                                    {cardLinked && user?.nfc_card_uid && (
                                        <p className="text-xs text-gray-500 mt-1 font-mono">{user.nfc_card_uid}</p>
                                    )}
                                </div>
                            </div>
                            {!cardLinked ? (
                                <button
                                    onClick={handleLinkCard}
                                    disabled={isLinking}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
                                >
                                    {isLinking ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                    {isLinking ? 'Linking...' : 'Link Card Now'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleUnlinkCard}
                                    disabled={isUnlinking}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
                                >
                                    {isUnlinking ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                    {isUnlinking ? 'Unlinking...' : 'Unlink Card'}
                                </button>
                            )}
                        </div>
                    </div>

                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors group">
                        <div className="flex items-center gap-3 text-gray-700 font-medium">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Clock size={20} />
                            </div>
                            All Borrowing History
                        </div>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors group">
                        <div className="flex items-center gap-3 text-gray-700 font-medium">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-500 group-hover:scale-110 transition-transform">
                                <Settings size={20} />
                            </div>
                            Notification Settings
                        </div>
                    </button>

                    {isAdmin && (
                        <button
                            onClick={toggleAdminMode}
                            className="md:hidden w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors group"
                        >
                            <div className="flex items-center gap-3 text-purple-700 font-medium">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    {isAdminMode ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </div>
                                <div className="text-left">
                                    <div>Admin Mode</div>
                                    <div className="text-xs text-purple-500">{isAdminMode ? 'Admin Navbar' : 'User Navbar'}</div>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${isAdminMode ? 'bg-purple-200 text-purple-700' : 'bg-purple-100 text-purple-600'}`}>
                                {isAdminMode ? 'ON' : 'OFF'}
                            </div>
                        </button>
                    )}

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors group mt-4"
                    >
                        <div className="flex items-center gap-3 text-red-600 font-medium">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                <LogOut size={20} />
                            </div>
                            Sign Out
                        </div>
                    </button>

                    {isAdmin && (
                        <Link href="/admin" className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors group mt-2">
                            <div className="flex items-center gap-3 text-purple-700 font-medium">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={20} />
                                </div>
                                Admin Dashboard
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
