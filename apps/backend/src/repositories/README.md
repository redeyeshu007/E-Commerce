# Repositories Layer

Repositories abstract data access and database interactions (Prisma queries) from the business logic.

## Architecture Convention

- All database queries (CRUD, joins, transactions) are encapsulated here.
- Interacts directly with the Prisma client (`@/lib/prisma`).
- Exposes typed domain entities to services.
