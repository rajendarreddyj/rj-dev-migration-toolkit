---
name: "Migrate Servlet to Controller"
description: "Single-servlet migration workflow: analyze one servlet, generate Spring Boot controller + service + tests"
agent: agent
tools: ['read/readFile', 'edit/createFile', 'edit/editFiles', 'search/codebase', 'search/textSearch']
---

# Migrate Single Servlet to Spring Boot Controller

Focused workflow for migrating ONE servlet class to a Spring Boot REST controller with full TDD coverage.

## Input
Provide the path to the legacy servlet file.

## Workflow

### Step 1: Analyze the Servlet

Read the servlet and extract:
- URL mappings (from `@WebServlet` or `web.xml`)
- HTTP methods handled (`doGet`, `doPost`, `doPut`, `doDelete`)
- Request parameters and their types
- Business logic (distinguish from HTTP plumbing)
- Response format (JSON, JSP forward, redirect, file download)
- Error handling (try/catch blocks, error codes)
- Session usage
- Filter dependencies

Produce a structured summary as a code comment block in the new controller file.

### Step 2: Design the API Contract

Map legacy endpoints to REST conventions:
```
Legacy: GET /ProjectServlet?action=list&status=active&page=1
Modern: GET /api/v1/projects?status=active&page=0&size=25

Legacy: POST /ProjectServlet (action=create in form body)
Modern: POST /api/v1/projects (JSON body)

Legacy: GET /ProjectServlet?action=detail&id=123
Modern: GET /api/v1/projects/123

Legacy: POST /ProjectServlet?action=delete&id=123
Modern: DELETE /api/v1/projects/123
```

### Step 3: Generate Test Shell (TDD First)

Create test class with test methods for EVERY code path in the servlet:
- Happy path per HTTP method
- Validation failures (missing required params, invalid types)
- Not-found cases
- Permission failures
- Edge cases from the servlet's error handling

Each test should:
- Have a descriptive `@DisplayName`
- Follow Arrange/Act/Assert structure
- Initially `fail("TODO: implement")`

### Step 4: Implement Controller

Write the `@RestController` class that makes the tests pass:
- Map old URL patterns to new REST paths
- Convert request parameters to `@PathVariable`, `@RequestParam`, or `@RequestBody`
- Delegate ALL business logic to service layer
- Return proper HTTP status codes
- Add `@Valid` for request body validation

### Step 5: Implement Service

Extract business logic from the servlet into a `@Service` class:
- Wrap in feature flag check (new vs legacy path)
- Apply proper transaction boundaries (`@Transactional`)
- Throw domain exceptions (not HTTP exceptions)

### Step 6: Implement DTO + Validation

Create request/response DTOs:
- Use Java records for immutability
- Add Bean Validation annotations matching legacy validation
- Create MapStruct mapper for entity ↔ DTO conversion

### Step 7: Verify

Run the tests. Report results. If failures, iterate on implementation.

## Output Files Created
```
src/main/java/.../controller/{Entity}Controller.java
src/main/java/.../service/{Entity}Service.java
src/main/java/.../service/{Entity}ServiceImpl.java
src/main/java/.../dto/{Entity}Request.java
src/main/java/.../dto/{Entity}Response.java
src/main/java/.../mapper/{Entity}Mapper.java
src/test/java/.../controller/{Entity}ControllerTest.java
src/test/java/.../service/{Entity}ServiceTest.java
```
