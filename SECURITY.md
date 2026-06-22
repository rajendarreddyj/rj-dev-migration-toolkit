# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in this toolkit, please do **not** open a public GitHub issue.

Instead, report it via one of these channels:

1. **GitHub Security Advisories** — use the "Report a vulnerability" button on this repository's Security tab.
2. **Email** — send details to the repository maintainers listed in `CODEOWNERS`.

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce or proof-of-concept
- Any suggested mitigations

We will acknowledge receipt within **48 hours** and aim to provide a fix or mitigation within **14 days** for critical issues.

## Scope

This repository contains AI agent skill files (Markdown/YAML). Security concerns include:

- Prompt injection payloads embedded in skill/agent files
- Malicious instructions that could cause AI agents to exfiltrate data or perform destructive actions
- Supply-chain risks in `apm.yml` agent dependencies
