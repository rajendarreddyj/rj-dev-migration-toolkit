# Customization Guide

## Changing Target Stack

### Backend: Kotlin instead of Java

1. Update `instructions/migration-spring-boot.instructions.md`:
   - Change formatting rules to Kotlin conventions
   - Replace Java patterns with idiomatic Kotlin (data classes, sealed classes, coroutines)

2. Update `skills/migration-backend-patterns/SKILL.md`:
   - Replace Java conversion recipes with Kotlin equivalents
   - Update Spring Boot 4 patterns to Kotlin idioms

3. Update `agents/migration-backend.agent.md`:
   - Change system prompt to reference Kotlin style guide
   - Update TDD patterns to use kotest or JUnit 5 + Kotlin

### Frontend: Vue instead of React

1. Update `instructions/migration-react.instructions.md`:
   - Rename to `migration-vue.instructions.md`
   - Replace React patterns with Vue 3 Composition API

2. Update `skills/migration-frontend-patterns/SKILL.md`:
   - Replace ExtJS→React mapping with ExtJS→Vue mapping
   - Update state management (Pinia instead of React Context + TanStack Query)

3. Update `agents/migration-frontend.agent.md`:
   - Change component templates from JSX to Vue SFC
   - Update testing patterns to use Vitest + Vue Test Utils

### Database: Liquibase instead of Flyway

1. Update `agents/migration-database.agent.md`:
   - Replace Flyway SQL scripts with Liquibase changesets (XML/YAML)
   - Update naming conventions

2. Update `skills/migration-backend-patterns/SKILL.md`:
   - Replace Flyway references with Liquibase
   - Update Spring Boot config patterns

## Adding New Agents

Create a new `.agent.md` file in `agents/`:

```yaml
---
name: My Custom Agent
description: What this agent does
tools: ['read/readFile', 'edit/createFile', 'edit/editFiles', 'search/codebase']
user-invocable: true
argument-hint: "How to invoke this agent"
model: claude-sonnet-4
---

# Agent Name

## Role
One-line description of the agent's role.

## Input
What this agent reads before starting.

## Steps
1. Step one
2. Step two
3. Step three

## Output
What files/artifacts this agent produces.

## Constraints
- Rule 1
- Rule 2
```

## Adding New Skills

Create a new directory in `skills/` with a `SKILL.md`:

```yaml
---
name: my-skill-name
description: 'One-sentence description for skill routing'
compatibility:
  - github-copilot
  - claude-code
  - cursor
  - codex
when_to_use:
  - describe the first trigger condition
  - describe the second trigger condition
metadata:
  author: your-name
  version: '1.0'
---

# Skill Name

## When to Use
Describe trigger conditions.

## Content
The actual knowledge/patterns/rules.

## Examples
Concrete examples of applying this skill.
```

> **Note**: The `when_to_use:` list in the YAML front-matter is used by the session hook and skill router to decide whether to inject this skill. Keep entries concise (one trigger per line).

## Proposing Skill Improvements

Any agent can propose an improvement to an existing skill by emitting a `skill-improvement` fenced block during a run:

````
```skill-improvement
skill: migration-backend-patterns       # target skill name (no path)
trigger: <what situation triggered this improvement>
problem: <the current gap, wrong guidance, or missing pattern>
proposed_fix: <the new or corrected guidance>
example_before: |                        # optional
  // old pattern
example_after: |                         # optional
  // new pattern
confidence: high                         # high | low
requires_human_approval: false           # true | false
```
````

**Apply rules**:
- `confidence: high` + `requires_human_approval: false` → auto-applied on next run, skill version bumped
- `confidence: low` OR `requires_human_approval: true` → queued in `context/migration/skill-improvement-queue.md`

To review the queue:

```
cat context/migration/skill-improvement-queue.md
```

To apply a queued item:

```
@Migration Coordinator apply-skill-improvement queue-id:3
```

## Adding New Prompts

Create a new `.prompt.md` file in `prompts/`:

```yaml
---
mode: agent
description: "What this prompt does"
---

# Prompt instructions here
```

## Project-Specific Overrides

If you need project-specific tweaks without forking:

1. Create a `overrides/` directory in your project
2. Add instruction files with the same names but higher specificity `applyTo` patterns
3. VS Code will apply the most specific matching instruction

Example: Override backend standards for a specific module:

```yaml
---
name: my-project-spring-boot
description: 'Project-specific Spring Boot overrides'
applyTo: '**/my-specific-module/src/main/java/**/*.java'
---

# Additional rules on top of migration-spring-boot
- Use 4-space indent (team preference override)
- Use YAML config (not .properties)
```

## Environment Variables

The toolkit doesn't require environment variables, but some agents check for:

| Variable | Purpose | Required |
|----------|---------|----------|
| `FIGMA_MCP_TOKEN` | Figma MCP design integration | No (optional) |
| `JIRA_BASE_URL` | Link to Jira tickets in reports | No (optional) |

## Phase Snapshot Customization

By default, snapshots are written at every pipeline gate. To change this behavior, edit `agents/migration-coordinator.agent.md` and locate the `## Phase Gate Actions` section.

**Skip snapshots for fast local runs** (not recommended for multi-day migrations):

```
# In migration-coordinator.agent.md, under Phase Gate Actions:
snapshot: disabled
```

**Custom snapshot path**:

```
snapshot_dir: my-team/migration-snapshots/{module}/
```

**Disable session-context.md auto-injection** (useful if you manage context manually):

Remove or comment out the `context/migration/session-context.md` block from `hooks/session-start` and `hooks/session-start-codex`.
