const D = 86_400_000;

export function daysUntil(ts: number): number {
  return Math.round((ts - Date.now()) / D);
}

export function fmtExpiry(ts: number | null | undefined): string {
  if (ts == null) return 'No expiry';
  const d = daysUntil(ts * 1000);
  if (d < 0) return `Expired ${-d}d ago`;
  if (d === 0) return 'Expires today';
  if (d === 1) return 'Expires tomorrow';
  if (d < 7) return `${d} days left`;
  if (d < 30) return `${Math.round(d / 7)} wk left`;
  return `${Math.round(d / 30)} mo left`;
}

export function fmtRelative(ts: number): string {
  const s = (Date.now() - ts * 1000) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86_400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86_400)}d ago`;
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Local-date ISO string (YYYY-MM-DD) — NOT toISOString(), which is UTC and can shift the day. */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday 00:00 (local) of the week containing `d`. */
export function weekStart(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // Mon=0 … Sun=6
  x.setDate(x.getDate() - dow);
  return x;
}

/** The 7 Mon→Sun days of the week starting at `start`. */
export function weekDays(start: Date = weekStart()): { date: string; dow: string; dayOfMonth: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: isoDate(d), dow: DAY_NAMES[i], dayOfMonth: d.getDate() };
  });
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/**
 * Spell an integer out in Australian English ("two hundred and forty") for
 * editorial copy like the landing-page library headline. Falls back to digits
 * outside 0–9999.
 */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
  if (n < 1000) {
    const rest = n % 100;
    return `${ONES[Math.floor(n / 100)]} hundred` + (rest ? ` and ${numberToWords(rest)}` : '');
  }
  const rest = n % 1000;
  const thousands = `${numberToWords(Math.floor(n / 1000))} thousand`;
  if (!rest) return thousands;
  return rest < 100 ? `${thousands} and ${numberToWords(rest)}` : `${thousands}, ${numberToWords(rest)}`;
}

/** numberToWords with the first letter capitalised — for starting a sentence. */
export function numberToWordsSentence(n: number): string {
  const w = numberToWords(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

export const SECTIONS = [
  { id: 'produce', label: 'Produce' },
  { id: 'meat', label: 'Meat & seafood' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'other', label: 'Other' },
] as const;
