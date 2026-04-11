export function isInQuietHours(user: {
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  quietHoursTimezone: string | null;
}): boolean {
  if (user.quietHoursStart === null || user.quietHoursEnd === null || !user.quietHoursTimezone) {
    return false;
  }

  let currentHour: number;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: user.quietHoursTimezone,
      hour: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === 'hour');
    currentHour = parseInt(hourPart?.value ?? '0', 10);
  } catch {
    return false;
  }

  const start = user.quietHoursStart;
  const end = user.quietHoursEnd;

  if (start <= end) {
    return currentHour >= start && currentHour < end;
  }
  return currentHour >= start || currentHour < end;
}
