---
name: migration-discovery
description: "Patterns and techniques for analyzing legacy Java Servlet/JSP/ExtJS applications. Use when reverse-engineering a legacy codebase for migration planning. Triggers: 'discover legacy', 'analyze servlet', 'map endpoints', 'extract business rules', 'legacy analysis'."
compatibility: IDE-agnostic
when_to_use:
  - "legacy codebase reverse-engineering during Phase 1"
  - "endpoint mapping from legacy servlets"
  - "business rule extraction from JSP/ExtJS"
  - "suggest improvement to discovery patterns"
metadata:
  author: migration-toolkit
  version: "1.0"
---

# Migration Discovery Skill

Systematic approach to reverse-engineering legacy Java web applications for migration.

## Discovery Search Patterns

### Servlet Mappings
```
# Annotation-based
grep_search: @WebServlet|@WebFilter|@WebListener

# XML-based
file_search: **/web.xml
grep_search: <servlet-mapping>|<filter-mapping>

# URL patterns
grep_search: urlPatterns|url-pattern|loadOnStartup
```

### JSP Business Logic (Critical — often hidden)
```
# Scriptlets with logic (not just display)
grep_search: <%[^=@].*if\s*\(|<%[^=@].*for\s*\(|<%[^=@].*while\s*\(

# Session manipulation
grep_search: session\.setAttribute|session\.getAttribute|session\.invalidate

# Request forwarding/redirecting
grep_search: RequestDispatcher|sendRedirect|forward\(

# Hidden form processing
grep_search: request\.getParameter|request\.getAttribute

# Tag libraries with logic
grep_search: <c:if|<c:forEach|<c:choose|<c:when
```

### ExtJS Components
```
# View definitions
grep_search: Ext\.define\('.*\.view\.|xtype:\s*'grid|xtype:\s*'form|xtype:\s*'tree

# Store/proxy configurations
grep_search: Ext\.data\.Store|Ext\.data\.proxy|Ext\.data\.Model

# Ajax calls outside stores
grep_search: Ext\.Ajax\.request|Ext\.data\.Connection

# Event handlers with logic
grep_search: listeners:|handler:|beforeload|beforesubmit|beforeedit

# Controllers
grep_search: Ext\.define\('.*\.controller\.
```

### DAO/Data Access
```
# JDBC usage
grep_search: PreparedStatement|ResultSet|DriverManager|DataSource

# Named queries
grep_search: @NamedQuery|@NamedNativeQuery|createQuery\(|createNativeQuery\(

# Connection management
grep_search: getConnection\(\)|conn\.close\(\)|connection\.close\(\)
```

### Configuration & Security
```
# Security constraints
grep_search: <security-constraint>|<auth-constraint>|@RolesAllowed|@PermitAll

# Context parameters
grep_search: <context-param>|getInitParameter|getServletContext

# Properties files
file_search: **/*.properties
grep_search: jdbc\.|mail\.|app\.|server\.
```

## Business Rule Extraction Heuristics

### Rule Indicators in Code:
1. **Conditional logic** with domain terms → business rule
2. **Validation** before persistence → constraint rule
3. **Status transitions** with checks → workflow rule
4. **Calculations** with multiple inputs → computation rule
5. **Side effects** (email, audit, notification) → trigger rule
6. **Permission checks** before operations → authorization rule

### Documentation Pattern:
```yaml
rule:
  id: BR-001
  name: "Project activation requires manager assignment"
  source_file: ProjectServlet.java
  source_lines: 145-152
  type: constraint  # constraint | workflow | computation | trigger | authorization
  trigger: "status change to ACTIVE"
  condition: "managerId must not be null"
  action: "reject with error message"
  side_effects: []
  feature_flag_candidate: false
  migration_risk: low
```

## Complexity Scoring

| Factor | LOW (1) | MEDIUM (2) | HIGH (3) | CRITICAL (4) |
|--------|---------|------------|----------|--------------|
| Business rules | 1-5 | 6-15 | 16-30 | 30+ |
| External integrations | 0 | 1-2 | 3-5 | 5+ |
| Database tables | 1-2 | 3-5 | 6-10 | 10+ |
| Session state | None | Read-only | Read/Write | Distributed |
| Concurrency | None | Simple locks | Complex sync | Distributed |
| File I/O | None | Read | Read/Write | Streaming |

**Score = Backend + Frontend + Data. Total > 8 = HIGH RISK module.**
