export function Loading({ label }: { label?: string }) {
  return (
    <div className="loading">
      <div className="spinner" />
      {label && <span style={{ marginLeft: 12, color: 'var(--muted)' }}>{label}</span>}
    </div>
  );
}
