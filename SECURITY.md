# Security Policy

Apoyo Venezuela is a humanitarian, non-partisan emergency-relief tool. Keeping reporters and users safe is a priority, and we welcome reports that help us protect people during a crisis.

## Supported Versions

This is a single, continuously deployed web application. There are no long-lived release branches: the latest code on `main` and the production site are what we support and patch.

| Version | Supported |
| ------- | --------- |
| Latest code on `main` | Yes |
| Production site (https://apoyovenezuela.com) | Yes |
| Older commits or forks | No |

## Reporting a Vulnerability

Please report security issues privately. Do not open a public issue, and do not disclose the problem publicly until a fix has been released.

Preferred channel:

1. Go to the repository Security tab on GitHub (https://github.com/javierdejesusda/ayuda-venezuela).
2. Choose "Report a vulnerability" to open a private advisory.

Alternative channel:

- Email javier.dejesusj9@gmail.com with a clear description and reproduction steps.

To help us assess and fix the issue quickly, please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce, including any relevant URLs, payloads, or configuration.
- Affected pages, endpoints, or components if known.

## What to Expect

- Acknowledgment of your report within a few days.
- An assessment of severity and impact.
- Coordinated disclosure: we will work with you on timing and confirm once a fix is released.
- Optional credit for your contribution, if you would like to be named.

## Scope

This is an emergency-response tool, and some design choices are intentional. The following are by design and are not vulnerabilities:

- **Public anon key.** The Supabase anon key is shipped in the browser bundle on purpose. It is public by design. The `service_role` and any other secret keys are never exposed.
- **Open row-level security.** To let anyone report and update needs without an account, RLS allows read, insert, and update. Delete is not allowed. This open model is intentional; moderation is future work.
- **Demo mode behavior.** With no environment variables set, the app runs against an in-memory store with sample data, and data is not shared between users. This local-only behavior is expected.

### In scope

We are especially interested in issues such as:

- Authentication or authorization bypass beyond the intended open model.
- Exposure of restricted data, secrets, or any data not meant to be public.
- Cross-site scripting (XSS) and related injection flaws.
- Server-side request forgery (SSRF).
- Remote code execution (RCE).
- Anything that enables abuse or spam at scale, or that could cause harm to users.

### Out of scope

- The public anon key.
- The known open RLS model (read, insert, and update allowed; no delete).
- Demo-mode, local-only data behavior.

Thank you for helping keep Apoyo Venezuela safe for the people who depend on it.
