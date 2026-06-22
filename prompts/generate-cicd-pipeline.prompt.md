---
agent: agent
description: "Generate CI/CD pipeline (GitHub Actions) for a migrated Spring Boot + React application"
tools: ['read/readFile', 'edit/createFile', 'search/codebase', 'search/fileSearch', 'search/textSearch']
---

# Generate CI/CD Pipeline for Migrated Application

## Context
Generate GitHub Actions workflows for the migrated **{{module}}** module that handles both the Spring Boot backend and React frontend, including feature flag awareness and dual-run validation.

## Instructions

### 1. Analyze Project Structure

Determine the build tools and test frameworks in use:
- **Backend:** Maven/Gradle, JUnit 5, Spring Boot version, Java version
- **Frontend:** npm/pnpm, Vitest, Playwright, Node.js version
- **Database:** Flyway migrations, TestContainers config
- **Feature Flags:** Togglz configuration, flag-dependent tests

### 2. Generate Backend CI Workflow

Create `.github/workflows/backend-ci.yml`:
```yaml
name: Backend CI
on:
  push:
    branches: [develop, 'feature/**', 'release/**']
    paths: ['src/main/java/**', 'src/test/java/**', 'pom.xml']
  pull_request:
    branches: [develop]
    paths: ['src/main/java/**', 'src/test/java/**', 'pom.xml']

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
          cache: maven

      - name: Run Checkstyle (Google Style)
        run: mvn checkstyle:check -q

      - name: Run Unit Tests
        run: mvn test -Dspring.profiles.active=test

      - name: Run Integration Tests
        run: mvn verify -Pit-tests -Dspring.profiles.active=test

      - name: Run Feature Flag Parity Tests
        run: mvn test -Dgroups=parity -Dspring.profiles.active=test

      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: target/site/jacoco/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
          cache: maven
      - name: OWASP Dependency Check
        run: mvn verify -Powasp-check -DskipTests
```

### 3. Generate Frontend CI Workflow

Create `.github/workflows/frontend-ci.yml`:
```yaml
name: Frontend CI
on:
  push:
    paths: ['frontend/**', 'package.json']
  pull_request:
    paths: ['frontend/**', 'package.json']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install Dependencies
        run: npm ci
        working-directory: frontend

      - name: Lint
        run: npm run lint
        working-directory: frontend

      - name: Type Check
        run: npx tsc --noEmit
        working-directory: frontend

      - name: Unit Tests
        run: npm run test -- --coverage
        working-directory: frontend

  e2e:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install
        run: npm ci
        working-directory: frontend
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium
        working-directory: frontend
      - name: Run E2E Tests
        run: npx playwright test
        working-directory: frontend
```

### 4. Generate Deployment Workflow

Create `.github/workflows/deploy.yml` with environment-based deployment:
- **dev:** Auto-deploy on push to develop
- **staging:** Auto-deploy on push to release branches
- **production:** Manual approval required

### 5. Generate Migration Validation Workflow

Create `.github/workflows/migration-parity.yml`:
- Run parity tests comparing legacy vs new responses
- Run dual-run validation in staging
- Block production deploy if parity < 99%

## Variables

- `module`: The migration module name
- `javaVersion`: Java version (default: 21)
- `nodeVersion`: Node.js version (default: 20)
