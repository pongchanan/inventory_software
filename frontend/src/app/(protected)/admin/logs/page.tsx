'use client';

import { useEffect, useState } from 'react';
import { fetchCabinetAccessLogs } from '@/lib/api_client/audit';
import { AuditLogDetail } from '@/lib/api_client/types';
import { FileText, Download, Search, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { LogsDesktopShell } from './_components/LogsDesktopShell';
import { LogsMobileShell } from './_components/LogsMobileShell';

export default function LogsAdminPage() {
  const [logs, setLogs] = useState<AuditLogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  // Sort state
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    loadLogs(currentPage);
  }, [currentPage]);

  const loadLogs = async (page: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchCabinetAccessLogs(page);
      setLogs(data.logs);
      setTotalLogs(data.total);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      'ID',
      'Time',
      'User',
      'User UID',
      'Type',
      'Item',
      'Status',
      'Message',
    ];
    const rows = filteredLogs.map((log) => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.user_name || 'Unknown',
      log.user,
      log.type,
      log.item || '',
      log.status,
      log.message,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `smart_inventory_logs_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs
    .filter((log) => {
      // Text search
      const matchesSearch =
        log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by type
      const matchesType = !filterType || log.type === filterType;

      // Filter by status
      const matchesStatus = !filterStatus || log.status === filterStatus;

      // Filter by user
      const matchesUser = !filterUser || log.user_name === filterUser;

      // Filter by date range
      const logDate = new Date(log.timestamp);
      const matchesDateFrom = !filterDateFrom || logDate >= new Date(filterDateFrom);
      const matchesDateTo = !filterDateTo || logDate <= new Date(filterDateTo + 'T23:59:59');

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesUser &&
        matchesDateFrom &&
        matchesDateTo
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'user':
          return (a.user_name || '').localeCompare(b.user_name || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

  // Get unique values for filter dropdowns
  const uniqueTypes = Array.from(new Set(logs.map((log) => log.type)));
  const uniqueStatuses = Array.from(new Set(logs.map((log) => log.status)));
  const uniqueUsers = Array.from(new Set(logs.map((log) => log.user_name).filter((u) => u != null))) as string[];

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery || filterType || filterStatus || filterUser || filterDateFrom || filterDateTo;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              <FileText className="w-8 h-8 text-[#ee4d2d]" />
              System Logs & Reports
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Log all system activities and important events
            </p>
          </div>

          <button
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl hover:bg-black transition-all shadow-md font-bold disabled:opacity-50"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>

        {/* FILTERS & SORT */}
        <div className="space-y-4">
          {/* Search Bar + Sort + Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search user, UID, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm w-full sm:w-auto"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="user">User (A-Z)</option>
              <option value="status">Status</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm w-full sm:w-auto whitespace-nowrap"
            >
              {showFilters ? '▼' : '▶'} More Filters
            </button>
          </div>

          {/* Advanced Filters Panel - Inside Container */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Activity Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-orange-50 transition-all h-11"
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-orange-50 transition-all h-11"
                >
                  <option value="">All Status</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                {/* User Filter */}
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-orange-50 transition-all h-11"
                >
                  <option value="">All Users</option>
                  {uniqueUsers.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>

                {/* Date From */}
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-orange-50 transition-all h-11"
                />

                {/* Date To */}
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-orange-50 transition-all h-11"
                />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('');
                    setFilterStatus('');
                    setFilterUser('');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                    setSortBy('latest');
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                >
                  <X className="inline mr-2" size={16} /> Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <LogsDesktopShell loading={loading} filteredLogs={filteredLogs} />
          <LogsMobileShell loading={loading} filteredLogs={filteredLogs} />
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-sm font-bold text-gray-700">
            Page {currentPage} of {totalPages || 1} • {totalLogs} total logs
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading || totalPages === 0}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
