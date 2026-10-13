# Remote access with Tailscale

Status: PLANNED, not implemented. Tailscale is not installed or configured, and no service is exposed. Tailscale is the preferred initial approach, but the VPN choice is still an open decision in [ADR 0001](adr/0001-backend-architecture.md) and D2 in the [requirements](requirements.md) only says "network level (e.g. VPN)".

Points marked "verify" come from general knowledge of Tailscale, not from this project. Check them against the current Tailscale documentation before relying on them.

## Goal

Use Recipe Vault from a smartphone at home and away from home, without opening the Pi to the public internet and without adding app-level login (D1, D2).

## How it would work

- Tailscale builds a private network (a tailnet) between your own devices. The Pi and the phone both join it, signed in to the same Tailscale account. Traffic between them is encrypted. The Pi needs no open inbound port on the router.
- Install Tailscale on the **Pi host**, not inside the app container (proposal). The app container stays unaware of it.
- The Pi gets a private name in the tailnet, for example `recipe-vault.<tailnet-name>.ts.net` (MagicDNS, verify), usable on the phone anywhere.
- Install the Tailscale app on the phone and keep it connected. When it is off, the app is unreachable from outside the home network.

## Exposing the frontend and API inside the tailnet

- The app container publishes its port only to `127.0.0.1` on the Pi (see [deployment-pi.md](deployment-pi.md)). It is not reachable from the LAN or the internet directly.
- Tailscale's `serve` feature (verify) would forward `https://<pi-name>.<tailnet>.ts.net` to `http://127.0.0.1:<port>`, so the tailnet sees one HTTPS address.
- One address and one origin serve both the frontend and `/api`. That matches how the frontend already calls `/api` on the same origin, so no CORS configuration is needed. Do not add permissive CORS.
- Do **not** use Tailscale Funnel (verify): it publishes a service to the public internet, which is the opposite of the goal.

## HTTPS and browser security

- HTTPS is needed for a future PWA and service worker ([pwa-and-offline.md](pwa-and-offline.md)): browsers only allow them in a secure context. Plain `http://` over the tailnet is still encrypted by Tailscale, but the browser treats the page as insecure.
- Tailscale can issue a certificate for the `.ts.net` name once HTTPS is enabled for the tailnet in its admin console (verify). That avoids self-signed certificates and manual renewal.
- Certificate names are typically recorded in public Certificate Transparency logs (verify). The host and tailnet name would become public, the content would not. Choose a host name that reveals nothing private.
- Host header and origin: the API should answer only for the expected host name, and keep requiring `application/json` for writes (it already returns 415 otherwise). Together with no CORS, this makes it hard for a web page you visit on the phone to read or change your recipes through your own network connection.
- Keep security headers in mind when the frontend is served (for example `X-Content-Type-Options: nosniff` and a content security policy). This belongs to ticket 1.2.

## Authentication and authorization

- There is no login in the app (D1, D2). Access control is "being on the tailnet". Anyone who can reach the address can read, change and delete every recipe, so the tailnet is the whole security boundary (R2).
- Tailscale controls who is on the tailnet. Protect that account with multi-factor authentication at the sign-in provider, and keep the tailnet to your own devices.
- Optionally restrict with Tailscale access rules so that only your phone and laptop can reach the Pi, and nothing on the Pi except the app port (verify the current policy syntax).
- Do not share the Pi node with other Tailscale users, and review the device list now and then.
- A lost or stolen phone: remove it from the tailnet in the admin console, and consider key expiry settings (verify).
- Tailscale can pass the signed-in user's identity to a service behind `serve` (verify). A later check in the API could use it, but that adds app-level authorisation and is not planned.
- The backups also hold all recipes, so they need the same care (see [deployment-pi.md](deployment-pi.md)).

## Difference from public exposure

| Aspect                | Tailscale (private)                  | Public (port forward, Funnel or a public tunnel)                                |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| Who can reach the app | Only devices you add to the tailnet  | Anyone on the internet                                                          |
| App login needed      | No, matching D1 and D2               | Yes. Without it, anyone could read and delete recipes                           |
| Attack surface        | Tailscale client on the Pi and phone | The app itself, bots and scanners, DoS, brute force                             |
| Extra work            | Install clients, enable HTTPS        | Accounts, passwords or passkeys, rate limiting, session handling, TLS, patching |
| Fits the requirements | Yes (D2)                             | No. It would need a new decision and an authentication design                   |

## Limits and trade-offs

- The phone needs Tailscale connected, which uses some battery and may conflict with another VPN on the phone (verify, especially on iOS).
- The app is unreachable when the Pi, its internet connection or Tailscale is down. At home, the same name should still work through the local network (verify). Offline access is a separate, optional topic ([pwa-and-offline.md](pwa-and-offline.md)).
- Tailscale is a third-party service and depends on its coordination server for new connections. Free-plan limits and terms can change (verify). Alternatives, such as a self-hosted WireGuard, are open if that matters.
- The Pi has 2 GB RAM. The Tailscale client's memory use is part of the spike's memory check (ADR 0001 risk "Memory pressure").

## Rollout steps (when it is built)

Planned as ticket 3.3. Not started.

1. Finish the Pi deployment (ticket 1.2), with the port bound to localhost.
2. Create or review the Tailscale account, enable multi-factor authentication, install the client on the Pi and on one phone.
3. Enable HTTPS for the tailnet and set up `serve` for the app port. Do not enable Funnel.
4. Restrict access rules to your own devices.
5. Test from mobile data: open the app, create, edit and delete a recipe, import and export.
6. Test the negative case: the app must not be reachable from a device outside the tailnet, and the router must have no port forward.
7. Record the result and update ADR 0001 (VPN choice, if accepted).

## Related

- [requirements](requirements.md): D1, D2, R2
- [ADR 0001](adr/0001-backend-architecture.md): remote access and security risks
- [deployment-pi.md](deployment-pi.md), [pwa-and-offline.md](pwa-and-offline.md)
