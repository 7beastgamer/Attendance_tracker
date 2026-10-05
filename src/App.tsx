import React, { useState } from 'react';
import { AttendanceProvider } from './context/AttendanceContext';
import { ToastProvider } from './components/Layout/Toast';
import { Navbar } from './components/Layout/Navbar';
import { DailyLogger } from './components/Logger/DailyLogger';
import { CalendarView } from './components/Calendar/CalendarView';
import { StatsOverview } from './components/Analytics/StatsOverview';
import { StatusDonutChart } from './components/Analytics/StatusDonutChart';
import { DayOfWeekChart } from './components/Analytics/DayOfWeekChart';
import { HistoryTable } from './components/History/HistoryTable';
import { BackupModal } from './components/Settings/BackupModal';

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar onSettingsClick={() => setShowSettings(true)} />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyLogger />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CalendarView />
          </div>
          <div className="space-y-8">
            <StatusDonutChart />
            <DayOfWeekChart />
          </div>
        </div>

        <div className="mt-8">
          <StatsOverview />
        </div>

        <HistoryTable />
      </main>

      {showSettings && <BackupModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function App() {
  return (
    <AttendanceProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AttendanceProvider>
  );
}

export default App;
