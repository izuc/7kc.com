export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-stack" aria-busy="true" aria-label="loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="skeleton" style={{ width: 22, height: 22, borderRadius: '50%' }} />
            <span className="skeleton skeleton-line" style={{ width: `${40 + Math.random() * 40}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6, columns = 'repeat(auto-fill, minmax(220px, 1fr))' }: { count?: number; columns?: string }) {
  return (
    <div
      className="stagger-in"
      style={{ display: 'grid', gridTemplateColumns: columns, gap: 12 }}
      aria-busy="true"
      aria-label="loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <span className="skeleton skeleton-line tall" style={{ width: '60%' }} />
          <span className="skeleton skeleton-line" style={{ width: '40%' }} />
          <span className="skeleton skeleton-line" style={{ width: '90%' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRecipeGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="recipe-grid stagger-in" aria-busy="true" aria-label="loading recipes">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="recipe-card" style={{ pointerEvents: 'none' }}>
          <span className="skeleton" style={{ width: '100%', height: 200, borderRadius: 0 }} />
          <div className="recipe-card-body">
            <span className="skeleton skeleton-line" style={{ width: '30%' }} />
            <span className="skeleton skeleton-line tall" style={{ width: '70%' }} />
            <span className="skeleton" style={{ height: 3, width: '100%' }} />
            <span className="skeleton skeleton-line" style={{ width: '45%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
