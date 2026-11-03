const ID_DATE_FULL = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

const ID_DATE_SHORT = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

const ID_TIME_HMS = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
});

const ID_TIME_HM = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
});

export function formatFullDateId(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return String(input);
  return ID_DATE_FULL.format(date);
}

export function formatDateYmdToId(ymd: string): string {
  if (!ymd) return '-';
  const dt = new Date(`${ymd}T00:00:00+07:00`);
  if (Number.isNaN(dt.getTime())) return ymd;
  return ID_DATE_SHORT.format(dt);
}

export function formatTimeWib(iso?: string | null, withSeconds = false): string {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  const formatted = (withSeconds ? ID_TIME_HMS : ID_TIME_HM)
    .format(dt)
    .replace(/\./g, ':');
  return `${formatted} WIB`;
}

export function formatDurationMinutes(minutes?: number | null): string {
  if (minutes === null || minutes === undefined) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} mnt`;
  return `${h} jam ${m} mnt`;
}

export function getTodayWibYmd(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  return `${map.year}-${map.month}-${map.day}`;
}

export function getCurrentMonthWib(): string {
  return getTodayWibYmd().slice(0, 7);
}

