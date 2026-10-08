'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
// @ts-ignore
import { CourseWithLogs, calculateAttendance, getLocalDateString } from 'shared';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, addMonths, subMonths, isSameDay } from 'date-fns';

function CourseDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const courseId = searchParams.get('id');

  const [course, setCourse] = useState<CourseWithLogs | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!user || !courseId) return;

    // Listen to the course document.
    const unsubCourse = onSnapshot(doc(db, 'users', user.uid, 'courses', courseId), (docSnap) => {
      if (!docSnap.exists()) {
        setNotFound(true);
        setCourse(null);
        return;
      }
      setNotFound(false);
      const courseData = docSnap.data();
      setCourse((prev) => ({
        id: docSnap.id,
        name: courseData.name,
        color: courseData.color || '#8ab4f8',
        baselinePresent: courseData.baselinePresent || 0,
        baselineAbsent: courseData.baselineAbsent || 0,
        logs: prev?.logs || {},
      } as CourseWithLogs));
    });

    // Listen to the logs sub-collection separately so marks update live.
    const unsubLogs = onSnapshot(collection(db, 'users', user.uid, 'courses', courseId, 'logs'), (snapshot) => {
      const logs: Record<string, any> = {};
      snapshot.forEach((logDoc) => {
        logs[logDoc.id] = logDoc.data();
      });
      setCourse((prev) => (prev ? { ...prev, logs } : prev));
    });

    return () => {
      unsubCourse();
      unsubLogs();
    };
  }, [user, courseId]);

  if (loading) {
    return <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center gap-4 text-white">
        <p>You need to sign in to view this course.</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-[#8ab4f8] text-[#1e1e1e] rounded font-bold">Go to Dashboard</button>
      </div>
    );
  }

  if (!courseId || notFound) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center gap-4 text-white">
        <p>Course not found.</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-[#8ab4f8] text-[#1e1e1e] rounded font-bold">Go to Dashboard</button>
      </div>
    );
  }

  if (!course) {
    return <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-white">Loading...</div>;
  }

  const handleUpdateLog = async (type: 'present' | 'absent', delta: number) => {
    if (!user) return;
    const dateStr = getLocalDateString(selectedDate);
    const existingLog = course.logs[dateStr] || {};

    // Convert legacy status if present
    let currentPresent = existingLog.present !== undefined ? existingLog.present : (existingLog.status === 'present' ? 1 : 0);
    let currentAbsent = existingLog.absent !== undefined ? existingLog.absent : (existingLog.status === 'absent' ? 1 : 0);

    if (type === 'present') currentPresent = Math.max(0, currentPresent + delta);
    if (type === 'absent') currentAbsent = Math.max(0, currentAbsent + delta);

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', user.uid, 'courses', course.id, 'logs', dateStr), {
      present: currentPresent,
      absent: currentAbsent,
    }, { merge: true });

    batch.update(doc(db, 'users', user.uid, 'courses', course.id), { lastUpdated: serverTimestamp() });
    await batch.commit();
  };

  const selectedDateStr = getLocalDateString(selectedDate);
  const selectedLog = course.logs[selectedDateStr] || {};
  const presentCount = selectedLog.present !== undefined ? selectedLog.present : (selectedLog.status === 'present' ? 1 : 0);
  const absentCount = selectedLog.absent !== undefined ? selectedLog.absent : (selectedLog.status === 'absent' ? 1 : 0);

  const stats = calculateAttendance(course, 75);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = monthStart;
  const days = eachDayOfInterval({ start: startDate, end: monthEnd });
  const startingDayIndex = getDay(startDate);

  return (
    <div className="min-h-screen flex flex-col bg-[#1e1e1e] text-gray-200 p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push('/')} className="text-2xl hover:text-white">&larr;</button>
        <h1 className="text-3xl font-bold text-[#8ab4f8]">{course.name}</h1>
      </header>

      <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto w-full">
        <div className="flex-1 bg-[#2d2d2d] rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-xl px-2 hover:text-white">&lt;</button>
            <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-xl px-2 hover:text-white">&gt;</button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center font-bold text-gray-400 mb-2">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const dStr = getLocalDateString(day);
              const log = course.logs[dStr] || {};
              const p = log.present !== undefined ? log.present : (log.status === 'present' ? 1 : 0);
              const a = log.absent !== undefined ? log.absent : (log.status === 'absent' ? 1 : 0);

              let bgColor = 'bg-[#3c4043]';
              if (p > 0 && a === 0) bgColor = 'bg-[#4caf50] text-black'; // green
              else if (a > 0 && p === 0) bgColor = 'bg-[#f44336] text-white'; // red
              else if (p > 0 && a > 0) bgColor = 'bg-[#ff9800] text-black'; // orange

              const isSelected = isSameDay(day, selectedDate);

              return (
                <button
                  key={dStr}
                  onClick={() => setSelectedDate(day)}
                  title={`${format(day, 'MMM d')}: ${p} Present, ${a} Absent`}
                  className={`aspect-square rounded-full flex items-center justify-center transition-transform hover:scale-110 ${bgColor} ${isSelected ? 'ring-2 ring-white' : ''}`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-[#2d2d2d] rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Edit: {format(selectedDate, 'EEE, MMM dd')}</h3>

            <div className="flex justify-between items-center mb-4">
              <span className="text-[#4caf50] font-bold text-lg">Present</span>
              <div className="flex items-center gap-4 bg-[#1e1e1e] p-2 rounded-full">
                <button onClick={() => handleUpdateLog('present', -1)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">-</button>
                <span className="w-6 text-center font-bold">{presentCount}</span>
                <button onClick={() => handleUpdateLog('present', 1)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">+</button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#f44336] font-bold text-lg">Absent</span>
              <div className="flex items-center gap-4 bg-[#1e1e1e] p-2 rounded-full">
                <button onClick={() => handleUpdateLog('absent', -1)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">-</button>
                <span className="w-6 text-center font-bold">{absentCount}</span>
                <button onClick={() => handleUpdateLog('absent', 1)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">+</button>
              </div>
            </div>
          </div>

          <div className="bg-[#2d2d2d] rounded-2xl p-6 shadow-lg text-center flex flex-col gap-2">
            <div className="flex justify-center gap-6 mb-2">
              <span className="text-[#4caf50] font-bold text-lg">Present: {stats.totalPresent}</span>
              <span className="text-[#f44336] font-bold text-lg">Absent: {stats.totalAbsent}</span>
            </div>
            <div className="text-gray-400">Total Sessions: {stats.totalClasses}</div>
            <div className="text-xl font-bold">Overall Attendance: {stats.percentage.toFixed(2)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-white">Loading...</div>}>
      <CourseDetails />
    </Suspense>
  );
}
