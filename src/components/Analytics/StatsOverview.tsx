import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Target, Flame, CalendarDays, BarChart2 } from 'lucide-react';
import clsx from 'clsx';

export const StatsOverview = () => {
  const { stats } = useAttendance();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard 
        title="Attendance Rate" 
        value={`${stats.attendanceRate}%`} 
        icon={<Target size={24} className="text-indigo-500" />} 
        trend="Present + Half Day"
      />
      <StatCard 
        title="Active Streak" 
        value={`${stats.currentStreak} Days`} 
        icon={<Flame size={24} className={clsx(stats.currentStreak > 0 ? "text-orange-500" : "text-slate-400")} />} 
        trend={`Best: ${stats.bestStreak}`}
      />
      <StatCard 
        title="Total Days" 
        value={stats.totalTracked.toString()} 
        icon={<CalendarDays size={24} className="text-blue-500" />} 
        trend={`${stats.present} Present`}
      />
      <StatCard 
        title="Absences" 
        value={stats.absent.toString()} 
        icon={<BarChart2 size={24} className="text-rose-500" />} 
        trend={`${stats.leave} Leaves, ${stats.halfday} Half Days`}
      />
    </div>
  );
};

const StatCard = ({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) => (
  <div className="glass-card rounded-2xl p-5 flex flex-col justify-between shadow-sm">
    <div className="flex items-start justify-between mb-2">
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">{icon}</div>
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{trend}</p>
    </div>
  </div>
);
