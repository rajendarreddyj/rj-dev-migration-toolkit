# Getting Started

## Prerequisites

1. **VS Code Insiders** with GitHub Copilot Chat (agent mode)
2. **A legacy Java codebase** containing Servlets, JSPs, and/or ExtJS
3. **Target project skeleton** — Spring Boot 4.x + React (or your target stack)

## Step 1: Install the Plugin

Add to your `.vscode/settings.json`:

```json
{
  "chat.pluginLocations": {
    "/path/to/rj-dev-migration-toolkit": true
  }
}
```

Restart VS Code. The agents, skills, prompts, and instructions will be automatically available.

## Step 2: Set Up Context Directory

Create the migration context directory in your project:

```bash
mkdir -p context/migration
```

Copy the template:
```bash
cp rj-dev-migration-toolkit/templates/context/migration/README.md context/migration/
```

The toolkit writes snapshot files and session context into this directory automatically. On your **next session start**, the hook reads `context/migration/session-context.md` (if present) and injects the current migration state as context — so agents can resume without re-discovery.

## Step 3: Run Your First Migration

### Option A: Full Module Migration (recommended)

```
@Migration Coordinator migrate module:project-management
```

This triggers the full 7-phase pipeline:
1. **Discovery** — Scans legacy code, produces discovery report
2. **Planning** — Creates migration plan, awaits human approval
3. **API Gap + Database** — Identifies missing endpoints, generates Flyway scripts
4. **Backend** — Converts servlets to Spring Boot (TDD-first)
5. **Frontend** — Converts ExtJS to React (TDD-first)
6. **Validation** — Runs parity tests, generates cutover plan
7. **Cutover** — Feature flag activation, deployment, rollback

### Option B: Single File (quick migration)

```
# Just one servlet
/migrate-servlet path:src/main/java/com/app/ProjectServlet.java

# Just one ExtJS view
/migrate-extjs-view path:webapp/app/view/project/ProjectGrid.js
```

### Option C: Find Missing APIs First

```
/identify-api-gaps module:project-management frontend:src/components/projects/ backend:src/main/java/com/app/project/controller/
```

## Step 4: Review and Approve

The coordinator pauses for human approval at key checkpoints:
- After discovery report (Phase 1 complete)
- After migration plan (Phase 2 complete)
- After API gap analysis (Phase 3 complete)
- After backend tests pass (Phase 4 complete)
- After parity validation (Phase 6 complete)

At each gate, the coordinator also writes a **compacted phase snapshot** to `context/migration/{module}/snapshots/phase-N-*.snap.md`. These are loaded automatically in future sessions so work is never lost.

## Step 5: Feature Flag Cutover

Once validated, the feature flag agent manages the rollout:
- Shadow traffic (0% user impact)
- Canary release (small %)
- Progressive rollout (10% → 50% → 100%)
- Legacy decommission (remove old code)

## Step 6: Resuming in a New Session

The `session-start` hook automatically loads `context/migration/session-context.md` (written at each phase gate) and injects active module state as context. No manual steps needed — just open a new chat and agents will know where they left off.

To manually restore context for a specific phase:

```
@Migration Coordinator load-context module:project-management phase:4
```

To force-write a snapshot at any point:

```
@Migration Coordinator snapshot module:project-management phase:4
```

## Tips

- **Start small**: Pick the simplest servlet for your first migration
- **Check status**: `@Migration Coordinator status` shows pipeline progress
- **Resume**: `@Migration Coordinator resume module:{name}` continues from last checkpoint
- **Rollback**: `@Migration Coordinator rollback module:{name} phase:3` resets to a specific phase
