---
name: project-overview
description: Delivery tracking admin web console — tech stack, key Firestore collections, and known data conventions
metadata:
  type: project
---

Next.js 15 App Router admin console for a delivery tracking mobile app (Firebase). Firebase project ID: `deliverytracking-a788b`.

Key Firestore collections: `drivers` (UID as doc ID), `drivers_location` (UID as doc ID), `daily_routes` (UUID as doc ID, subcollection `stops`).

**Why:** The mobile driver app writes to these collections; the web console reads them via Firebase Admin SDK.

**How to apply:** When touching data models, match these collection paths. Driver documents may have no `active` field — treat that as `active: true` (fixed in mappers.ts).
