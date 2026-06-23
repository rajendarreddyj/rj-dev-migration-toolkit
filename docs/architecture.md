# Architecture

## Pipeline Model

The migration toolkit uses a **coordinator + specialist** pattern:

- **Coordinator** (claude-opus-4): Manages the pipeline, makes routing decisions, handles errors
- **Specialists** (claude-sonnet-4): Execute specific phases with deep domain knowledge

State is shared between agents via **file-based manifests** in `context/migration/`.

## State Machine

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│ DISCOVER │──►[snap]►──────│   PLAN   │──►[snap]►──────│ API GAP+DB │──►[snap]►──│ BACKEND  │
│          │     │          │     │              │     │          │
└──────────┘     └──────────┘     └──────────────┘     └──────────┘
                       │                                      │
                  [human                                 [TDD loop:
                   approval]                             max 3 retries]
                                                              │
                                                              ▼
                 ┌──────────┐     ┌──────────┐     ┌──────────┐
                 │ CUTOVER  │◄─[snap]─────── │ VALIDATE │◄─[snap]─│ FRONTEND │
                 │          │     │          │     │          │
                 └──────────┘     └──────────┘     └──────────┘
                                                        │
                                                   [TDD loop:
                                                    max 3 retries]
```

`[snap]` = compacted phase snapshot written to `context/migration/{module}/snapshots/` and `session-context.md` updated.

## File-Based State

Each module’s state is tracked in `context/migration/manifest.md`. At every phase gate, a **compacted phase snapshot** (< 80 lines) is also written to `context/migration/{module}/snapshots/`. The global index `context/migration/session-context.md` is updated after every snapshot.

### manifest.md format

```markdown
## Module: project-management

| Phase | Status | Agent | Started | Completed | Artifacts |
|-------|--------|-------|---------|-----------|----------|
| 1-Discovery | ✅ Complete | Discovery | 2025-01-15 | 2025-01-15 | discovery-report.md |
| 2-Plan | ⏸️ Awaiting Approval | Coordinator | 2025-01-15 | - | migration-plan.md |
| 3-Backend | ⬜ Not Started | - | - | - | - |
| 4-Frontend | ⬜ Not Started | - | - | - | - |
| 5-Validate | ⬜ Not Started | - | - | - | - |
| 6-Cutover | ⬜ Not Started | - | - | - | - |
```

### session-context.md (global index)

```markdown
# Session Context

Last updated: 2025-01-16T09:00:00Z

## Active Modules

| Module | Last Phase | Status | Snapshot |
|--------|-----------|--------|----------|
| project-management | 4-backend | in-progress | snapshots/phase-4-backend.snap.md |
| user-management | 6-cutover | complete | snapshots/phase-6-cutover.snap.md |
```

## Snapshot & Session Context System

### Phase Snapshots

At every pipeline gate, the coordinator writes a compacted snapshot (< 80 lines, YAML front-matter + Markdown body) to:

```
context/migration/{module}/snapshots/phase-{N}-{name}.snap.md
```

Snapshot content includes: phase name, status, key decisions made, artifacts produced, known blockers, and what happens next.

### session-context.md (Cross-Session Index)

`context/migration/session-context.md` is a lightweight index updated after every snapshot. The `session-start` hook auto-injects it into the agent’s context window when a new session begins, so agents always know the current state without re-running discovery.

### Hook Auto-Load Order

```
session-start (bash / cmd)
  1. Load skills/migration-toolkit-reference/SKILL.md  (always)
  2. Walk up from $PWD looking for context/migration/session-context.md
  3. If found: inject as ## Active Session Context (from workspace)
```

### Manual Commands

| Command | Effect |
|---------|--------|
| `load-context module:{name} phase:{N}` | Restore specific phase snapshot as context |
| `snapshot module:{name} phase:{N}` | Force-write snapshot for current phase |

## Skill Self-Improvement Loop

During a migration run, any agent can emit a `skill-improvement` fenced code block when it encounters a pattern not covered (or wrongly covered) by a skill:

````
```skill-improvement
skill: migration-backend-patterns
trigger: <what triggered the improvement>
problem: <current gap or incorrect guidance>
proposed_fix: <updated guidance>
confidence: high | low
requires_human_approval: true | false
```
````

**Auto-apply rule**: if `confidence: high` AND `requires_human_approval: false`, the toolkit applies the patch to the skill on the next run and increments the skill version. Low-confidence or human-approval-required improvements are queued in `context/migration/skill-improvement-queue.md`.

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
