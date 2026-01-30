import { Wifi, Zap, Radio, CheckCircle, AlertTriangle } from 'lucide-react';

export function SystemHealth() {
  const healthIndicators = [
    {
      label: 'Network Status',
      status: 'online',
      value: 'Live & Syncing',
      icon: Wifi,
      color: 'green',
    },
    {
      label: 'Power Supply',
      status: 'online',
      value: 'Stable',
      icon: Zap,
      color: 'green',
    },
    {
      label: 'RFID Scanner',
      status: 'online',
      value: '8/8 Active',
      icon: Radio,
      color: 'green',
    },
    {
      label: 'Last Sync',
      status: 'online',
      value: '2 seconds ago',
      icon: CheckCircle,
      color: 'green',
    },
  ];

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-900 text-lg font-bold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          System Health Status
        </h3>
        <span className="text-slate-500 text-sm">All systems operational</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {healthIndicators.map((indicator, index) => {
          const Icon = indicator.icon;
          return (
            <div
              key={index}
              className={`border-2 rounded-lg p-4 ${getStatusColor(indicator.color)}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${getIconColor(indicator.color)}`} />
                <div className="flex-1">
                  <p className="text-xs font-medium opacity-75">{indicator.label}</p>
                  <p className="font-bold text-sm">{indicator.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
