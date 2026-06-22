---
name: migration-strangler-fig
description: "Strangler Fig pattern for incremental migration. Covers API compatibility layers, request routing, dual-run validation, and phased traffic shifting. Prevents big-bang migration failures. Triggers: 'strangler fig', 'api compatibility', 'incremental migration', 'dual run', 'traffic routing', 'reverse proxy', 'gradual migration', 'compatibility layer'."
compatibility: IDE-agnostic
metadata:
  author: migration-toolkit
  version: "1.0"
---

# Strangler Fig Pattern for Migration

Incrementally replace legacy components while both systems run simultaneously. New functionality wraps ("strangles") the legacy system until it can be safely decommissioned.

## Architecture

```
                    ┌──────────────────────┐
                    │   API Gateway /       │
         Client ──► │   Reverse Proxy       │
                    │   (Route by path)     │
                    └──────┬───────┬────────┘
                           │       │
              ┌────────────▼─┐   ┌─▼────────────┐
              │  New Spring  │   │ Legacy Servlet │
              │  Boot API    │   │ Application    │
              │  (migrated)  │   │ (original)     │
              └──────┬───────┘   └──────┬────────┘
                     │                  │
              ┌──────▼──────────────────▼────────┐
              │         Shared Database           │
              └───────────────────────────────────┘
```

## Routing Strategies

### Strategy 1: Path-Based Routing (Recommended)

Route requests to new or legacy based on URL path:

```yaml
# nginx or Spring Cloud Gateway config
routes:
  # Migrated endpoints → new service
  - path: /api/v1/projects/**
    target: http://new-service:8080
    condition: feature_flag('PROJECTS_MIGRATED')

  # Not yet migrated → legacy
  - path: /api/v1/contracts/**
    target: http://legacy-service:8080

  # Catch-all → legacy (safe default)
  - path: /**
    target: http://legacy-service:8080
```

### Strategy 2: Feature Flag Routing (In-App)

```java
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

  private final ProjectService newService;
  private final LegacyProjectAdapter legacyAdapter;
  private final FeatureFlagService flags;

  @GetMapping("/{id}")
  public ResponseEntity<ProjectResponse> getById(@PathVariable Long id) {
    if (flags.isEnabled(Features.PROJECT_V2)) {
      return ResponseEntity.ok(newService.findById(id));
    }
    return ResponseEntity.ok(legacyAdapter.findById(id));
  }
}
```

### Strategy 3: Percentage-Based Traffic Splitting

```java
@Component
@RequiredArgsConstructor
public class TrafficRouter {

  private final FeatureFlagService flags;

  public boolean shouldUseNewService(String module) {
    // Progressive rollout: 0% → 10% → 50% → 100%
    return flags.isEnabledForPercentage(
        "MIGRATION_" + module.toUpperCase(), getUserId());
  }
}
```

## API Compatibility Layer

### Adapter Pattern for Response Shape Differences

```java
// Legacy returns flat object; new returns nested
@Component
public class LegacyProjectAdapter {

  private final LegacyProjectService legacyService;

  public ProjectResponse findById(Long id) {
    LegacyProject legacy = legacyService.getProject(id);
    return new ProjectResponse(
        legacy.getId(),
        legacy.getName(),
        new ProjectStatus(legacy.getStatusCode(), legacy.getStatusName()),
        legacy.getCreatedDate().toLocalDateTime()
    );
  }
}
```

### Request Translation (Legacy → New)

```java
// Translates legacy query params to new DTO
@Component
public class LegacyRequestTranslator {

  public ProjectSearchCriteria fromLegacyParams(Map<String, String> params) {
    return new ProjectSearchCriteria(
        params.get("name"),
        translateStatus(params.get("status")),
        parseDate(params.get("fromDate")),
        parseDate(params.get("toDate")),
        parseLong(params.get("firmID"))
    );
  }
}
```

## Dual-Run Validation

Run BOTH legacy and new paths simultaneously, compare results:

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class DualRunValidator<T> {

  private final MeterRegistry metrics;

  public T validateAndReturn(
      Supplier<T> newPath,
      Supplier<T> legacyPath,
      String operationName) {

    T legacyResult = legacyPath.get();
    T newResult = newPath.get();

    if (!Objects.equals(legacyResult, newResult)) {
      log.warn("Dual-run mismatch for {}: legacy={}, new={}",
          operationName, legacyResult, newResult);
      metrics.counter("migration.dualrun.mismatch",
          "operation", operationName).increment();
      // Return legacy during validation phase
      return legacyResult;
    }

    metrics.counter("migration.dualrun.match",
        "operation", operationName).increment();
    return newResult; // Safe to use new result
  }
}
```

## Migration Phases

### Phase A: Shadow Mode (0% traffic to new)
- Deploy new service alongside legacy
- Run dual validation on read operations
- Monitor mismatch rate → target < 0.1%
- **Duration:** 1-2 sprints

### Phase B: Canary (10% traffic to new)
- Route 10% of traffic to new service
- Monitor error rates, latency, correctness
- Auto-rollback if error rate > baseline + 1%
- **Duration:** 1 sprint

### Phase C: Progressive Rollout (10% → 50% → 100%)
- Increase traffic in increments
- Each increment requires:
  - Error rate stable for 24 hours
  - No parity mismatches
  - P95 latency within 10% of legacy
- **Duration:** 2-4 sprints

### Phase D: Legacy Decommission
- Remove legacy routes
- Clean up feature flags
- Remove adapter/translator code
- Archive legacy source
- Drop legacy-specific DB objects (after backup)

## Anti-Corruption Layer

Prevent legacy concepts from leaking into new code:

```java
// WRONG: new code uses legacy types
public ProjectResponse findById(Long id) {
  LegacyProjectBean bean = legacyDao.findById(id); // ❌ legacy type
  return mapToResponse(bean);
}

// CORRECT: anti-corruption boundary
public ProjectResponse findById(Long id) {
  ProjectEntity entity = repository.findById(id)  // ✅ new domain type
      .orElseThrow(() -> new ProjectNotFoundException(id));
  return mapper.toResponse(entity);
}
```

## Monitoring Dashboard Metrics

| Metric | Purpose | Alert Threshold |
|--------|---------|-----------------|
| `migration.traffic.new.pct` | % of traffic to new service | Monitor only |
| `migration.dualrun.mismatch.rate` | Parity failure rate | > 0.1% |
| `migration.new.error.rate` | New service error rate | > baseline + 1% |
| `migration.new.latency.p95` | New service P95 latency | > legacy P95 × 1.1 |
| `migration.rollback.count` | Auto-rollback events | > 0 |
