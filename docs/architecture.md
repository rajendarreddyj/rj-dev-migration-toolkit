# Architecture

## Pipeline Model

The migration toolkit uses a **coordinator + specialist** pattern:

- **Coordinator** (claude-opus-4): Manages the pipeline, makes routing decisions, handles errors
- **Specialists** (claude-sonnet-4): Execute specific phases with deep domain knowledge

State is shared between agents via **file-based manifests** in `context/migration/`.

## State Machine

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│ DISCOVER │────►│   PLAN   │────►│ API GAP + DB │────►│ BACKEND  │
│          │     │          │     │              │     │          │
└──────────┘     └──────────┘     └──────────────┘     └──────────┘
                       │                                      │
                  [human                                 [TDD loop:
                   approval]                             max 3 retries]
                                                              │
                                                              ▼
                 ┌──────────┐     ┌──────────┐     ┌──────────┐
                 │ CUTOVER  │◄────│ VALIDATE │◄────│ FRONTEND │
                 │          │     │          │     │          │
                 └──────────┘     └──────────┘     └──────────┘
                                                        │
                                                   [TDD loop:
                                                    max 3 retries]
```

## File-Based State

Each module's state is tracked in `context/migration/manifest.md`:

```markdown
## Module: project-management

| Phase | Status | Agent | Started | Completed | Artifacts |
|-------|--------|-------|---------|-----------|-----------|
| 1-Discovery | ✅ Complete | Discovery | 2025-01-15 | 2025-01-15 | discovery-report.md |
| 2-Plan | ⏸️ Awaiting Approval | Coordinator | 2025-01-15 | - | migration-plan.md |
| 3-Backend | ⬜ Not Started | - | - | - | - |
| 4-Frontend | ⬜ Not Started | - | - | - | - |
| 5-Validate | ⬜ Not Started | - | - | - | - |
| 6-Cutover | ⬜ Not Started | - | - | - | - |
```

## Retry & Rollback

### Retry Policy
- **Max attempts**: 3 per step
- **Between attempts**: Agent re-reads error output and adjusts approach
- **After 3 failures**: Escalates to user with error context and suggested fixes

### Rollback
- **Artifact preservation**: Moved to `context/migration/{module}/rollback/{timestamp}/`
- **Phase reset**: Manifest updated to target phase status
- **Clean state**: Subsequent re-run starts fresh from that phase

## Agent Communication

Agents communicate via artifacts (files), not direct message passing:

```
Coordinator reads manifest.md → decides next phase → invokes specialist agent
Specialist reads {previous-phase-output}.md → produces {current-phase-output}.md
Coordinator reads new artifact → updates manifest → routes to next phase
```

## Feature Flag Integration

```
Legacy Route ──[feature flag OFF]──► Legacy Servlet
                                    │
New Route ──[feature flag ON]──► Spring Boot Controller
                                    │
                                    ▼
                              Strangler Fig Proxy
                              (dual-run in shadow mode)
```

## Tech Stack Assumptions (customizable)

| Layer | Default | Alternatives |
|-------|---------|-------------|
| Backend framework | Spring Boot 4.x | Quarkus, Micronaut |
| Language | Java 25 | Kotlin, Scala |
| Build tool | Maven/Gradle | - |
| Database migration | Flyway | Liquibase |
| Feature flags | Togglz | LaunchDarkly, Unleash |
| Frontend framework | React 19 | Vue 3, Angular 17+ |
| Frontend language | TypeScript 5 | - |
| CSS | Tailwind CSS | CSS Modules, Styled Components |
| Data fetching | TanStack Query v5 | SWR, RTK Query |
| Testing (backend) | JUnit 5 + Mockito | - |
| Testing (frontend) | Vitest + Testing Library | Jest |
| E2E testing | Playwright | Cypress |
