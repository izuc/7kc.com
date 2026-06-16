import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUi } from '../store/ui';
import { Loading } from '../components/Loading';
import { PasteParseModal } from './ListsPage';

// Landing point for the Web Share Target (Android share sheet → 7KC). The shared
// title/text/url arrive as query params; we seed them into the paste-parse flow
// against the user's first active list (creating one if they have none).
export function SharePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useUi((s) => s.toast);

  const seed = useMemo(
    () => [params.get('title'), params.get('text'), params.get('url')].filter(Boolean).join('\n'),
    [params]
  );

  const { data, isLoading } = useQuery({ queryKey: ['lists'], queryFn: () => api.lists() });
  const [targetId, setTargetId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isLoading || targetId || creating) return;
    const active = (data?.lists ?? []).filter((l) => !l.archived_at);
    if (active.length > 0) {
      setTargetId(active[0].id);
      return;
    }
    // No list yet → create one to receive the shared items.
    setCreating(true);
    api
      .createList('Shopping')
      .then((r) => {
        qc.invalidateQueries({ queryKey: ['lists'] });
        setTargetId(r.list.id);
      })
      .catch(() => {
        toast("Couldn't open a list for your shared items — please try again.");
        navigate('/lists', { replace: true });
      })
      .finally(() => setCreating(false));
  }, [isLoading, data, targetId, creating, qc, navigate, toast]);

  if (!targetId) return <Loading label="Opening your list…" />;

  return (
    <div className="screen">
      <PasteParseModal
        listId={targetId}
        seedText={seed}
        onClose={() => {
          qc.invalidateQueries({ queryKey: ['lists'] });
          navigate(`/lists/${targetId}`, { replace: true });
        }}
      />
    </div>
  );
}
