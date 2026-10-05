import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { useToast } from '../Layout/Toast';
import type { AttendanceStatus } from '../../types/attendance';
import { X, Check, Clock, MapPin, Trash2 } from 'lucide-react';
import { formatDateDisplay } from '../../utils/dateUtils';
import clsx from 'clsx';

interface DayModalProps {
  isoDate: string;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: any; color: string }[] = [
  { value: 'present', label: 'Present', icon: Check, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { value: 'absent', label: 'Absent', icon: X, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  { value: 'halfday', label: 'Half Day', icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { value: 'leave', label: 'On Leave', icon: MapPin, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
];

export const DayModal = ({ isoDate, onClose }: DayModalProps) => {
  const { records, logAttendance, deleteAttendance } = useAttendance();
  const { showToast } = useToast();
  const record = records[isoDate];

  const [status, setStatus] = useState<AttendanceStatus | null>(record?.status || null);
  const [note, setNote] = useState(record?.note || '');

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handleSave = () => {
    if (!status) return;
    logAttendance({
      id: isoDate,
      date: isoDate,
      status,
      note,
      createdAt: record?.createdAt || Date.now()
    });
    showToast(`Updated record for ${formatDateDisplay(isoDate)}`, 'success');
    onClose();
  };

  const handleDelete = () => {
    deleteAttendance(isoDate);
    showToast(`Deleted record for ${formatDateDisplay(isoDate)}`, 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {formatDateDisplay(isoDate)}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {STATUS_OPTIONS.map(opt => {
              const isSelected = status === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                    isSelected 
                      ? `${opt.color}` 
                      : "border-transparent bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  <Icon size={18} />
                  <span className="font-semibold text-sm">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          {record ? (
            <button
              onClick={handleDelete}
              className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors text-sm font-medium"
            >
              <Trash2 size={16} /> Delete
            </button>
          ) : (
            <div />
          )}
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!status}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
