# Services Layer

Services encapsulate all core business logic and workflows for the e-commerce platform.

## Architecture Convention

- Coordinate domain operations (e.g. order calculations, gold-rate price snapshots, payment initiation).
- Services depend on `repositories` for data persistence.
- Services should remain framework-agnostic (avoiding direct references to Express `Request` or `Response` objects).
