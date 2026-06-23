---
name: migration-api-gap-analysis
description: "Identifies missing REST endpoints needed for UI integration during migration. Analyzes frontend components to determine required API contracts, compares against existing/migrated backend endpoints, and produces a gap report with prioritized implementation backlog. Triggers: 'missing endpoint', 'api gap', 'frontend needs endpoint', 'UI integration', 'endpoint coverage', 'what APIs does the UI need', 'missing REST', 'api contract gap'."
compatibility: IDE-agnostic
when_to_use:
  - "missing endpoint detection during Phase 3 or Phase 5"
  - "UI integration gap analysis"
  - "API contract generation"
  - "suggest improvement to API gap analysis patterns"
metadata:
  author: migration-toolkit
  version: "1.0"
  references:
    - skill://migration-backend-patterns
    - skill://migration-frontend-patterns
---

# API Gap Analysis Skill

Systematic methodology for identifying REST endpoints that the frontend requires but the backend does not yet provide. Critical during migration to prevent UI-first development from blocking on missing APIs.

## When To Use

- **Phase 3 (API GAP + DB):** After planning, before backend implementation begins
- **Phase 5 (FRONTEND):** When frontend agent encounters missing APIs during implementation
- **Integration Testing:** When parity validation reveals fetch failures
- **Continuous:** Whenever a new React component is planned that calls an API

## Gap Detection Methodology

### Step 1: Extract Frontend API Requirements

Scan frontend source for all outbound API calls. Look for:

```typescript
// TanStack Query patterns
useQuery({ queryKey: ['projects', id], queryFn: () => api.get(`/api/v1/projects/${id}`) })
useMutation({ mutationFn: (data) => api.post('/api/v1/projects', data) })

// Fetch/axios patterns
fetch('/api/v1/projects?status=active&page=1&size=25')
axios.get('/api/v1/projects/{id}/documents')
axios.put('/api/v1/projects/{id}', payload)
axios.delete('/api/v1/projects/{id}')

// Legacy ExtJS store proxy URLs (if frontend not yet migrated)
proxy: { url: '/api/users', type: 'ajax' }
Ext.Ajax.request({ url: '/api/projects/search', method: 'POST' })
```

### Step 2: Extract Existing Backend Endpoints

Scan for registered REST endpoints:

```java
// Spring Boot (new)
@GetMapping("/api/v1/projects/{id}")
@PostMapping("/api/v1/projects")
@PutMapping("/api/v1/projects/{id}")
@DeleteMapping("/api/v1/projects/{id}")
@GetMapping("/api/v1/projects")  // list with pagination

// Legacy CXF JAX-RS (old)
@GET @Path("/projects/{id}")
@POST @Path("/projects")
@PUT @Path("/projects/{id}")

// Legacy Servlet URL mappings (web.xml or @WebServlet)
@WebServlet("/api/projects")
<servlet-mapping><url-pattern>/api/projects/*</url-pattern></servlet-mapping>
```

### Step 3: Compare and Identify Gaps

For each frontend API call, check if a matching backend endpoint exists:

| Check | Result |
|-------|--------|
| URL path matches existing endpoint | ✅ Covered |
| URL path matches but HTTP method differs | ⚠️ Method gap |
| URL path matches but response shape differs | ⚠️ Contract gap |
| URL path has no backend match | ❌ Missing endpoint |
| Backend endpoint exists but no frontend consumer | ℹ️ Orphan (low priority) |

### Step 4: Classify Gaps

| Priority | Criteria | Action |
|----------|----------|--------|
| **P0 — Blocking** | Frontend component cannot render without this data | Implement immediately |
| **P1 — Required** | Feature works partially but key functionality is missing | Implement in current sprint |
| **P2 — Enhancement** | Frontend can degrade gracefully (loading state, fallback) | Schedule for next iteration |
| **P3 — Future** | Planned component not yet built | Track in backlog |

### Step 5: Generate API Contract Spec

For each missing endpoint, produce an OpenAPI-style contract:

```yaml
# Gap: GET /api/v1/projects/{id}/documents
path: /api/v1/projects/{id}/documents
method: GET
summary: List documents attached to a project
parameters:
  - name: id
    in: path
    type: integer
    required: true
  - name: page
    in: query
    type: integer
    default: 0
  - name: size
    in: query
    type: integer
    default: 25
response:
  status: 200
  body:
    type: PagedResponse<DocumentResponse>
    schema:
      content: DocumentResponse[]
      totalElements: integer
      totalPages: integer
      page: integer
      size: integer
frontend_consumer: ProjectDocumentsPanel.tsx
priority: P0
reason: "Panel renders empty without document list"
legacy_source: "ProjectServlet.doGet() action=listDocs"
```

## Search Patterns for Detection

### Frontend API Calls (React/TypeScript)
```
# TanStack Query hooks
queryFn.*api\.(get|post|put|patch|delete)
useMutation.*mutationFn
useQuery.*queryKey

# Direct fetch/axios
fetch\(['"]/api/
axios\.(get|post|put|patch|delete)\(['"]/api/
api\.(get|post|put|patch|delete)\(

# URL constants
API_BASE.*=.*['"]/api
endpoint.*=.*['"]/api
```

### Frontend API Calls (Legacy ExtJS)
```
# Store proxy URLs
proxy.*url.*['"]/api
Ext\.Ajax\.request.*url

# Direct AJAX
Ext\.Ajax\.request
store\.load\(
store\.sync\(
```

### Backend Endpoints (Spring Boot)
```
@(Get|Post|Put|Patch|Delete)Mapping\(
@RequestMapping\(.*method
```

### Backend Endpoints (Legacy CXF/JAX-RS)
```
@(GET|POST|PUT|DELETE)
@Path\(
@WebServlet\(
<url-pattern>
```

## Output Format: API Gap Report

```markdown
# API Gap Report: {module}

**Generated:** {date}
**Frontend source:** {path to React/ExtJS components}
**Backend source:** {path to controllers/servlets}

## Summary

| Status | Count |
|--------|-------|
| ✅ Covered | 12 |
| ⚠️ Contract mismatch | 3 |
| ❌ Missing (P0) | 2 |
| ❌ Missing (P1) | 4 |
| ❌ Missing (P2) | 1 |

## Missing Endpoints (P0 — Blocking)

### 1. GET /api/v1/projects/{id}/documents
- **Consumer:** `ProjectDocumentsPanel.tsx` line 23
- **Legacy source:** `ProjectServlet.doGet()` action=listDocs (line 145)
- **Expected response:** `PagedResponse<DocumentResponse>`
- **Required fields:** id, name, type, uploadDate, size, url
- **Pagination:** Yes (page, size, sort)
- **Auth:** Requires PROJECT_VIEW permission
- **Feature flag:** PROJECT_DOCUMENTS_V2

### 2. POST /api/v1/projects/{id}/documents
- **Consumer:** `UploadDocumentDialog.tsx` line 45
- **Legacy source:** `DocumentUploadServlet.doPost()` (line 30)
- **Expected request:** multipart/form-data (file + metadata JSON)
- **Expected response:** `DocumentResponse` (201 Created)
- **Auth:** Requires PROJECT_EDIT permission
- **Feature flag:** PROJECT_DOCUMENTS_V2

## Contract Mismatches (⚠️)

### 1. GET /api/v1/projects — Response shape mismatch
- **Frontend expects:** `{ data: Project[], total: number, page: number }`
- **Backend returns:** `{ content: Project[], totalElements: number, number: number }`
- **Fix:** Update frontend query hook OR add response wrapper
- **Recommendation:** Align to Spring Data Page structure on frontend side

## Implementation Backlog

| # | Endpoint | Priority | Estimated Effort | Depends On |
|---|----------|----------|-----------------|------------|
| 1 | GET /api/v1/projects/{id}/documents | P0 | 4h | DocumentEntity, DocumentRepository |
| 2 | POST /api/v1/projects/{id}/documents | P0 | 6h | #1 + file storage config |
| 3 | GET /api/v1/users/search | P1 | 3h | UserRepository spec query |
| 4 | PATCH /api/v1/projects/{id}/status | P1 | 4h | Workflow integration |
```

## Integration with Migration Pipeline

### During Phase 3 (API GAP + DB)
The Migration Coordinator invokes API gap analysis after discovery and planning complete:
```
1. Discovery → discovery-report.md (lists all legacy endpoints + UI actions)
2. Plan → migration-plan.md (strategy + contracts)
3. API Gap Analysis → api-gap-report.md (identifies what's missing)
```

### During Phase 5 (FRONTEND)
When the Frontend Agent encounters a missing endpoint:
1. Log the gap in `context/migration/{module}/api-gaps.md`
2. Create a stub endpoint specification
3. Notify the Coordinator to schedule backend implementation
4. Use MSW (Mock Service Worker) to unblock frontend development

### Mock Strategy for Unblocking
```typescript
// handlers.ts (MSW mock for missing endpoint)
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/projects/:id/documents', ({ params }) => {
    return HttpResponse.json({
      content: [
        { id: 1, name: 'Floor Plan.pdf', type: 'PDF', uploadDate: '2024-01-15' },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 25,
    });
  }),
];
```

## Continuous Monitoring

After migration completes, run periodic gap analysis to catch:
- New frontend features calling endpoints that don't exist
- Deprecated endpoints still being called
- Contract drift between frontend types and backend DTOs
- Missing error response handling (4xx/5xx not covered in frontend)
