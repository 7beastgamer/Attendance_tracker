import type { AttendanceRecord, AttendanceStats } from '../types/attendance';
import { calculateStreaks } from './streakUtils';
import { getIsoDate } from './dateUtils';
import { subDays } from 'date-fns';

const STORAGE_KEY = 'attendance_records_v1';

export const getRecords = (): Record<string, AttendanceRecord> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

export const saveRecord = (record: AttendanceRecord): void => {
  const records = getRecords();
  records[record.date] = record;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const deleteRecord = (date: string): void => {
  const records = getRecords();
  delete records[date];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const getStats = (): AttendanceStats => {
  const records = getRecords();
  const values = Object.values(records);
  
  let present = 0;
  let absent = 0;
  let halfday = 0;
  let leave = 0;

  values.forEach(r => {
    if (r.status === 'present') present++;
    if (r.status === 'absent') absent++;
    if (r.status === 'halfday') halfday++;
    if (r.status === 'leave') leave++;
  });

  const totalTracked = values.length;
  const attendanceRate = totalTracked ? ((present + 0.5 * halfday) / totalTracked) * 100 : 0;
  const streaks = calculateStreaks(records);

  return {
    totalTracked, present, absent, halfday, leave,
    attendanceRate: Number(attendanceRate.toFixed(1)),
    currentStreak: streaks.currentStreak,
    bestStreak: streaks.bestStreak
  };
};

export const loadSampleData = () => {
  const records: Record<string, AttendanceRecord> = {};
  const today = new Date();
  
  for (let i = 0; i < 60; i++) {
    const d = subDays(today, i);
    // skip weekends mostly
    const day = d.getDay();
    if (day === 0 || day === 6) {
      if (Math.random() > 0.9) { // rare weekend work
        const date = getIsoDate(d);
        records[date] = { id: date, date, status: 'present', note: 'Weekend crunch', createdAt: Date.now() };
      }
      continue;
    }

    const date = getIsoDate(d);
    let status: any = 'present';
    const rand = Math.random();
    if (rand > 0.9) status = 'absent';
    else if (rand > 0.8) status = 'halfday';
    else if (rand > 0.75) status = 'leave';

    records[date] = {
      id: date,
      date,
      status,
      note: status !== 'present' ? 'Sample note' : '',
      createdAt: Date.now() - i * 86400000
    };
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEY);
};
