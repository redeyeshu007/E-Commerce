# Controllers Layer

Controllers handle incoming HTTP requests, validate input via validation schemas, invoke the corresponding service functions, and return formatted API responses using standard response utilities (`@/utils/response`).

## Architecture Convention

- Keep controllers thin: no raw database queries, transactions, or business rules here.
- Delegate all business logic to the `services` layer or feature-specific modules under `modules/`.
- Handle expected and unexpected exceptions gracefully via global error handlers.
