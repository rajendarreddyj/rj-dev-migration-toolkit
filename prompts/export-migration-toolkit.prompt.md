---
agent: agent
description: "Export the migration toolkit as a portable, project-independent package for use in other repositories"
tools: ['read/readFile', 'edit/createFile', 'search/codebase', 'search/fileSearch']
---

# Export Migration Toolkit

## Purpose
Package the entire migration toolkit (agents, skills, prompts, instructions) into a self-contained, portable directory that can be dropped into any Java Servlet/JSP/ExtJS project to enable AI-assisted migration to Spring Boot + React.

## Instructions

### 1. Inventory All Toolkit Files

Collect every file belonging to the migration toolkit:

**Agents** (`.github/agents/migration-*.agent.md`):
- migration-coordinator.agent.md
- migration-discovery.agent.md
- migration-backend.agent.md
- migration-frontend.agent.md
- migration-tdd.agent.md
- migration-featureflags.agent.md
- migration-api-analyzer.agent.md
- migration-database.agent.md

**Skills** (`.github/skills/migration-*/SKILL.md`):
- migration-discovery/SKILL.md
- migration-backend-patterns/SKILL.md
- migration-frontend-patterns/SKILL.md
- migration-tdd-patterns/SKILL.md
- migration-java-styleguide/SKILL.md
- migration-api-gap-analysis/SKILL.md
- migration-strangler-fig/SKILL.md
- migration-toolkit-reference/SKILL.md

**Prompts** (`.github/prompts/migrate-*.prompt.md` + related):
- migrate-module-full.prompt.md
- migrate-batch.prompt.md
- migrate-servlet.prompt.md
- migrate-extjs-view.prompt.md
- migrate-jsp-page.prompt.md
- validate-parity.prompt.md
- identify-api-gaps.prompt.md
- generate-cicd-pipeline.prompt.md
- generate-openapi-spec.prompt.md

**Instructions** (`.github/instructions/migration-*.instructions.md`):
- migration-spring-boot.instructions.md
- migration-react.instructions.md

**Context template**:
- context/migration/README.md

### 2. Create Export Directory

Create `exports/migration-toolkit/` with the same structure:
```
exports/migration-toolkit/
├── README.md                    # Setup guide for target project
├── .github/
│   ├── agents/                  # All migration agents
│   ├── skills/                  # All migration skills
│   ├── prompts/                 # All migration prompts
│   └── instructions/            # Migration coding standards
└── context/
    └── migration/
        └── README.md            # Context directory template
```

### 3. Generate README

Create `exports/migration-toolkit/README.md` with:
- What the toolkit does
- Prerequisites (VS Code + GitHub Copilot)
- Installation (copy `.github/` contents to target repo)
- Quick start (`@Migration Coordinator migrate module:your-module`)
- Agent reference table
- Customization points (tech stack, naming conventions)

### 4. Sanitize Project-Specific References

Review each file and replace any LX-IWMS-specific references with generic placeholders:
- Replace `lx-iwms`, `lucernex`, `rolloutmanager` → `{your-project}`
- Replace specific package names → `com.{org}.{app}`
- Keep all patterns, recipes, and methodologies intact

### 5. Validate Completeness

Verify:
- [ ] All cross-references between files resolve
- [ ] No broken skill/agent references
- [ ] All prompts reference available agents/skills
- [ ] Instructions have correct `applyTo` patterns
- [ ] Context template directory structure is complete
