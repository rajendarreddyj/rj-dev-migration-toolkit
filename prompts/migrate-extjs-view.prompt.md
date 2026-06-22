---
name: "Migrate ExtJS View to React"
description: "Single-view migration workflow: analyze one ExtJS component, generate React component + hooks + tests"
agent: agent
tools: ['read/readFile', 'edit/createFile', 'edit/editFiles', 'search/codebase', 'search/textSearch']
---

# Migrate Single ExtJS View to React Component

Focused workflow for migrating ONE ExtJS view to a React component with TypeScript, TanStack Query, and full test coverage.

## Input
Provide the path to the legacy ExtJS view file (and optionally, the related store/model files).

## Workflow

### Step 1: Analyze the ExtJS Component

Read the view and extract:
- Component type (`xtype`: grid, form, tree, panel, window)
- Store configuration (proxy URL, reader config, pagination)
- Column/field definitions (names, types, renderers, editors)
- Event handlers (with full logic extraction)
- Toolbar/button actions
- Child components (nested panels, docked items)
- Store listeners and data transformations
- Permission checks (e.g., `APP_CONFIG.canEdit`)

### Step 2: Map to React Architecture

Determine the target structure:
```
ExtJS Grid → Page with DataTable component + useQuery hook
ExtJS Form → Page with Form component + useMutation hook  
ExtJS Tree → Page with TreeView component + recursive query
ExtJS Window → Dialog component triggered by parent
ExtJS Tab Panel → Tabbed layout with lazy-loaded children
```

Identify shared UI primitives needed (Button, Input, Select, Table, Dialog).

### Step 3: Define TypeScript Types

From the ExtJS model/store fields, generate:
```typescript
// types/{entity}.ts
export interface Entity {
  id: string;
  name: string;
  status: EntityStatus;
  // ... all fields from ExtJS model
}

export type EntityStatus = 'ACTIVE' | 'DRAFT' | 'CLOSED';

// For forms
export const entityFormSchema = z.object({ ... });
export type EntityFormData = z.infer<typeof entityFormSchema>;
```

### Step 4: Generate Test Shells (TDD First)

Create tests encoding EVERY user-visible behavior from the ExtJS component:

**Unit tests (Vitest):**
- Component renders all columns/fields
- Event handlers produce correct effects
- Loading/error/empty states render correctly
- Form validation matches ExtJS field validators
- Feature flag OFF renders legacy fallback

**E2E tests (Playwright):**
- Full page interaction flow
- Form submission (success + failure)
- Table pagination, sorting, filtering
- Keyboard navigation (if present in legacy)

### Step 5: Implement Query/Mutation Hooks

Create TanStack Query hooks that replace Ext.data.Store:
- Match the API contract from the backend migration
- Handle pagination parameters
- Handle optimistic updates where legacy had immediate UI feedback
- Handle error states

### Step 6: Implement React Component

Build the component to make tests pass:
- Functional component with hooks
- Tailwind CSS for styling (match legacy visual appearance)
- Accessible (aria labels, keyboard nav, focus management)
- Feature flag gate for gradual rollout
- Error boundary for graceful failure

### Step 7: Verify

Run unit tests and e2e tests. Report results. If failures, iterate.

## Output Files Created
```
src/app/routes/{module}/{page}.tsx           # Route/page component
src/app/components/{module}/{Component}.tsx   # Reusable component
src/app/hooks/queries/use{Entity}.ts         # Query hook
src/app/hooks/mutations/use{Action}{Entity}.ts # Mutation hook
src/app/api/{entity}.ts                      # API client functions
src/app/types/{entity}.ts                    # TypeScript types + Zod schema
src/app/components/{module}/__tests__/{Component}.test.tsx
e2e/{module}/{feature}.spec.ts
```
