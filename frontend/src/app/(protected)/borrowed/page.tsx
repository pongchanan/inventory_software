"use client";

import { useState } from 'react';
import { useInventory } from '../../../services/hooks/useInventory';
import { useDamageReport } from '../../../services/hooks/useDamageReport';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Package, MapPin, History, AlertTriangle, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import { ReportModal } from '../../../components/features/ReportModal';
import { BorrowedItem } from '../../../domain/models/Item';

export default function BorrowedPage() {
    const { borrowedItems } = useInventory();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');
    const [showFilters, setShowFilters] = useState(false);

    const {
        isReportModalOpen,
        selectedItem,
        reportImage,
        reportDetail,
        setReportDetail,
        openReportModal,
        closeReportModal,
        handleImageChange,
        handleRemoveImage,
        submitReport
    } = useDamageReport();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Filter and sort borrowed items
    const filteredItems = borrowedItems
        .filter((item: BorrowedItem) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.loc?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a: BorrowedItem, b: BorrowedItem) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'location':
                    return (a.loc || '').localeCompare(b.loc || '');
                case 'date-desc':
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'date-asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                default:
                    return 0;
            }
        });

    if (authLoading || !user) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <h2 className="text-3xl font-black mb-6">My Borrowed Items</h2>

            {/* Search and Filter Bar */}
            <div className="space-y-3 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search borrowed items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm"
                        />
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm w-full sm:w-auto"
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="location">Location (A-Z)</option>
                    </select>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        <Filter size={18} /> {showFilters ? 'Hide' : 'Show'}
                    </button>
                </div>

                {/* Filter Badge - Shows active search */}
                {searchQuery && (
                    <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full flex items-center gap-2">
                            Search: "{searchQuery}"
                            <button
                                onClick={() => setSearchQuery('')}
                                className="ml-1 text-blue-500 hover:text-blue-800"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {filteredItems.map((item: BorrowedItem) => (
                    <div key={item.id} className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 border border-gray-50 hover:border-orange-100 transition-colors">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border relative">
                            <Image
                                src={item.img}
                                alt={item.name}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 640px) 4rem, 6rem"
                            />
                        </div>
                        <div className="flex-grow">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">Status: Borrowed</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5"><MapPin size={14} className="text-[#ee4d2d]" /> {item.loc}</div>
                                <div className="flex items-center gap-1.5"><History size={14} className="text-[#ee4d2d]" /> Borrowed on {item.date}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => openReportModal(item)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-orange-50 text-[#ee4d2d] text-sm font-bold rounded-2xl hover:bg-[#ee4d2d] hover:text-white transition-all shadow-sm shrink-0"
                        >
                            <AlertTriangle size={18} /> Report Damage
                        </button>
                    </div>
                ))}

                {filteredItems.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <Package size={48} className="mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-400 font-bold">
                            {searchQuery ? 'No borrowed items match your search' : "You haven't borrowed any equipment yet"}
                        </p>
                    </div>
                )}
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                selectedItem={selectedItem}
                reportImage={reportImage}
                reportDetail={reportDetail}
                onClose={closeReportModal}
                onImageChange={handleImageChange}
                onRemoveImage={handleRemoveImage}
                setReportDetail={setReportDetail}
                onSubmit={submitReport}
            />
        </div>
    );
}
