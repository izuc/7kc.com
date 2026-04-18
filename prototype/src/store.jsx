// App store — plain React context + reducer. Persists to localStorage.

const { createContext, useContext, useReducer, useEffect, useMemo, useState, useRef, useCallback } = React;

const STORAGE_KEY = '7kc-state-v1';
const D = 86400000;

function initialState() {
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  })();
  if (saved && saved._v === 1) return saved;

  const SEED = window.SEED;
  const lists = SEED.listSeed.map((l) => ({
    id: l.id,
    name: l.name,
    created: l.created,
    archived: l.archived,
    items: l.items.map((it, i) => ({
      id: `${l.id}-i${i}`,
      ingId: it.ing || null,
      custom: it.custom || null,
      section: it.section || (it.ing ? SEED.byId[it.ing].section : 'other'),
      bought: it.bought,
      boughtBy: it.bought ? (Math.random() > 0.5 ? 'u-sarah' : 'u-you') : null,
      addedBy: 'u-you',
      moved: false, // whether moved to pantry yet
    })),
  }));

  const pantry = SEED.pantrySeed.map((p, i) => ({
    id: `p-${i}`,
    ingId: p.ing,
    custom: null,
    added: p.added,
    expires: p.expires,
    low: !!p.low,
  }));

  return {
    _v: 1,
    tab: 'lists',
    activeListId: 'list-1',
    lists,
    pantry,
    cookedRecipes: [], // array of { recipeIdx, at, who }
    feed: SEED.feedSeed.slice(),
    likes: { 's-1': ['u-you'] },
    comments: {
      's-1': [{ who: 'u-sarah', text: 'yes please, I\'ll pick up naan', t: Date.now() - 9 * 3600000 }],
      's-2': [{ who: 'u-mike', text: 'we\'ve got pumpkin that needs eating, perfect', t: Date.now() - 1.5 * 3600000 }],
    },
    suggestions: [
      { id: 's-1', recipe: 'Chicken Tikka Masala', by: 'u-mike', date: 'Friday', t: Date.now() - 10 * 3600000, cooked: false },
      { id: 's-2', recipe: 'Haloumi Grain Bowl', by: 'u-you', date: 'Tomorrow', t: Date.now() - 2 * 3600000, cooked: false },
    ],
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB': return { ...state, tab: action.tab };
    case 'SET_ACTIVE_LIST': return { ...state, activeListId: action.id };

    case 'ADD_LIST': {
      const id = 'list-' + Date.now();
      return { ...state, activeListId: id, lists: [{ id, name: action.name || 'New list', created: Date.now(), archived: false, items: [] }, ...state.lists] };
    }
    case 'RENAME_LIST':
      return { ...state, lists: state.lists.map((l) => l.id === action.id ? { ...l, name: action.name } : l) };
    case 'ARCHIVE_LIST':
      return { ...state, lists: state.lists.map((l) => l.id === action.id ? { ...l, archived: !l.archived } : l) };

    case 'ADD_LIST_ITEMS': {
      const items = action.items.map((it, i) => ({
        id: `li-${Date.now()}-${i}`,
        ingId: it.ingId || null,
        custom: it.custom || null,
        section: it.section,
        bought: false,
        boughtBy: null,
        addedBy: action.who || 'u-you',
        moved: false,
      }));
      return {
        ...state,
        lists: state.lists.map((l) => l.id === action.listId ? { ...l, items: [...l.items, ...items] } : l),
      };
    }

    case 'TOGGLE_BOUGHT':
      return {
        ...state,
        lists: state.lists.map((l) => l.id === action.listId ? {
          ...l,
          items: l.items.map((it) => it.id === action.itemId ? { ...it, bought: !it.bought, boughtBy: !it.bought ? (action.who || 'u-you') : null } : it),
        } : l),
      };

    case 'MARK_ALL_BOUGHT':
      return {
        ...state,
        lists: state.lists.map((l) => l.id === action.listId ? {
          ...l,
          items: l.items.map((it) => ({ ...it, bought: true, boughtBy: it.boughtBy || 'u-you' })),
        } : l),
      };

    case 'REMOVE_LIST_ITEM':
      return {
        ...state,
        lists: state.lists.map((l) => l.id === action.listId ? { ...l, items: l.items.filter((it) => it.id !== action.itemId) } : l),
      };

    case 'MOVE_BOUGHT_TO_PANTRY': {
      const list = state.lists.find((l) => l.id === action.listId);
      if (!list) return state;
      const toMove = list.items.filter((it) => it.bought && !it.moved && !action.excludeIds?.includes(it.id));
      const newPantry = toMove.map((it, i) => {
        const ing = it.ingId ? window.SEED.byId[it.ingId] : null;
        const shelf = ing ? ing.shelf : 14;
        return {
          id: `p-${Date.now()}-${i}`,
          ingId: it.ingId,
          custom: it.custom,
          added: Date.now(),
          expires: Date.now() + shelf * D,
          low: false,
        };
      });
      return {
        ...state,
        pantry: [...newPantry, ...state.pantry],
        lists: state.lists.map((l) => l.id === action.listId ? {
          ...l,
          items: l.items.map((it) => toMove.find((m) => m.id === it.id) ? { ...it, moved: true } : it),
        } : l),
      };
    }

    case 'ADD_PANTRY_ITEM': {
      const ing = action.ingId ? window.SEED.byId[action.ingId] : null;
      const shelf = ing ? ing.shelf : 14;
      return { ...state, pantry: [{
        id: `p-${Date.now()}`, ingId: action.ingId, custom: action.custom, added: Date.now(),
        expires: Date.now() + shelf * D, low: false,
      }, ...state.pantry] };
    }
    case 'REMOVE_PANTRY_ITEM':
      return { ...state, pantry: state.pantry.filter((p) => p.id !== action.id) };
    case 'TOGGLE_LOW':
      return { ...state, pantry: state.pantry.map((p) => p.id === action.id ? { ...p, low: !p.low } : p) };

    case 'COOK_RECIPE': {
      const { recipeIdx, removeIngIds } = action;
      const removedSet = new Set(removeIngIds || []);
      return {
        ...state,
        cookedRecipes: [{ recipeIdx, at: Date.now(), who: 'u-you' }, ...state.cookedRecipes],
        pantry: state.pantry.filter((p) => !p.ingId || !removedSet.has(p.ingId)),
      };
    }

    case 'TOGGLE_LIKE': {
      const cur = state.likes[action.id] || [];
      const you = 'u-you';
      const next = cur.includes(you) ? cur.filter((x) => x !== you) : [...cur, you];
      return { ...state, likes: { ...state.likes, [action.id]: next } };
    }
    case 'ADD_COMMENT':
      return { ...state, comments: { ...state.comments, [action.id]: [...(state.comments[action.id] || []), { who: 'u-you', text: action.text, t: Date.now() }] } };

    case 'ADD_SUGGESTION': {
      const id = 's-' + Date.now();
      const sug = { id, recipe: action.recipe, by: 'u-you', date: action.date, t: Date.now(), cooked: false };
      return {
        ...state,
        suggestions: [sug, ...state.suggestions],
        feed: [{ kind: 'suggest', who: 'u-you', recipe: action.recipe, t: Date.now(), date: action.date, id }, ...state.feed],
      };
    }

    case 'RESET':
      localStorage.removeItem(STORAGE_KEY);
      return initialState();

    default: return state;
  }
}

const StoreContext = createContext(null);

function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, initialState);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }, [state]);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

function useStore() { return useContext(StoreContext); }

// Tweaks — UI mode, density, accent
const TweaksContext = createContext(null);
const TWEAKS_KEY = '7kc-tweaks-v1';

function TweaksProvider({ children }) {
  const [tweaks, setTweaks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TWEAKS_KEY)) || {}; } catch { return {}; }
  });
  const merged = { groupMode: false, density: 'roomy', accent: 'terracotta', showTweaks: false, ...tweaks };
  const update = (patch) => setTweaks((t) => ({ ...t, ...patch }));
  useEffect(() => { localStorage.setItem(TWEAKS_KEY, JSON.stringify(merged)); }, [JSON.stringify(merged)]);

  // Tweaks protocol
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') update({ showTweaks: true });
      if (e.data?.type === '__deactivate_edit_mode') update({ showTweaks: false });
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  return <TweaksContext.Provider value={{ tweaks: merged, update }}>{children}</TweaksContext.Provider>;
}

function useTweaks() { return useContext(TweaksContext); }

window.StoreProvider = StoreProvider;
window.useStore = useStore;
window.TweaksProvider = TweaksProvider;
window.useTweaks = useTweaks;

// utility helpers
window.daysUntil = (ts) => Math.round((ts - Date.now()) / D);
window.fmtExpiry = (ts) => {
  const d = window.daysUntil(ts);
  if (d < 0) return `Expired ${-d}d ago`;
  if (d === 0) return 'Expires today';
  if (d === 1) return 'Expires tomorrow';
  if (d < 7) return `${d} days left`;
  if (d < 30) return `${Math.round(d / 7)} wk left`;
  return `${Math.round(d / 30)} mo left`;
};
window.fmtRelative = (ts) => {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  return Math.round(s / 86400) + 'd ago';
};
window.SECTIONS = [
  { id: 'produce', label: 'Produce' },
  { id: 'meat', label: 'Meat & seafood' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'other', label: 'Other' },
];
