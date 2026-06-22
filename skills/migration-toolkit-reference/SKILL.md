# Migration Toolkit — Quick Reference

> **Compatibility:** GitHub Copilot (VS Code), Claude Code, Antigravity, Codex (App/CLI), Cursor

## Cross-Tool Installation

| Tool | Install Method |
|------|---------------|
| **GitHub Copilot** (VS Code) | Add to `chat.pluginLocations` in settings.json |
| **Claude Code** | `/plugin install` → reads `.claude-plugin/manifest.json` |
| **Antigravity** | `agy plugin install <repo-url>` → reads `.antigravity-plugin/manifest.json` |
| **Codex** (App/CLI) | Plugin marketplace or `/plugins install` → reads `.codex-plugin/manifest.json` |
| **Cursor** | `/add-plugin migration-toolkit` → reads `.cursor-plugin/manifest.json` |

All platforms discover: `skills/*/SKILL.md`, `agents/*.agent.md`, `prompts/*.prompt.md`, `instructions/*.instructions.md`

---

## Agent Roster

| Agent | Invocation | Phase | Purpose |
|-------|-----------|-------|---------|
| **Migration Coordinator** | `@Migration Coordinator migrate module:X` | All | Orchestrates full pipeline with retry/rollback |
| **Migration Discovery** | `@Migration Discovery` | 1 | Reverse-engineers legacy code |
| **Migration API Analyzer** | `@Migration API Analyzer module:X` | 3 | Identifies missing REST endpoints for UI |
| **Migration Database** | `@Migration Database` | 3 | Schema migration → Flyway + JPA entities |
| **Migration Backend** | `@Migration Backend` | 4 | Servlet → Spring Boot (Google Java Style) |
| **Migration Frontend** | `@Migration Frontend` | 5 | ExtJS → React (+ Figma MCP when available) |
| **Migration TDD** | `@Migration TDD` | 4,5,6 | Test-first + parity validation |
| **Migration Feature Flags** | `@Migration Feature Flags design module:X` | 2,7 | Flag architecture + lifecycle |

## Pipeline Phases

```
Phase 1: DISCOVER → Phase 2: PLAN → Phase 3: API GAP + DB SCHEMA → Phase 4: BACKEND → Phase 5: FRONTEND → Phase 6: VALIDATE → Phase 7: CUTOVER
                         │                 ↑                              ↑                    ↑                    │
                         │                 │                              └────────────────────┴────── LOOP (max 3 retries, then escalate)
                         │                 └──────── RE-SCAN (if frontend finds new gaps during Phase 5)
                         │
                         ├── Completeness Validation (auto)
                         ├── Bug Discovery via Jira (auto)
                         └── HUMAN GATE before Phase 3

Gates: Phase 4→5 = Backend Write Gate (tests green, no stubs)
       Phase 5→6 = Frontend Write Gate (tests green, no stubs)

Retry policy: 3 attempts per step → escalate to user
Rollback: `@Migration Coordinator rollback module:X to:phase:N`
```

## Quick Commands

```
# Start full migration for a module
@Migration Coordinator migrate module:project-management

# Check status
@Migration Coordinator status

# Resume interrupted migration
@Migration Coordinator resume module:project-management

# Identify missing REST endpoints for UI integration
@Migration API Analyzer module:project-management

# Verify API coverage after backend implementation
@Migration API Analyzer verify module:project-management

# Migrate single servlet (no orchestration)
Use prompt: migrate-servlet.prompt.md

# Migrate single ExtJS view (no orchestration)
Use prompt: migrate-extjs-view.prompt.md

# Migrate single JSP (no orchestration)
Use prompt: migrate-jsp-page.prompt.md

# Run parity validation standalone
Use prompt: validate-parity.prompt.md

# Batch migrate multiple modules
Use prompt: migrate-batch.prompt.md

# Identify missing endpoints for a module
Use prompt: identify-api-gaps.prompt.md

# Generate OpenAPI spec from legacy endpoints
Use prompt: generate-openapi-spec.prompt.md

# Generate CI/CD pipeline for migrated app
Use prompt: generate-cicd-pipeline.prompt.md

# Export toolkit for use in another project
Use prompt: export-migration-toolkit.prompt.md
```

## Directory Structure

```
context/migration/
├── manifest.md                          # Overall progress tracking
├── {module}/
│   ├── discovery-report.md              # Phase 1 output
│   ├── migration-plan.md                # Phase 2 output
│   ├── backend/
│   │   ├── api-contracts.md             # OpenAPI snippets
│   │   ├── test-matrix.md              # Test coverage map
│   │   └── implementation-log.md        # Per-endpoint status
│   ├── frontend/
│   │   ├── component-tree.md            # React component hierarchy
│   │   ├── test-matrix.md              # Test coverage map
│   │   └── implementation-log.md        # Per-component status
│   ├── validation/
│   │   ├── parity-report.md            # Phase 5 output
│   │   └── regression-results.md       # Test run results
│   └── cutover/
│       ├── feature-flags.md            # Flag activation plan
│       ├── deployment-checklist.md     # Go-live checklist
│       └── rollback-plan.md            # Per-flag rollback steps
```

## Skills Reference

| Skill | When Used | Key Content |
|-------|-----------|-------------|
| `migration-java-styleguide` | **All backend code** | Google Java Style + Spring Boot 4 conventions |
| `migration-api-gap-analysis` | **Phase 3 + Phase 5** | Detect missing endpoints for UI integration |
| `migration-strangler-fig` | **All phases** | API compatibility, dual-run, traffic routing |
| `migration-discovery` | Phase 1 | Search patterns for legacy code analysis |
| `migration-backend-patterns` | Phase 4 | Servlet→Controller recipes + Spring Boot 4 patterns |
| `migration-frontend-patterns` | Phase 5 | ExtJS→React conversion recipes |
| `migration-tdd-patterns` | Phases 4-6 | Test patterns for parity validation |

## Instructions (Auto-Applied)

| File | Applied To | Enforces |
|------|-----------|----------|
| `migration-spring-boot.instructions.md` | `**/*.java` | Spring Boot coding standards |
| `migration-react.instructions.md` | `**/*.tsx, **/*.ts` | React/TypeScript standards |

## TDD Loop (Core Mechanism)

```
1. TDD Agent generates test shell (tests FAIL)
2. Implementation Agent writes code (tests PASS)
3. If tests still fail after 3 attempts → escalate to user
4. Log completion → move to next item
```

## Feature Flag Lifecycle

```
DESIGN → IMPLEMENT → TEST (both states) → ROLLOUT (%) → MONITOR → CLEANUP
```

## Escalation Points

- Phase 2 → Human must approve plan before implementation
- Phase 4/5 → 3 test failures → escalate with failure log
- Phase 6 → Parity gaps → targeted fix loop (max 3) then escalate
- Phase 7 → Deployment requires explicit human go-ahead

---

## RALPH Loop (Review → Adapt → Learn → Plan → Handle)

A continuous improvement feedback loop that runs after each phase to make the toolkit smarter with every migration.

### When RALPH Triggers

- After Phase 6 (VALIDATE) — Reviews parity gaps
- After Phase 7 (CUTOVER) — Post-deployment learning
- On retry/failure — Captures what went wrong
- On user correction — When human overrides agent decision

### The 5 Steps

```
① REVIEW  ──►  ② ADAPT  ──►  ③ LEARN
     ▲                            │
     │                            ▼
⑤ HANDLE  ◄──────────────  ④ PLAN
```

**① REVIEW** — Compare expected vs actual outcomes. Note human corrections, parity gaps, failures.

**② ADAPT** — Update `context/migration/{module}/conventions.md` with project-specific adjustments.

**③ LEARN** — Extract reusable patterns and anti-patterns → `context/migration/{module}/learnings.md`

**④ PLAN** — Incorporate learnings into remaining phases. Re-prioritize modules. Adjust retries.

**⑤ HANDLE** — Apply learned patterns to next module. Update skills if universally applicable.

### RALPH Output

```yaml
# context/migration/{module}/ralph-review.md
ralph_cycle:
  phase_reviewed: 4
  module: "project-management"
  review:
    outcome: "partial_success"
    parity_score: "87%"
    gaps: ["Date formatting in CSV export", "Pagination off-by-one"]
    human_corrections: ["Changed DTO naming to snake_case for API compat"]
  adapt:
    project_conventions: ["snake_case in REST responses", "CSV preserves legacy headers"]
  learn:
    reusable: ["Check pagination base (0 vs 1) in Discovery", "CSV byte-exact comparison"]
    anti_patterns: ["Don't assume camelCase without checking legacy format"]
  plan:
    adjustments: ["Add pagination-base to Discovery checklist", "Add DTO transformer for frontend"]
  handle:
    applied: ["Updated discovery-report.md", "Added convention to module-strategy.md"]
```

### RALPH + Build System Brainstorming

After first module completes, RALPH learnings feed into brainstorming for module #2:
- Previous module's conventions inform next module's strategy
- Build system decisions benefit from discovered patterns
- Module boundary decisions informed by actual dependency graphs found

- Discovery finds unknowns → ask product owner
- Plan review → requires explicit human "approved"
- Parity gaps after 2 loops → document + accept or fix
- Cutover → requires explicit human "go"
