---
name: "Migration Batch — Multiple Modules"
description: "Orchestrates parallel discovery of multiple modules, then sequential migration with dependency ordering"
agent: agent
tools: ['runSubagent', 'read/readFile', 'edit/createFile', 'search/codebase']
---

# Migration Batch Orchestration

Manage migration of multiple modules with dependency awareness and parallel discovery.

## Input
```yaml
modules:
  - name: user-management
    servlets: [UserServlet.java, AuthServlet.java]
    jsps: [user/*.jsp]
    extjs: [view/user/]
    priority: 1  # Foundation module — migrate first
    
  - name: project-management
    servlets: [ProjectServlet.java]
    jsps: [project/*.jsp]
    extjs: [view/project/]
    priority: 2
    depends_on: [user-management]  # Uses auth from user module
    
  - name: reporting
    servlets: [ReportServlet.java, ExportServlet.java]
    jsps: [report/*.jsp]
    extjs: [view/report/]
    priority: 3
    depends_on: [project-management]
```

## Orchestration Strategy

### Phase A: Parallel Discovery (All Modules)

Discovery is read-only and independent — run all modules in parallel:

```
PARALLEL:
  @Migration Discovery → user-management/discovery-report.md
  @Migration Discovery → project-management/discovery-report.md
  @Migration Discovery → reporting/discovery-report.md
END PARALLEL
```

### Phase B: Dependency-Ordered Planning

Plan in priority order (respects `depends_on`):
```
SEQUENTIAL (by priority):
  1. Plan user-management → present for approval
  2. Plan project-management (can reference user-management plan) → approve
  3. Plan reporting (can reference both previous plans) → approve
```

### Phase C: Sequential Migration (TDD Loops)

Migrate in dependency order:
```
FOR module IN sorted_by_priority(modules):
  WAIT until all depends_on modules reach Phase 6 (validated)
  Execute full pipeline (Phases 4-6) for this module
END FOR
```

### Phase D: Integration Validation

After all modules migrated:
```
1. Run cross-module integration tests
2. Verify inter-module API calls work (e.g., project page calls user API)
3. Test feature flag combinations (some ON, some OFF)
4. Validate shared auth/session state across modules
```

### Phase E: Coordinated Cutover

```
1. Generate unified deployment plan
2. Define flag activation order (dependencies first)
3. Create monitoring dashboard covering all modules
4. Define rollback cascade (if module B fails, also rollback A if tightly coupled)
```

## Progress Dashboard

Maintain at `context/migration/manifest.md`:

```markdown
# Migration Progress Dashboard

| Module | Discovery | Plan | API Gap + DB | Backend | Frontend | Validate | Cutover |
|--------|-----------|------|-------------|---------|----------|----------|---------|
| user-management | ✅ | ✅ | ✅ | 🔄 5/8 | ⬜ | ⬜ | ⬜ |
| project-management | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| reporting | ✅ | 🔄 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## Blockers
- [ ] project-management blocked on user-management Phase 6 completion

## Metrics
- Total business rules: 67
- Rules with test coverage: 23/67 (34%)
- Feature flags created: 8
- Parity validation loops: 1
```

## Escalation Rules

- **Stalled module** (no progress in 2 iterations): surface to user with diagnostic
- **Circular dependency** detected: halt and request architecture review
- **Parity failure after 2 loops**: document as known gap, require explicit user acceptance
- **Scope creep** (discovering new modules during migration): add to backlog, don't block current work
