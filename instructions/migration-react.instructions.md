---
name: migration-react
description: 'Coding standards for React TypeScript migrated frontend code'
applyTo: '**/*.tsx, **/*.ts'
---

# React Migration Coding Standards

## Architecture Rules

1. **Pages (Routes)** — Composition and layout only
   - Compose hooks and components, no raw logic
   - Handle loading/error/empty states at page level
   - Feature flag gates at page level

2. **Components** — Reusable UI units
   - Functional components with hooks exclusively
   - Max 150 lines per component (decompose if larger)
   - Props interface explicitly typed (no `any`)
   - Controlled components preferred for forms

3. **Hooks** — Logic extraction
   - `useQuery`/`useMutation` for ALL server state
   - Custom hooks for reusable logic
   - No `useEffect` for data fetching

4. **API Layer** — Typed fetch functions
   - One file per resource (e.g., `api/projects.ts`)
   - Returns typed promises (no untyped responses)
   - Base client with interceptors (auth, error transform)

## Mandatory Patterns

### Feature Flag Gate
```typescript
// Page-level gate for new UI
export default function ProjectListPage() {
  const isV2 = useFeatureFlag('project-list-v2');
  if (!isV2) return <LegacyFrame src="/legacy/projects" />;
  return <ProjectList />;
}
```

### Query Hook Pattern
```typescript
// hooks/queries/useProjects.ts
export function useProjects(params: ProjectListParams) {
  return useQuery({
    queryKey: ['projects', params] as const,
    queryFn: () => projectApi.list(params),
    placeholderData: keepPreviousData,
  });
}
```

### Mutation Hook Pattern
```typescript
// hooks/mutations/useCreateProject.ts
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

### Form Pattern
```typescript
// Zod schema + React Hook Form
const schema = z.object({ ... });
type FormData = z.infer<typeof schema>;

export function EntityForm({ onSubmit }: Props) {
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Error Boundary
```typescript
// Every page should have an error boundary
<ErrorBoundary fallback={<ErrorState />}>
  <Suspense fallback={<LoadingState />}>
    <PageContent />
  </Suspense>
</ErrorBoundary>
```

## Testing Standards

- **Unit tests (Vitest + Testing Library):** Test component behavior, not implementation
- **E2E tests (Playwright):** Test critical user flows
- **MSW:** Mock all API calls in unit tests
- **Test IDs:** Use `data-testid` only when semantic queries fail
- **Coverage target:** 80% for migrated components

### Test File Locations
```
src/app/components/module/__tests__/Component.test.tsx  # Unit
e2e/module/feature.spec.ts                              # E2E
src/test/mocks/handlers/module.ts                       # MSW handlers
```

## Prohibited Patterns

- ❌ `any` type (use `unknown` + type guards if truly dynamic)
- ❌ `useEffect` for data fetching (use TanStack Query)
- ❌ Inline styles (use Tailwind utilities)
- ❌ `document.querySelector` (use refs)
- ❌ Non-null assertions `!` without justification
- ❌ Index as key in `.map()` (use stable IDs)
- ❌ `console.log` in committed code (use proper error reporting)
- ❌ Barrel exports (`index.ts` re-exports) in large modules
- ❌ Default exports (use named exports for better refactoring)

## Accessibility Requirements

- All interactive elements must be keyboard accessible
- Form fields must have associated labels
- Error messages must be announced to screen readers (`aria-live`)
- Color must not be the only indicator (add icons/text)
- Focus management on route transitions
