# Delivery Ops Console

Production-oriented admin panel for a Firebase-backed delivery operations system. This web app is designed to complement an existing Android driver app by giving dispatch and admin users a secure way to manage drivers, routes, and delivery stops.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Firebase Auth
- Firestore
- Firebase Storage
- Firebase Admin SDK
- React Hook Form + Zod
- Leaflet + React Leaflet

## Implemented Features

- Firebase Auth login with server-issued session cookies
- Role-based access control using Firebase custom claims (`admin`, `dispatcher`)
- Protected dashboard routes
- Driver list and driver detail views
- Daily route list, route creation, driver assignment, and route status updates
- Stop create/edit/delete flows with transaction-backed `stopCount` updates
- Stop reordering
- Proof image preview through protected signed URLs
- Driver location monitoring with optional single-driver live subscription
- Address lookup proxy and map-based coordinate picking
- Firestore rules, indexes, App Hosting config, and custom-claim script

## Project Structure

```text
src/
  app/                  Next.js routes, layouts, route handlers
  core/                 auth, env, errors, utility helpers
  features/             feature modules split by domain
  lib/firebase/         client/admin Firebase bootstrap
  shared/               reusable UI primitives and layout
  scripts/              operational scripts such as custom-claim setup
tests/
  unit/                 utility and domain tests
```

## Firebase Collections

- `drivers/{driverId}`
- `daily_routes/{routeId}`
- `daily_routes/{routeId}/stops/{stopId}`
- `drivers_location/{driverId}`

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_FIREBASE_*` for the client SDK
- `FIREBASE_*` for the Admin SDK
- optional map tile and geocoding settings

For local development, use a service account only in trusted environments. In production, prefer Firebase App Hosting with attached service identity or other application default credentials rather than a long-lived JSON key.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

## Custom Claims

Use the included script to assign roles:

```bash
node src/scripts/set-custom-claims.mjs <uid> <admin|dispatcher>
```

## Firebase Config Files

- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `firebase.json`
- `apphosting.yaml`

## Notes

- Route deletion is intentionally not implemented as a destructive operation. Use status changes such as `cancelled`.
- Stop mutations are intentionally limited to draft routes.
- Live location subscriptions are opt-in and scoped to a single driver page to keep Firestore costs predictable.
