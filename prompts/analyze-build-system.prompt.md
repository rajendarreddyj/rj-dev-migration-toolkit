---
name: "Analyze Build System & Module Strategy"
description: "Detect build system, analyze module structure, and brainstorm whether migration needs a new module or fits in existing code"
agent: agent
tools: ['read/readFile', 'search/codebase', 'search/fileSearch', 'search/textSearch', 'edit/createFile']
---

# Analyze Build System & Decide Module Strategy

Interactive brainstorming session to determine where migrated code should live.

## Input
- **Project root** or workspace path to analyze
- **Module being migrated** (from Discovery phase output)

## Workflow

### Step 1: Detect Build System

Scan the workspace for build descriptors:

```
Search for: pom.xml, build.gradle, build.gradle.kts, settings.gradle, settings.gradle.kts
Check for: mvnw/gradlew (wrapper presence)
Read: root build descriptor to determine single vs multi-module
```

Report findings:
- Build tool: Maven | Gradle
- Structure: Single-module | Multi-module
- Spring Boot: Present (version?) | Absent
- Existing modules: List with purposes

### Step 2: Ask Brainstorming Questions

Present the following questions interactively. Adapt based on detected build system.

#### If Single-Module Project:
1. Is this project intended to stay as a single deployable?
2. Will migration introduce enough code to justify splitting?
3. Is the existing code already Spring Boot, or traditional WAR/EAR?
4. Can Spring Boot be added to the existing module without breaking the legacy code?
5. Would a gradual strangler-fig approach benefit from module separation?

#### If Multi-Module Project:
1. Which existing module is closest to the migration target's domain?
2. Does the migration target share entities/DTOs with an existing module?
3. Is there a "shared" or "core" module that already has the domain model?
4. Would adding to an existing module exceed a reasonable size (>50 classes)?
5. Are there dependency conflicts between the migration target and existing modules?

#### Always Ask:
1. How will this code be deployed — same artifact as existing, or separate?
2. Which team will own this code after migration?
3. Is there a parallel-run period where old and new must coexist?
4. What's the build time tolerance? (Adding modules = parallel builds = faster)
5. Are there CI/CD pipeline constraints that favor one approach?

### Step 3: Score and Recommend

Based on answers, produce a decision matrix:

```markdown
## Module Strategy Decision

### Factors Assessment
| Factor | Score (1-5) | Notes |
|--------|-------------|-------|
| Domain isolation | ? | Distinct bounded context? |
| Shared dependencies | ? | Overlaps with existing? |
| Team ownership | ? | Same or different team? |
| Deployment independence | ? | Same or separate artifact? |
| Build complexity | ? | Adds overhead? |
| Reversibility | ? | Easy to merge/split later? |

### Recommendation
- **Strategy:** New module | Add to existing | Convert to multi-module
- **Target:** {module name}
- **Rationale:** ...
- **Risk:** ...
```

### Step 4: Scaffold (If New Module Needed)

If recommendation is "new module":

**For Maven:**
1. Create `{module-name}/pom.xml` inheriting from parent
2. Register module in parent `<modules>` section
3. Create standard package structure:
   - `src/main/java/com/{group}/{module}/controller/`
   - `src/main/java/com/{group}/{module}/service/`
   - `src/main/java/com/{group}/{module}/repository/`
   - `src/main/java/com/{group}/{module}/domain/`
   - `src/main/java/com/{group}/{module}/dto/`
   - `src/main/java/com/{group}/{module}/config/`
   - `src/test/java/com/{group}/{module}/`
   - `src/main/resources/`
4. Add inter-module dependency if shared domain exists
5. Verify build: `mvn compile -pl {module-name}`

**For Gradle:**
1. Create `{module-name}/build.gradle.kts`
2. Add `include("{module-name}")` to `settings.gradle.kts`
3. Create standard package structure (same as Maven)
4. Add `implementation(project(":shared"))` if shared domain exists
5. Verify build: `gradle :{module-name}:build`

**If converting single → multi-module:**
1. Warn user this is a significant refactor
2. Propose phased approach: create parent POM/settings first, move existing code second
3. Get explicit approval before restructuring

### Step 5: Document Decision

Output to: `context/migration/{module}/module-strategy.md`

```markdown
# Module Strategy: {module}

## Build System
- Tool: Maven/Gradle
- Structure: Single/Multi-module
- Spring Boot: version or N/A

## Decision
- **Strategy:** {recommendation}
- **Target module:** {name}
- **Created new module:** Yes/No

## Key Factors
1. {factor 1 and reasoning}
2. {factor 2 and reasoning}
3. {factor 3 and reasoning}

## Module Dependencies
- Depends on: [list]
- Depended by: [list]

## Build Verification
- [ ] Module compiles: `{build command}`
- [ ] Tests run: `{test command}`
- [ ] No circular dependencies introduced
```
