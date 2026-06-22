# Migration Toolkit — Servlet/JSP/ExtJS → Spring Boot + React

An AI-powered migration toolkit that orchestrates the incremental modernization of legacy Java Servlet, JSP, and ExtJS applications into Spring Boot 3.x + React (TypeScript) with full TDD coverage, feature flag gating, and production-safe Strangler Fig cutover.

## What It Does

- **Discovers** legacy endpoints, business rules, and data flows without modifying code
- **Plans** migration strategies with human approval checkpoints
- **Identifies** missing REST endpoints needed for UI integration
- **Migrates** database schemas via Flyway with rollback scripts
- **Converts** servlets → Spring Boot controllers (TDD-first, Google Java Style)
- **Converts** ExtJS → React components (TDD-first, TypeScript + Tailwind)
- **Validates** behavioral parity between legacy and new implementations
- **Manages** feature flag lifecycle for safe incremental rollout
- **Generates** CI/CD pipelines, OpenAPI specs, and deployment checklists

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MIGRATION COORDINATOR (Opus)                             │
│  Orchestrates 7-phase pipeline per module with retry/rollback                   │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Phase 1        Phase 2       Phase 3         Phase 4         Phase 5           │
│  DISCOVER ──►  PLAN ──►  API GAP + DB ──►  BACKEND ──►  FRONTEND              │
│  (read-only)   (approve)  (contracts)       (TDD loop)    (TDD loop)            │
│                                                                                 │
│                              Phase 6         Phase 7                             │
│                              VALIDATE ◄──── CUTOVER                             │
│                              (parity)       (flags + deploy)                    │
│                                                                                 │
│  Retry: 3 attempts per step → escalate                                          │
│  Rollback: preserve artifacts, reset to target phase                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [Getting Started](docs/getting-started.md) | Install, configure, run first migration |
| [Usage Guide & Sample Prompts](docs/usage-guide.md) | 13 scenarios with copy-paste prompts |
| [Architecture](docs/architecture.md) | Pipeline model, state machine, retry/rollback |
| [Customization](docs/customization.md) | Change target stack, add agents, swap providers |

## Installation

### GitHub Copilot (VS Code) — Recommended

Add to your VS Code settings:

```json
{
  "chat.pluginLocations": {
    "/path/to/rj-dev-migration-toolkit": true
  }
}
```

### Claude Code

```bash
/plugin install /path/to/rj-dev-migration-toolkit
```

Or clone and register:
```bash
git clone https://github.com/rajendarreddyj/rj-dev-migration-toolkit.git ~/.claude/plugins/migration-toolkit
```

### Antigravity

```bash
agy plugin install https://github.com/rajendarreddyj/rj-dev-migration-toolkit
```

### Codex (App & CLI)

**Codex App:** Plugins → Install from path → select `rj-dev-migration-toolkit/`

**Codex CLI:**
```bash
/plugins install /path/to/rj-dev-migration-toolkit
```

### Cursor

In Cursor Agent chat:
```
/add-plugin /path/to/rj-dev-migration-toolkit
```

### As Git Submodule

```bash
git submodule add https://github.com/rajendarreddyj/rj-dev-migration-toolkit.git .github/plugins/migration-toolkit
```

### Manual Copy

Copy the contents into your project's `.github/` directory:

```bash
cp -r rj-dev-migration-toolkit/agents/     .github/agents/
cp -r rj-dev-migration-toolkit/skills/     .github/skills/
cp -r rj-dev-migration-toolkit/prompts/    .github/prompts/
cp -r rj-dev-migration-toolkit/instructions/ .github/instructions/
cp -r rj-dev-migration-toolkit/templates/  .
```

## Prerequisites

- **VS Code Insiders** with GitHub Copilot (agent mode enabled)
- **Legacy codebase** with Java Servlets, JSPs, and/or ExtJS views
- **Target stack**: Spring Boot 3.x, React 19+, TypeScript, Tailwind CSS

## Quick Start

```
# 1. Start full migration for a module
@Migration Coordinator migrate module:project-management

# 2. Check status
@Migration Coordinator status

# 3. Resume after pause
@Migration Coordinator resume module:project-management
```

## Agent Roster

| Agent | Purpose | Model |
|-------|---------|-------|
| **Migration Coordinator** | Orchestrates full pipeline with retry/rollback | claude-opus-4 |
| **Migration Discovery** | Reverse-engineers legacy code (read-only) | claude-sonnet-4 |
| **Migration API Analyzer** | Identifies missing REST endpoints for UI | claude-sonnet-4 |
| **Migration Database** | Schema → Flyway + JPA entities | claude-sonnet-4 |
| **Migration Backend** | Servlet → Spring Boot (Google Java Style) | claude-sonnet-4 |
| **Migration Frontend** | ExtJS → React + Tailwind (Figma MCP opt.) | claude-sonnet-4 |
| **Migration TDD** | Test-first + parity validation | claude-sonnet-4 |
| **Migration Feature Flags** | Flag lifecycle (Togglz + React context) | claude-sonnet-4 |

## Skills

| Skill | Purpose |
|-------|---------|
| `migration-java-styleguide` | Google Java Style conventions |
| `migration-build-system` | Detect Maven/Gradle, module strategy brainstorming |
| `migration-api-gap-analysis` | Detect missing endpoints for UI integration |
| `migration-strangler-fig` | API compatibility, dual-run, traffic routing |
| `migration-discovery` | Search patterns for legacy code analysis |
| `migration-backend-patterns` | Servlet→Controller recipes |
| `migration-frontend-patterns` | ExtJS→React component mapping |
| `migration-tdd-patterns` | Parity tests, dual-state flag tests |
| `migration-toolkit-reference` | Quick reference, RALPH loop, cross-tool compat |

## Prompts

| Prompt | Use Case |
|--------|----------|
| `migrate-module-full` | Full 7-phase orchestration per module |
| `migrate-batch` | Multi-module with dependency ordering |
| `migrate-servlet` | Single servlet→controller (standalone) |
| `migrate-extjs-view` | Single ExtJS→React view (standalone) |
| `migrate-jsp-page` | Single JSP→React page (standalone) |
| `validate-parity` | Standalone parity validation |
| `identify-api-gaps` | Find missing REST endpoints |
| `analyze-build-system` | Detect build system + module strategy brainstorming |
| `generate-openapi-spec` | Reverse-engineer legacy into OpenAPI 3.1 |
| `generate-cicd-pipeline` | GitHub Actions for migrated app |
| `export-migration-toolkit` | Portable export of this toolkit |

## RALPH Loop (Continuous Improvement)

The toolkit includes a feedback loop that runs after each migration phase:

```
① REVIEW  → Compare expected vs actual outcomes
② ADAPT   → Update project-specific conventions
③ LEARN   → Extract reusable patterns & anti-patterns
④ PLAN    → Incorporate into remaining phases
⑤ HANDLE  → Apply to next module's migration
```

RALPH ensures each subsequent module migration benefits from lessons learned. Output stored in `context/migration/{module}/ralph-review.md`.

## Coding Standards

The toolkit enforces two sets of auto-applied coding standards:

- **`migration-spring-boot.instructions.md`** — Applied to `**/src/main/java/**/*.java`
  - Google Java Style (2-space indent, K&R braces, 100-col)
  - Spring Boot layered architecture
  - Records for DTOs, constructor injection, RFC 7807 errors

- **`migration-react.instructions.md`** — Applied to `**/*.tsx, **/*.ts`
  - Functional components + hooks only
  - TanStack Query for server state
  - Tailwind CSS, no inline styles
  - Zod for validation, React Hook Form for forms

## Customization

### Target Stack

Edit the agents and instructions to match your target stack. The toolkit is designed for:
- **Backend**: Spring Boot 3.x, Java 21+, PostgreSQL, Flyway
- **Frontend**: React 19, TypeScript 5, Tailwind CSS, TanStack Query v5

To change (e.g., to MySQL, Vue.js, or Kotlin), update:
1. `instructions/migration-spring-boot.instructions.md`
2. `skills/migration-backend-patterns/SKILL.md`
3. `agents/migration-backend.agent.md`

### Feature Flag Provider

Default: Togglz (Java) + React Context (frontend). To use LaunchDarkly, Unleash, or Flagsmith:
1. Update `agents/migration-featureflags.agent.md`
2. Update the feature flag gating patterns in `agents/migration-backend.agent.md`

### Figma Integration

The frontend agent has built-in Figma MCP integration points. When Figma MCP is available:
- Design tokens → Tailwind config
- Component frames → React components
- Visual parity validation

## Directory Structure

```
rj-dev-migration-toolkit/
├── README.md                                    # This file
├── LICENSE
├── agents/                                      # 8 specialized agents
│   ├── migration-coordinator.agent.md           # Main orchestrator
│   ├── migration-discovery.agent.md             # Legacy analyzer
│   ├── migration-api-analyzer.agent.md          # API gap detection
│   ├── migration-database.agent.md              # Schema migration
│   ├── migration-backend.agent.md               # Servlet → Spring Boot
│   ├── migration-frontend.agent.md              # ExtJS → React
│   ├── migration-tdd.agent.md                   # Test-first + parity
│   └── migration-featureflags.agent.md          # Feature flag lifecycle
├── skills/                                      # 8 knowledge skills
│   ├── migration-java-styleguide/SKILL.md       # Google Java Style
│   ├── migration-api-gap-analysis/SKILL.md      # Endpoint gap detection
│   ├── migration-strangler-fig/SKILL.md         # Incremental cutover
│   ├── migration-discovery/SKILL.md             # Legacy analysis patterns
│   ├── migration-backend-patterns/SKILL.md      # Conversion recipes
│   ├── migration-frontend-patterns/SKILL.md     # ExtJS→React mapping
│   ├── migration-tdd-patterns/SKILL.md          # Test patterns
│   └── migration-toolkit-reference/SKILL.md     # Quick reference
├── prompts/                                     # 10 workflow prompts
│   ├── migrate-module-full.prompt.md
│   ├── migrate-batch.prompt.md
│   ├── migrate-servlet.prompt.md
│   ├── migrate-extjs-view.prompt.md
│   ├── migrate-jsp-page.prompt.md
│   ├── validate-parity.prompt.md
│   ├── identify-api-gaps.prompt.md
│   ├── generate-openapi-spec.prompt.md
│   ├── generate-cicd-pipeline.prompt.md
│   └── export-migration-toolkit.prompt.md
├── instructions/                                # 2 auto-applied standards
│   ├── migration-spring-boot.instructions.md
│   └── migration-react.instructions.md
├── templates/                                   # Project scaffolding
│   └── context/migration/README.md
└── docs/                                        # Extended documentation
    ├── getting-started.md
    ├── usage-guide.md
    ├── architecture.md
    └── customization.md
```

## Contributing

1. Fork this repository
2. Create a feature branch (`feature/add-kotlin-support`)
3. Follow the existing file patterns for new agents/skills
4. Test with a real legacy codebase
5. Submit a PR with before/after examples

## License

MIT
