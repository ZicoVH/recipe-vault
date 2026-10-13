# Raspberry Pi deployment plan

Status: PLANNED, not implemented. Nothing here has been built, deployed or tested on the Pi. Everything marked "proposal" is a design choice for discussion and not a final decision. The technology stack itself is provisional until [ADR 0001](adr/0001-backend-architecture.md) is accepted.

This document gathers the deployment considerations that the ADR, the [spike](spike-pi-sqlite.md) and tickets 1.2 and 3.1 do not spell out. It does not repeat them. Where they already cover a point, this document links to them.

## What exists and what does not

| Area                                  | State                                                                 |
| ------------------------------------- | --------------------------------------------------------------------- |
| API with SQLite (WAL) in `DATA_DIR`   | Implemented, runs in development only                                 |
| JSON export and import (API and UI)   | Implemented                                                           |
| Docker image, compose file, Pi deploy | Planned, ticket 1.2                                                   |
| Spike on the SSD, ADR acceptance      | Planned, ticket 0.2, blocked on the SSD                               |
| Backup and restore procedure          | Planned, ticket 3.1                                                   |
| Update procedure, dev data migration  | Planned, ticket 3.2 (new)                                             |
| Remote access                         | Planned, see [remote-access-tailscale.md](remote-access-tailscale.md) |
| Photo storage                         | Proposed only, see [ADR 0002](adr/0002-recipe-photos.md)              |
| Scheduled backups                     | Out of MVP scope today, the ADR suggests revisiting this              |

## Target setup

- Raspberry Pi 4B with 2 GB RAM. The OS currently boots from a 16 GB microSD card. A 512 GB SATA SSD on a USB 3.0 adapter is ordered and not installed yet.
- One application container that serves the API and the built frontend (open decision in ADR 0001: container layout and how the frontend is served). Debian-slim arm64 image, built off the Pi.
- Live data on the SSD. A separate backup destination on a different physical device.
- The backend is not published to the internet (D2, R2).

## Docker volumes and persistent storage

- **Proposal:** a bind mount of one directory on the SSD, for example `/mnt/ssd/recipe-vault/data`, mounted at the container's `DATA_DIR`. A bind mount keeps the files visible on the host for backup scripts. A named Docker volume works too but hides the files inside Docker's storage directory.
- One directory holds everything that must survive: the SQLite files and, if ADR 0002 is accepted, `photos/`. One directory means one thing to back up and one thing to restore.
- Mount the SSD by UUID in `/etc/fstab` with a mount option that does not block boot if the SSD is missing, and make the container refuse to start when the data directory is not mounted. Otherwise the app could silently create a fresh, empty database on the SD card.
- Run the container as a non-root user. Give that user ownership of the data directory.
- Put the compose file and its environment in version control. Keep the data directory out of it (already in `.gitignore`).
- Limit Docker's log size (the default `json-file` driver grows without limit) and set a memory limit that leaves room for the OS and the VPN client.
- Docker persistent storage protects against restarts and updates. It is not a backup (R1, US9).

## SQLite and image storage

- WAL mode keeps recent writes in `recipes.db-wal` next to the main file. A plain file copy of the database while the app runs can miss committed data or be inconsistent. Never back up by copying the files of a running database. Use SQLite's online backup mechanism, which the ADR already names.
- The database and `photos/` must be on a local disk, not on a network share. SQLite locking and WAL are not reliable there.
- Only one process writes to the database. Do not run two containers on the same data directory, including during an update. Stop the old container before starting the new one.
- Photos are plain files. They are not part of a SQLite backup, so the backup procedure copies them separately (see next section).
- Check free space on the SSD, and alert or at least log when it is low. A full disk makes SQLite writes fail.

## Backups

The requirements fix the principles (US9): a documented procedure, backups on a different physical device than the live data, and one tested end-to-end run. These points are not yet decided or written down:

- **What to back up:** (1) a consistent SQLite snapshot made with the online backup mechanism, (2) the `photos/` directory if photos exist, (3) a JSON export as an extra, portable copy (it contains recipes only, no photos).
- **Order (proposal):** take the database snapshot first, then copy `photos/`. A photo that is newer than the snapshot is an orphan file and is harmless. A database row pointing to a missing photo is the case to avoid, and this order prevents it.
- **Destination (open decision):** once the SSD is the live disk it cannot also be the backup target (ADR 0001). Options: a second USB drive on the Pi, another computer on the home network reached over SSH, or a remote location. A second drive on the same Pi does not protect against fire, theft or a power surge. Decide how much protection is wanted.
- **Schedule and retention (open decision):** scheduled backups are currently out of MVP scope. Without a schedule, the owner must remember to run the procedure. A simple option is a cron job or systemd timer on the Pi that keeps, for example, the last 7 daily and 4 weekly snapshots. These numbers are examples, not a recommendation backed by measurements.
- **Verification:** after each backup, run `PRAGMA integrity_check` on the snapshot and compare the recipe count with the live database. An untested backup is not a backup.
- **Security:** backups contain all recipes. Treat the destination with the same care as the live data. Encryption of backups is an open question.

## Restore

Document and test these steps once end-to-end (ticket 3.1):

1. Stop the container.
2. Move the damaged data directory aside. Do not delete it until the restore is verified.
3. Restore the SQLite snapshot into a new data directory, then restore `photos/` from the backup that matches it.
4. Run `PRAGMA integrity_check` and start the container. Migrations run on start and must not fail on a restored database.
5. Verify the recipe count, a sample of recipes and a sample of photos.
6. List files in `photos/` that no recipe references, and recipes whose photo file is missing. Resolve or accept them.

Also document the fallback: a JSON export can be imported into an empty database (US8). That restores recipes but not photos or ids.

## Deployment and updates

Not specified in the existing documents:

- **Build and transport (open decision):** build the arm64 image on the development machine or in CI (`buildx`), as the ADR requires. Move it to the Pi through a container registry or as an image file (`docker save` and `docker load`). A private registry is more setup but makes updates repeatable.
- **Versioning:** tag images with a version or commit, not only `latest`, so a previous image can be started again.
- **Update steps (proposal):** make a backup, pull or load the new image, stop the old container, start the new one, check a health endpoint and the recipe count.
- **Migrations are forward-only.** Schema migrations are numbered SQL files and applied files are never edited. After a migration, an older image may not work with the new schema. Therefore the backup before an update is the rollback path. Test the rollback once.
- **Health check:** add a simple endpoint and a Docker `HEALTHCHECK`, with a restart policy of `unless-stopped`.
- **Unattended updates:** not planned. Update by hand until a routine exists.

## Moving data from development to the Pi

The current data is in `apps/api/data` on the development machine and exists nowhere else. Two routes:

| Route                                                                                                                       | Keeps                                                         | Loses                                                             |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Snapshot copy (proposal):** online backup of the dev database, copied into the Pi's data directory before the first start | Recipe ids, timestamps, trash state, photos (once they exist) | Nothing, but the development and Pi migration versions must match |
| JSON export, then import on the Pi                                                                                          | Active recipes                                                | Ids, timestamps, trash, photos                                    |

Steps for the snapshot route: stop the dev API, make an online backup, copy it (and `photos/` if present) to the Pi, check ownership, start the container, verify counts. Do this only after the first backup procedure works, and keep the original dev data until the Pi is verified.

Until the Pi runs, the only safety copy of the development data is a manual JSON export kept on another device.

## Missing considerations to settle before ticket 1.2

- Container layout: one container for API and frontend, or a reverse proxy in front.
- Host port binding: publish only to `127.0.0.1` on the Pi, so only a local proxy or the VPN client can reach it.
- Time zone and clock: timestamps are stored by the server, so the Pi needs working time synchronisation.
- Resource limits and swap on a 2 GB device (measure in the spike).
- Where the build happens and how images get to the Pi.
- Backup destination, schedule and retention, as listed above.

## Related

- [ADR 0001](adr/0001-backend-architecture.md), [spike](spike-pi-sqlite.md), [requirements](requirements.md) (US9, US10, R1, R2)
- [Remote access with Tailscale](remote-access-tailscale.md)
- [ADR 0002: optional recipe photos](adr/0002-recipe-photos.md)
- Tickets 1.2, 3.1, 3.2 in [docs/tickets](tickets/README.md)
