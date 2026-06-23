---
name: migration-toolkit-reference
description: "Quick reference for migration toolkit usage across supported harnesses, including agent roster, pipeline phases, and command shortcuts."
compatibility: IDE-agnostic
when_to_use:
  - "quick command lookup for migration agents"
  - "pipeline phase reference"
  - "skill or instruction lookup"
  - "suggest improvement to a migration skill"
  - "skill learning, feedback, or self-improvement"
  - "record reusable pattern or anti-pattern"
metadata:
  author: migration-toolkit
  version: "1.1"
---

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

# Load snapshot context for a specific module + phase (resume without re-discovery)
@Migration Coordinator load-context module:project-management phase:4

# Manually write a phase snapshot now
@Migration Coordinator snapshot module:project-management phase:4
```

## Directory Structure

```
context/migration/
├── manifest.md                          # Overall progress tracking
├── session-context.md                   # ← loaded at session start to resume any module
├── skill-improvement-queue.md           # Pending skill improvement proposals
├── {module}/
│   ├── discovery-report.md              # Phase 1 output
│   ├── migration-plan.md                # Phase 2 output
│   ├── conventions.md                   # Project-specific discovered conventions
│   ├── learnings.md                     # Reusable patterns + anti-patterns
│   ├── ralph-review.md                  # Latest RALPH cycle snapshot
│   ├── snapshots/
│   │   ├── phase-1-discovery.snap.md    # Compacted Phase 1 output
│   │   ├── phase-2-plan.snap.md         # Compacted Phase 2 output
│   │   ├── phase-3-api-gap-db.snap.md   # Compacted Phase 3 output
│   │   ├── phase-4-backend.snap.md      # Compacted Phase 4 output
│   │   ├── phase-5-frontend.snap.md     # Compacted Phase 5 output
│   │   ├── phase-6-validate.snap.md     # Compacted Phase 6 output
│   │   └── phase-7-cutover.snap.md      # Compacted Phase 7 output
│   ├── backend/
│   │   ├── api-contracts.md             # OpenAPI snippets
│   │   ├── test-matrix.md              # Test coverage map
│   │   └── implementation-log.md        # Per-endpoint status
│   ├── frontend/
│   │   ├── component-tree.md            # React component hierarchy
│   │   ├── test-matrix.md              # Test coverage map
│   │   └── implementation-log.md        # Per-component status
│   ├── validation/
│   │   ├── parity-report.md            # Phase 6 output
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

## Compacted Phase Output Protocol

At the completion gate of every pipeline phase, agents MUST write a compacted snapshot. These snapshots serve as **resumable context** — they are loaded at the start of future sessions to eliminate re-discovery and prevent duplicate work.

### When to Write a Snapshot

| Gate | Trigger | File written |
|------|---------|-------------|
| Phase 1 complete | Discovery report finalised | `snapshots/phase-1-discovery.snap.md` |
| Phase 2 approved | Human approves plan | `snapshots/phase-2-plan.snap.md` |
| Phase 3 complete | API gaps resolved + Flyway scripts done | `snapshots/phase-3-api-gap-db.snap.md` |
| Phase 4 gate pass | Backend tests green, no stubs | `snapshots/phase-4-backend.snap.md` |
| Phase 5 gate pass | Frontend tests green, no stubs | `snapshots/phase-5-frontend.snap.md` |
| Phase 6 complete | Parity ≥95% or accepted | `snapshots/phase-6-validate.snap.md` |
| Phase 7 complete | Cutover executed | `snapshots/phase-7-cutover.snap.md` |

Also update `context/migration/session-context.md` after **every** snapshot write.

### Snapshot File Format

Keep snapshots compact. Target **<80 lines** per file. Use YAML front-matter for machine-readable state, Markdown body for human-readable summary.

```markdown
---
module: project-management
phase: 4
phase_name: backend
status: complete          # complete | partial | blocked
date: 2026-06-23
parity_score: null        # filled from Phase 6
agents_used:
  - Migration Backend
  - Migration TDD
files_created:
  - src/main/java/com/app/project/controller/ProjectController.java
  - src/main/java/com/app/project/service/ProjectService.java
  - src/test/java/com/app/project/controller/ProjectControllerTest.java
open_items: []            # list blockers or deferred items
---

## Summary

3 servlets converted: ProjectServlet, TaskServlet, CommentServlet.
All JUnit 5 tests passing (23/23). Feature flags: `PROJECTS_V2`, `TASKS_V2`.

## Key Decisions

- Pagination uses 0-based index (legacy was 1-based — adapter added)
- CSV export preserves legacy headers verbatim
- DTO naming: snake_case for REST responses (API compat requirement)

## Conventions Discovered

- All date fields returned as ISO-8601 strings
- Null optional fields omitted from JSON (not null-valued)

## Pending for Phase 5

- Frontend needs `GET /api/projects/{id}/members` — not yet implemented
```

### Session Context Index (`context/migration/session-context.md`)

Maintained automatically. Always 1 file, always overwritten. Loaded by the `session-start` hook.

```markdown
---
last_updated: 2026-06-23
active_modules:
  - name: project-management
    current_phase: 5
    last_snapshot: context/migration/project-management/snapshots/phase-4-backend.snap.md
    status: in_progress
  - name: task-management
    current_phase: 2
    last_snapshot: context/migration/task-management/snapshots/phase-2-plan.snap.md
    status: awaiting_approval
completed_modules:
  - reporting
  - user-management
global_conventions:
  - snake_case REST responses
  - 0-based pagination
  - ISO-8601 dates
skill_improvement_queue: context/migration/skill-improvement-queue.md
---

## Resume Instructions

To resume: `@Migration Coordinator status` then `@Migration Coordinator resume module:project-management`.
Load latest snapshot before starting any phase to avoid re-discovery.
```

### How Agents Load Context at Session Start

1. The `session-start` hook injects `skills/migration-toolkit-reference/SKILL.md` as `<EXTREMELY_IMPORTANT>` context (always)
2. If `context/migration/session-context.md` exists → read it and announce active modules + phases
3. Before starting a phase → read the previous phase’s `.snap.md` for that module
4. Before Phase 1 of a new module → check `manifest.md` for global conventions already discovered

### Snapshot Writing Rules

- **Agents write snapshots themselves** — do not wait for a human prompt
- Write the snapshot file **before** emitting the phase-complete message
- If a phase is interrupted (blocked/partial): write a partial snapshot with `status: partial` and `open_items` populated
- Do **not** duplicate full file contents into snapshots — reference paths only
- Use bullet-point summaries, not prose paragraphs
- Never exceed 80 lines per snapshot

### Loading a Specific Snapshot (Manual)

```
@Migration Coordinator load-context module:project-management phase:4
```

This reads `context/migration/project-management/snapshots/phase-4-backend.snap.md` and sets active context before continuing.

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

---

## Skill Learning & Self-Improvement

Any agent, human, or automated check can propose a change to any skill in this toolkit. The protocol below ensures suggestions are captured, reviewed, and — when approved — merged back into the relevant `SKILL.md`.

### When to Trigger a Skill Improvement

| Situation | Action |
|-----------|--------|
| An agent retried the same step ≥ 2 times due to a missing pattern | Propose new pattern to the owning skill |
| A human correction overrides an agent decision | Capture as anti-pattern in the owning skill |
| A pattern proved universally reusable across ≥ 2 modules | Promote from `learnings.md` to the skill |
| A skill trigger description misses a real use-case | Propose updated `description` or `when_to_use` |
| A code example in a skill is outdated or wrong | Propose a replacement example |
| A new harness or tool is supported | Update harness compatibility tables |

### Improvement Proposal Format

When an agent identifies a skill improvement, it MUST emit a fenced `skill-improvement` block before continuing:

```skill-improvement
skill: <skill-name>            # e.g. migration-backend-patterns
triggered_by: <why>           # e.g. "agent retried servlet conversion 3x - missing filter pattern"
change_type: add|update|remove|fix
section: <section heading>    # where in the SKILL.md the change belongs
current: |                    # (omit if change_type=add)
  existing text / example to replace
proposed: |
  new or replacement text / example
confidence: high|medium|low   # high = proven across ≥2 modules; low = single observation
requires_human_approval: true|false
```

**Rules:**
- `confidence: high` improvements with `requires_human_approval: false` may be applied automatically by any agent after emitting the block.
- `confidence: low` improvements are written to `context/migration/skill-improvement-queue.md` and reviewed at the next RALPH cycle.
- An improvement that modifies `name`, `description`, or `when_to_use` always requires human approval.
- Do **not** delete content from a skill without a `remove` block and human approval.

### Improvement Queue File

```
context/migration/skill-improvement-queue.md
```

Format:
```markdown
## Queue

### [PENDING] <skill-name> — <change_type> — <date>

**Triggered by:** <agent name or human> during <phase> of <module>
**Section:** <section heading>
**Confidence:** <high|medium|low>

**Current:**
```
...
```

**Proposed:**
```
...
```

**Decision:** PENDING | APPROVED | REJECTED
**Applied:** false | <date>
```

### Applying an Approved Improvement

```
# Workflow
1. Read skill-improvement-queue.md
2. Filter entries where Decision=APPROVED and Applied=false
3. For each: edit the relevant SKILL.md section
4. Update queue entry: Applied=<today's date>
5. Emit confirmation: "Applied improvement to <skill-name> § <section>"
```

### Built-in Self-Assessment Triggers

The following events auto-trigger a skill self-assessment pass:

- **End of any migration module** — all skills used during that module are evaluated for gaps
- **3+ retries on a single step** — the owning skill is flagged immediately
- **Human correction** — the correction is evaluated against the skill for coverage
- **New module starts** — previously queued improvements are applied before Phase 1

### Skill Health Checklist

Run this checklist against any skill before closing a module:

- [ ] All patterns observed during this module are represented
- [ ] No outdated API/framework references remain
- [ ] `when_to_use` covers all triggers actually encountered
- [ ] Examples compile / pass lint (for code samples)
- [ ] Anti-patterns section updated with new failures
- [ ] Any pending queue items reviewed (APPROVE or REJECT)
