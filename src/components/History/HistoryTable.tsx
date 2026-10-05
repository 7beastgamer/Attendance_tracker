import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import type { AttendanceStatus } from '../../types/attendance';
import { formatDateDisplay } from '../../utils/dateUtils';
import { Search, Filter, Trash2, Edit2 } from 'lucide-react';
import { DayModal } from '../Calendar/DayModal';
import clsx from 'clsx';

const STATUS_BADGES = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  absent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  halfday: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  leave: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export const HistoryTable = () => {
  const { records, deleteAttendance } = useAttendance();
  const [filter, setFilter] = useState<AttendanceStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    return Object.values(records)
      .filter(r => filter === 'all' || r.status === filter)
      .filter(r => 
        r.date.includes(search) || 
        r.note?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, filter, search]);

  return (
    <div className="glass-card rounded-2xl shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">History Log</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto hide-scrollbar">
            {['all', 'present', 'absent', 'halfday', 'leave'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={clsx(
                  "px-4 py-2 text-sm font-medium rounded-lg capitalize whitespace-nowrap transition-colors",
                  filter === tab 
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {tab === 'halfday' ? 'Half Day' : tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Notes</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRecords.length > 0 ? (
              filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-200">
                    {formatDateDisplay(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx("px-3 py-1 text-xs font-semibold rounded-full capitalize", STATUS_BADGES[record.status])}>
                      {record.status === 'halfday' ? 'Half Day' : record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {record.note || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingDate(record.date)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteAttendance(record.date)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  No records found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingDate && (
        <DayModal isoDate={editingDate} onClose={() => setEditingDate(null)} />
      )}
    </div>
  );
};
