import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { fmtRelative } from '../lib/format';
import { useAuth } from '../store/auth';
import { useUi } from '../store/ui';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import type { RecipeComment } from '../types/models';

const MAX = 1000;

/** Public per-recipe comments — cooks share notes/tips on a dish. */
export function RecipeComments({ slug }: { slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const toast = useUi((s) => s.toast);
  const key = ['recipe-comments', slug];
  const [text, setText] = useState('');

  const { data } = useQuery({ queryKey: key, queryFn: () => api.recipeComments(slug) });
  const comments = data?.comments ?? [];

  const post = useMutation({
    mutationFn: (content: string) => api.addRecipeComment(slug, content),
    onSuccess: (r) => {
      qc.setQueryData(key, r); // server returns the refreshed list
      setText('');
    },
    onError: (e) =>
      toast(e instanceof ApiError ? e.message : "Couldn't post your comment — please try again."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteRecipeComment(slug, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast("Couldn't delete that — please try again."),
  });

  const submit = () => {
    const c = text.trim();
    if (c) post.mutate(c);
  };

  return (
    <section className="recipe-comments">
      <h3>
        Comments {comments.length > 0 && <span className="mono small muted">{comments.length}</span>}
      </h3>

      <div className="comment-compose">
        <textarea
          className="text-input"
          rows={2}
          maxLength={MAX}
          placeholder="Share a tip, a tweak, or how it turned out…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="comment-compose-foot">
          <span className="mono small muted">{text.length > MAX - 100 ? `${MAX - text.length} left` : ''}</span>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={!text.trim() || post.isPending}>
            {post.isPending ? 'Posting…' : 'Post comment'}
          </button>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="muted small">No comments yet — be the first to share a tip.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c: RecipeComment) => (
            <li key={c.id} className="comment">
              <Avatar user={{ user_id: c.user_id, display_name: c.author, color: null }} size={28} />
              <div className="comment-body">
                <div className="comment-head">
                  <b>{c.user_id === user?.id ? 'You' : c.author}</b>
                  <span className="mono small muted">{fmtRelative(c.created_at)}</span>
                  {c.user_id === user?.id && (
                    <button
                      className="comment-delete"
                      aria-label="Delete your comment"
                      onClick={() => remove.mutate(c.id)}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  )}
                </div>
                <p>{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
