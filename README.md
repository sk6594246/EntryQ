# EntryQ – Society & Gate Security Management Platform

Fast gate check-ins, visitor passes (QR/OTP), multi-tenant SaaS-ready PWA.

**Live (GitHub Pages):** https://sk6594246.github.io/EntryQ/

## Current Stack (v0.1 – Gate first)

- **Frontend:** Vanilla HTML / CSS / JS (zero build step)
- **Storage:** `localStorage` (multi-tenant via `societyId`)
- **PWA:** Installable on Android & iOS (Add to Home Screen)
- **Later:** Cloudflare D1 + Worker for real backend / real-time

## Features in this release

| # | Feature | Status |
|---|---------|--------|
| 1 | Pre-Approved Access (6-digit OTP pass) | ✅ |
| 2 | Instant Gate Approvals (walk-in logging) | ✅ (auto-approve demo) |
| 3 | Gate Entry Logs (today + history) | ✅ |
| 9 | Guard Kiosk UI (high-contrast, tablet-ready) | ✅ |
| – | Multi-tenant (create multiple societies) | ✅ |
| – | Resident pass creation | ✅ |
| – | Admin overview + JSON export | ✅ |

## How to use

1. Open the app → **+ New Society**
2. Choose role:
   - **Guard Kiosk** – validate OTP, log walk-ins, see today’s entries
   - **Resident** – create guest passes (share the 6-digit code)
   - **Admin** – view stats, logs, export backup

## Project structure

```
EntryQ/
├── index.html
├── css/app.css
├── js/
│   ├── storage.js   ← data layer (swap later for D1)
│   └── app.js
├── sw.js
├── manifest.json
└── icons/
```

## Roadmap (next)

- Real-time resident approval for walk-ins (push / WebSocket)
- Photo capture + display at gate
- QR code generation (in addition to OTP)
- Cloudflare D1 multi-tenant backend
- ANPR / boom-barrier hooks
- Maintenance billing & amenity booking modules

## License

MIT
