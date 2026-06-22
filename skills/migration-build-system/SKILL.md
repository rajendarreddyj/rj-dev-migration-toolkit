---
name: migration-build-system
description: "Detect existing build system (Maven/Gradle), analyze module structure, and brainstorm whether migration requires a new module or code in existing modules. References dr-jskill project structure conventions. Triggers: 'build system', 'maven module', 'gradle module', 'multi-module', 'add module', 'project structure', 'module layout'."
compatibility: IDE-agnostic
metadata:
  author: migration-toolkit
  version: "1.0"
  references:
    - skill://migration-backend-patterns
    - skill://migration-discovery
    - https://github.com/jdubois/dr-jskill
---

# Build System & Module Strategy Skill

Detects the existing build system, analyzes module structure, and provides brainstorming questions to decide whether migration work belongs in a new module or existing code.

## Build System Detection

### Step 1: Identify Build Tool

```
# Maven indicators
file_search: **/pom.xml
file_search: **/.mvn/wrapper/maven-wrapper.properties
file_search: **/mvnw

# Gradle indicators
file_search: **/build.gradle
file_search: **/build.gradle.kts
file_search: **/settings.gradle
file_search: **/settings.gradle.kts
file_search: **/gradle/wrapper/gradle-wrapper.properties
file_search: **/gradlew
```

### Step 2: Determine Module Structure

```
# Multi-module Maven
grep_search: <modules>|<module>
# Check parent pom for module declarations
read_file: pom.xml (root) — look for <modules> section and <packaging>pom</packaging>

# Multi-module Gradle
grep_search: include\s*\(|include\s+'|includeFlat
read_file: settings.gradle(.kts) — look for include statements
```

### Step 3: Map Existing Modules

Produce a module inventory:
```yaml
build_system:
  type: maven | gradle
  wrapper: true | false
  version: "3.9.x" | "8.x"  # from wrapper properties
  
project_structure:
  packaging: pom | jar | war  # root packaging
  multi_module: true | false
  modules:
    - name: "app-core"
      path: "app-core/"
      packaging: jar
      purpose: "Shared domain, services, config"
      dependencies: []
    - name: "app-web"
      path: "app-web/"
      packaging: war
      purpose: "Servlet controllers, JSP, web resources"
      dependencies: ["app-core"]
    - name: "app-batch"
      path: "app-batch/"
      packaging: jar
      purpose: "Scheduled jobs, batch processing"
      dependencies: ["app-core"]
```

---

## Brainstorming Questions

### MANDATORY — Ask These Before Deciding Module Strategy

These questions MUST be asked during Phase 2 (PLAN) of the migration pipeline, before any code is written.

#### Category 1: Current Architecture Understanding

1. **What is the current module boundary?**
   - Is the legacy code in a single WAR or already split into modules?
   - Where does business logic currently live — servlet layer, DAO layer, or shared utils?

2. **What are the current inter-module dependencies?**
   - Does existing code reference classes across module boundaries?
   - Are there shared domain models or DTOs that multiple modules use?

3. **How is the build currently orchestrated?**
   - Single `mvn package` from root, or module-by-module?
   - Are there profiles that activate different module builds?
   - Does CI/CD build all modules or selectively?

#### Category 2: Migration Scope & Impact

4. **How large is the migration surface area?**
   - How many servlets/controllers are being migrated?
   - If ≤3 endpoints → probably belongs in existing module
   - If ≥10 endpoints with distinct domain → likely warrants a new module

5. **Does the migrated code introduce new domain concepts?**
   - New entities/tables not referenced by existing modules → separate module candidate
   - Extensions of existing entities → same module

6. **Will the migrated code need independent deployment?**
   - Same deployment unit as existing app → same module
   - Separate deployable (e.g., microservice extraction) → new module

7. **Is there a feature flag cutover period where old + new code coexist?**
   - Parallel running → shared module avoids version conflicts
   - Clean cutover → separate module simplifies removal of legacy

#### Category 3: Team & Build Concerns

8. **How many teams will own this code post-migration?**
   - Single team → consolidate in existing module
   - Multiple teams → separate modules for clear ownership

9. **What are the build time implications?**
   - Adding to a large existing module → slower incremental builds
   - Separate module → faster targeted builds, but more complex dependency graph

10. **Does the project use BOM (Bill of Materials) or version catalogs?**
    - Maven BOM → new module can inherit dependency versions from parent
    - Gradle version catalog → shared dependency resolution across modules

#### Category 4: Technical Compatibility

11. **Are there conflicting dependency versions?**
    - Legacy code requires older Spring version → isolate in separate module with own dependency management
    - Compatible versions → same module

12. **Does the target module already have Spring Boot auto-configuration?**
    - If yes → migrated code can plug into existing config
    - If no → adding Spring Boot may disrupt existing non-Boot code

13. **Is the existing project a Spring Boot application or traditional WAR?**
    - Already Spring Boot → add packages/classes to existing module
    - Traditional WAR → may need a NEW Spring Boot module alongside

---

## Decision Framework

### Signals Favoring NEW Module

| Signal | Weight |
|--------|--------|
| ≥10 new endpoints with distinct domain | HIGH |
| Different team ownership post-migration | HIGH |
| Independent deployment requirement | HIGH |
| Conflicting dependency versions | HIGH |
| Legacy is non-Boot WAR and migration target is Boot | MEDIUM |
| Clean bounded context (DDD) with minimal shared entities | MEDIUM |
| Need for independent scaling | MEDIUM |
| Long parallel-run period (old + new coexist) | LOW |

### Signals Favoring EXISTING Module

| Signal | Weight |
|--------|--------|
| ≤3 endpoints, simple CRUD | HIGH |
| Heavily uses shared domain models from existing module | HIGH |
| Same team, same deployment, same lifecycle | HIGH |
| Project already Spring Boot — just adding controllers | HIGH |
| Single deployable monolith (no plans to split) | MEDIUM |
| Build time is not a concern (< 5 min full build) | LOW |

### Decision Output

```yaml
module_decision:
  recommendation: "new_module" | "existing_module"
  confidence: high | medium | low
  target_module: "{name}"  # existing module name, or proposed new name
  rationale: |
    - Summary of key factors
  risks:
    - "Risk if wrong decision..."
  reversibility: |
    How hard is it to undo this later?
```

---

## New Module Scaffolding

### Maven — New Module in Multi-Module Project

#### 1. Create module directory and pom.xml

```xml
<!-- {new-module}/pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>${parent.groupId}</groupId>
        <artifactId>${parent.artifactId}</artifactId>
        <version>${parent.version}</version>
        <relativePath>../pom.xml</relativePath>
    </parent>

    <artifactId>${new-module-name}</artifactId>
    <packaging>jar</packaging>
    <description>Migrated module: ${module-description}</description>

    <dependencies>
        <!-- Spring Boot Starter Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Boot Starter Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Spring Boot Starter Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Shared domain from core module (if applicable) -->
        <dependency>
            <groupId>${parent.groupId}</groupId>
            <artifactId>${core-module-name}</artifactId>
            <version>${project.version}</version>
        </dependency>

        <!-- Test dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-testcontainers</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

#### 2. Register in parent pom.xml

```xml
<!-- In root pom.xml, add to <modules> section -->
<modules>
    <module>existing-module-1</module>
    <module>existing-module-2</module>
    <module>${new-module-name}</module>  <!-- ADD THIS -->
</modules>
```

#### 3. Create standard Spring Boot package structure

```
{new-module}/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/example/{module}/
    │   │       ├── config/          # Module-specific @Configuration
    │   │       ├── controller/      # @RestController classes
    │   │       ├── service/         # @Service business logic
    │   │       ├── repository/      # Spring Data JPA repositories
    │   │       ├── domain/          # @Entity classes
    │   │       └── dto/             # Request/Response records
    │   └── resources/
    │       ├── application.properties  # Module-specific config (if needed)
    │       └── db/migration/           # Flyway scripts for this module
    └── test/
        └── java/
            └── com/example/{module}/
                ├── controller/      # @WebMvcTest classes
                ├── service/         # Unit tests
                ├── repository/      # @DataJpaTest classes
                └── integration/     # Full integration tests
```

### Gradle — New Module in Multi-Module Project

#### 1. Create module directory and build.gradle.kts

```kotlin
// {new-module}/build.gradle.kts
plugins {
    id("java")
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Shared domain from core module (if applicable)
    implementation(project(":${core-module-name}"))

    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:postgresql")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

#### 2. Register in settings.gradle.kts

```kotlin
// In root settings.gradle.kts
include("existing-module-1")
include("existing-module-2")
include("${new-module-name}")  // ADD THIS
```

### Single-Module → Multi-Module Conversion

If the project is currently single-module and needs to become multi-module:

#### Maven Conversion Steps

1. **Restructure root pom.xml** → change packaging to `pom`, add `<modules>`
2. **Move existing source** → into a new child module (e.g., `app-legacy` or `app-web`)
3. **Create shared module** (if needed) → for domain objects used across modules
4. **Create migration module** → the new Spring Boot module

```xml
<!-- Root pom.xml becomes the parent -->
<packaging>pom</packaging>
<modules>
    <module>app-legacy</module>    <!-- existing code moved here -->
    <module>app-shared</module>    <!-- optional: shared domain -->
    <module>app-migrated</module>  <!-- new migrated Spring Boot code -->
</modules>
```

#### Gradle Conversion Steps

1. **Create settings.gradle.kts** (if not exists) → add `include()` for each module
2. **Create subproject directories** → move existing code into a subproject
3. **Extract shared code** into a `shared` or `core` project
4. **Create new migration subproject**

---

## Integration with Discovery Phase

During Phase 1 (DISCOVER), the Discovery agent should also capture:

```yaml
build_analysis:
  build_tool: maven | gradle
  is_multi_module: true | false
  modules_list: [...]
  spring_boot_present: true | false
  spring_boot_version: "3.x.x" | null
  target_module_candidates:
    - module: "app-web"
      reason: "Already has Spring Boot config and controllers"
    - module: "NEW: app-migrated"
      reason: "Legacy is servlet-only WAR, needs separate Boot context"
```

---

## dr-jskill Project Structure Reference

Following [dr-jskill](https://github.com/jdubois/dr-jskill) conventions, the target Spring Boot module should include:

| Artifact | Purpose |
|----------|---------|
| `pom.xml` | Maven descriptor with Spring Boot parent, dependencies |
| `.gitignore` | Java/Maven + IDE + Docker + Node excludes |
| `.editorconfig` | 4-space Java, 2-space YAML/JS, LF endings |
| `.env.sample` | Documented env vars (never commit real `.env`) |
| `compose.yaml` | Dev database via `spring-boot-docker-compose` |
| `Dockerfile` | Production JVM image (jlink + distroless) |
| `src/main/resources/application.properties` | Properties files (not YAML) |

### Key dr-jskill Conventions Applied to Migration

1. **Properties over YAML** — Use `application.properties`, not `.yml`
2. **PostgreSQL by default** — Use Spring Data JPA + PostgreSQL
3. **Testcontainers for integration tests** — `@ServiceConnection` annotation
4. **Docker Compose for dev** — `spring-boot-docker-compose` auto-starts DB
5. **Service layer only when needed** — Simple CRUD can skip service layer
6. **Maven for dependency management** — Prefer Maven unless project already uses Gradle
7. **Records for DTOs** — Java records for request/response types
8. **Actuator always included** — Production readiness endpoints

---

## Validation Checklist

After module decision and scaffolding:

- [ ] Build tool detected correctly (Maven/Gradle)
- [ ] Module structure mapped (single/multi)
- [ ] Brainstorming questions answered with user
- [ ] Decision documented in `context/migration/{module}/module-strategy.md`
- [ ] New module (if created) builds: `mvn compile -pl {module}` or `gradle :{module}:build`
- [ ] New module registered in parent build descriptor
- [ ] Package structure follows dr-jskill convention
- [ ] Dependencies inherit from parent (no version hardcoding)
- [ ] Tests run in isolation: `mvn test -pl {module}` or `gradle :{module}:test`
