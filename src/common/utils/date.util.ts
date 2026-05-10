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

/**
 * Returns today's date as a YYYY-MM-DD string using the SERVER's local timezone.
 * Unlike toISOString() (which is always UTC), this uses JS local-time date
 * parts so it remains correct even when the server's TZ env is set (e.g. Asia/Dhaka).
 *
 * To fix timezone on your server set:  TZ=Asia/Dhaka  in your environment / .env
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
