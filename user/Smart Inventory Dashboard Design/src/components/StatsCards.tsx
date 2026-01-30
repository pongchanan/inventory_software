import React from 'react';
import { Package, Clock, FileCheck } from 'lucide-react';

export function StatsCards() {
  const stats = [
    {
      id: 1,
      title: 'Items Currently Borrowed',
      value: '3',
      subtitle: 'Out of 5 max allowed',
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    },
    {
      id: 2,
      title: 'Upcoming Due Dates',
      value: '2',
      subtitle: '1 due in 6 hours',
      icon: Clock,
      color: 'amber',
      bgColor: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
    },
    {
      id: 3,
      title: 'Pending Approvals',
      value: '1',
      subtitle: 'High-value item request',
      icon: FileCheck,
      color: 'purple',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-6 hover:shadow-lg transition-all`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-slate-400 text-sm font-medium mb-2">{stat.title}</p>
                <p className={`text-4xl font-bold ${stat.iconColor} mb-1`}>{stat.value}</p>
                <p className="text-slate-500 text-sm">{stat.subtitle}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
