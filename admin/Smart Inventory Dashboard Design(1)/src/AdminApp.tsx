import { useState } from 'react';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { AdminHeader } from './components/admin/AdminHeader';
import { ApprovalQueue } from './components/admin/ApprovalQueue';
import { InventoryMonitor } from './components/admin/InventoryMonitor';
import { UserManagement } from './components/admin/UserManagement';
import { AuditLogs } from './components/admin/AuditLogs';
import { SystemHealth } from './components/admin/SystemHealth';

export default function AdminApp() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Admin Sidebar */}
      <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader />
        
        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1440px] mx-auto space-y-6">
            {/* System Health Status Bar */}
            <SystemHealth />
            
            {/* Priority Section - Approval Queue */}
            <ApprovalQueue />
            
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Real-time Inventory Monitor - Takes 2 columns */}
              <div className="xl:col-span-2">
                <InventoryMonitor />
              </div>
              
              {/* Audit Logs - Takes 1 column */}
              <div className="xl:col-span-1">
                <AuditLogs />
              </div>
            </div>
            
            {/* User Management Section */}
            <UserManagement />
          </div>
        </main>
      </div>
    </div>
  );
}
