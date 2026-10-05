import { calculateAttendance } from '../src/attendanceMath';
import { CourseWithLogs } from '../src/types';

describe('calculateAttendance', () => {
  it('handles zero classes correctly', () => {
    const course: CourseWithLogs = {
      id: '1', name: 'Test', color: 'red', baselinePresent: 0, baselineAbsent: 0, logs: {}
    };
    const result = calculateAttendance(course, 75);
    expect(result.percentage).toBe(0);
    expect(result.totalClasses).toBe(0);
    expect(result.statusText).toBe('No classes logged yet');
  });

  it('calculates baseline correctly', () => {
    const course: CourseWithLogs = {
      id: '1', name: 'Test', color: 'red', baselinePresent: 3, baselineAbsent: 1, logs: {}
    };
    const result = calculateAttendance(course, 75);
    expect(result.percentage).toBe(75); // 3 / 4 = 75%
  });

  it('calculates logs overriding baseline correctly', () => {
    const course: CourseWithLogs = {
      id: '1', name: 'Test', color: 'red', baselinePresent: 3, baselineAbsent: 1, 
      logs: {
        '2026-09-21': { status: 'absent' },
        '2026-09-22': { status: 'present' }
      }
    };
    const result = calculateAttendance(course, 75);
    expect(result.totalPresent).toBe(4);
    expect(result.totalAbsent).toBe(2);
    expect(result.percentage).toBeCloseTo(66.67);
  });

  it('tells you how many classes you can miss', () => {
    const course: CourseWithLogs = {
      id: '1', name: 'Test', color: 'red', baselinePresent: 10, baselineAbsent: 0, logs: {}
    };
    const result = calculateAttendance(course, 75);
    expect(result.statusText).toContain('miss 3 more');
  });

  it('tells you how many classes you need to attend', () => {
    const course: CourseWithLogs = {
      id: '1', name: 'Test', color: 'red', baselinePresent: 5, baselineAbsent: 5, logs: {}
    };
    const result = calculateAttendance(course, 75);
    expect(result.statusText).toContain('attend 10 more');
  });
});
