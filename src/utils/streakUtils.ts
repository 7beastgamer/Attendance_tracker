import type { AttendanceRecord } from '../types/attendance';
import { getIsoDate } from './dateUtils';
import { parseISO, differenceInDays } from 'date-fns';

export const calculateStreaks = (records: Record<string, AttendanceRecord>) => {
  const sortedDates = Object.values(records)
    .filter(r => r.status === 'present' || r.status === 'halfday') // Consider half-day as continuing streak? Let's say yes for simplicity, but strictly present is also fine. Let's strictly count 'present'.
    .filter(r => r.status === 'present')
    .map(r => r.date)
    .sort((a, b) => b.localeCompare(a)); // Newest first

  if (sortedDates.length === 0) return { currentStreak: 0, bestStreak: 0 };

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 1;

  // Calculate current streak
  const today = getIsoDate();
  const yesterday = getIsoDate(new Date(Date.now() - 86400000));
  
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const diff = differenceInDays(parseISO(sortedDates[i]), parseISO(sortedDates[i+1]));
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate best streak
  const ascendingDates = [...sortedDates].reverse();
  tempStreak = 1;
  bestStreak = 1;
  for (let i = 0; i < ascendingDates.length - 1; i++) {
    const diff = differenceInDays(parseISO(ascendingDates[i+1]), parseISO(ascendingDates[i]));
    if (diff === 1) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else if (diff > 1) {
      tempStreak = 1;
    }
  }

  return { currentStreak, bestStreak: Math.max(currentStreak, bestStreak) };
};
