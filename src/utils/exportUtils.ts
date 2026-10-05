import type { AttendanceRecord } from '../types/attendance';

export const exportToCSV = (records: Record<string, AttendanceRecord>) => {
  const rows = [
    ['Date', 'Status', 'Notes', 'Created At']
  ];

  Object.values(records)
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach(record => {
      rows.push([
        record.date,
        record.status,
        `"${record.note?.replace(/"/g, '""') || ''}"`,
        new Date(record.createdAt).toISOString()
      ]);
    });

  const csvContent = rows.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (records: Record<string, AttendanceRecord>) => {
  const data = JSON.stringify(records, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `attendance_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
