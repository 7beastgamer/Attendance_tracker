import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { useToast } from '../Layout/Toast';
import { getIsoDate } from '../../utils/dateUtils';
import type { AttendanceStatus } from '../../types/attendance';
import { Check, X, Clock, MapPin, Tag } from 'lucide-react';
import clsx from 'clsx';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: any; color: string; hover: string }[] = [
  { value: 'present', label: 'Present', icon: Check, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-800/60' },
  { value: 'absent', label: 'Absent', icon: X, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400', hover: 'hover:bg-rose-200 dark:hover:bg-rose-800/60' },
  { value: 'halfday', label: 'Half Day', icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', hover: 'hover:bg-amber-200 dark:hover:bg-amber-800/60' },
  { value: 'leave', label: 'On Leave', icon: MapPin, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400', hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-800/60' },
];

const QUICK_TAGS = ['Work from Home', 'Sick Leave', 'In Office', 'Vacation', 'Client Meeting', 'Personal'];

export const DailyLogger = () => {
  const { records, logAttendance, deleteAttendance } = useAttendance();
  const { showToast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<string>(getIsoDate());
  const [note, setNote] = useState('');
  
  const currentRecord = records[selectedDate];

  useEffect(() => {
    if (currentRecord) {
      setNote(currentRecord.note || '');
    } else {
      setNote('');
    }
  }, [selectedDate, currentRecord]);

  const handleLog = (status: AttendanceStatus) => {
    logAttendance({
      id: selectedDate,
      date: selectedDate,
      status,
      note,
      createdAt: Date.now()
    });
    showToast(`Logged ${status} for ${selectedDate}`, 'success');
  };

  const handleClear = () => {
    if (currentRecord) {
      deleteAttendance(selectedDate);
      showToast(`Cleared record for ${selectedDate}`, 'info');
      setNote('');
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 w-full max-w-2xl mx-auto mb-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Log Attendance</h2>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 text-slate-700 dark:text-slate-300 px-3 py-2 cursor-pointer"
          />
          <button 
            onClick={() => setSelectedDate(getIsoDate())}
            className={clsx(
              "text-xs px-3 py-1.5 rounded-md font-medium transition-colors ml-2",
              selectedDate === getIsoDate() 
                ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = currentRecord?.status === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => handleLog(opt.value)}
              className={clsx(
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-2",
                isSelected 
                  ? `border-${opt.color.split('-')[1]}-500 ${opt.color} shadow-sm scale-[1.02]`
                  : `border-transparent bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50`
              )}
            >
              <Icon size={24} className={isSelected ? "" : "opacity-70"} />
              <span className="font-semibold text-sm">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <Tag size={16} /> Notes / Reason (Optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Doctor appointment, WFH..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow dark:text-slate-200"
        />
        <div className="flex flex-wrap gap-2 pt-2">
          {QUICK_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setNote(tag)}
              className="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {currentRecord && (
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Recorded at {new Date(currentRecord.createdAt).toLocaleTimeString()}
          </p>
          <button 
            onClick={handleClear}
            className="text-sm text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium px-3 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
          >
            Clear Entry
          </button>
        </div>
      )}
    </div>
  );
};
