# 7KC Frontend

React 18 + TypeScript + Vite. Installable PWA.

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
npm run build      # dist/
npm run preview
```

`VITE_API_URL` points at the backend (defaults to `/api/v1` which proxies to `VITE_API_PROXY` in dev).

## Structure

```
src/
├── components/   Icon, Avatar, Swatch, Modal, Toasts, AppShell
├── pages/        Login, Register, Lists, Pantry, Recipes, Cook, Group, Settings
├── hooks/        useIngredients — cached ingredient directory
├── lib/          api client, format helpers
├── store/        auth context, zustand UI store
├── types/        shared TS types mirroring the API
└── styles.css    design system (terracotta/sage/plum accents, OKLCH)
```
