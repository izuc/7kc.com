import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/Avatar';
import { Swatch } from '../components/Swatch';
import { fmtRelative } from '../lib/format';
import { useAuth } from '../store/auth';
import type { GroupMember, RecipeSummary, Suggestion } from '../types/models';

export function GroupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: groupData } = useQuery({
    queryKey: ['my-group'],
    queryFn: () => api.myGroup(),
    enabled: Boolean(user?.group_id),
  });
  const { data: feedData } = useQuery({ queryKey: ['feed'], queryFn: () => api.feed() });
  const { data: sugData } = useQuery({
    queryKey: ['group-suggestions'],
    queryFn: () => api.listSuggestions(),
  });
  // recipe lookup so suggestion cards can show real palettes
  const { data: recipesData } = useQuery({
    queryKey: ['recipes-all'],
    queryFn: () => api.recipes(),
    staleTime: 10 * 60 * 1000,
  });
  const recipeByTitle = new Map<string, RecipeSummary>();
  for (const r of recipesData?.recipes ?? []) recipeByTitle.set(r.title, r);

  if (!user?.group_id) {
    return (
      <div className="screen">
        <div className="empty">
          <p>You're in solo mode. Share a pantry with housemates or a partner?</p>
          <button className="btn btn-primary" onClick={() => navigate('/settings')}>
            <Icon name="group" size={14} /> Invite to your kitchen
          </button>
        </div>
      </div>
    );
  }

  const group = groupData?.group;
  const members = group?.members ?? [];
  const membersById: Record<string, GroupMember> = Object.fromEntries(members.map((m) => [m.user_id, m]));
  const suggestions = sugData?.suggestions ?? [];
  const feed = feedData?.feed ?? [];

  const youLabel = (id: string) => (id === user.id ? 'You' : membersById[id]?.display_name || 'Someone');

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-head-left">
          <div className="eyebrow">
            Group <span className="dot-sep">·</span> <span className="mono">{members.length} members</span>
          </div>
          <h1 className="screen-title">{group?.name}</h1>
          <div className="member-row">
            {members.map((m) => (
              <div key={m.user_id} className="member-chip">
                <Avatar
                  user={{ user_id: m.user_id, display_name: m.display_name, color: m.color }}
                  size={22}
                />
                {m.display_name}
              </div>
            ))}
            <button
              className="member-chip add-member"
              onClick={() => {
                if (group?.invite_token) {
                  navigator.clipboard?.writeText(group.invite_token);
                }
              }}
              title="Copy invite token"
            >
              <Icon name="plus" size={12} /> Copy invite
            </button>
          </div>
        </div>
      </div>

      <div className="group-grid">
        <div className="group-col">
          <h3 className="col-head">Meal suggestions</h3>
          {suggestions.length === 0 ? (
            <div className="empty small">No suggestions yet. Head to Recipes to suggest one.</div>
          ) : (
            <div className="suggestion-list">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s.id}
                  s={s}
                  recipe={recipeByTitle.get(s.recipe_title)}
                  membersById={membersById}
                  currentUserId={user.id}
                  onChanged={() => {
                    qc.invalidateQueries({ queryKey: ['group-suggestions'] });
                    qc.invalidateQueries({ queryKey: ['feed'] });
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="group-col">
          <h3 className="col-head">Activity</h3>
          {feed.length === 0 ? (
            <div className="empty small">Nothing happening yet.</div>
          ) : (
            <ul className="feed">
              {feed.slice(0, 30).map((f) => {
                const who = membersById[f.user_id];
                const p = f.payload as Record<string, any>;
                return (
                  <li key={f.id} className="feed-item">
                    <Avatar
                      user={{ user_id: f.user_id, display_name: who?.display_name, color: who?.color }}
                      size={22}
                    />
                    <div>
                      <div>
                        <b>{youLabel(f.user_id)}</b>{' '}
                        {f.kind === 'cooked' && <>cooked <i>{String(p.recipe_title ?? '')}</i></>}
                        {f.kind === 'suggest' && (
                          <>
                            suggested <i>{String(p.recipe_title ?? '')}</i>
                            {p.suggested_for_date ? <> for <b>{String(p.suggested_for_date)}</b></> : null}
                          </>
                        )}
                        {f.kind === 'comment' && <>commented: "{String(p.content ?? '')}"</>}
                        {f.kind === 'member_joined' && <>joined the group</>}
                        {f.kind === 'member_left' && <>left the group</>}
                      </div>
                      <div className="mono small muted">{fmtRelative(f.created_at)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({
  s,
  recipe,
  membersById,
  currentUserId,
  onChanged,
}: {
  s: Suggestion;
  recipe?: RecipeSummary;
  membersById: Record<string, GroupMember>;
  currentUserId: string;
  onChanged: () => void;
}) {
  const [comment, setComment] = useState('');
  const by = membersById[s.suggested_by] ?? { display_name: 'Someone', color: '#888', user_id: s.suggested_by };
  const youLiked = s.likes.includes(currentUserId);

  return (
    <div className="suggestion-card">
      {recipe ? (
        <Swatch palette={recipe.palette} label={recipe.title} size="sm" rounded />
      ) : (
        <div className="swatch rounded" style={{ width: 64, height: 64, background: 'var(--cream-2)' }} />
      )}
      <div className="suggestion-body">
        <div className="suggestion-head">
          <Avatar user={{ user_id: by.user_id, display_name: by.display_name, color: by.color }} size={18} />
          <span>
            <b>{by.display_name}</b> suggested
          </span>
          {s.suggested_for_date && <span className="tag tag-sage">{s.suggested_for_date}</span>}
        </div>
        <div className="suggestion-title">{s.recipe_title}</div>
        <div className="suggestion-actions">
          <button
            className={`chip ${youLiked ? 'liked' : ''}`}
            onClick={async () => {
              await api.likeSuggestion(s.id);
              onChanged();
            }}
          >
            <Icon name="heart" size={12} /> {s.likes.length}
          </button>
          <span className="chip-ghost">
            <Icon name="msg" size={12} /> {s.comments.length}
          </span>
        </div>
        {s.comments.length > 0 && (
          <ul className="comments">
            {s.comments.map((c) => {
              const who = membersById[c.user_id];
              return (
                <li key={c.id}>
                  <Avatar user={{ user_id: c.user_id, display_name: who?.display_name, color: who?.color }} size={16} />
                  <span>
                    <b>{who?.display_name || 'Someone'}</b> {c.content}
                  </span>
                  <span className="mono small muted">{fmtRelative(c.created_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="comment-entry">
          <input
            placeholder="Add a comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && comment.trim()) {
                await api.commentSuggestion(s.id, comment.trim());
                setComment('');
                onChanged();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
