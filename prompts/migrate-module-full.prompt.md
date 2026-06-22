---
name: "Migrate Module (Full Pipeline)"
description: "Orchestrates complete migration of one module through all 7 phases with proper handoffs between subagents"
agent: agent
tools: ['runSubagent', 'read/readFile', 'edit/createFile', 'search/codebase']
---

# Migrate Module — Full Pipeline Orchestration

Execute the complete migration pipeline for a single module. This prompt drives the Migration Coordinator through all 7 phases with checkpoints.

## Input Required
- **Module name**: The logical module to migrate (e.g., "project-management", "user-admin")
- **Legacy source paths**: Servlet(s), JSP(s), ExtJS view(s) for this module
- **Target package**: Spring Boot base package (e.g., `com.app.project`)

## Execution Flow

### Phase 1: Discovery
```
@Migration Discovery
Analyze the following legacy files for module "{{module}}":
- Servlets: {{servlet_paths}}
- JSPs: {{jsp_paths}}
- ExtJS: {{extjs_paths}}

Output to: context/migration/{{module}}/discovery-report.md
```

**Checkpoint:** Review discovery report. Are there unknowns that need clarification?

---

### Phase 2: Plan
Using the discovery report, create a migration plan covering:
1. API contract design (REST endpoints with request/response DTOs)
2. Component tree (React component hierarchy)
3. Feature flag design (which flags, dependencies, rollout strategy)
4. Test matrix (what tests are needed per business rule)
5. Risk assessment (what could go wrong)
6. Migration order (which endpoints/components first, respecting dependencies)

**Completeness Validation (auto):**
Cross-check discovery report against plan. For each business rule, verify:
- Source location identified (servlet/JSP/DB)
- Target location planned (controller/service/component)
- Test coverage planned
Output gaps to: `context/migration/{{module}}/gap-report.md`

**Bug Discovery (auto — Jira):**
Query Jira for existing bugs related to this module's legacy code.
Classify as "fix during migration" or "defer to separate ticket".
Output: `context/migration/{{module}}/bugs-to-fix.md`

**Checkpoint:** Present plan + gaps + bugs to user. Wait for explicit approval before proceeding.

---

### Phase 3: API Gap + Database

Identify missing endpoints and generate database migration scripts:
```
@Migration API Analyzer module:{{module}}
Frontend sources: {{frontend_paths}}
Backend sources: {{backend_paths}}
Output: context/migration/{{module}}/api-gap-report.md

@Migration Database (if schema changes needed)
Output: Flyway scripts + JPA entities
```

**Checkpoint:** Review gap report. Approve before proceeding to backend implementation.

---

### Phase 4: Backend (TDD Loop)

```
LOOP for each endpoint in plan (dependency-first order):
  Step A: Generate test shell
    @Migration TDD generate-backend
    Create test shells for endpoint: {{endpoint}}
    Business rules: {{rules_from_discovery}}
    Output: src/test/java/.../{{Entity}}ControllerTest.java
    Output: src/test/java/.../{{Entity}}ServiceTest.java

  Step B: Implement against tests
    @Migration Backend
    Implement endpoint: {{endpoint}}
    Test files: {{test_paths}}
    Discovery rules: {{rules}}
    Feature flag: {{flag_name}}

  Step C: Verify
    Run: mvn test -pl backend -Dtest={{TestClass}}
    If FAIL → return to Step B with error context
    If PASS → log to implementation-log.md, proceed to next endpoint
END LOOP
```

**Backend Write Gate (hard gate — must pass before Phase 5):**
- All planned endpoints have corresponding controller files (no stubs)
- No placeholder markers remain (`TODO`, `throw new UnsupportedOperationException`)
- Full backend test suite passes: `mvn test -pl backend`
- If gate fails → fix and re-run until green.

---

### Phase 5: Frontend (TDD Loop)

```
LOOP for each component in plan:
  Step A: Generate test shell
    @Migration TDD generate-frontend
    Create test shells for component: {{component}}
    API contract: {{api_contract_from_phase3}}
    Legacy behavior: {{extjs_behavior_from_discovery}}
    Output: src/**/__tests__/{{Component}}.test.tsx
    Output: e2e/{{module}}/{{feature}}.spec.ts

  Step B: Implement against tests
    @Migration Frontend
    Implement component: {{component}}
    Test files: {{test_paths}}
    API contract: {{api_contract}}
    Feature flag: {{flag_name}}

  Step C: Verify
    Run: npm test -- --filter={{component}}
    Run: npx playwright test {{e2e_spec}}
    If FAIL → return to Step B with error context
    If PASS → log to implementation-log.md, proceed to next component
END LOOP
```

**Frontend Write Gate (hard gate — must pass before Phase 6):**
- All planned components exist in target directories (no stubs)
- No placeholder markers remain in generated components
- Components use real API hooks (no hardcoded mock data in production code)
- Full frontend test suite passes: `npm test` + `npx playwright test`
- If gate fails → fix and re-run until green.

---

### Phase 6: Validate

```
@Migration TDD validate
Module: {{module}}
Discovery report: context/migration/{{module}}/discovery-report.md
Backend implementation: context/migration/{{module}}/backend/implementation-log.md
Frontend implementation: context/migration/{{module}}/frontend/implementation-log.md
Output: context/migration/{{module}}/validation/parity-report.md
```

**Decision Gate:**
- If parity report shows ALL rules covered → proceed to Phase 7
- If MISSING gaps → return to Phase 4 or 5 (targeted fix)
- If PARTIAL gaps → add specific tests, then re-validate

---

### Phase 7: Cutover

Generate cutover artifacts:
1. Feature flag activation plan (rollout percentages + timeline)
2. Deployment checklist (infrastructure, config, secrets)
3. Rollback procedure (per-flag rollback steps)
4. Monitoring dashboard spec (key metrics to watch)

**Checkpoint:** Present cutover plan. Requires explicit human approval.

---

## Loop Control

Track iterations to prevent infinite loops:
- **Max TDD iterations per endpoint/component:** 3
- **Max parity validation loops:** 2
- If limits exceeded → escalate to user with diagnostic context
