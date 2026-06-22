---
name: "Validate Migration Parity"
description: "Run parity validation across a migrated module — checks business rule coverage, feature flag states, and produces gap report"
agent: agent
tools: ['read/readFile', 'edit/createFile', 'search/codebase', 'search/textSearch']
---

# Validate Migration Parity

Standalone prompt to validate that a migrated module has 100% business logic parity with the legacy implementation.

## Input
- Module name
- Path to discovery report (contains business rules catalog)
- Path to implementation logs (backend + frontend)

## Validation Procedure

### Step 1: Load Business Rules

Read `context/migration/{module}/discovery-report.md` and extract all numbered business rules.

### Step 2: Trace Each Rule to Tests

For each business rule:
1. Search test files for references to the rule (by rule ID or description keywords)
2. Verify the test assertion matches the rule's expected behavior
3. Check that both feature flag states are tested

### Step 3: Check Error Path Coverage

For each error handling path documented in discovery:
1. Verify a test exists that triggers the error condition
2. Verify the response matches legacy behavior (or documents intentional improvement)

### Step 4: Check Side Effect Coverage

For each side effect (email, audit, cache, notification):
1. Verify a test exists with appropriate mock verification
2. Verify the trigger condition matches legacy

### Step 5: Run Automated Checks

```bash
# Backend
mvn test -pl backend -Dmigration.module={module}
mvn verify -pl backend -Pcoverage -Dmigration.module={module}

# Frontend
npm test -- --filter={module} --coverage
npx playwright test e2e/{module}/
```

### Step 6: Produce Parity Report

Generate `context/migration/{module}/validation/parity-report.md`:

```markdown
# Parity Report: {Module}
Generated: {date}

## Score: {covered}/{total} rules ({percentage}%)

## ✅ Fully Covered ({N})
| Rule ID | Description | Test File | Flag States |
|---------|-------------|-----------|-------------|
| BR-001 | Project name required | ProjectServiceTest:45 | ON ✅ OFF ✅ |

## ⚠️ Partially Covered ({N})
| Rule ID | Description | Gap | Remediation |
|---------|-------------|-----|-------------|
| BR-008 | Cascade status | Missing notification test | Add verify(notifier) |

## ❌ Not Covered ({N})
| Rule ID | Description | Impact | Action |
|---------|-------------|--------|--------|
| BR-017 | CSV custom headers | HIGH | Return to Phase 4 |

## Feature Flag Coverage
| Flag | ON tested | OFF tested | Dual-parity |
|------|-----------|-----------|-------------|
| project-list-v2 | ✅ | ✅ | ✅ |

## Recommendation
{PROCEED | FIX_AND_REVALIDATE | ESCALATE}
```

### Step 7: Decision

- **100% coverage** → Signal PROCEED to coordinator
- **≥90% with only LOW impact gaps** → Signal PROCEED with documented gaps
- **<90% or any HIGH impact gaps** → Signal FIX_AND_REVALIDATE with specific actions
