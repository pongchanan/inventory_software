import { useEffect, useState } from 'react';
import { Activity, CheckCircle, XCircle, Unlock, Lock, Radio } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: Date;
  type: 'scan' | 'unlock' | 'lock' | 'sync' | 'approval' | 'violation';
  user: string;
  item?: string;
  status: 'success' | 'failed';
  message: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 30 * 1000),
      type: 'unlock',
      user: 'Alex Johnson',
      item: 'USB-C Hub',
      status: 'success',
      message: 'RFID unlock successful',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      type: 'scan',
      user: 'Sarah Martinez',
      item: 'MacBook Pro',
      status: 'success',
      message: 'RFID scan detected',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      type: 'sync',
      user: 'System',
      status: 'success',
      message: 'Database sync completed',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      type: 'approval',
      user: 'Admin',
      item: 'Sony Camera',
      status: 'success',
      message: 'High-value request approved',
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      type: 'unlock',
      user: 'Mike Chen',
      item: 'iPad Pro',
      status: 'failed',
      message: 'Access denied - overdue items',
    },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: AuditLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: ['scan', 'unlock', 'sync'][Math.floor(Math.random() * 3)] as any,
        user: ['Alex Johnson', 'Sarah Martinez', 'System'][Math.floor(Math.random() * 3)],
        status: Math.random() > 0.1 ? 'success' : 'failed',
        message: 'Real-time activity detected',
      };
      setLogs(prev => [newLog, ...prev].slice(0, 10));
    }, 15000); // Add new log every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const getLogIcon = (type: AuditLog['type']) => {
    switch (type) {
      case 'scan':
        return Radio;
      case 'unlock':
        return Unlock;
      case 'lock':
        return Lock;
      case 'sync':
        return Activity;
      case 'approval':
        return CheckCircle;
      case 'violation':
        return XCircle;
    }
  };

  const getLogColor = (status: AuditLog['status']) => {
    return status === 'success' ? 'text-green-600' : 'text-red-600';
  };

  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm h-fit">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-slate-900 text-lg font-bold">Audit Logs</h3>
            <p className="text-slate-500 text-xs">Real-time activity feed</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          <span className="text-green-700 text-xs font-bold">LIVE</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {logs.map((log, index) => {
          const Icon = getLogIcon(log.type);
          return (
            <div
              key={log.id}
              className={`border-l-4 ${
                log.status === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
              } p-3 rounded-r-lg hover:shadow-md transition-shadow ${
                index === 0 ? 'animate-pulse' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getLogColor(log.status)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-slate-900 font-semibold text-sm">{log.user}</p>
                    <span className="text-slate-500 text-xs font-mono whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mb-1">{log.message}</p>
                  {log.item && (
                    <p className="text-slate-500 text-xs font-mono">Item: {log.item}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                      log.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {log.status === 'success' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {log.status.toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase">
                      {log.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <button className="w-full text-center text-slate-600 hover:text-slate-900 text-sm font-medium py-2 hover:bg-slate-50 rounded-lg transition-colors">
          View Full Audit History
        </button>
      </div>
    </div>
  );
}
