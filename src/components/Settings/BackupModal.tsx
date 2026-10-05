import React, { useRef } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { useToast } from '../Layout/Toast';
import { exportToCSV, exportToJSON } from '../../utils/exportUtils';
import { Download, Upload, Trash2, X, FileJson, FileSpreadsheet, DatabaseZap } from 'lucide-react';

export const BackupModal = ({ onClose }: { onClose: () => void }) => {
  const { records, loadSample, clearData, importData } = useAttendance();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (typeof json === 'object' && json !== null) {
          importData(json, true);
          showToast('Data imported successfully!', 'success');
          onClose();
        }
      } catch (err) {
        showToast('Invalid JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to delete all attendance records? This cannot be undone.')) {
      clearData();
      showToast('All records deleted.', 'info');
      onClose();
    }
  };

  const handleLoadSample = () => {
    if (window.confirm('This will load 60 days of sample data. Proceed?')) {
      loadSample();
      showToast('Sample data loaded.', 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Settings & Backup</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Export Data</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { exportToCSV(records); showToast('CSV Exported'); }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium text-sm border border-slate-200 dark:border-slate-700"
              >
                <FileSpreadsheet size={18} className="text-emerald-500" /> Export CSV
              </button>
              <button
                onClick={() => { exportToJSON(records); showToast('JSON Exported'); }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium text-sm border border-slate-200 dark:border-slate-700"
              >
                <FileJson size={18} className="text-blue-500" /> Export JSON
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Import & Actions</h4>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium text-sm border border-slate-200 dark:border-slate-700"
              >
                <Upload size={18} /> Restore from JSON
              </button>
              <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              
              <button
                onClick={handleLoadSample}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-xl transition-colors font-medium text-sm border border-indigo-200 dark:border-indigo-800/50"
              >
                <DatabaseZap size={18} /> Load Sample Data
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <h4 className="text-sm font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Danger Zone</h4>
            <button
              onClick={handleClear}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors font-medium text-sm border border-rose-200 dark:border-rose-800/50"
            >
              <Trash2 size={18} /> Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
