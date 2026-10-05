import { CourseWithLogs } from './types';

export interface AttendanceStats {
  totalPresent: number;
  totalAbsent: number;
  totalClasses: number;
  percentage: number;
  statusText: string;
}

export function calculateAttendance(course: CourseWithLogs, targetPercentage: number = 75): AttendanceStats {
  let present = course.baselinePresent || 0;
  let absent = course.baselineAbsent || 0;

  if (course.logs) {
    for (const date in course.logs) {
      const log = course.logs[date];
      if (log.present !== undefined) present += log.present;
      else if (log.status === 'present') present++;
      
      if (log.absent !== undefined) absent += log.absent;
      else if (log.status === 'absent') absent++;
    }
  }

  const totalClasses = present + absent;
  const percentage = totalClasses === 0 ? 0 : (present / totalClasses) * 100;
  
  let statusText = '';
  
  if (totalClasses > 0) {
    if (percentage >= targetPercentage) {
      // Classes they can miss and still maintain the target percentage
      const targetRatio = targetPercentage / 100;
      const canMiss = Math.floor((present / targetRatio) - totalClasses);
      if (canMiss > 0) {
        statusText = `You can miss ${canMiss} more class${canMiss === 1 ? '' : 'es'}`;
      } else {
        statusText = `On track (cannot miss next class)`;
      }
    } else {
      // Classes they need to attend to reach the target percentage
      const targetRatio = targetPercentage / 100;
      const needToAttend = Math.ceil((targetRatio * totalClasses - present) / (1 - targetRatio));
      statusText = `Need to attend ${needToAttend} more class${needToAttend === 1 ? '' : 'es'}`;
    }
  } else {
    statusText = 'No classes logged yet';
  }

  return {
    totalPresent: present,
    totalAbsent: absent,
    totalClasses,
    percentage,
    statusText
  };
}
