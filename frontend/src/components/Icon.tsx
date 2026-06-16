import type { ReactNode } from 'react';

const paths: Record<string, ReactNode> = {
  list: <path d="M4 6h16M4 12h16M4 18h16" />,
  pantry: <path d="M4 4h16v4H4zM4 10h16v10H4zM10 13h4" />,
  chef: <path d="M7 21h10M7 21v-3m10 3v-3M6 18h12V10a4 4 0 0 0-3-3.87V5a3 3 0 1 0-6 0v1.13A4 4 0 0 0 6 10v8z" />,
  group: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 2-3.5 4-3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12l5 5L20 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  msg: <path d="M4 5h16v10H8l-4 4V5z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
    </>
  ),
  sparkle: <path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />,
  refresh: <path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" />,
  print: (
    <>
      <path d="M6 9V4h12v5" />
      <rect x="4" y="9" width="16" height="9" rx="1" />
      <rect x="7" y="14" width="10" height="6" />
    </>
  ),
  low: <path d="M12 3v10M12 17v.01M5 21h14" />,
  cart: (
    <>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M3 4h3l2.5 12h11L21 8H7" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" />
    </>
  ),
  home: <path d="M4 11l8-7 8 7M6 10v9h12v-9M10 19v-5h4v5" />,
};

export function Icon({ name, size = 18 }: { name: keyof typeof paths | string; size?: number }) {
  const p = paths[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {p}
    </svg>
  );
}
