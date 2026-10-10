# Spike: Node.js + SQLite on Raspberry Pi 4B

Status: proposed, not run. Pass/fail criteria are to be finalized before the spike is executed.

## Purpose

Check whether the provisional architecture (Node.js + TypeScript backend with SQLite, in Docker on ARM64) is viable on the target hardware. The result feeds a separate ADR. This spike is a throwaway test, not part of the application.

The architecture recommendation stays provisional until the ADR is accepted.

## Target hardware

- Raspberry Pi 4B, 2 GB RAM.
- Currently booting from a 16 GB microSD card.
- A 512 GB SATA SSD with a USB 3.0 adapter is ordered but not installed yet.

## Test environments

Run the spike in two environments and compare results:

1. **microSD:** the current setup. It is the worst case for write wear, speed and free space.
2. **SSD:** after the SSD is installed and the system or data volume runs from it.

Record for each run: Pi OS and version, kernel, Docker version, Node version, image base, SQLite version, SQLite driver and version, free disk space, and other services running on the Pi.

## Constraints

- 16 GB microSD means limited free space for images, the database and backups.
- Backup copies must not live only on the same card or disk as the live database. A backup on the same device does not protect against device failure.
- Memory is shared with the OS, Docker and a future VPN client.

## Checklist

Each check records the measured result and a pass or fail. Criteria marked TBD are numeric thresholds to be agreed before the spike runs.

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
- The backup is copied to separate storage (another device or the SSD, once installed).
- Full restore: stop the app, wipe the data volume, restore from the backup, start the app, and verify recipe counts and sample content.
- Time and disk space for backup and restore are recorded.

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

**Pass:** TBD, to be set as a maximum container RAM and a minimum free system memory. **Fail:** exceeds the agreed limits or causes swapping under the test load.

### 6. Startup and search performance

- Cold start time of the container to first successful response.
- Search latency with about 500 seeded recipes, measured on the Pi over the local network.
- Compare microSD and SSD results.

**Pass:** TBD, to be set as a maximum start time and a maximum search latency (the goal is that it feels instant on a phone). **Fail:** exceeds the agreed limits.

### 7. Fallback checks (only if check 1 or 2 fails)

- Alternative SQLite drivers for Node (`node:sqlite`, `sqlite3`).
- A different backend language that ships SQLite in its standard library (for example Python).
- Record the cost of each fallback before any architecture change.

## Criteria to finalize before running

- Numeric thresholds for RAM, startup time and search latency.
- Maximum acceptable backup and restore duration.
- Seed dataset definition (size, language mix, accents).
- Whether the microSD results alone can give a "go", or whether SSD results are required for the final decision.

## Assumptions

- Single user, low data volume, no photos in the MVP.
- Debian-based (glibc) images are used, based on documented prebuilt-binary gaps for Node 24 on arm64 musl. This needs confirmation for glibc arm64.
- Figures in the architecture comparison are estimates until measured here.

## Out of scope

- Implementing application features.
- Evaluating PostgreSQL or Spring Boot. 2 GB RAM makes them impractical, and this is not tested here.
- Remote access and VPN setup.
- Automated scheduled backups.

## Outcome

To be filled in after the spike: measured results per environment, pass or fail per check, and a go or no-go recommendation as input to the ADR.
