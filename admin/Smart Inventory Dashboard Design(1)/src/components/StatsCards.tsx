import { Package, Clock, FileCheck } from 'lucide-react';

export function StatsCards() {
  const stats = [
    {
      title: 'Items Currently Borrowed',
      value: '3',
      subtitle: 'Out of 5 max allowed',
      icon: Package,
      color: 'blue',
    },
    {
      title: 'Upcoming Due Dates',
      value: '2',
      subtitle: 'Items due within 24 hours',
      icon: Clock,
      color: 'amber',
    },
    {
      title: 'Pending Approvals',
      value: '1',
      subtitle: 'High-value item request',
      icon: FileCheck,
      color: 'purple',
    },
  ];

  const colorStyles = {
    blue: 'bg-blue-600/10 text-blue-500',
    amber: 'bg-amber-600/10 text-amber-500',
    purple: 'bg-purple-600/10 text-purple-500',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-slate-400 text-sm font-medium mb-2">{stat.title}</p>
                <h3 className="text-white text-4xl font-bold mb-1">{stat.value}</h3>
                <p className="text-slate-500 text-xs">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-lg ${colorStyles[stat.color as keyof typeof colorStyles]}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
