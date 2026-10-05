import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AttendanceRecord, AttendanceStats } from '../types/attendance';
import * as storage from '../utils/storage';

interface AttendanceContextType {
  records: Record<string, AttendanceRecord>;
  stats: AttendanceStats;
  logAttendance: (record: AttendanceRecord) => void;
  deleteAttendance: (date: string) => void;
  loadSample: () => void;
  clearData: () => void;
  importData: (importedRecords: Record<string, AttendanceRecord>, merge: boolean) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [stats, setStats] = useState<AttendanceStats>({
    totalTracked: 0, present: 0, absent: 0, halfday: 0, leave: 0,
    attendanceRate: 0, currentStreak: 0, bestStreak: 0
  });

  const refreshState = () => {
    setRecords(storage.getRecords());
    setStats(storage.getStats());
  };

  useEffect(() => {
    refreshState();
  }, []);

  const logAttendance = (record: AttendanceRecord) => {
    storage.saveRecord(record);
    refreshState();
  };

  const deleteAttendance = (date: string) => {
    storage.deleteRecord(date);
    refreshState();
  };

  const loadSample = () => {
    storage.loadSampleData();
    refreshState();
  };

  const clearData = () => {
    storage.clearAllData();
    refreshState();
  };

  const importData = (importedRecords: Record<string, AttendanceRecord>, merge: boolean) => {
    if (!merge) {
      storage.clearAllData();
    }
    Object.values(importedRecords).forEach(record => {
      storage.saveRecord(record);
    });
    refreshState();
  };

  return (
    <AttendanceContext.Provider value={{
      records, stats, logAttendance, deleteAttendance, loadSample, clearData, importData
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error('useAttendance must be used within AttendanceProvider');
  return context;
};
