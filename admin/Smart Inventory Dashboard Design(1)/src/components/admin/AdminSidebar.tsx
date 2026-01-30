import { LayoutDashboard, Package, Users, FileText, Settings, Shield, Activity } from 'lucide-react';

interface AdminSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export function AdminSidebar({ activeView, setActiveView }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approvals', icon: Shield, badge: 3 },
    { id: 'inventory', label: 'Inventory Monitor', icon: Package },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'activity', label: 'System Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-slate-900 text-lg font-bold">Admin Panel</h1>
            <p className="text-slate-500 text-xs">Control Center</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-white text-red-600' : 'bg-red-100 text-red-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Admin Info */}
      <div className="p-4 border-t border-slate-200">
        <div className="bg-slate-100 rounded-lg p-3">
          <p className="text-slate-600 text-xs font-medium">Logged in as</p>
          <p className="text-slate-900 font-semibold text-sm">Admin User</p>
          <p className="text-slate-500 text-xs">admin@university.edu</p>
        </div>
      </div>
    </aside>
  );
}
