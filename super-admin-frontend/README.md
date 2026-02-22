# Tickflo Super Admin (React + Vite)

Pure frontend React application (no Next.js, no TypeScript, no API integrations). Built with Vite and react-router-dom.

## Run the project

```bash
npm install
npm run dev
```

Then open http://localhost:5173 (or the URL shown in the terminal).

## Build

```bash
npm run build
npm run preview   # preview production build
```

## What’s included

- **Routing**: react-router-dom (no Next.js app router).
- **Auth**: Mock auth via `useAuth` (localStorage; any credentials work on login).
- **Data**: All data is mocked in hooks (`use-super-admin`, `use-branding`, `use-status`). No axios/fetch/API.
- **UI**: Existing UI components and Tailwind/Radix remain; no server-side logic.

## Removed

- Next.js (app router, `next.config`, `next/link`, `next/navigation`, `next/font`).
- TypeScript (converted to JS; some `.tsx`/`.ts` files may remain for reference but entry is JS/JSX).
- API layer (`api/`, `superadmin-apis/`, `lib/axios`), and all axios/fetch/backend calls.
- `next-themes` (Toaster uses a fixed theme).

## Routes

- `/` – Redirects to `/dashboard` or `/login` based on auth.
- `/login` – Login (mock; any email/password).
- `/dashboard` – Dashboard with mock stats.
- `/tenant-management` – Tenant list (mock).
- `/tenant-management/create` – Placeholder (no wizard API).
- `/tenant-management/:id` – Tenant details (mock).
- `/tenant-management/:id/edit` – Tenant edit (mock).
- `/pricing-plans` – Pricing plans (mock).
- `/integrations` – Integrations (mock).
- `/system-settings` – System settings (UI only).
