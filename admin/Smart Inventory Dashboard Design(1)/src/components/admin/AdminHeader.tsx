import { Search, Bell, Settings, LogOut } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h2 className="text-slate-900 text-2xl font-bold">System Dashboard</h2>
          <p className="text-slate-500 text-sm">Real-time monitoring and control</p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users, assets, logs..."
              className="w-80 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
          
          {/* Notifications */}
          <button className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
          </button>
          
          {/* Settings */}
          <button className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          {/* Logout */}
          <button className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
