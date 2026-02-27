"use client";

import { useState } from 'react';
import { useInventory } from '../../services/hooks/useInventory';
import { useDamageReport } from '../../services/hooks/useDamageReport';

// Layout Components
import { BottomNav, TabType } from '../layout/BottomNav';

// View Components
import { HomeView } from './HomeView';
import { BorrowedView } from './BorrowedView';
import { ProfileView } from './ProfileView';
import { ReportModal } from '../features/ReportModal';

export function MobileApp() {
    const [activeTab, setActiveTab] = useState<TabType>('home');

    const {
        items,
        borrowedItems,
        currentUser,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        sortedItems,
        isLoading
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
        <div className="max-w-md mx-auto bg-[#f5f5f5] min-h-screen relative flex flex-col shadow-2xl overflow-hidden font-sans">
            <main className="flex-grow">
                {activeTab === 'home' && (
                    <HomeView
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        items={sortedItems}
                    />
                )}

                {activeTab === 'borrowed' && (
                    <BorrowedView
                        borrowedItems={borrowedItems}
                        onReportClick={openReportModal}
                    />
                )}

                {activeTab === 'profile' && (
                    <ProfileView user={currentUser} />
                )}
            </main>

            <BottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                borrowedCount={borrowedItems.length}
            />

            <ReportModal
                isOpen={isReportModalOpen}
                selectedItem={selectedItem}
                reportImage={reportImage}
                onClose={closeReportModal}
                onImageChange={handleImageChange}
                onRemoveImage={handleRemoveImage}
                onSubmit={submitReport}
            />
        </div>
    );
}
