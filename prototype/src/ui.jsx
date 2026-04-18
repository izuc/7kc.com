// UI primitives and shell
const { useState: uS, useMemo: uM, useEffect: uE, useRef: uR, useCallback: uC } = React;

function Icon({ name, size = 18 }) {
  const paths = {
    list: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    pantry: <><path d="M4 4h16v4H4zM4 10h16v10H4zM10 13h4" /></>,
    chef: <><path d="M7 21h10M7 21v-3m10 3v-3M6 18h12V10a4 4 0 0 0-3-3.87V5a3 3 0 1 0-6 0v1.13A4 4 0 0 0 6 10v8z" /></>,
    group: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 2-3.5 4-3.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <><path d="M5 12l5 5L20 7" /></>,
    x: <><path d="M6 6l12 12M18 6L6 18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    flame: <><path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-4s-1-1-1-2c0-1 4-2 4-2z" /></>,
    heart: <><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></>,
    msg: <><path d="M4 5h16v10H8l-4 4V5z" /></>,
    leaf: <><path d="M5 19c8 0 14-6 14-14-7 0-14 4-14 14zM5 19l7-7" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" /></>,
    sparkle: <><path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" /></>,
    archive: <><path d="M3 7h18v4H3zM5 11v10h14V11M10 15h4" /></>,
    refresh: <><path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" /></>,
    low: <><path d="M12 3v10M12 17v.01M5 21h14" /></>,
    cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /><path d="M3 4h3l2.5 12h11L21 8H7" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function Avatar({ user, size = 24 }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: user.color, fontSize: size * 0.42 }}
      title={user.name}
    >
      {user.name[0]}
    </span>
  );
}

function userById(id) {
  return window.SEED.group.members.find((m) => m.id === id) || { id, name: id, color: '#888' };
}

function Swatch({ palette, label, size = 'md', small, rounded = false }) {
  // abstract placeholder: two-tone gradient in recipe palette + recipe initials
  const [c1, c2] = palette || ['#8c8c8c', '#d4d4d4'];
  const initials = label.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const dim = size === 'sm' ? 44 : size === 'lg' ? 220 : 92;
  return (
    <div
      className={"swatch " + (rounded ? 'rounded' : '')}
      style={{
        width: size === 'full' ? '100%' : dim,
        height: size === 'full' ? 200 : dim,
        background: `linear-gradient(135deg, ${c2} 0%, ${c2} 55%, ${c1} 55%, ${c1} 100%)`,
      }}
    >
      <span style={{ color: c1, mixBlendMode: 'multiply' }}>{initials}</span>
    </div>
  );
}

window.Icon = Icon;
window.Avatar = Avatar;
window.userById = userById;
window.Swatch = Swatch;
