import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export function ActiveLoansTable() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const loans = [
    {
      id: 1,
      itemName: 'iPad Pro 11"',
      rfidId: 'RFID-002',
      borrowedAt: new Date('2026-01-30T08:00:00'),
      dueAt: new Date('2026-01-30T20:00:00'),
    },
    {
      id: 2,
      itemName: 'Zeiss Microscope',
      rfidId: 'RFID-103',
      borrowedAt: new Date('2026-01-29T14:00:00'),
      dueAt: new Date('2026-01-31T14:00:00'),
    },
    {
      id: 3,
      itemName: 'Dell Latitude Laptop',
      rfidId: 'RFID-001',
      borrowedAt: new Date('2026-01-28T10:00:00'),
      dueAt: new Date('2026-02-04T10:00:00'),
    },
  ];

  const getTimeRemaining = (dueDate: Date) => {
    const now = currentTime.getTime();
    const due = dueDate.getTime();
    const diff = due - now;

    if (diff <= 0) {
      return { text: 'Overdue', isUrgent: true, isOverdue: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return {
        text: `${days}d ${remainingHours}h`,
        isUrgent: days < 1,
        isOverdue: false,
      };
    } else if (hours > 0) {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return {
        text: `${hours}h ${minutes}m`,
        isUrgent: hours < 12,
        isOverdue: false,
      };
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return {
        text: `${minutes}m`,
        isUrgent: true,
        isOverdue: false,
      };
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100">My Active Loans</h2>
            <p className="text-sm text-slate-400">{loans.length} items currently borrowed</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Item Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">RFID ID</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                Time Borrowed
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Due Date</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">
                Time Remaining
              </th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => {
              const timeRemaining = getTimeRemaining(loan.dueAt);
              return (
                <tr
                  key={loan.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span className="text-slate-200 font-medium">{loan.itemName}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-400 font-mono text-sm">{loan.rfidId}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-400 text-sm">{formatDateTime(loan.borrowedAt)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-400 text-sm">{formatDateTime(loan.dueAt)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {timeRemaining.isUrgent && (
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            timeRemaining.isOverdue ? 'text-red-400' : 'text-amber-400'
                          }`}
                        />
                      )}
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                          timeRemaining.isOverdue
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : timeRemaining.isUrgent
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                        }`}
                      >
                        {timeRemaining.text}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {loans.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No active loans</p>
        </div>
      )}
    </div>
  );
}
