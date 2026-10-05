export type AttendanceStatus = 'present' | 'absent' | 'halfday' | 'leave';

export interface AttendanceRecord {
  id: string; // usually the ISO date string like YYYY-MM-DD
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
  createdAt: number; // timestamp
}

export interface AttendanceStats {
  totalTracked: number;
  present: number;
  absent: number;
  halfday: number;
  leave: number;
  attendanceRate: number; // (present + 0.5 * halfday) / totalTracked * 100
  currentStreak: number;
  bestStreak: number;
}
