# ADR 0001: Backend architecture

Status: PROPOSED

Date: 2026-10-10

This decision is not accepted. It must not be treated as approved until the validation step below has been run and reviewed. The spike in [docs/spike-pi-sqlite.md](../spike-pi-sqlite.md) is proposed and has not been run. No measurements exist yet.

## Context

Recipe Vault is a single-user personal recipe manager (see [docs/requirements.md](../requirements.md)). The frontend is a React 19 + TypeScript scaffold built with Vite. Requirement D3 adds a backend and database that run in Docker on a Raspberry Pi 4B, and D16 left the technology choice open for this decision.

Hardware: Raspberry Pi 4B with 2 GB RAM, currently booting from a 16 GB microSD card. A 512 GB SATA SSD with a USB 3.0 adapter has been ordered and is not installed yet.

## Decision drivers

- Low memory and CPU use on a 2 GB Pi shared with the OS, Docker and a future VPN client.
- Data safety: recipes are hard to recreate, and a microSD card is a failure risk (R1).
- Reliable database backup and full restore, with backup copies on separate physical storage (US9).
- Case-insensitive and accent-insensitive search over title, ingredients and tags (D9).
- Simplicity for a single developer: few moving parts, one language where possible.
- ARM64 Docker compatibility, with builds done off the Pi.
- Room for later features (shopping lists, URL import, cooking mode) without a rewrite.
- Single user, no accounts (D1). Remote access secured at network level (D2).

## Proposed decision

- **Frontend:** the existing React + TypeScript app (Vite), unchanged.
- **Backend:** a Node.js + TypeScript REST API with request validation, sharing types with the frontend where practical.
- **Database:** SQLite in WAL mode, with versioned schema migrations, stored on a persistent Docker volume.
- **Driver:** `better-sqlite3` is a candidate, pending verification. `node:sqlite` is a fallback candidate. Neither is chosen.
- **Packaging:** a Debian-slim (glibc) multi-arch image, with arm64 built off the Pi (for example `buildx` or CI). No compiling on the Pi.
- **Deployment:** Docker on the Pi 4B. The exact container layout, such as one container serving API and frontend, is a detail still to be designed.
- **Backups:** database backups via SQLite's online backup mechanism, plus JSON export (US7). Backup copies must be stored on separate physical storage from the live database. A full restore procedure is documented and tested (US9).
- **Remote access:** network-level (for example a VPN), as in D2. The backend is not exposed directly to the internet.

## Alternatives considered

| Option                 | Assessment                                                                                                                                                                                                                                                                          | Outcome  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Python + FastAPI**   | Lean and has solid validation. Adds a second language and toolchain, and shares no code with the frontend. Possibly stronger for recipe URL import later, which is not verified. Python's standard library ships SQLite, which makes it the main fallback if the Node driver fails. | Fallback |
| **Java + Spring Boot** | Robust and mature, but the highest resource cost (estimated JVM idle memory several times that of Node or Python) and the most boilerplate. Poorly matched to 2 GB RAM and a single-user app.                                                                                       | Rejected |
| **PostgreSQL**         | Strong search and concurrency, and mature backup tools. Needs a second container and more RAM, and solves concurrency that a single user does not have. Does not reduce SD card risk.                                                                                               | Rejected |
| **Node.js + SQLite**   | Lowest operational weight and one language across the stack. Risks: native driver support on ARM64, and single-writer limits.                                                                                                                                                       | Proposed |

Resource figures are estimates from general experience, not measurements.

## Trade-offs

- Node + SQLite gives the smallest footprint and simplest backup, but depends on a native SQLite binding or on a Node built-in module that was still a release candidate when last checked. Prebuilt `better-sqlite3` binaries for Node 24 on glibc arm64 are unconfirmed. A documented gap exists for arm64 musl (Alpine), so Debian-slim is proposed.
- SQLite allows one writer at a time. That is fine for one user, but reopens this decision if D1 changes.
- A single shared TypeScript codebase speeds development, but couples frontend and backend tooling and Node version.
- Choosing SQLite means search is built with FTS5 or normalized columns, not a database extension such as `unaccent`.

## Consequences

If accepted:

- `CLAUDE.md` and `README.md` must be updated to name the selected stack (R5 in the requirements).
- A backend project, migration tooling and a Dockerfile are needed. Scope and layout are to be planned separately.
- The ingredient data model (D5) must be designed before implementation.
- Backup and restore are a first-class feature, not an afterthought. The requirements currently list scheduled backups as out of scope, and this ADR suggests revisiting that.
- A test runner will be needed for the backend. None exists yet.

## Risks

- **Driver availability on ARM64:** `better-sqlite3` may not offer a usable prebuilt binary for the chosen Node version. Mitigation: validation step, plus the fallbacks above.
- **microSD failure or wear:** the largest data-safety risk, independent of technology. Mitigation: move live data to the SSD when installed, and keep backups elsewhere.
- **Backups on the same device:** a backup on the same card or disk does not protect against device failure. Once the SSD hosts the live database, it is no longer separate physical storage for backups.
- **Memory pressure:** the 2 GB limit may be tighter than estimated once the OS, Docker and a VPN client run. Needs measurement.
- **Network-only security:** with no app-level authentication (D1, D2), misconfigured network access exposes all data (R2).
- **x86_64 development, ARM64 target:** differences may only appear on the Pi.

## Validation before acceptance

This ADR must not move to ACCEPTED until the spike in [docs/spike-pi-sqlite.md](../spike-pi-sqlite.md) has been run and its results reviewed. As of this writing the spike is proposed and has not been run, and its numeric pass/fail thresholds are not yet agreed. It covers ARM64 install, FTS5 with accent-insensitive search, online backup and full restore, persistence, RAM, and startup and search performance, on the SSD. Results from the new SSD are required before acceptance. Testing on the existing microSD card is optional because of its limited free space and the production Docker services already running on it.

A failed check triggers its fallback path and a revision of this ADR.

## Unresolved decisions

- Numeric pass/fail thresholds for the spike (RAM, startup, search latency, backup duration).
- Final SQLite driver: `better-sqlite3`, `node:sqlite` or another.
- Node.js version, and the Node.js framework for the REST API.
- Migration tool and approach.
- Ingredient data model for optional quantities and free expressions (D5).
- Where backups are stored once the SSD is the live disk: a third device, another machine or a remote location.
- Backup schedule and whether scheduled backups move into the MVP.
- Container layout and how the frontend is served.
- Backend test strategy.
- Remote access mechanism (VPN choice). Tailscale is the preferred initial approach, documented in [remote-access-tailscale.md](../remote-access-tailscale.md) and not yet decided.
- Deployment details not covered here (volumes, updates, backup destination and schedule, data migration) are collected in [deployment-pi.md](../deployment-pi.md).
- Optional recipe photos are proposed separately in [ADR 0002](0002-recipe-photos.md).
