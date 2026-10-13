# Epic 3: Operations

## 3.1 Backup and restore procedure

Size: M. Depends on: 1.2. Covers: US9, R1.

- The docs describe backup and restore on the Pi.
- The docs state that Docker persistent storage is not a backup.
- Backups are stored on a different physical device than the live data.
- The procedure is tested once end-to-end (backup, wipe, restore, verify counts and sample content), and the result is recorded.
- The considerations in [deployment-pi.md](../deployment-pi.md) are settled: backup destination, schedule and retention, order of copying, verification.
- If photos are added (ticket 4.1), backups include the photo directory.

## 3.2 Update procedure and development data migration

Size: M. Depends on: 1.2, 3.1. Covers: US10, R1.

- The docs describe how to build, transport and start a new image on the Pi, and how to roll back with the backup taken before the update.
- The existing development data is moved to the Pi by a snapshot copy or by JSON import, as chosen in [deployment-pi.md](../deployment-pi.md). Counts and sample content are verified, and the original is kept until then.
- Rollback is tested once.

## 3.3 Remote access with Tailscale

Size: M. Depends on: 1.2. Covers: D2, R2. Status: not started.

- Tailscale runs on the Pi and on the phone. The app is reachable inside the tailnet over HTTPS only.
- The backend port is bound to localhost, and Funnel is not enabled.
- Access rules limit the Pi to your own devices.
- A test from mobile data works, and a device outside the tailnet cannot reach the app.
- Described in [remote-access-tailscale.md](../remote-access-tailscale.md). The choice is recorded in ADR 0001.
