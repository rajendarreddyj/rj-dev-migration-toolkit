---
name: migration-spring-boot
description: 'Coding standards for Spring Boot 3.x/4.x migrated backend code'
applyTo: '**/src/main/java/**/*.java, **/src/test/java/**/*.java'
---

# Spring Boot Migration Coding Standards

> **Style Reference:** Follows [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html) + [dr-jskill](https://github.com/jdubois/dr-jskill) best practices.
> See `migration-java-styleguide` skill for detailed formatting, naming, and Javadoc rules.
> **Spring Boot 4 Migration:** See [Spring Boot 4.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide) for breaking changes.

## Formatting (Google Java Style)

- **Indent:** 2 spaces (not 4, not tabs)
- **Column limit:** 100 characters
- **Braces:** K&R style — opening brace on same line, always used for control statements
- **Imports:** No wildcards, static first, ASCII sorted
- **Naming:** `UpperCamelCase` classes, `lowerCamelCase` methods/fields, `UPPER_SNAKE_CASE` constants
- **No Hungarian notation:** No `m`, `s_`, `k` prefixes
- **Acronyms:** `XmlHttpRequest` not `XMLHTTPRequest`

## Dependency Injection

- **Constructor injection** for all required dependencies — declare fields as `private final`
- Use `@RequiredArgsConstructor` (Lombok) or explicit constructors
- Never use `@Autowired` on fields
- Single-implementation services do NOT need interface + impl split (YAGNI)

## Configuration

- Use `.properties` files (`application.properties`) — NOT YAML
- Use `@ConfigurationProperties` for type-safe configuration binding
- Externalize secrets via environment variables or `.env` (never commit `.env`)
- Use Spring profiles for environment-specific config (`application-{profile}.properties`)

## Architecture Rules

1. **Controller Layer** — HTTP binding only
   - No business logic in controllers
   - Use `@Valid` on all request bodies
   - Return `ResponseEntity<T>` for explicit status control
   - One controller per resource/aggregate root

2. **Service Layer** — Business logic lives here
   - Only include if it adds value (complex logic, orchestration)
   - Simple CRUD can skip service layer (controller → repository directly)
   - `@Transactional` at service method level (not class level)
   - Feature flag checks at the entry point of service methods
   - Throw domain exceptions, never `ResponseStatusException`
   - Services should be stateless and testable
   - Method signatures use domain IDs or DTOs, not expose entities directly

3. **Repository Layer** — Data access only
   - Extend `JpaRepository` + `JpaSpecificationExecutor` for dynamic queries
   - No business logic in custom query methods
   - Always include tenant ID in queries (multi-tenant isolation)

4. **DTO Layer** — Use Java records
   - `*Request` for inbound (with validation annotations)
   - `*Response` for outbound (immutable, serialization-friendly)
   - Never expose JPA entities in API responses

## Code Organization

- **Package by feature/domain** — NOT by layer
  - `com.example.project/` contains controller + service + repo + domain for "project"
  - Shared infra in `config/`, `common/`, or `shared/`
- **Utility Classes:** Make final with private constructors

## Logging

- Use SLF4J: `private static final Logger log = LoggerFactory.getLogger(MyClass.class);`
- Never use Logback/Log4j2 directly or `System.out.println()`
- Parameterized logging: `log.info("User {} logged in", userId);`

## Security & Input Handling

- Always use parameterized queries (Spring Data JPA or `NamedParameterJdbcTemplate`)
- Validate request bodies/parameters using JSR-380 (`@NotNull`, `@Size`, etc.)
- Never trust client-provided IDs for authorization decisions

## Mandatory Patterns

### Feature Flag Wrapping
```java
// Every migrated method MUST have a flag gate during migration
if (featureFlags.isActive(Features.MODULE_FEATURE_V2)) {
    return newImplementation(args);
} else {
    return legacyImplementation(args);
}
```

### Error Handling
```java
// Domain exceptions — NOT HTTP exceptions
public class ProjectNotFoundException extends RuntimeException {
    private final Long projectId;
    // constructor, getter
}

// Translated to HTTP in @ControllerAdvice only
```

### Pagination
```java
// Controllers accept Pageable
@GetMapping
public PagedResponse<EntityResponse> list(
    @PageableDefault(size = 25, sort = "name") Pageable pageable) { ... }

// Services return Page<T>, controllers wrap in PagedResponse
```

### Validation
```java
// Request DTOs use Bean Validation
public record CreateProjectRequest(
    @NotBlank @Size(max = 255) String name,
    @NotNull ProjectStatus status,
    @NotNull Long managerId
) {}
```

## Testing Standards

- **Controller tests:** `@WebMvcTest` + `@MockBean` services
- **Service tests:** `@ExtendWith(MockitoExtension.class)` with mocked repos
- **Integration tests:** `@SpringBootTest` + Testcontainers (`@ServiceConnection`)
- **Naming:** `methodName_condition_expectedResult`
- **Coverage target:** 80% line coverage minimum for migrated code

## Build & Verification

- After adding/modifying code, verify the project builds:
  - Maven: `./mvnw clean package` (or `mvnw.cmd clean package` on Windows)
  - Gradle: `./gradlew build` (or `gradlew.bat build` on Windows)
- Ensure all tests pass as part of the build
- Run integration tests: `./mvnw verify` or `./gradlew integrationTest`

## Useful Commands

| Gradle | Maven | Purpose |
|--------|-------|---------|
| `./gradlew bootRun` | `./mvnw spring-boot:run` | Run the application |
| `./gradlew build` | `./mvnw package` | Build the application |
| `./gradlew test` | `./mvnw test` | Run tests |
| `./gradlew bootJar` | `./mvnw spring-boot:repackage` | Package as JAR |
| `./gradlew bootBuildImage` | `./mvnw spring-boot:build-image` | Build container image |

## Spring Boot 4.x Migration Awareness

When migrating TO Spring Boot 4.x (if target is Boot 4):
- **Starters renamed:** `spring-boot-starter-web` → `spring-boot-starter-webmvc`
- **Jackson 3:** `com.fasterxml.jackson.*` → `tools.jackson.*` (annotations exception: still `com.fasterxml.jackson.core`)
- **Annotations:** `@JsonComponent` → `@JacksonComponent`, `Jackson2ObjectMapperBuilderCustomizer` → `JsonMapperBuilderCustomizer`
- **Testing:** `@SpringBootTest` no longer auto-configures MockMVC/WebTestClient — add `@AutoConfigureMockMvc` explicitly
- **Mockito:** Add `@ExtendWith(MockitoExtension.class)` explicitly (removed `MockitoTestExecutionListener`)
- **Properties:** `spring.jackson.read.*` → `spring.jackson.json.read.*`
- **Undertow removed:** Use Tomcat (default) or Jetty only
- **Kotlin 2.2+** minimum if using Kotlin
- **Jakarta EE 11** (Servlet 6.1 baseline)

## Prohibited Patterns

- ❌ `@Autowired` on fields (use constructor injection)
- ❌ `Optional` as method parameter (use overloads)
- ❌ Checked exceptions in service interfaces
- ❌ `System.out.println` (use SLF4J)
- ❌ Raw JDBC in service layer
- ❌ `@SuppressWarnings` without justification comment
- ❌ Mutable DTOs (use records or builder pattern)
