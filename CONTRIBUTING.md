# Contributing to rj-dev-migration-toolkit

Thank you for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/org/rj-dev-migration-toolkit
cd rj-dev-migration-toolkit
npm install
cp .env.example .env   # fill in your tokens
```

## Development Workflow

1. **Branch** — create a feature branch from `develop`
2. **Edit** — update skills (`skills/`), agents (`agents/`), prompts (`prompts/`), or instructions (`instructions/`)
3. **Lint** — run `npm run lint` before committing
4. **Format** — run `npm run format` to fix formatting
5. **PR** — open a pull request against `develop` using the PR template

## File Structure

| Directory       | Purpose                                    |
|-----------------|--------------------------------------------|
| `agents/`       | Agent definition files (`.agent.md`)       |
| `skills/`       | Skill knowledge files (`SKILL.md`)         |
| `prompts/`      | Workflow prompts (`.prompt.md`)            |
| `instructions/` | Auto-applied coding standards              |
| `templates/`    | Project scaffolding templates              |
| `docs/`         | Extended documentation                     |

## Adding a New Skill

1. Create `skills/migration-<name>/SKILL.md`
2. Add an entry to the **Skill Catalog** table in `AGENTS.md`
3. Update `README.md` skills table
4. Run `npm run lint` — fix any markdownlint errors

## Adding a New Agent

1. Create `agents/migration-<name>.agent.md` with proper YAML frontmatter
2. Add an entry to `AGENTS.md` Agent Catalog
3. Create a matching stub in `.github/agents/migration-<name>.agent.md`

## Coding Standards

- Follow the Google Java Style Guide for any Java examples in skills
- Use 2-space indentation in YAML/Markdown
- Keep SKILL.md files focused — one domain per skill
- Reference Spring Boot 4 architecture patterns for new code

## Commit Messages

Use Conventional Commits:

```
feat(skills): add migration-security skill
fix(agents): correct coordinator phase ordering
docs: update README with new commands
```

## Code of Conduct

Be respectful and constructive. See [GitHub Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines).
