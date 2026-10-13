# Spike: Node.js + SQLite on Raspberry Pi 4B

Status: criteria finalized, not run. Thresholds were set in ticket 0.1 and are estimates, not measured values.

## Purpose

Check whether the provisional architecture (Node.js + TypeScript backend with SQLite, in Docker on ARM64) is viable on the target hardware. The result feeds a separate ADR. This spike is a throwaway test, not part of the application.

The architecture recommendation stays provisional until the ADR is accepted.

## Target hardware

- Raspberry Pi 4B, 2 GB RAM.
- Currently booting from a 16 GB microSD card.
- A 512 GB SATA SSD with a USB 3.0 adapter is ordered but not installed yet.

## Test environments

Run the spike in these environments:

1. **SSD (required):** after the SSD is installed and the data volume runs from it. Results on the SSD are required before the architecture is accepted.
2. **microSD (optional):** the current setup. Testing here is optional because the 16 GB card has limited free space and already runs production Docker services. It is the worst case for write wear, speed and free space. If run, use a disposable dataset and avoid disturbing the existing services. Results are compared with the SSD where available.

Record for each run: Pi OS and version, kernel, Docker version, Node version, image base, SQLite version, SQLite driver and version, free disk space, and other services running on the Pi.

## Constraints

- The 16 GB microSD has limited free space for images, the database and backups, and already runs production Docker services that must not be disrupted.
- Backup copies must not live only on the same card or disk as the live database. A backup on the same device does not protect against device failure.
- Memory is shared with the OS, Docker and a future VPN client.

## Checklist

Each check records the measured result and a pass or fail. Numeric thresholds are defined in the Thresholds section.

### 1. ARM64 compatibility

- `better-sqlite3` (latest major compatible with the chosen Node version) installs in a Debian-slim (glibc) arm64 Node image from a prebuilt binary, with no compile step.
- The Alpine (musl) variant is tested only as a comparison. Source compilation there is a known risk.
- The application image is built for arm64 on the dev machine (`buildx`) or in CI, and runs on the Pi without compiling on the Pi.
- Record the Node version tested. Note whether the Node built-in SQLite module (`node:sqlite`) works as an alternative.

**Pass:** the install and image run on the Pi without a compile step. **Fail:** compile required on the Pi, or a runtime error.

### 2. FTS5 and accent-insensitive search

- FTS5 is available in the SQLite build used by the driver.
- A test set includes mixed-case and accented content (for example "Crème brûlée", "Crêpes", "Saumon à l'oseille") and Dutch examples.
- Searching "creme brulee", "CREPES" and "saumon" returns the expected recipes.
- Search covers title, ingredient names and tags, as required by `docs/requirements.md`.
- Inactive (trashed) recipes are excluded.

**Pass:** all expected matches returned, no false matches on the test set. **Fail:** FTS5 missing, or accent or case matching incorrect and not fixable with a simple alternative such as normalized columns.

### 3. Online backup and full restore

- A backup is taken while the app is writing (for example with the online backup API or `VACUUM INTO`).
- The backup file opens and passes `PRAGMA integrity_check`.
- The backup is copied to separate storage (a different physical device from the one holding the live database).
- Full restore: stop the app, wipe the data volume, restore from the backup, start the app, and verify recipe counts and sample content.
- Time and disk space for backup and restore are recorded. Backup takes at most 60 s. Restore, including stop, wipe and start, takes at most 5 min.

**Pass:** restored data matches the source and the integrity check passes. **Fail:** corrupted or incomplete backup, or restore not reproducible.

### 4. Persistence

- WAL mode is enabled on the data volume.
- Data survives a container restart, replacing the container image, and a Pi reboot.
- An abrupt power loss test is optional and only run with a disposable dataset.

**Pass:** no data loss or corruption in the tested scenarios. **Fail:** any loss or failed integrity check.

### 5. RAM usage

- Measured on the Pi with the OS, Docker and expected background services running.
- Measure idle, and under a simple load: a seeded set of about 500 recipes and repeated searches and edits.
- Record container memory and total system memory, and whether swap is used.

**Pass:** container RAM at most 256 MB and at least 300 MB of system memory available under the test load, with no swap in use. **Fail:** exceeds these limits or causes swapping.

### 6. Startup and search performance

- Cold start time of the container to first successful response.
- Search latency with about 500 seeded recipes, measured on the Pi over the local network.
- Record SSD results. If the optional microSD run is done, compare it with the SSD.

**Pass:** cold start at most 10 s to first successful response, and search p95 latency at most 200 ms over the local network with about 500 seeded recipes (the goal is that it feels instant on a phone). **Fail:** exceeds these limits.

### 7. Fallback checks (only if check 1 or 2 fails)

- Alternative SQLite drivers for Node (`node:sqlite`, `sqlite3`).
- A different backend language that ships SQLite in its standard library (for example Python).
- Record the cost of each fallback before any architecture change.

## Thresholds

Set in ticket 0.1. These are estimates chosen for a 2 GB Pi that is shared with other services, not measured values. Revisit them if the spike shows they are unrealistic.

| Check          | Pass criterion                                       |
| -------------- | ---------------------------------------------------- |
| Container RAM  | At most 256 MB under the test load                   |
| System memory  | At least 300 MB available, no swap in use            |
| Cold start     | At most 10 s to first successful response            |
| Search latency | p95 at most 200 ms on the LAN with about 500 recipes |
| Backup         | At most 60 s                                         |
| Restore        | At most 5 min, including stop, wipe and start        |

## Seed dataset

- About 500 recipes: roughly 70% Dutch, 20% French or other accented content, 10% English.
- Each recipe has 5 to 25 ingredients, 3 to 12 steps and 0 to 6 tags.
- Fixed test cases: "Crème brûlée", "Crêpes", "Saumon à l'oseille", plus Dutch titles.
- Some recipes are trashed, to verify that search excludes them.

## Environment requirement

SSD results are required for a "go". Optional microSD results are informational only.

## Assumptions

- Single user, low data volume, no photos in the MVP.
- Debian-based (glibc) images are used, based on documented prebuilt-binary gaps for Node 24 on arm64 musl. This needs confirmation for glibc arm64.
- Figures in the architecture comparison are estimates until measured here.

## Out of scope

- Implementing application features.
- Evaluating PostgreSQL or Spring Boot. 2 GB RAM makes them impractical, and this is not tested here.
- Remote access and VPN setup.
- Automated scheduled backups.

## Pre-spike results (dev PC, 2026-10-13)

A first run of the scripts in `spike/` on the developer PC (x86_64, Node 24.21.0, SQLite 3.53.2, better-sqlite3 12.11.1, 500 generated recipes). This is informational and does not count toward the thresholds or the go/no-go. Run it on the Pi with `cd spike && npm install && node run.mjs <data-dir>`.

| Check                                 | PC result     | Valid for the Pi?                                           |
| ------------------------------------- | ------------- | ----------------------------------------------------------- |
| 2. FTS5 and accent-insensitive search | 11 of 11 pass | Yes, this is logic. Re-run on the Pi to confirm             |
| 3. Backup and restore                 | 4 of 4 pass   | Logic yes. Duration and disk behavior need the Pi           |
| 4. Persistence                        | 3 of 3 pass   | Partly. Container restart, image update and reboot untested |
| 1. ARM64 install                      | Not tested    | No. No arm64 emulation was available                        |
| 5 and 6. RAM, startup, search latency | Informational | No. Different hardware, in-process, no network              |

Findings:

- FTS5 with the `unicode61 remove_diacritics 2` tokenizer matches "creme brulee", "CREPES" and "saumon" as required, and the join on a `trashed` flag excludes trashed recipes. No normalized columns were needed.
- Backup with `db.backup()` while writes continue produced a copy that passes `integrity_check` and restores to identical content.

## Outcome

To be filled in after the spike: measured results per environment, pass or fail per check, and a go or no-go recommendation as input to the ADR.
