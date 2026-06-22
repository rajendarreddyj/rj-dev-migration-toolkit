---
agent: agent
description: "Generate OpenAPI 3.1 spec from legacy servlet/JSP endpoints discovered during migration"
tools: ['read/readFile', 'edit/createFile', 'search/codebase', 'search/fileSearch', 'search/textSearch']
---

# Generate OpenAPI Spec from Legacy Endpoints

## Context
Reverse-engineer the legacy **{{module}}** module's servlet/JSP endpoints into a formal OpenAPI 3.1 specification. This spec becomes the contract for the new Spring Boot API.

## Instructions

### 1. Read Discovery Report

Load `context/migration/{{module}}/discovery-report.md` to get the endpoint inventory.

### 2. Analyze Legacy Endpoints

For each legacy endpoint, extract:
- **URL pattern** (from `web.xml`, `@WebServlet`, or JAX-RS `@Path`)
- **HTTP method** (from `doGet`/`doPost` or request parameter dispatch)
- **Request parameters** (query params, form data, JSON body)
- **Response format** (JSON, HTML redirect, JSP forward)
- **Authentication** (session-based, filter-checked, annotation)
- **Error responses** (what HTTP codes are returned for failures)

### 3. Design RESTful API

Transform legacy patterns into RESTful conventions:

| Legacy Pattern | REST Convention |
|---------------|-----------------|
| `?action=list` | `GET /api/v1/{resources}` |
| `?action=get&id=X` | `GET /api/v1/{resources}/{id}` |
| `?action=create` (POST) | `POST /api/v1/{resources}` |
| `?action=update` (POST) | `PUT /api/v1/{resources}/{id}` |
| `?action=delete` (POST) | `DELETE /api/v1/{resources}/{id}` |
| `?action=search&q=X` | `GET /api/v1/{resources}?q=X` |
| Nested resource access | `GET /api/v1/{parents}/{id}/{children}` |

### 4. Generate OpenAPI Spec

Write `context/migration/{{module}}/openapi.yaml`:

```yaml
openapi: 3.1.0
info:
  title: "{Module} API"
  version: "1.0.0"
  description: "Migrated from legacy servlet endpoints"
servers:
  - url: /api/v1
paths:
  /{resources}:
    get:
      summary: "List {resources}"
      operationId: "list{Resources}"
      tags: ["{Module}"]
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/SizeParam'
        - $ref: '#/components/parameters/SortParam'
      responses:
        '200':
          description: "Paged list"
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Paged{Resource}Response'
        '401':
          $ref: '#/components/responses/Unauthorized'
    post:
      summary: "Create {resource}"
      operationId: "create{Resource}"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/{Resource}Request'
      responses:
        '201':
          description: "Created"
        '422':
          $ref: '#/components/responses/ValidationError'
```

### 5. Generate Schema Components

For each entity, define request/response schemas from legacy data structures:
- Extract field names and types from JSP form fields, DAO result set mappings, or JSON serialization
- Add validation constraints (`required`, `maxLength`, `pattern`)
- Document enum values from legacy code constants

### 6. Cross-Reference with API Gap Report

If `context/migration/{{module}}/api-gap-report.md` exists, ensure the OpenAPI spec includes all missing endpoints identified there.

### 7. Output

- `context/migration/{{module}}/openapi.yaml` — Full OpenAPI 3.1 spec
- `context/migration/{{module}}/api-mapping.md` — Legacy endpoint → REST endpoint mapping table

## Variables

- `module`: The migration module name (e.g., project-management)
