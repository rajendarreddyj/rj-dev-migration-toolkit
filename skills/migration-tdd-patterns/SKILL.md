---
name: migration-tdd-patterns
description: "TDD patterns for migration parity testing. Covers test-first methodology, parity assertions, dual-state feature flag testing, and regression prevention. Triggers: 'migration test', 'parity test', 'feature flag test', 'regression test', 'migration TDD'."
compatibility: IDE-agnostic
metadata:
  author: migration-toolkit
  version: "1.0"
---

# Migration TDD Patterns Skill

Test-Driven Development patterns specifically designed for legacy-to-modern migration projects.

## TDD Cycle for Migration

```
1. EXTRACT: Identify business rule from legacy code
2. SPECIFY: Write test that encodes the rule (test FAILS)
3. IMPLEMENT: Write minimum code to pass the test
4. VERIFY: Confirm behavior matches legacy
5. REFACTOR: Improve code while keeping tests green
6. FLAG: Wrap in feature flag, test both states
```

## Test Categories

### Category 1: Parity Tests
Verify the new implementation produces identical results to the legacy system.

```java
@ParameterizedTest
@CsvSource({
    "input1, expectedOutput1",
    "input2, expectedOutput2",
    "edge-case-input, edge-case-output"
})
@DisplayName("New implementation matches legacy behavior")
void newImplementation_matchesLegacy(String input, String expected) {
    // The expected values come from running the LEGACY code
    String actual = newService.process(input);
    assertThat(actual).isEqualTo(expected);
}
```

### Category 2: Feature Flag Dual-State Tests
Verify behavior in both flag states.

```java
@Nested
@DisplayName("Feature flag: ENTITY_V2")
class FeatureFlagTests {

    @Test
    @DisplayName("Flag ON → uses new implementation")
    void flagOn_usesNew() {
        when(featureManager.isActive(Features.ENTITY_V2)).thenReturn(true);
        var result = service.findById(1L);
        verify(newRepository).findById(1L);  // new path
        verifyNoInteractions(legacyDao);     // old path NOT called
    }

    @Test
    @DisplayName("Flag OFF → uses legacy implementation")
    void flagOff_usesLegacy() {
        when(featureManager.isActive(Features.ENTITY_V2)).thenReturn(false);
        var result = service.findById(1L);
        verify(legacyDao).findById(1);       // old path
        verifyNoInteractions(newRepository); // new path NOT called
    }

    @Test
    @DisplayName("Both paths return identical results for same input")
    void bothPaths_sameResult() {
        var legacyResult = runWithFlag(false, () -> service.findById(1L));
        var newResult = runWithFlag(true, () -> service.findById(1L));
        assertThat(newResult).isEqualTo(legacyResult);
    }
}
```

### Category 3: Contract Tests
Verify API contracts match the legacy endpoint behavior.

```java
@Test
@DisplayName("GET /api/v1/entities returns same shape as legacy /entity/list")
void apiContract_matchesLegacy() throws Exception {
    mockMvc.perform(get("/api/v1/entities").param("status", "ACTIVE"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items").isArray())
        .andExpect(jsonPath("$.items[0].id").isNumber())
        .andExpect(jsonPath("$.items[0].name").isString())
        .andExpect(jsonPath("$.items[0].status").value(oneOf("ACTIVE", "DRAFT", "CLOSED")))
        .andExpect(jsonPath("$.totalCount").isNumber())
        .andExpect(jsonPath("$.page").value(0))
        .andExpect(jsonPath("$.pageSize").value(25));
}
```

### Category 4: Error Parity Tests
Verify error handling matches legacy behavior.

```java
@Nested
@DisplayName("Error handling parity")
class ErrorParity {

    @Test
    @DisplayName("Missing entity → same error response as legacy")
    void notFound_matchesLegacy() throws Exception {
        // Legacy returned 200 with empty body (bad practice, but we must match)
        // OR legacy returned 404 with custom error page
        mockMvc.perform(get("/api/v1/entities/999"))
            .andExpect(status().isNotFound())  // improved from legacy 200-empty
            .andExpect(jsonPath("$.title").value("Entity Not Found"))
            .andExpect(jsonPath("$.status").value(404));
        // NOTE: Document this behavioral change in parity report
    }

    @Test
    @DisplayName("Validation failure → 400 with field errors")
    void validation_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/entities")
                .contentType(APPLICATION_JSON)
                .content("""
                    {"name": "", "status": "INVALID"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.name").exists())
            .andExpect(jsonPath("$.fieldErrors.status").exists());
    }
}
```

### Category 5: Side Effect Tests
Verify that side effects (email, audit, cache) fire correctly.

```java
@Test
@DisplayName("Status change to ACTIVE triggers manager notification")
void statusChangeToActive_notifiesManager() {
    // Arrange
    var entity = entityWith(status("DRAFT"), managerId(42L));
    when(repository.findById(1L)).thenReturn(Optional.of(entity));
    
    // Act
    service.updateStatus(1L, "ACTIVE");
    
    // Assert — side effect
    verify(notificationService).notify(
        eq(42L),
        contains("activated"),
        any()
    );
}
```

## Frontend Test Patterns

### Vitest: Component Behavior Parity
```typescript
describe('StatusBadge - parity with legacy statusRenderer', () => {
  test.each([
    ['ACTIVE', 'bg-green-100'],   // was: badge-green
    ['DRAFT', 'bg-gray-100'],     // was: badge-gray
    ['CLOSED', 'bg-red-100'],     // was: badge-red
  ])('status %s renders with correct style', (status, expectedClass) => {
    render(<StatusBadge status={status as Status} />);
    expect(screen.getByText(status)).toHaveClass(expectedClass);
  });
});
```

### Playwright: Full Page Parity
```typescript
test.describe('Project List - parity with legacy ExtJS grid', () => {
  test('displays same columns as legacy', async ({ page }) => {
    await page.goto('/projects');
    const headers = page.getByRole('columnheader');
    await expect(headers).toHaveText(['Name', 'Status', 'Due Date', 'Manager']);
  });

  test('pagination shows same page size as legacy (25)', async ({ page }) => {
    await page.goto('/projects');
    const rows = page.getByRole('row');
    // Header + 25 data rows
    await expect(rows).toHaveCount(26);
  });

  test('sort by name matches legacy sort behavior', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('columnheader', { name: 'Name' }).click();
    const firstCell = page.getByRole('row').nth(1).getByRole('cell').first();
    await expect(firstCell).toHaveText(/^A/); // Alphabetical ascending
  });
});
```

## Test Shell Generation Rules

1. **One test per business rule** — trace back to discovery report rule ID
2. **Test the interface, not the implementation** — allows refactoring
3. **Use test fixtures** — shared data builders for consistent test data
4. **Mark expected failures with `@Disabled("TODO: implement")`** — tracks progress
5. **Group by feature flag state** — `@Nested` classes for ON/OFF
6. **Include test data rationale** — comment WHY specific values chosen

## Parity Validation Checklist

```markdown
- [ ] All business rules have at least one test
- [ ] Error handling matches legacy (or documented improvement)
- [ ] Pagination returns same page sizes and total counts
- [ ] Sort order matches legacy for all sortable fields
- [ ] Date formatting matches legacy timezone handling
- [ ] Null/empty handling matches legacy (null vs empty string vs missing)
- [ ] Unicode/special characters handled same as legacy
- [ ] Feature flag OFF path delegates to legacy correctly
- [ ] Feature flag ON path produces equivalent results
- [ ] Side effects (email, audit, cache) fire at same trigger points
```
