export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Tasks store `dueAt` as a UTC string whose date portion encodes the intended
 * calendar day (e.g. "2026-10-07T12:00:00Z"). To keep the day stable across
 * timezones, always derive the day from the UTC date portion rather than
 * reinterpreting the instant in local time.
 */
export function getTaskDateString(dueAt: string): string {
  // dueAt always begins with YYYY-MM-DD; take it verbatim so a task's day never
  // shifts based on the viewer's timezone.
  return dueAt.split('T')[0];
}

/**
 * Build a Date pinned to midnight *local* time for the given YYYY-MM-DD. This is
 * what calendar UIs that render in local time expect for an all-day event, so
 * the event lands on the same calendar cell as `getTaskDateString`.
 */
export function dateStringToLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
