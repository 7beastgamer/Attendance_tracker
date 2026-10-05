import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAttendance } from '../../context/AttendanceContext';

export const StatusDonutChart = () => {
  const { stats } = useAttendance();

  const data = [
    { name: 'Present', value: stats.present, color: '#10b981' }, // emerald-500
    { name: 'Half Day', value: stats.halfday, color: '#f59e0b' }, // amber-500
    { name: 'On Leave', value: stats.leave, color: '#6366f1' }, // indigo-500
    { name: 'Absent', value: stats.absent, color: '#f43f5e' }, // rose-500
  ].filter(d => d.value > 0);

  if (stats.totalTracked === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 h-[300px] flex items-center justify-center text-slate-400">
        No data to display
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Distribution</h3>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#1e293b' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
