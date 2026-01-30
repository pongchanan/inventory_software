import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { AssetInventoryGrid } from './components/AssetInventoryGrid';
import { ActiveLoansTable } from './components/ActiveLoansTable';
import { ReservationSidebar } from './components/ReservationSidebar';
import AdminApp from './AdminApp';

export default function App() {
  const [activeView, setActiveView] = useState('overview');
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('admin'); // Start with admin view

  // Toggle between user and admin views
  if (viewMode === 'admin') {
    return <AdminApp />;
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1440px] mx-auto space-y-6">
            {/* Top Stats Cards */}
            <StatsCards />
            
            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Asset Inventory Grid - Takes 2 columns */}
              <div className="xl:col-span-2">
                <AssetInventoryGrid />
              </div>
              
              {/* Reservation Sidebar - Takes 1 column */}
              <div className="xl:col-span-1">
                <ReservationSidebar />
              </div>
            </div>
            
            {/* Active Loans Table */}
            <ActiveLoansTable />
          </div>
        </main>
      </div>
    </div>
  );
}