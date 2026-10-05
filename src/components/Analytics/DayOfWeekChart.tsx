import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAttendance } from '../../context/AttendanceContext';
import { parseISO } from 'date-fns';

export const DayOfWeekChart = () => {
  const { records } = useAttendance();

  const data = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = days.map(day => ({ day, present: 0, absent: 0 }));

    Object.values(records).forEach(record => {
      const dayIndex = parseISO(record.date).getDay();
      if (record.status === 'present' || record.status === 'halfday') {
        counts[dayIndex].present++;
      } else if (record.status === 'absent') {
        counts[dayIndex].absent++;
      }
    });

    // We can filter out days that have 0 data entirely to keep it clean
    return counts;
  }, [records]);

  if (Object.keys(records).length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 h-[300px] flex items-center justify-center text-slate-400">
        No data to display
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Weekly Patterns</h3>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
            <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
