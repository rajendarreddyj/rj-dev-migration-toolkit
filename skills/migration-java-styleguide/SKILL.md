---
name: migration-java-styleguide
description: "Google Java Style Guide + dr-jskill best practices for migrated Spring Boot code. Enforces formatting, naming, Javadoc, and programming practices. Reference: https://google.github.io/styleguide/javaguide.html. Triggers: 'java style', 'code style', 'naming convention', 'formatting', 'javadoc', 'Google style'."
compatibility: IDE-agnostic
metadata:
  author: migration-toolkit
  version: "1.0"
  references:
    - https://google.github.io/styleguide/javaguide.html
    - https://github.com/jdubois/dr-jskill
---

# Java Style Guide for Migration (Google + dr-jskill)

Enforces Google Java Style Guide conventions with Spring Boot / dr-jskill best practices for all migrated backend code.

## Source File Structure

Every `.java` file follows this order:
1. License/copyright (if present)
2. Package declaration (never line-wrapped)
3. Imports (no wildcards, no module imports)
4. Exactly one top-level class

### Import Rules
- **No wildcard imports** — `import java.util.*` is forbidden
- **No module imports** — `import module java.base` is forbidden
- Static imports in one group, then non-static in one group, separated by one blank line
- ASCII sort order within each group
- No line-wrapping on imports

## Formatting

### Indentation & Line Limits
- **Block indentation:** +2 spaces (not 4, not tabs)
- **Continuation indent:** +4 spaces minimum
- **Column limit:** 100 characters
- **One statement per line**

### Braces (K&R Style)
```java
// CORRECT: K&R style — opening brace on same line
public class ProjectService {
  public ProjectResponse findById(Long id) {
    if (id == null) {
      throw new IllegalArgumentException("ID must not be null");
    }
    return repository.findById(id)
        .map(mapper::toResponse)
        .orElseThrow(() -> new ProjectNotFoundException(id));
  }
}
```

- Opening brace: NO line break before it
- Closing brace: line break before AND after (unless followed by `else`, `catch`, comma)
- **Always use braces** for `if`, `else`, `for`, `do`, `while` — even single-line bodies
- Empty blocks may be concise: `void doNothing() {}`

### Line-Wrapping
```java
// Break BEFORE operators, dots, and method references
return repository.findByStatusAndFirmId(status, firmId)
    .stream()
    .map(ProjectMapper.INSTANCE::toResponse)
    .collect(Collectors.toList());

// Method name stays attached to opening parenthesis
public ResponseEntity<PagedResponse<ProjectResponse>> list(
    @Valid ProjectSearchCriteria criteria,
    @PageableDefault(size = 25) Pageable pageable) {
  // ...
}
```

### Whitespace
- Blank line between class members (fields, constructors, methods)
- Space after keywords (`if`, `for`, `catch`)
- Space before opening brace `{`
- Spaces around binary/ternary operators
- No space before `,` `;` `)` after cast
- No horizontal alignment (creates merge conflicts)

## Naming Conventions

| Type | Style | Examples |
|------|-------|---------|
| Package | `all.lowercase.concatenated` | `com.app.project.service` |
| Class / Interface | `UpperCamelCase` (nouns) | `ProjectService`, `Readable` |
| Method | `lowerCamelCase` (verbs) | `findById`, `sendNotification` |
| Constant (`static final` immutable) | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| Non-constant field | `lowerCamelCase` (nouns) | `projectRepository`, `featureFlags` |
| Parameter | `lowerCamelCase` | `projectId`, `pageable` |
| Local variable | `lowerCamelCase` | `result`, `filteredItems` |
| Type variable | Single capital or `NameT` | `T`, `E`, `RequestT` |

### Naming Anti-Patterns (FORBIDDEN)
- ❌ Hungarian notation: `mName`, `s_instance`, `kConstant`
- ❌ Prefixes/suffixes: `IService`, `ServiceImpl` (use `DefaultProjectService` if needed)
- ❌ Acronyms as all-caps in camelCase: `XMLHTTPRequest` → use `XmlHttpRequest`

### Camel Case Rules for Acronyms
| Prose | Correct | Incorrect |
|-------|---------|-----------|
| "XML HTTP request" | `XmlHttpRequest` | `XMLHTTPRequest` |
| "new customer ID" | `newCustomerId` | `newCustomerID` |
| "supports IPv6 on iOS" | `supportsIpv6OnIos` | `supportsIPv6OnIOS` |

## Programming Practices

### @Override: Always Used
```java
@Override
public String toString() { ... }

// Exception: parent method is @Deprecated — @Override may be omitted
```

### Caught Exceptions: Never Ignored
```java
// WRONG: silent swallow
try { parse(input); } catch (Exception e) {}

// CORRECT: log or rethrow
try {
  parse(input);
} catch (ParseException e) {
  log.warn("Failed to parse input: {}", input, e);
  throw new BadRequestException("Invalid input format", e);
}

// CORRECT: intentionally ignored with explanation
try {
  int i = Integer.parseInt(response);
  return handleNumericResponse(i);
} catch (NumberFormatException _) {
  // not numeric — fall through to text handling
}
```

### Static Members: Qualify with Class
```java
// CORRECT
Foo.staticMethod();

// WRONG
fooInstance.staticMethod();
```

### Finalizers: Never Used
Do not override `Object.finalize()`.

## Javadoc

### Where Required
- Every `public` or `protected` class, method, field, record component
- Exception: self-explanatory getters/setters, `@Override` methods

### Format
```java
/**
 * Finds a project by its unique identifier.
 *
 * <p>Returns the project wrapped in a response DTO. Throws if the project
 * does not exist or belongs to a different firm.
 *
 * @param id the project's database identifier
 * @return the project response DTO
 * @throws ProjectNotFoundException if no project exists with the given ID
 */
public ProjectResponse findById(Long id) { ... }
```

- Summary fragment: noun or verb phrase, capitalized, punctuated
- Block tags in order: `@param`, `@return`, `@throws`, `@deprecated`
- Never write `/** @return the id */` — write `/** Returns the ID. */` or `/** {@return the ID} */`
- Single-line form allowed: `/** An especially short bit of Javadoc. */`

## Spring Boot Specific (from dr-jskill)

### Project Structure (dr-jskill pattern)
```
src/main/java/com/{org}/{app}/
├── Application.java           # @SpringBootApplication entry point
├── config/                    # @Configuration beans
├── {module}/
│   ├── controller/            # @RestController (thin)
│   ├── service/               # Business logic (interface optional for complex domains)
│   ├── repository/            # Spring Data JPA
│   ├── domain/                # JPA entities
│   └── dto/                   # Request/Response records
```

- Service layer is **optional** — only include if business logic exists beyond CRUD
- For simple CRUD, controller can call repository directly (dr-jskill pattern)

### Configuration (dr-jskill pattern)
- Use `.properties` files, NOT YAML
- Externalize secrets via environment variables
- Use `@ConfigurationProperties` for type safety
- `.env` file for local secrets (gitignored)
- `.env.sample` with placeholder values (committed)

### Records for DTOs
```java
// Prefer records for immutable DTOs (Java 16+)
public record ProjectResponse(
    Long id,
    String name,
    ProjectStatus status,
    LocalDateTime createdAt
) {}

// Request DTOs with validation
public record CreateProjectRequest(
    @NotBlank @Size(max = 255) String name,
    @NotNull ProjectStatus status,
    @NotNull Long managerId
) {}
```

### Testing (Google + dr-jskill)
- Test class name: `{ClassUnderTest}Test` (e.g., `ProjectServiceTest`)
- Test method name: `lowerCamelCase` with underscores separating logical components
  - `findById_existingProject_returnsResponse()`
  - `create_blankName_throwsValidationException()`
- Use TestContainers with `@ServiceConnection` for integration tests
- AssertJ for assertions (preferred over JUnit assertions)
- Given-When-Then structure within test body

### Switch Expressions (Modern Java)
```java
// Prefer new-style switch with arrows
return switch (status) {
  case ACTIVE -> handleActive(project);
  case DRAFT -> handleDraft(project);
  case CLOSED -> handleClosed(project);
};
```

### Text Blocks for SQL/JSON
```java
@Query("""
    SELECT p FROM ProjectEntity p
    WHERE p.firmId = :firmId
      AND p.status IN :statuses
    ORDER BY p.name ASC
    """)
List<ProjectEntity> findActiveByFirm(
    @Param("firmId") Long firmId,
    @Param("statuses") List<ProjectStatus> statuses);
```

## Checkstyle Integration

Use `google_checks.xml` from: https://github.com/checkstyle/checkstyle/blob/master/src/main/resources/google_checks.xml

Maven configuration:
```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-checkstyle-plugin</artifactId>
  <version>3.6.0</version>
  <configuration>
    <configLocation>google_checks.xml</configLocation>
    <consoleOutput>true</consoleOutput>
    <failsOnError>true</failsOnError>
  </configuration>
</plugin>
```
