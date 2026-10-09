# components/ui

This directory contains shadcn/ui components installed via the shadcn CLI.

## Adding a Component

```bash
cd apps/frontend
npx shadcn@latest add <component-name>
```

Examples:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add form
```

## Important Notes

- These components are **owned code** — they are copied into your project, not imported from a package.
- You may modify them freely.
- The `components.json` file in the frontend root controls the shadcn configuration.
- Components depend on `@/lib/utils` (the `cn` function) and Tailwind CSS.

## Currently Installed Components

None — install components as needed during feature development.
