import { Search, Bell, User, CheckCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-slate-950 border-b border-slate-800 px-6 py-4">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets by name, RFID ID, or category..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Profile Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User Profile */}
          <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium text-sm">Alex Johnson</p>
                <div className="flex items-center gap-1 bg-green-900/30 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-500 text-xs font-medium">Active</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs">Student ID: STU-2024-1234</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
