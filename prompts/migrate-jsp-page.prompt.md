---
name: "Migrate JSP to React Page"
description: "Single-JSP migration workflow: extract embedded logic from JSP scriptlets, migrate to React page with proper server/client separation"
agent: agent
tools: ['read/readFile', 'edit/createFile', 'edit/editFiles', 'search/codebase', 'search/textSearch']
---

# Migrate JSP Page to React

Focused workflow for migrating ONE JSP page (with embedded scriptlets and logic) to a React page backed by proper API endpoints.

## Input
Provide the path to the legacy JSP file (and optionally, related includes/taglibs).

## Workflow

### Step 1: Triage JSP Content

Classify every section of the JSP:

| Category | JSP Pattern | Migration Target |
|----------|-------------|-----------------|
| **Server Logic** | `<% if (user.hasRole("admin")) %>` | Backend API + auth middleware |
| **Data Query** | `<% List items = dao.findAll() %>` | Backend endpoint + React query |
| **Form Processing** | `<% request.getParameter("name") %>` | React form + API POST |
| **Display Logic** | `<c:forEach items="${items}">` | React `.map()` rendering |
| **Navigation** | `<% response.sendRedirect() %>` | React Router `navigate()` |
| **Session State** | `<% session.getAttribute("cart") %>` | React Context or server session API |
| **Includes** | `<%@ include file="header.jsp" %>` | React layout/component composition |

### Step 2: Extract Business Rules from Scriptlets

For each `<% ... %>` block:
1. Determine if it's **display logic** (safe for frontend) or **business logic** (must stay on server)
2. Business logic → create API endpoint (Phase 4 work)
3. Display logic → translate to React JSX conditional rendering
4. Session reads → determine if state should be client-side or API-fetched

### Step 3: Design the Page API Contract

The JSP likely does multiple things (load data, check permissions, render forms). Split into clean API calls:

```yaml
# Legacy: single JSP that loads 3 data sets and checks permissions
# Modern: 3 API calls composed in one React page

page: ProjectDetailPage
api_calls:
  - GET /api/v1/projects/{id}              # Main entity
  - GET /api/v1/projects/{id}/history       # Audit trail (was inline scriptlet query)
  - GET /api/v1/permissions/projects/{id}   # Permission check (was session-based)
```

### Step 4: Generate Test Shells

**Backend tests** (for any extracted business logic):
- Permission checks
- Data queries
- Form processing

**Frontend tests:**
- Page renders with all sections
- Loading states (multiple queries)
- Permission-gated UI elements
- Form submission
- Navigation flows

### Step 5: Implement Backend (if needed)

If the JSP contained server-side logic that needs an API:
- Create controller + service for the extracted logic
- Ensure it's feature-flagged

### Step 6: Implement React Page

Replace the JSP with a React page:
- Use `useQueries` for multiple parallel data fetches
- Use `Suspense` boundaries for loading states
- Translate `<c:if>` / `<c:choose>` → conditional rendering
- Translate `<c:forEach>` → `.map()` with keys
- Translate form actions → React Hook Form + mutation
- Translate includes → React component imports

### Step 7: Verify

Run tests. Ensure all JSP behaviors are covered.

## JSP → React Translation Quick Reference

```jsp
<%-- JSP --%>
<c:if test="${user.admin}">
  <button>Delete</button>
</c:if>
```
```tsx
{/* React */}
{permissions.canDelete && <Button variant="danger">Delete</Button>}
```

```jsp
<%-- JSP --%>
<c:forEach items="${projects}" var="p">
  <tr><td>${p.name}</td><td>${p.status}</td></tr>
</c:forEach>
```
```tsx
{/* React */}
{projects.map(p => (
  <tr key={p.id}><td>{p.name}</td><td>{p.status}</td></tr>
))}
```

```jsp
<%-- JSP (form with server validation) --%>
<form action="/project/save" method="POST">
  <input name="name" value="${project.name}" />
  <% if (errors.hasError("name")) { %>
    <span class="error">${errors.get("name")}</span>
  <% } %>
</form>
```
```tsx
{/* React */}
<form onSubmit={handleSubmit(onSubmit)}>
  <Input {...register('name')} error={errors.name?.message} />
</form>
```

## Output Files
```
src/app/routes/{module}/{page}.tsx
src/app/hooks/queries/use{PageData}.ts
src/app/components/{module}/{Section}.tsx
src/app/types/{entity}.ts
src/test/.../_{page}.test.tsx
e2e/{module}/{page}.spec.ts
# + backend files if business logic was extracted
```
