/**
 * Formats a date into a human-readable string (e.g., "Apr 27, 2026").
 * @param date The date to format
 * @returns A formatted date string
 */
export function formatReadableDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return String(date);
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
