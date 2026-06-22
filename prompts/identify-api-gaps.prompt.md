---
agent: agent
description: "Identify missing REST endpoints required for UI integration in a migration module"
tools: ['read/readFile', 'edit/createFile', 'search/codebase', 'search/fileSearch', 'search/textSearch']
---

# Identify Missing REST Endpoints for UI Integration

## Context
You are performing an API gap analysis for the **{{module}}** module as part of a Servlet/JSP/ExtJS → Spring Boot/React migration.

## Instructions

Load the `migration-api-gap-analysis` skill, then execute this workflow:

### 1. Discover Frontend API Requirements

Scan frontend sources for all outbound API calls:
- **React (if migrated):** `{{frontendPath}}` — search for `useQuery`, `useMutation`, `fetch`, `axios`, `api.get/post/put/delete`
- **ExtJS (if not yet migrated):** Search for `proxy.url`, `Ext.Ajax.request`, store definitions with AJAX proxies
- **Type definitions:** Search for API response/request interfaces

### 2. Discover Backend Endpoints

Scan backend sources for all registered endpoints:
- **Spring Boot controllers:** `{{backendPath}}` — `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`
- **Legacy CXF/JAX-RS:** Search for `@GET`, `@POST`, `@PUT`, `@DELETE`, `@Path`
- **Legacy Servlets:** Check `web.xml` URL patterns and `@WebServlet` annotations

### 3. Correlate and Identify Gaps

For each frontend API call:
1. Find matching backend endpoint (same path + method)
2. If found: verify response shape matches frontend expectations
3. If missing: classify priority (P0=blocking, P1=required, P2=enhancement, P3=future)

### 4. Generate Gap Report

Write `context/migration/{{module}}/api-gap-report.md` containing:
- Summary table (covered / mismatch / missing counts)
- Detailed spec for each missing endpoint (path, method, params, response schema, auth, feature flag)
- Contract mismatches with resolution recommendations
- Prioritized implementation backlog
- MSW mock handlers for P0/P1 gaps

### 5. Update Migration Plan

If `context/migration/{{module}}/migration-plan.md` exists, append the missing endpoints as new implementation tasks in the backend phase.

## Variables

- `module`: The migration module being analyzed (e.g., project-management)
- `frontendPath`: Path to React/ExtJS frontend source (e.g., src/components/projects/)
- `backendPath`: Path to Spring Boot controllers (e.g., src/main/java/com/app/project/controller/)
