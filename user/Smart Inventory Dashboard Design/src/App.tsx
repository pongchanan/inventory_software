import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { AssetInventoryGrid } from './components/AssetInventoryGrid';
import { ActiveLoansTable } from './components/ActiveLoansTable';
import { ReservationSidebar } from './components/ReservationSidebar';

export default function App() {
  const [activeView, setActiveView] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1440px] mx-auto space-y-6">
            {/* Stats Cards */}
            <StatsCards />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Inventory and Active Loans - Left Side (2 columns) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Asset Inventory Grid */}
                <AssetInventoryGrid searchQuery={searchQuery} />

                {/* Active Loans Table */}
                <ActiveLoansTable />
              </div>

              {/* Reservation Sidebar - Right Side (1 column) */}
              <div className="lg:col-span-1">
                <ReservationSidebar />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
