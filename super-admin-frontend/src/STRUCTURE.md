# Project Structure – Inventory Super Admin

React app structure (components, pages, hooks, services, data):

```
src/
├── components/           # Reusable UI & layout
│   ├── ui/              # Primitives (Button, Card, Input, etc.)
│   ├── forms/           # Form components (CreateTenantForm, PlanForm)
│   ├── layout/         # Layout (DashboardLayout – sidebar + main)
│   ├── screens/        # Full-screen components (Login, InboundEmailsManager)
│   └── comman/         # Common (Loading)
├── containers/         # Feature containers (tenant tabs, integrations)
│   ├── tenant/tenantTabs/
│   └── integrations/
├── pages/              # Route-level page components
├── hooks/              # Custom hooks (use-auth, use-super-admin, etc.)
├── services/           # API layer (api.js – replace with real API)
├── data/               # Dummy/static data (dummyData.js)
├── lib/                # Utils & constants
│   ├── utils.js
│   └── constants/options.js
├── App.jsx
└── main.jsx
```

**API replace:** `src/services/api.js` – jab backend banaogi, yahi file mein real calls add karna.
