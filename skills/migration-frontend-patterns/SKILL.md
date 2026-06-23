---
name: migration-frontend-patterns
description: "ExtJS-to-React conversion patterns including component mapping, store-to-query migration, and event handler translation. Triggers: 'convert extjs', 'extjs to react', 'migrate grid', 'migrate form', 'migrate frontend', 'store to query'."
compatibility: IDE-agnostic
when_to_use:
  - "ExtJS component to React conversion during Phase 5"
  - "Ext.data.Store to TanStack Query migration"
  - "grid/form/tree panel conversion"
  - "suggest improvement to frontend migration patterns"
metadata:
  author: migration-toolkit
  version: "1.0"
---

# Frontend Migration Patterns Skill

Reference patterns for converting Sencha ExtJS components to React + TypeScript.

## Component Type Mapping

| ExtJS xtype | React Equivalent | Library |
|-------------|-----------------|---------|
| `grid` / `gridpanel` | `DataTable` | TanStack Table |
| `form` / `formpanel` | `Form` | React Hook Form + Zod |
| `treepanel` | `TreeView` | Custom or Radix |
| `tabpanel` | `Tabs` | Radix UI / Headless UI |
| `window` / `messagebox` | `Dialog` / `AlertDialog` | Radix UI |
| `combobox` | `Select` / `Combobox` | Radix UI + cmdk |
| `datefield` | `DatePicker` | react-day-picker |
| `numberfield` | `Input type="number"` | Native + Zod |
| `toolbar` | Flex container | Tailwind CSS |
| `pagingtoolbar` | Pagination component | TanStack Table |
| `panel` | `Card` / `section` | Tailwind CSS |
| `container` | `div` with layout | Tailwind CSS |

## Store → Query Mapping

| ExtJS Pattern | React Pattern |
|---------------|---------------|
| `store.load()` | `useQuery()` auto-fetch |
| `store.reload()` | `queryClient.invalidateQueries()` |
| `store.add(record)` | `useMutation()` + cache update |
| `store.sync()` | `useMutation()` with batch |
| `store.filter(...)` | Query key with filter params |
| `store.sort(...)` | Query key with sort params |
| `store.getRange()` | `data` from `useQuery` result |
| `store.getCount()` | `data.totalCount` |
| `store.on('load', fn)` | `onSuccess` callback or `useEffect` |
| `store.proxy.extraParams` | Query function parameters |

## Event Handler Mapping

| ExtJS Event | React Equivalent |
|-------------|-----------------|
| `itemclick` / `itemdblclick` | `onClick` / `onDoubleClick` on row |
| `selectionchange` | `onSelectionChange` (TanStack Table) |
| `beforeedit` / `edit` | Form open handler / `onSubmit` |
| `beforeload` | `queryFn` pre-processing |
| `afterrender` | `useEffect([], ...)` or `useLayoutEffect` |
| `show` / `hide` | Conditional rendering or state |
| `expand` / `collapse` | Disclosure state |
| `change` (field) | `onChange` / `watch()` (RHF) |
| `specialkey` (Enter) | `onKeyDown` handler |
| `beforesubmit` | `handleSubmit` validation |

## Conversion Recipes

### Recipe 1: Grid with Remote Store → DataTable + useQuery

**Input (ExtJS):**
```javascript
Ext.define('App.view.UserGrid', {
    extend: 'Ext.grid.Panel',
    store: {
        type: 'users',
        autoLoad: true,
        pageSize: 50,
        proxy: {
            type: 'ajax',
            url: '/api/users',
            reader: { rootProperty: 'data', totalProperty: 'total' }
        }
    },
    columns: [
        { text: 'Name', dataIndex: 'name', flex: 1, sortable: true },
        { text: 'Email', dataIndex: 'email', flex: 1 },
        { text: 'Role', dataIndex: 'role', renderer: function(v) { return v.toUpperCase(); } }
    ],
    dockedItems: [{ xtype: 'pagingtoolbar', dock: 'bottom', displayInfo: true }],
    listeners: {
        itemdblclick: function(grid, record) {
            this.fireEvent('openuser', record.get('id'));
        }
    }
});
```

**Output (React):**
```typescript
// hooks/queries/useUsers.ts
export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userApi.list(params),
    placeholderData: keepPreviousData,
  });
}

// components/users/UserTable.tsx
const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role', cell: ({ getValue }) => (
    <Badge>{(getValue() as string).toUpperCase()}</Badge>
  )},
];

export function UserTable({ onUserOpen }: { onUserOpen: (id: string) => void }) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const { data, isLoading } = useUsers({ ...pagination, sorting });

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      totalCount={data?.total ?? 0}
      isLoading={isLoading}
      onRowDoubleClick={(row) => onUserOpen(row.original.id)}
    />
  );
}
```

### Recipe 2: Form with Validation → React Hook Form + Zod

**Input (ExtJS):**
```javascript
Ext.define('App.view.UserForm', {
    extend: 'Ext.form.Panel',
    items: [
        { xtype: 'textfield', name: 'name', fieldLabel: 'Name', allowBlank: false, maxLength: 100 },
        { xtype: 'textfield', name: 'email', fieldLabel: 'Email', vtype: 'email' },
        { xtype: 'combobox', name: 'role', fieldLabel: 'Role',
          store: ['USER', 'ADMIN', 'MANAGER'], editable: false }
    ],
    buttons: [
        { text: 'Save', formBind: true, handler: 'onSave' },
        { text: 'Cancel', handler: 'onCancel' }
    ]
});
```

**Output (React):**
```typescript
// types/user.ts
export const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  role: z.enum(['USER', 'ADMIN', 'MANAGER']),
});
export type UserFormData = z.infer<typeof userFormSchema>;

// components/users/UserForm.tsx
export function UserForm({ onSubmit, onCancel, defaultValues }: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Name" error={form.formState.errors.name?.message}>
        <Input {...form.register('name')} />
      </FormField>
      <FormField label="Email" error={form.formState.errors.email?.message}>
        <Input type="email" {...form.register('email')} />
      </FormField>
      <FormField label="Role" error={form.formState.errors.role?.message}>
        <Select {...form.register('role')} options={ROLE_OPTIONS} />
      </FormField>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!form.formState.isValid}>Save</Button>
      </div>
    </form>
  );
}
```

### Recipe 3: Renderer Functions → Cell Components

**Input (ExtJS):**
```javascript
{ text: 'Status', dataIndex: 'status', renderer: function(value, meta) {
    var colors = { ACTIVE: 'green', DRAFT: 'gray', CLOSED: 'red' };
    meta.tdCls = 'status-' + value.toLowerCase();
    return '<span class="badge badge-' + colors[value] + '">' + value + '</span>';
}}
```

**Output (React):**
```typescript
const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  CLOSED: 'bg-red-100 text-red-800',
} as const;

function StatusBadge({ status }: { status: keyof typeof STATUS_STYLES }) {
  return (
    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

// In column definition:
{ accessorKey: 'status', cell: ({ getValue }) => <StatusBadge status={getValue()} /> }
```

## Testing Patterns

### Component Test (Vitest + Testing Library):
```typescript
describe('UserTable', () => {
  it('renders columns matching legacy grid', () => {
    render(<UserTable onUserOpen={vi.fn()} />, { wrapper: QueryWrapper });
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
  });

  it('calls onUserOpen on double-click', async () => {
    const onOpen = vi.fn();
    render(<UserTable onUserOpen={onOpen} />, { wrapper: QueryWrapper });
    await waitFor(() => screen.getByText('John Doe'));
    await userEvent.dblClick(screen.getByText('John Doe'));
    expect(onOpen).toHaveBeenCalledWith('user-1');
  });
});
```

### E2E Test (Playwright):
```typescript
test('user list page shows paginated data', async ({ page }) => {
  await page.goto('/users');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(51); // header + 50 rows

  // Pagination
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Showing 51-100')).toBeVisible();
});
```
