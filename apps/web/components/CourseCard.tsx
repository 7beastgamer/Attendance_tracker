import React from 'react';
import Link from 'next/link';
import { CourseWithLogs, calculateAttendance } from 'shared';

interface Props {
  course: CourseWithLogs;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  onDelete: () => void;
}

export default function CourseCard({ course, onMarkPresent, onMarkAbsent, onDelete }: Props) {
  const stats = calculateAttendance(course, 75);
  
  return (
    <Link 
      href={{ pathname: '/course', query: { id: course.id } }}
      className="bg-[#1e1e1e] rounded-lg border-l-4 p-4 mb-4 flex items-center shadow-md text-white relative group block hover:bg-[#2a2a2a] transition-colors cursor-pointer" 
      style={{ borderLeftColor: course.color }}
    >
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
        title="Delete Course"
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
      </button>

      <div className="flex-1 mr-4">
        <h3 className="text-lg font-bold mb-2 pr-4">{course.name}</h3>
        
        <div className="flex items-center mb-1">
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden mr-2">
            <div 
              className={`h-full ${stats.percentage >= 75 ? 'bg-[#4caf50]' : 'bg-[#f44336]'}`}
              style={{ width: `${Math.min(stats.percentage, 100)}%` }}
            />
          </div>
          <span className="font-semibold text-sm min-w-[3rem] text-right">
            {stats.percentage.toFixed(1)}%
          </span>
        </div>
        
        <p className="text-xs text-gray-400">{stats.statusText}</p>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkPresent(); }}
          aria-label={`Mark present for ${course.name}`}
          className="w-10 h-10 rounded-full bg-[#4caf50] text-white flex items-center justify-center text-xl font-bold hover:bg-green-600 transition-colors shadow-sm"
        >
          +
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkAbsent(); }}
          aria-label={`Mark absent for ${course.name}`}
          className="w-10 h-10 rounded-full bg-[#f44336] text-white flex items-center justify-center text-xl font-bold hover:bg-red-600 transition-colors shadow-sm"
        >
          -
        </button>
      </div>
    </Link>
  );
}
