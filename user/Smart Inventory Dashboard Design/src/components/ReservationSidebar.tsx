import React from 'react';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

export function ReservationSidebar() {
  const reservations = [
    {
      id: 1,
      itemName: 'Canon EOS R5',
      rfidId: 'RFID-101',
      requestedDate: '2026-01-30',
      status: 'Pending',
      requestedFor: '2026-02-01',
      timeSlot: '09:00 - 17:00',
    },
    {
      id: 2,
      itemName: 'Epson Projector',
      rfidId: 'RFID-102',
      requestedDate: '2026-01-28',
      status: 'Approved',
      requestedFor: '2026-02-05',
      timeSlot: '10:00 - 14:00',
    },
    {
      id: 3,
      itemName: 'Sony A7 III Camera',
      rfidId: 'RFID-104',
      requestedDate: '2026-01-25',
      status: 'Rejected',
      requestedFor: '2026-01-27',
      timeSlot: '13:00 - 18:00',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-fit sticky top-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Reservations</h2>
          <p className="text-sm text-slate-400">High-value items</p>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
        <div className="text-center mb-3">
          <p className="text-sm text-slate-400 mb-1">Current Month</p>
          <p className="text-lg font-semibold text-slate-100">January 2026</p>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-xs text-slate-500 font-medium">
              {day}
            </div>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const hasReservation = [1, 5, 27].includes(day);
            const isToday = day === 30;
            return (
              <div
                key={day}
                className={`text-xs py-1.5 rounded ${
                  isToday
                    ? 'bg-blue-600 text-white font-semibold'
                    : hasReservation
                    ? 'bg-purple-500/20 text-purple-300 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reservations List */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Recent Requests</h3>
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:bg-slate-700/30 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-100 mb-1">
                  {reservation.itemName}
                </h4>
                <p className="text-xs text-slate-500 font-mono">{reservation.rfidId}</p>
              </div>
              <div className={`flex items-center gap-1`}>
                {getStatusIcon(reservation.status)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>For: {formatDate(reservation.requestedFor)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{reservation.timeSlot}</span>
              </div>
            </div>

            <div className="mt-3">
              <span
                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusStyles(
                  reservation.status
                )}`}
              >
                {reservation.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-green-400">1</p>
            <p className="text-xs text-slate-500 mt-1">Approved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">1</p>
            <p className="text-xs text-slate-500 mt-1">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">1</p>
            <p className="text-xs text-slate-500 mt-1">Rejected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
