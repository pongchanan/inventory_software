import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Reservation {
  id: string;
  itemName: string;
  rfidId: string;
  requestedDate: Date;
  status: 'approved' | 'pending' | 'rejected';
  pickupDate?: Date;
}

export function ReservationSidebar() {
  const reservations: Reservation[] = [
    {
      id: '1',
      itemName: 'MacBook Pro 16"',
      rfidId: 'RFID-101-HV',
      requestedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'pending',
      pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      itemName: 'Sony Camera A7III',
      rfidId: 'RFID-102-HV',
      requestedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'approved',
      pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      itemName: 'DJI Drone Mavic',
      rfidId: 'RFID-105-HV',
      requestedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'approved',
      pickupDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status: Reservation['status']) => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'bg-green-900/30 text-green-500 border-green-500/30',
          label: 'Approved',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-amber-900/30 text-amber-500 border-amber-500/30',
          label: 'Pending',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'bg-red-900/30 text-red-500 border-red-500/30',
          label: 'Rejected',
        };
    }
  };

  const approvedCount = reservations.filter(r => r.status === 'approved').length;
  const pendingCount = reservations.filter(r => r.status === 'pending').length;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Reservations</h2>
        <Calendar className="w-5 h-5 text-slate-400" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <p className="text-green-500 text-2xl font-bold">{approvedCount}</p>
          <p className="text-green-500/80 text-xs">Approved</p>
        </div>
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
          <p className="text-amber-500 text-2xl font-bold">{pendingCount}</p>
          <p className="text-amber-500/80 text-xs">Pending</p>
        </div>
      </div>

      {/* Reservations List */}
      <div className="space-y-3">
        <h3 className="text-slate-400 text-sm font-medium mb-3">High-Value Item Requests</h3>
        {reservations.map((reservation) => {
          const statusConfig = getStatusConfig(reservation.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={reservation.id}
              className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-white font-medium text-sm">{reservation.itemName}</h4>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span className="text-xs font-medium">{statusConfig.label}</span>
                </div>
              </div>
              
              <p className="text-slate-400 text-xs font-mono mb-3">{reservation.rfidId}</p>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Requested:</span>
                  <span className="text-slate-400">{formatDate(reservation.requestedDate)}</span>
                </div>
                {reservation.pickupDate && (
                  <div className="flex justify-between text-slate-500">
                    <span>Pickup Date:</span>
                    <span className="text-slate-400">{formatDate(reservation.pickupDate)}</span>
                  </div>
                )}
              </div>

              {reservation.status === 'approved' && (
                <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded transition-colors">
                  View Details
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Action */}
      <button className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
        <Calendar className="w-4 h-4" />
        <span>New Reservation Request</span>
      </button>
    </div>
  );
}
