import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface Loan {
  id: string;
  itemName: string;
  rfidId: string;
  borrowedAt: Date;
  dueAt: Date;
}

export function ActiveLoansTable() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loans: Loan[] = [
    {
      id: '1',
      itemName: 'Portable Charger',
      rfidId: 'RFID-003-LV',
      borrowedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      dueAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
    },
    {
      id: '2',
      itemName: 'HDMI Cable',
      rfidId: 'RFID-015-LV',
      borrowedAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
      dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    },
    {
      id: '3',
      itemName: 'USB-C Hub',
      rfidId: 'RFID-002-LV',
      borrowedAt: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
      dueAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now - urgent!
    },
  ];

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (dueAt: Date) => {
    const diff = dueAt.getTime() - currentTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const isUrgent = hours < 2;
    const isOverdue = diff < 0;

    return {
      text: isOverdue 
        ? 'OVERDUE' 
        : `${hours}h ${minutes}m ${seconds}s`,
      isUrgent,
      isOverdue,
    };
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">My Active Loans</h2>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Clock className="w-4 h-4" />
          <span>Live Countdown</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-slate-400 text-sm font-medium pb-3 px-4">Item Name</th>
              <th className="text-left text-slate-400 text-sm font-medium pb-3 px-4">RFID ID</th>
              <th className="text-left text-slate-400 text-sm font-medium pb-3 px-4">Time Borrowed</th>
              <th className="text-left text-slate-400 text-sm font-medium pb-3 px-4">Due Date</th>
              <th className="text-left text-slate-400 text-sm font-medium pb-3 px-4">Time Remaining</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => {
              const timeRemaining = getTimeRemaining(loan.dueAt);
              
              return (
                <tr key={loan.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-white font-medium">{loan.itemName}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-400 font-mono text-sm">{loan.rfidId}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-400 text-sm">{formatTimestamp(loan.borrowedAt)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-400 text-sm">{formatTimestamp(loan.dueAt)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold ${
                      timeRemaining.isOverdue
                        ? 'bg-red-900/30 text-red-500 border border-red-500/30'
                        : timeRemaining.isUrgent
                        ? 'bg-amber-900/30 text-amber-500 border border-amber-500/30 animate-pulse'
                        : 'bg-green-900/30 text-green-500 border border-green-500/30'
                    }`}>
                      {timeRemaining.isUrgent && !timeRemaining.isOverdue && (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span>{timeRemaining.text}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No active loans at the moment</p>
        </div>
      )}
    </div>
  );
}
