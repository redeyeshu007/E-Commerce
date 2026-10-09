# features

Feature-scoped code goes here.
Each feature is a self-contained directory with its own components, hooks,
and types that are specific to that feature.

Structure per feature:

```
features/
└── <feature-name>/
    ├── components/    Feature-specific UI components
    ├── hooks/         Feature-specific React hooks
    ├── types/         Feature-specific TypeScript types
    └── index.ts       Public API — only export what other features need
```

Planned features (implement during feature development):

- `auth/` — login, registration, password reset
- `products/` — product listing and detail
- `cart/` — cart state and UI
- `checkout/` — checkout flow
- `orders/` — order history and tracking
- `account/` — customer account management
- `admin/` — administration dashboard
