import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { getMonthDays, getIsoDate } from '../../utils/dateUtils';
import { addMonths, subMonths, format, isToday, parseISO, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { DayModal } from './DayModal';

const STATUS_COLORS = {
  present: 'bg-emerald-500',
  absent: 'bg-rose-500',
  halfday: 'bg-amber-500',
  leave: 'bg-indigo-500',
};

export const CalendarView = () => {
  const { records } = useAttendance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const days = getMonthDays(currentMonth.getFullYear(), currentMonth.getMonth());
  
  // Pad the beginning of the month so it aligns with weekday columns (Sunday start)
  const startDayOfWeek = days[0].getDay();
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 w-full shadow-sm mb-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ChevronRight size={20} />
          </button>
        </h2>
        <button 
          onClick={() => setCurrentMonth(new Date())}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
        >
          Today
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {paddingDays.map(i => (
          <div key={`pad-${i}`} className="aspect-square rounded-xl bg-transparent" />
        ))}
        {days.map(day => {
          const iso = getIsoDate(day);
          const record = records[iso];
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const today = isToday(day);

          return (
            <button
              key={iso}
              onClick={() => setSelectedDateStr(iso)}
              className={clsx(
                "relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all hover:ring-2 hover:ring-indigo-400/50 border",
                today ? "ring-2 ring-indigo-500 border-transparent bg-indigo-50/50 dark:bg-indigo-900/20" : "border-slate-100 dark:border-slate-800/50",
                !record && isWeekend ? "bg-slate-50/50 dark:bg-slate-800/20 text-slate-400" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                !isSameMonth(day, currentMonth) && "opacity-40"
              )}
            >
              <span className={clsx("text-sm font-medium z-10", today && "text-indigo-700 dark:text-indigo-400 font-bold")}>
                {format(day, 'd')}
              </span>
              
              {record && (
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                  <div className={clsx("w-2 h-2 rounded-full", STATUS_COLORS[record.status])} />
                </div>
              )}
              
              {record?.note && (
                <div className="absolute top-1.5 right-1.5 text-slate-300 dark:text-slate-600">
                  <MessageSquare size={10} fill="currentColor" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Half Day</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> On Leave</div>
      </div>

      {selectedDateStr && (
        <DayModal 
          isoDate={selectedDateStr} 
          onClose={() => setSelectedDateStr(null)} 
        />
      )}
    </div>
  );
};
