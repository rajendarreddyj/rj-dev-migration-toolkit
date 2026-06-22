# Usage Guide & Sample Prompts

## How It Works

The Migration Toolkit is a VS Code agent plugin. You interact with it through **GitHub Copilot Chat** using `@agent` mentions and `/prompt` commands. The toolkit provides:

- **Agents** — Specialized AI assistants you invoke with `@AgentName`
- **Prompts** — Pre-built workflow templates you invoke with `/prompt-name`
- **Skills** — Domain knowledge automatically loaded when relevant
- **Instructions** — Coding standards auto-applied to generated files

## Quick Reference

| I want to... | Use this |
|---|---|
| Migrate an entire module | `@Migration Coordinator migrate module:{name}` |
| Convert one servlet | `/migrate-servlet` |
| Convert one ExtJS view | `/migrate-extjs-view` |
| Convert one JSP page | `/migrate-jsp-page` |
| Find missing APIs | `/identify-api-gaps` |
| Check parity | `/validate-parity` |
| See pipeline status | `@Migration Coordinator status` |
| Resume after pause | `@Migration Coordinator resume module:{name}` |
| Rollback to a phase | `@Migration Coordinator rollback module:{name} phase:{N}` |
| Batch migrate | `/migrate-batch` |
| Generate OpenAPI spec | `/generate-openapi-spec` |
| Generate CI/CD pipeline | `/generate-cicd-pipeline` |

---

## Sample Prompts by Scenario

### Scenario 1: Full Module Migration (End-to-End)

Start with this when you want the complete orchestrated pipeline:

```
@Migration Coordinator migrate module:project-management
```

The coordinator will ask for servlet/JSP/ExtJS paths. Provide them:

```
Servlets: src/main/java/com/app/project/ProjectServlet.java, 
          src/main/java/com/app/project/ProjectDocumentServlet.java
JSPs: WebContent/project/projectList.jsp, WebContent/project/projectEdit.jsp
ExtJS: webapp/app/view/project/ProjectGrid.js, webapp/app/view/project/ProjectForm.js
```

The pipeline runs automatically with pauses at human gates.

---

### Scenario 2: Discover What You Have (Before Committing to Migration)

Want to understand your legacy code before deciding on a migration approach:

```
@Migration Discovery
Analyze the following legacy module for migration planning:
- Servlets: src/main/java/com/app/user/UserServlet.java
- JSPs: WebContent/user/*.jsp
- ExtJS: webapp/app/view/user/

Produce a comprehensive discovery report covering:
- All URL patterns and their HTTP methods
- Business rules embedded in each action handler
- Data flow from request → processing → response
- Session state dependencies
- Cross-cutting concerns (auth, logging, transactions)
```

---

### Scenario 3: Single Servlet Conversion (Quick Win)

For a fast, focused conversion of one servlet:

```
/migrate-servlet path:src/main/java/com/app/project/ProjectServlet.java
```

Or with more context:

```
@Migration Backend
Convert this servlet to Spring Boot:
- Source: src/main/java/com/app/project/ProjectServlet.java
- Target package: com.app.project.controller
- Feature flag: project-list-v2
- Existing tests: src/test/java/com/app/project/ProjectControllerTest.java

Business rules from discovery:
1. GET /projects → paginated list, filtered by user role
2. POST /projects → create with validation (name required, budget > 0)
3. PUT /projects/{id} → update, only owner or admin
4. DELETE /projects/{id} → soft delete, cascade to documents
```

---

### Scenario 4: ExtJS View Conversion

```
/migrate-extjs-view path:webapp/app/view/project/ProjectGrid.js
```

Or with explicit guidance:

```
@Migration Frontend
Convert this ExtJS GridPanel to a React component:
- Source: webapp/app/view/project/ProjectGrid.js
- Store: webapp/app/store/ProjectStore.js
- Target: src/components/projects/ProjectList.tsx
- API contract: GET /api/v1/projects?page={n}&size={s}&sort={field}&filter={text}
- Feature flag: project-list-v2

Requirements:
- TanStack Query for data fetching
- TanStack Table for the grid
- Tailwind CSS for styling
- Support pagination, sorting, filtering
- Preserve column configuration from ExtJS grid
```

---

### Scenario 5: Find Missing REST Endpoints

Before building frontend, identify what APIs you need:

```
/identify-api-gaps module:project-management frontend:src/components/projects/ backend:src/main/java/com/app/project/controller/
```

Or for a full workspace scan:

```
@Migration API Analyzer full-scan
Scan the entire workspace for API coverage gaps.
Frontend sources: src/components/
Backend sources: src/main/java/com/app/
Legacy sources: legacy/src/main/java/com/app/
```

---

### Scenario 6: Database Schema Migration

```
@Migration Database generate-flyway module:project-management
Schema source: db/schema.sql
Stored procedures: db/procedures/project_*.sql
Target entities: src/main/java/com/app/project/entity/

Generate:
1. Flyway migration script (V001__create_project_tables.sql)
2. JPA entity classes (Project.java, ProjectDocument.java)
3. Spring Data JPA repositories
4. Data migration script for existing rows
```

---

### Scenario 7: Validate Parity After Migration

```
/validate-parity module:project-management
```

Or with specific business rules:

```
@Migration TDD validate
Module: project-management
Discovery report: context/migration/project-management/discovery-report.md
Backend log: context/migration/project-management/backend/implementation-log.md
Frontend log: context/migration/project-management/frontend/implementation-log.md

Focus on these critical business rules:
- BR-001: Project budget cannot exceed department allocation
- BR-005: Status transitions follow workflow (Draft→Active→Complete→Archived)
- BR-012: Document upload limited to 10MB, PDF/DOCX only
```

---

### Scenario 8: Feature Flag Design

```
@Migration Feature Flags design module:project-management
Pages/features to flag:
- Project list (grid view)
- Project create/edit form
- Project document upload
- Project budget calculator

Requirements:
- Togglz for backend
- React context for frontend
- Gradual rollout by user role (admin first, then all)
- Independent flags per feature (not all-or-nothing)
```

---

### Scenario 9: Batch Migration (Multiple Modules)

```
/migrate-batch
```

Then provide the module list:

```
Modules to migrate (in dependency order):
1. user-management (no dependencies)
   - Servlets: src/main/java/com/app/user/UserServlet.java
   - Priority: HIGH (other modules depend on user APIs)

2. project-management (depends on: user-management)
   - Servlets: src/main/java/com/app/project/ProjectServlet.java
   - Priority: HIGH (core business module)

3. reporting (depends on: user-management, project-management)
   - Servlets: src/main/java/com/app/report/ReportServlet.java
   - Priority: MEDIUM (read-only, lower risk)
```

---

### Scenario 10: Generate CI/CD Pipeline

After migration is complete:

```
/generate-cicd-pipeline
```

Or with specifics:

```
Generate a GitHub Actions CI/CD pipeline for the migrated application:
- Backend: Spring Boot 4.x, Java 25, Maven
- Frontend: React 19, TypeScript, Vite
- Database: PostgreSQL + Flyway
- Feature flags: Togglz (flag config from database)
- Environments: dev → staging → production
- Tests: JUnit 5 (backend), Vitest + Playwright (frontend)
- Deploy target: Kubernetes (AKS)
```

---

### Scenario 11: Generate OpenAPI Spec from Legacy

```
/generate-openapi-spec
```

Or:

```
@Migration API Analyzer
Reverse-engineer an OpenAPI 3.1 specification from these legacy servlets:
- src/main/java/com/app/project/ProjectServlet.java
- src/main/java/com/app/project/ProjectDocumentServlet.java

Include:
- All action parameters mapped to REST operations
- Request/response schemas inferred from Java types
- Authentication requirements from security annotations
- Pagination patterns from list operations
```

---

### Scenario 12: Resume After Error

When a pipeline step fails and you've fixed the issue:

```
@Migration Coordinator resume module:project-management
```

Or retry a specific phase:

```
@Migration Coordinator retry module:project-management phase:4
```

With additional context about what you fixed:

```
@Migration Coordinator retry module:project-management phase:4
I fixed the failing test in ProjectControllerTest.java:
- Changed the expected HTTP status from 200 to 201 for POST
- Added missing @MockBean for ProjectNotificationService
```

---

### Scenario 13: JSP Page to React

```
/migrate-jsp-page path:WebContent/project/projectEdit.jsp
```

Or with details:

```
@Migration Frontend
Convert this JSP page to a React component:
- Source JSP: WebContent/project/projectEdit.jsp
- Included fragments: WebContent/common/header.jsp, WebContent/common/formFields.jsp
- Form action: ProjectServlet?action=save
- Target: src/components/projects/ProjectEditForm.tsx
- API endpoint: PUT /api/v1/projects/{id}

The JSP uses:
- JSTL c:forEach for iterating project types (→ React select/dropdown)
- Scriptlet for permission checks (→ hook or context)
- jQuery for client-side validation (→ React Hook Form + Zod)
- AJAX for async save (→ TanStack Mutation)
```

---

## Common Patterns & Tips

### Start Small, Validate Early

```
# 1. Discover one module
@Migration Discovery analyze: src/main/java/com/app/SimpleServlet.java

# 2. Review the report, then migrate just one endpoint
@Migration Backend
Convert only the GET /items endpoint from SimpleServlet.
Source: context/migration/simple/discovery-report.md
Write tests first, then implement.

# 3. Validate it works before doing the rest
@Migration TDD validate context/migration/simple/
```

### Check Status Anytime

```
@Migration Coordinator status
```

Returns a dashboard showing all active modules and their pipeline progress.

### Export for Another Project

```
/export-migration-toolkit
```

Generates a portable copy of the toolkit configured for your target stack.

### Ask the Toolkit Reference

When you forget a command:

```
What commands does the Migration Coordinator support?
```

The `migration-toolkit-reference` skill loads automatically with the full command reference.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Agent not found | Check plugin is registered in `.vscode/settings.json` |
| Skills not loading | Restart VS Code after adding plugin |
| Pipeline stuck | `@Migration Coordinator status` to see where it paused |
| Phase failed 3 times | Pipeline escalates — review the error log and retry manually |
| Want to start over | `@Migration Coordinator rollback module:{name} phase:1` |
| Tests failing | Check discovery report — business rules may be incomplete |
| API gaps found during frontend | Pipeline loops back automatically (max 2 times) |
