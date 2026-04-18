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

export const SECTIONS = [
  { id: 'produce', label: 'Produce' },
  { id: 'meat', label: 'Meat & seafood' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'other', label: 'Other' },
] as const;
