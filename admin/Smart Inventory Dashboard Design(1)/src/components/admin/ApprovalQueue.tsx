import { useState } from 'react';
import { Shield, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

interface ApprovalRequest {
  id: string;
  requesterName: string;
  studentId: string;
  itemName: string;
  rfidId: string;
  requestedDate: Date;
  borrowingDuration: string;
  reason: string;
  priority: 'high' | 'normal';
}

export function ApprovalQueue() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([
    {
      id: '1',
      requesterName: 'Alex Johnson',
      studentId: 'STU-2024-1234',
      itemName: 'MacBook Pro 16"',
      rfidId: 'RFID-101-HV',
      requestedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      borrowingDuration: '3 days',
      reason: 'Final project development - Computer Science',
      priority: 'high',
    },
    {
      id: '2',
      requesterName: 'Sarah Martinez',
      studentId: 'STU-2024-5678',
      itemName: 'Sony Camera A7III',
      rfidId: 'RFID-102-HV',
      requestedDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
      borrowingDuration: '7 days',
      reason: 'Documentary filming for Media Studies thesis',
      priority: 'normal',
    },
    {
      id: '3',
      requesterName: 'Michael Chen',
      studentId: 'STU-2024-9012',
      itemName: 'DJI Drone Mavic Pro',
      rfidId: 'RFID-105-HV',
      requestedDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
      borrowingDuration: '2 days',
      reason: 'Aerial photography for Architecture project',
      priority: 'high',
    },
  ]);

  const handleApprove = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
    // In real app, would make API call to approve
  };

  const handleReject = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
    // In real app, would make API call to reject
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="bg-white border-2 border-orange-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-slate-900 text-xl font-bold">High-Value Item Approval Queue</h3>
            <p className="text-slate-500 text-sm">Pending requests requiring admin authorization</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-lg">
          <Clock className="w-4 h-4 text-orange-600" />
          <span className="text-orange-600 font-bold text-lg">{requests.length}</span>
          <span className="text-orange-600 text-sm font-medium">Pending</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-50">
              <th className="text-left text-slate-700 text-sm font-bold py-3 px-4">Priority</th>
              <th className="text-left text-slate-700 text-sm font-bold py-3 px-4">Requester</th>
              <th className="text-left text-slate-700 text-sm font-bold py-3 px-4">Item Requested</th>
              <th className="text-left text-slate-700 text-sm font-bold py-3 px-4">Duration</th>
              <th className="text-left text-slate-700 text-sm font-bold py-3 px-4">Requested</th>
              <th className="text-left text-slate-700 text-sm font-bold py-3 px-4">Reason</th>
              <th className="text-right text-slate-700 text-sm font-bold py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4">
                  {request.priority === 'high' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border-2 border-red-200">
                      <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                      HIGH
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border-2 border-slate-200">
                      NORMAL
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div>
                    <p className="text-slate-900 font-semibold text-sm">{request.requesterName}</p>
                    <p className="text-slate-500 text-xs font-mono">{request.studentId}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <p className="text-slate-900 font-semibold text-sm">{request.itemName}</p>
                    <p className="text-slate-500 text-xs font-mono">{request.rfidId}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-200">
                    <Clock className="w-3 h-3" />
                    {request.borrowingDuration}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-slate-600 text-sm">{formatTimeAgo(request.requestedDate)}</span>
                </td>
                <td className="py-4 px-4 max-w-xs">
                  <p className="text-slate-600 text-sm truncate">{request.reason}</p>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-bold text-sm shadow-lg shadow-green-600/20"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold text-sm shadow-lg shadow-red-600/20"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requests.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No pending approvals</p>
          <p className="text-slate-500 text-sm">All high-value requests have been processed</p>
        </div>
      )}
    </div>
  );
}
