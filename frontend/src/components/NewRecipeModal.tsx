import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { useUi } from '../store/ui';
import { IngredientIcon } from '../lib/ingredientIcons';
import { createParser } from '../lib/parser';
import type { ParsedItem, RecipeDraft, NewRecipePayload } from '../types/models';

type DraftIng = ParsedItem & { skip?: boolean };

interface EditDraft {
  title: string;
  description: string;
  prep: string;
  cook: string;
  servings: string;
  source: string | null;
  image_url: string | null;
  ingredients: DraftIng[];
  stepsText: string;
}

function emptyDraft(): EditDraft {
  return {
    title: '',
    description: '',
    prep: '',
    cook: '',
    servings: '2',
    source: null,
    image_url: null,
    ingredients: [],
    stepsText: '',
  };
}

function fromImported(d: RecipeDraft): EditDraft {
  return {
    title: d.title,
    description: d.description,
    prep: d.prep_time ? String(d.prep_time) : '',
    cook: d.cook_time ? String(d.cook_time) : '',
    servings: d.servings ? String(d.servings) : '2',
    source: d.source,
    image_url: d.image_url,
    ingredients: d.ingredients.map((i) => ({ ...i, skip: false })),
    stepsText: d.steps.map((s) => s.content).join('\n'),
  };
}

// "2 cups flour" + matched "flour" → "2 cups" (keep the quantity, drop the dupe name).
function amountFor(p: DraftIng): string | null {
  if (!p.match) return p.raw;
  const esc = p.match.display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = p.raw.replace(new RegExp(esc, 'ig'), '').replace(/\s+/g, ' ').trim();
  return stripped || null;
}

export function NewRecipeModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useUi((s) => s.toast);
  const { data: dict } = useQuery({
    queryKey: ['ingredient-dictionary'],
    queryFn: () => api.dictionary(),
    staleTime: 60 * 60 * 1000,
  });
  const parser = useMemo(() => (dict ? createParser(dict) : null), [dict]);

  const [stage, setStage] = useState<'choose' | 'edit'>('choose');
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>(emptyDraft());
  const [pasteText, setPasteText] = useState('');
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<EditDraft>) => setDraft((d) => ({ ...d, ...p }));

  const doImport = async () => {
    setImporting(true);
    setImportErr(null);
    try {
      const { draft: d } = await api.importRecipe(url.trim());
      setDraft(fromImported(d));
      setStage('edit');
    } catch (e) {
      setImportErr(
        e instanceof ApiError ? e.message : "Couldn't reach that page — check the link and try again."
      );
    } finally {
      setImporting(false);
    }
  };

  const startManual = () => {
    setDraft(emptyDraft());
    setStage('edit');
  };

  const addPasted = async () => {
    if (!pasteText.trim()) return;
    let items: ParsedItem[];
    try {
      items = parser ? parser.parse(pasteText) : (await api.parse(pasteText)).items;
    } catch {
      toast("Couldn't parse those — please try again.");
      return;
    }
    patch({ ingredients: [...draft.ingredients, ...items.map((i) => ({ ...i, skip: false }))] });
    setPasteText('');
  };

  const save = async () => {
    const kept = draft.ingredients.filter((p) => !p.skip);
    const payload: NewRecipePayload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      prep_time: Number(draft.prep) || 0,
      cook_time: Number(draft.cook) || 0,
      servings: Number(draft.servings) || 2,
      source: draft.source,
      image_url: draft.image_url,
      ingredients: kept.map((p) =>
        p.match
          ? { ingredient_id: p.match.id, amount: amountFor(p), is_optional: false }
          : { ingredient_id: null, amount: p.raw, is_optional: false }
      ),
      steps: draft.stepsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((content) => ({ content })),
    };
    setSaving(true);
    try {
      const { recipe } = await api.createRecipe(payload);
      qc.invalidateQueries({ queryKey: ['recipe-suggestions'] });
      toast('Recipe saved');
      onClose();
      navigate(`/recipes/${recipe.slug}`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't save — please try again.");
      setSaving(false);
    }
  };

  const matched = draft.ingredients.filter((p) => p.match && !p.skip).length;
  const canSave = draft.title.trim().length > 0 && draft.ingredients.some((p) => !p.skip);

  if (stage === 'choose') {
    return (
      <Modal onClose={onClose} eyebrow="Add a recipe" title="New recipe">
        <p className="muted small">
          Paste a link from any recipe site — we'll pull the title, ingredients and steps from its
          structured data and match ingredients to your pantry. Or enter one by hand.
        </p>
        {importErr && <div className="error" role="alert">{importErr}</div>}
        <label className="field-label">Import from a link</label>
        <input
          className="text-input"
          type="url"
          inputMode="url"
          placeholder="https://example.com/recipes/spaghetti"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url.trim() && !importing) doImport();
          }}
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={startManual}>
            Enter manually
          </button>
          <button className="btn btn-primary" onClick={doImport} disabled={!url.trim() || importing}>
            {importing ? 'Fetching…' : (
              <>
                Import <Icon name="arrow" size={14} />
              </>
            )}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} eyebrow={draft.source ? 'Confirm import' : 'New recipe'} title="Recipe details">
      <label className="field-label">Title</label>
      <input
        className="text-input"
        placeholder="e.g. Weeknight tomato pasta"
        value={draft.title}
        onChange={(e) => patch({ title: e.target.value })}
        autoFocus
      />

      <label className="field-label">Description</label>
      <textarea
        className="text-input"
        rows={2}
        placeholder="One line about the dish (optional)"
        value={draft.description}
        onChange={(e) => patch({ description: e.target.value })}
      />

      <div className="row-inline" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 90 }}>
          <label className="field-label">Prep (min)</label>
          <input
            className="text-input"
            type="number"
            min={0}
            value={draft.prep}
            onChange={(e) => patch({ prep: e.target.value })}
          />
        </div>
        <div style={{ flex: 1, minWidth: 90 }}>
          <label className="field-label">Cook (min)</label>
          <input
            className="text-input"
            type="number"
            min={0}
            value={draft.cook}
            onChange={(e) => patch({ cook: e.target.value })}
          />
        </div>
        <div style={{ flex: 1, minWidth: 90 }}>
          <label className="field-label">Servings</label>
          <input
            className="text-input"
            type="number"
            min={1}
            value={draft.servings}
            onChange={(e) => patch({ servings: e.target.value })}
          />
        </div>
      </div>

      <label className="field-label">
        Ingredients{' '}
        <span className="muted small">
          — {matched} matched to pantry{draft.ingredients.length ? `, ${draft.ingredients.length} total` : ''}
        </span>
      </label>
      {draft.ingredients.length > 0 && (
        <ul className="parse-preview">
          {draft.ingredients.map((p, i) => (
            <li
              key={i}
              className={p.skip ? 'skip' : p.match ? (p.match.confidence === 'maybe' ? 'maybe' : 'matched') : 'unmatched'}
            >
              <button
                className="tick"
                aria-pressed={!p.skip}
                aria-label={p.skip ? `Include ${p.raw}` : `Remove ${p.raw}`}
                onClick={() =>
                  patch({ ingredients: draft.ingredients.map((x, j) => (i === j ? { ...x, skip: !x.skip } : x)) })
                }
              >
                {!p.skip ? <Icon name="check" size={14} /> : null}
              </button>
              <span className="raw">{p.raw}</span>
              <span className="arrow">→</span>
              {p.match ? (
                <span className="match">
                  <IngredientIcon id={p.match.id} section={p.match.section} size={22} title={p.match.display} />
                  <span className={`section-dot section-dot-${p.match.section}`} />
                  {p.match.confidence === 'maybe' ? <em>{p.match.display}?</em> : p.match.display}
                </span>
              ) : (
                <span className="unmatched-label">kept as text</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <textarea
        className="paste"
        rows={3}
        placeholder={'Paste or type ingredients, one per line\n2 chicken thighs\n500g beef mince'}
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
      />
      <button className="btn btn-ghost" onClick={addPasted} disabled={!pasteText.trim()} style={{ alignSelf: 'flex-start' }}>
        <Icon name="plus" size={14} /> Parse &amp; add
      </button>

      <label className="field-label">Method <span className="muted small">— one step per line</span></label>
      <textarea
        className="paste"
        rows={5}
        placeholder={'Boil the pasta until al dente.\nMeanwhile, soften the garlic in oil.'}
        value={draft.stepsText}
        onChange={(e) => patch({ stepsText: e.target.value })}
      />

      {draft.source && (
        <p className="muted small">
          Source: <a href={draft.source} target="_blank" rel="noopener noreferrer nofollow">{draft.source}</a>
        </p>
      )}

      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={() => setStage('choose')}>
          Back
        </button>
        <button className="btn btn-primary" onClick={save} disabled={!canSave || saving}>
          {saving ? 'Saving…' : 'Save recipe'}
        </button>
      </div>
    </Modal>
  );
}
