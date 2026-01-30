import { useState } from 'react';
import { Users, Shield, Ban, Eye, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  studentId: string;
  email: string;
  status: 'active' | 'blacklisted' | 'disabled';
  itemsBorrowed: number;
  overdueItems: number;
  violations: number;
  lastActivity: Date;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      studentId: 'STU-2024-1234',
      email: 'alex.j@university.edu',
      status: 'active',
      itemsBorrowed: 3,
      overdueItems: 0,
      violations: 0,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Sarah Martinez',
      studentId: 'STU-2024-5678',
      email: 'sarah.m@university.edu',
      status: 'active',
      itemsBorrowed: 2,
      overdueItems: 0,
      violations: 1,
      lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: '3',
      name: 'Michael Chen',
      studentId: 'STU-2024-9012',
      email: 'michael.c@university.edu',
      status: 'active',
      itemsBorrowed: 1,
      overdueItems: 1,
      violations: 2,
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: '4',
      name: 'Emma Davis',
      studentId: 'STU-2024-3456',
      email: 'emma.d@university.edu',
      status: 'blacklisted',
      itemsBorrowed: 0,
      overdueItems: 0,
      violations: 5,
      lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ]);

  const handleToggleStatus = (userId: string, newStatus: 'active' | 'disabled' | 'blacklisted') => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border-2 border-green-200">
            <Shield className="w-3 h-3" />
            ACTIVE
          </span>
        );
      case 'disabled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border-2 border-slate-200">
            <Ban className="w-3 h-3" />
            DISABLED
          </span>
        );
      case 'blacklisted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border-2 border-red-200">
            <AlertTriangle className="w-3 h-3" />
            BLACKLISTED
          </span>
        );
    }
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-slate-900 text-xl font-bold">User Management & Security</h3>
            <p className="text-slate-500 text-sm">Manage user accounts and access control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-slate-900 font-bold text-2xl">{users.length}</p>
            <p className="text-slate-500 text-xs">Total Users</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-50">
              <th className="text-left text-slate-700 text-sm font-bold py-3 px-4">User</th>
              <th className="text-left text-slate-700 text-sm font-bold py-3 px-4">Status</th>
              <th className="text-center text-slate-700 text-sm font-bold py-3 px-4">Items Borrowed</th>
              <th className="text-center text-slate-700 text-sm font-bold py-3 px-4">Overdue</th>
              <th className="text-center text-slate-700 text-sm font-bold py-3 px-4">Violations</th>
              <th className="text-left text-slate-700 text-sm font-bold py-3 px-4">Last Activity</th>
              <th className="text-right text-slate-700 text-sm font-bold py-3 px-4">Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4">
                  <div>
                    <p className="text-slate-900 font-semibold">{user.name}</p>
                    <p className="text-slate-500 text-xs font-mono">{user.studentId}</p>
                    <p className="text-slate-400 text-xs">{user.email}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {getStatusBadge(user.status)}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                    {user.itemsBorrowed}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  {user.overdueItems > 0 ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-700 rounded-full font-bold text-sm border-2 border-red-200">
                      {user.overdueItems}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                      0
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  {user.violations > 0 ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 rounded-full font-bold text-sm border-2 border-orange-200">
                      {user.violations}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-500 rounded-full font-bold text-sm">
                      0
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span className="text-slate-600 text-sm">{formatTimeAgo(user.lastActivity)}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    {user.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(user.id, 'disabled')}
                          className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-xs font-bold"
                        >
                          Disable
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, 'blacklisted')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-bold"
                        >
                          Blacklist
                        </button>
                      </>
                    )}
                    {(user.status === 'disabled' || user.status === 'blacklisted') && (
                      <button
                        onClick={() => handleToggleStatus(user.id, 'active')}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs font-bold"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
