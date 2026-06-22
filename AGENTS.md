# AGENTS.md — Migration Toolkit Plugin

> AI-powered migration pipeline: Java Servlet/JSP/ExtJS → Spring Boot 3.x/4.x + React
> 
> **Compatible with:** GitHub Copilot (VS Code), Claude Code, Antigravity, Codex (App/CLI), Cursor

## Plugin Structure

```
.antigravity-plugin/ — Antigravity plugin manifest
.claude-plugin/      — Claude Code plugin manifest
.codex-plugin/       — Codex plugin manifest
.cursor-plugin/      — Cursor plugin manifest
agents/              — 8 specialized migration agents (.agent.md)
skills/              — 9 knowledge skills with patterns and guardrails
prompts/             — 11 workflow prompts for common operations
instructions/        — 2 auto-applied coding standards
templates/           — Project scaffolding templates
docs/                — Extended documentation
package.json         — Plugin metadata for marketplace discovery
```

## Agent Catalog

| Agent | File | Model | Role |
|-------|------|-------|------|
| Migration Coordinator | `agents/migration-coordinator.agent.md` | claude-opus-4 | Orchestrates full 7-phase pipeline |
| Migration Discovery | `agents/migration-discovery.agent.md` | claude-sonnet-4 | Reverse-engineers legacy code |
| Migration API Analyzer | `agents/migration-api-analyzer.agent.md` | claude-sonnet-4 | Finds missing REST endpoints |
| Migration Database | `agents/migration-database.agent.md` | claude-sonnet-4 | Schema → Flyway + JPA |
| Migration Backend | `agents/migration-backend.agent.md` | claude-sonnet-4 | Servlet → Spring Boot |
| Migration Frontend | `agents/migration-frontend.agent.md` | claude-sonnet-4 | ExtJS → React |
| Migration TDD | `agents/migration-tdd.agent.md` | claude-sonnet-4 | Test-first + parity |
| Migration Feature Flags | `agents/migration-featureflags.agent.md` | claude-sonnet-4 | Flag lifecycle |

## Skill Catalog

| Skill | Directory | Trigger |
|-------|-----------|---------|
| Java Style Guide | `skills/migration-java-styleguide/` | Java code review, formatting |
| Build System & Module Strategy | `skills/migration-build-system/` | Build detection, module decisions |
| API Gap Analysis | `skills/migration-api-gap-analysis/` | Missing endpoint detection |
| Strangler Fig | `skills/migration-strangler-fig/` | Incremental cutover patterns |
| Discovery Patterns | `skills/migration-discovery/` | Legacy code analysis |
| Backend Patterns | `skills/migration-backend-patterns/` | Servlet→Controller conversion |
| Frontend Patterns | `skills/migration-frontend-patterns/` | ExtJS→React mapping |
| TDD Patterns | `skills/migration-tdd-patterns/` | Test generation, parity |
| Toolkit Reference | `skills/migration-toolkit-reference/` | Quick command lookup |

## Key Commands

```
@Migration Coordinator migrate module:{name}     # Full pipeline
@Migration Coordinator status                    # Progress dashboard
@Migration Coordinator resume module:{name}      # Continue from checkpoint
@Migration Coordinator rollback module:{name} phase:{n}  # Reset to phase

/migrate-servlet path:{file}                     # Single servlet conversion
/migrate-extjs-view path:{file}                  # Single view conversion
/identify-api-gaps module:{name}                 # Find missing APIs
/analyze-build-system                            # Detect build + module strategy
/validate-parity module:{name}                   # Run parity checks
```

## Pipeline Phases

1. **Discovery** — Scan legacy code, produce structured report
2. **Planning** — Build system analysis, module strategy brainstorming, API contracts, human approval gate
3. **API Gap + DB** — Missing endpoints + Flyway scripts
4. **Backend** — TDD loop: write test → implement → verify (max 3 retries)
5. **Frontend** — TDD loop: write test → implement → verify (max 3 retries)
6. **Validation** — Parity tests, cutover plan generation
7. **Cutover** — Feature flag activation, deployment, rollback procedure
8. **RALPH** — Review → Adapt → Learn → Plan → Handle (continuous improvement loop)

## Coding Standards (auto-applied)

- `instructions/migration-spring-boot.instructions.md` → `**/src/main/java/**/*.java`
- `instructions/migration-react.instructions.md` → `**/*.tsx, **/*.ts`
