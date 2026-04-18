import { useQuery } from '@tanstack/react-query';
import { Icon } from './Icon';
import { trackEvent } from '../lib/analytics';

type Retailer = { id: string; display: string; region: string; basket_url: string };

async function fetchRetailers(query: string): Promise<Retailer[]> {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  const r = await fetch(`${base}/public/retailers?q=${encodeURIComponent(query)}`);
  if (!r.ok) return [];
  const body = await r.json();
  return body.retailers ?? [];
}

export function AffiliateButtons({ query, unboughtCount }: { query: string; unboughtCount: number }) {
  const { data: retailers } = useQuery({
    queryKey: ['retailers'],
    queryFn: () => fetchRetailers(''),
    staleTime: 60 * 60 * 1000,
  });

  if (!retailers?.length || !query.trim() || unboughtCount === 0) return null;

  return (
    <div className="affiliate-row">
      <span className="mono small muted">Shop online:</span>
      {retailers.map((r) => (
        <a
          key={r.id}
          className="chip"
          target="_blank"
          rel="noopener sponsored"
          href={r.basket_url.replace(/\{query\}|%7Bquery%7D/g, encodeURIComponent(query))}
          onClick={() => trackEvent('affiliate_click', { retailer: r.id })}
        >
          <Icon name="cart" size={12} /> {r.display}
        </a>
      ))}
    </div>
  );
}
