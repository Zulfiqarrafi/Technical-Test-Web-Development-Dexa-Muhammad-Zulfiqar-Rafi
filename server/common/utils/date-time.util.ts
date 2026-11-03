export function getJakartaDateParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  const hour = map.hour === '24' ? '00' : map.hour;

  return {
    dateString: `${map.year}-${map.month}-${map.day}`,
    timeHHMM: `${hour}:${map.minute}`,
    timeHHMMSS: `${hour}:${map.minute}:${map.second}`,
  };
}

export function isLateClockIn(date: Date, limitHHMM = '08:30'): boolean {
  const { timeHHMM } = getJakartaDateParts(date);
  return timeHHMM > limitHHMM;
}

export function diffMinutes(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / 60000));
}

