---
name: migration-backend-patterns
description: "Spring Boot 4.x migration patterns for converting legacy servlets, filters, and DAOs. Covers layered architecture, error handling, pagination, and testing. References Google Java Style Guide and Spring Boot 4 architecture patterns. Triggers: 'convert servlet', 'spring boot migration', 'servlet to controller', 'dao to repository', 'migrate backend'."
compatibility: IDE-agnostic
metadata:
  author: migration-toolkit
  version: "1.2"
  references:
    - skill://migration-java-styleguide
---

# Backend Migration Patterns Skill

Reference patterns for converting legacy Java web components to Spring Boot 4.x with Java 25.

> **Style:** All code in this skill follows the `migration-java-styleguide` skill (Google Java Style + Spring Boot 4 conventions). Key: 2-space indent, K&R braces, records for DTOs, text blocks for SQL.

## Layer Mapping

| Legacy | Spring Boot | Responsibility |
|--------|-------------|----------------|
| `HttpServlet.doGet/doPost` | `@RestController` | HTTP binding only |
| Servlet business logic | `@Service` | Business rules, orchestration |
| `Filter` (auth) | `SecurityFilterChain` | Authentication/authorization |
| `Filter` (cross-cutting) | `HandlerInterceptor` | Logging, timing, correlation |
| `DAO` (JDBC) | `JpaRepository` / `@Repository` | Data access |
| `ResultSet` mapping | MapStruct `@Mapper` | Object transformation |
| `HttpSession` state | Stateless JWT / Redis session | Auth state |
| `web.xml` | `@Configuration` beans | App configuration |
| `context.xml` | `application.yml` | Properties |

## Conversion Recipes

### Recipe 1: Simple CRUD Servlet → REST Controller

**Indicators:** Servlet with straightforward get/create/update/delete operations.

```java
// Pattern: Controller (thin — validation + delegation only)
@RestController
@RequestMapping("/api/v1/{entities}")
@RequiredArgsConstructor
@Tag(name = "{Entity} Management")
public class EntityController {

    private final EntityService service;

    @GetMapping
    public ResponseEntity<PagedResponse<EntityResponse>> list(
            @Valid EntitySearchCriteria criteria,
            @PageableDefault(size = 25) Pageable pageable) {
        return ResponseEntity.ok(service.search(criteria, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntityResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<EntityResponse> create(@Valid @RequestBody EntityRequest request) {
        EntityResponse created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody EntityRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Recipe 2: DAO with Complex Queries → Spring Data + Specifications

**Indicators:** DAO with dynamic WHERE clause construction, multiple optional filters.

```java
// Specification for dynamic queries
public class EntitySpecifications {

    public static Specification<EntityEntity> withCriteria(EntitySearchCriteria criteria) {
        return Specification.where(hasStatus(criteria.status()))
            .and(hasNameLike(criteria.name()))
            .and(createdAfter(criteria.fromDate()))
            .and(belongsToFirm(criteria.firmId())); // ALWAYS include firmId
    }

    private static Specification<EntityEntity> hasStatus(String status) {
        return (root, query, cb) -> status == null ? null : 
            cb.equal(root.get("status"), status);
    }
}

// Repository using specifications
public interface EntityRepository extends JpaRepository<EntityEntity, Long>,
        JpaSpecificationExecutor<EntityEntity> {
    
    // Simple queries as method names
    Optional<EntityEntity> findByIdAndFirmId(Long id, Long firmId);
    
    // Complex queries as @Query
    @Query("""
        SELECT e FROM EntityEntity e 
        JOIN FETCH e.details d 
        WHERE e.firmId = :firmId AND e.status IN :statuses
        """)
    List<EntityEntity> findActiveWithDetails(
        @Param("firmId") Long firmId, 
        @Param("statuses") List<String> statuses);
}
```

### Recipe 3: Servlet Filter → Spring Security Config

**Indicators:** Filter checking session attributes, roles, or permissions.

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/public/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/**").authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .build();
    }
}
```

### Recipe 4: Error Handling (Servlet exception → RFC 7807)

```java
@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ProblemDetail handleNotFound(EntityNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Entity Not Found");
        problem.setProperty("entityId", ex.getEntityId());
        return problem;
    }

    @ExceptionHandler(BusinessRuleViolationException.class)
    public ProblemDetail handleBusinessRule(BusinessRuleViolationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problem.setTitle("Business Rule Violation");
        problem.setProperty("ruleCode", ex.getRuleCode());
        return problem;
    }
}
```

## Testing Patterns

### Controller Test (MockMvc):
```java
@WebMvcTest(EntityController.class)
@Import(SecurityConfig.class)
class EntityControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private EntityService service;

    @Test
    @WithMockUser(roles = "USER")
    void list_authenticated_returns200() throws Exception {
        when(service.search(any(), any())).thenReturn(pagedResponse());
        
        mockMvc.perform(get("/api/v1/entities")
                .param("status", "ACTIVE")
                .param("page", "0")
                .param("size", "25"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.totalCount").isNumber());
    }
}
```

### Service Test (Mockito):
```java
@ExtendWith(MockitoExtension.class)
class EntityServiceImplTest {

    @Mock private EntityRepository repository;
    @Mock private FeatureManager featureManager;
    @InjectMocks private EntityServiceImpl service;

    @Test
    void findById_exists_returnsResponse() {
        var entity = TestFixtures.entityWith(id(1L), name("Test"));
        when(repository.findByIdAndFirmId(1L, FIRM_ID)).thenReturn(Optional.of(entity));
        
        var result = service.findById(1L);
        
        assertThat(result.name()).isEqualTo("Test");
    }
}
```

### Integration Test (Testcontainers):
```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class EntityIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", PG::getJdbcUrl);
    }

    @Autowired private TestRestTemplate rest;

    @Test
    void fullCrudLifecycle() {
        // Create
        var created = rest.postForEntity("/api/v1/entities", request, EntityResponse.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        
        // Read
        var fetched = rest.getForEntity("/api/v1/entities/" + id, EntityResponse.class);
        assertThat(fetched.getBody().name()).isEqualTo("Test");
    }
}
```

## Pagination Pattern

```java
// Response DTO matching ExtJS reader expectations during migration
public record PagedResponse<T>(
    List<T> items,
    long totalCount,
    int page,
    int pageSize,
    int totalPages
) {
    public static <T> PagedResponse<T> from(Page<T> springPage) {
        return new PagedResponse<>(
            springPage.getContent(),
            springPage.getTotalElements(),
            springPage.getNumber(),
            springPage.getSize(),
            springPage.getTotalPages()
        );
    }
}
```

## Spring Boot Reference Patterns

Best practices adopted from [Spring Boot](https://github.com/jdubois/Spring Boot) for Spring Boot scaffolding.

### Project Bootstrap (Spring Boot style)
```properties
# application.properties (NOT YAML — Spring Boot convention)
spring.application.name=${MODULE_NAME}
server.port=8080
spring.datasource.url=jdbc:postgresql://localhost:5432/${DB_NAME}
spring.jpa.open-in-view=false
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
```

### Simple CRUD Without Service Layer (Spring Boot pattern)
For entities with no business logic beyond CRUD, skip the service layer:
```java
@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagController {

  private final TagRepository repository;
  private final TagMapper mapper;

  @GetMapping
  public List<TagResponse> list() {
    return repository.findAll().stream()
        .map(mapper::toResponse)
        .toList();
  }

  @PostMapping
  public ResponseEntity<TagResponse> create(@Valid @RequestBody TagRequest request) {
    var entity = mapper.toEntity(request);
    var saved = repository.save(entity);
    return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(saved));
  }
}
```

### Records for DTOs (Java 16+)
```java
// Request records with validation
public record CreateProjectRequest(
    @NotBlank @Size(max = 255) String name,
    @NotNull ProjectStatus status,
    String description
) {}

// Response records (immutable by default)
public record ProjectResponse(
    Long id,
    String name,
    ProjectStatus status,
    LocalDateTime createdAt
) {}
```

### Testcontainers with @ServiceConnection (Spring Boot 4.x)
```java
@SpringBootTest
@Testcontainers
class ProjectServiceIntTest {

  @Container
  @ServiceConnection
  static PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>("postgres:16-alpine");

  // No @DynamicPropertySource needed — @ServiceConnection auto-configures
}
```

### Text Blocks for Multiline SQL/JSON
```java
@Query("""
    SELECT p FROM ProjectEntity p
    WHERE p.firmId = :firmId
      AND p.status = :status
    ORDER BY p.name ASC
    """)
Page<ProjectEntity> findByFirmAndStatus(
    @Param("firmId") Long firmId,
    @Param("status") ProjectStatus status,
    Pageable pageable);
```

### Environment-Based Configuration (Spring Boot pattern)
```
# .env (gitignored — local secrets)
DB_PASSWORD=localpass123
JWT_SECRET=dev-secret-key

# .env.sample (committed — placeholder values)
DB_PASSWORD=change-me
JWT_SECRET=change-me

# application.properties references
spring.datasource.password=${DB_PASSWORD}
app.jwt.secret=${JWT_SECRET}
```
