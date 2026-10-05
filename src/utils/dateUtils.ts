import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

export const getIsoDate = (date: Date = new Date()): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getMonthDays = (year: number, month: number): Date[] => {
  const date = new Date(year, month);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
};

export const formatDateDisplay = (isoDate: string): string => {
  try {
    return format(parseISO(isoDate), 'MMM d, yyyy');
  } catch (e) {
    return isoDate;
  }
};
