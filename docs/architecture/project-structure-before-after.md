# Project Structure: Before vs After

## Purpose

This document explains the current project structure, why it made sense for the original RFID-first system, and how the repository should evolve for the new vision-based drawer architecture.

The goal is not only to add features, but to keep the codebase readable, predictable, and easy to extend.

---

## 1. Design Principle

A readable project structure should make these things obvious:
- where hardware-facing code lives
- where business logic lives
- where AI/vision logic lives
- where UI logic lives
- which code is production code vs test/setup/docs

For this project, the main readability problem is that the system is no longer only:
- `frontend`
- `backend`
- `kiosk`

It is becoming a 5-part system:
- web app
- core API
- kiosk controller firmware
- edge vision controller
- vision inference service

If the folder structure does not reflect that change, the code will become harder to reason about over time.

---

## 2. Current Structure (Before)

```text
inventory_software/
├── README.md
├── RUN_GUIDE.md
├── ADMIN_TRACKING_FEATURES.md
├── check_users.py
├── create_student.py
├── package.json
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── app/
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── s3.py
│   │   ├── models/
│   │   ├── routes/
│   │   └── schemas/
│   └── test/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   ├── domain/
│   │   ├── lib/
│   │   ├── repositories/
│   │   └── services/
│   └── test/
├── kiosk/
│   ├── kiosk_main/
│   └── test/
└── scripts/
```

### What is good about the current structure
- Top-level separation between `backend`, `frontend`, and `kiosk` is clear
- Backend already separates `models`, `routes`, and `schemas`
- Frontend already has some domain separation
- Firmware is isolated from web code

### What is becoming difficult
- Vision logic does not have a home yet
- Hardware control and AI processing would be mixed if added carelessly
- Root directory already contains many one-off docs and scripts
- Backend is currently centered on REST resources, not on bounded workflows
- Current structure reflects `RFID per item`, not `slot-based loose tracking`

---

## 3. What the Current Structure Means Architecturally

### Before: RFID-first architecture
The repository originally maps cleanly to this system:

- `frontend/` = user/admin web UI
- `backend/` = authentication, item CRUD, loans, logs
- `kiosk/` = ESP32 firmware that reads cards/tags and unlocks cabinet

This was appropriate because item identification happened at the firmware edge through RFID scanning.

### Why that is no longer enough
In the new design, item identification moves into image processing and similarity inference. That creates two new concerns that deserve explicit structure:

1. `vision orchestration`
   - receive drawer-close events
   - control capture timing
   - manage calibration and snapshot storage

2. `vision inference`
   - diff images
   - segment slots
   - embed crops
   - compare similarity
   - emit confidence scores

If these are hidden inside `backend/` or `scripts/`, readability will degrade quickly.

---

## 4. Recommended Structure (After)

```text
inventory_software/
├── README.md
├── RUN_GUIDE.md
├── VISION_BASED_INVENTORY_ARCHITECTURE.md
├── PROJECT_STRUCTURE_BEFORE_AFTER.md
├── docs/
│   ├── architecture/
│   │   ├── system-context.md
│   │   ├── drawer-lifecycle.md
│   │   ├── exception-flow.md
│   │   └── data-model.md
│   ├── hardware/
│   │   ├── drawer-wiring.md
│   │   ├── camera-placement.md
│   │   └── lighting-calibration.md
│   ├── backend/
│   ├── frontend/
│   └── operations/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── app/
│   │   ├── auth/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── drawer_sessions/
│   │   │   ├── inventory_events/
│   │   │   ├── item_types/
│   │   │   └── notifications/
│   │   └── repositories/
│   └── test/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── admin-drawers/
│   │   │   ├── admin-exceptions/
│   │   │   ├── item-type-registration/
│   │   │   └── session-monitoring/
│   │   ├── domain/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── shared/
│   └── test/
├── kiosk/
│   ├── firmware/
│   │   ├── src/
│   │   ├── include/
│   │   └── README.md
│   └── test/
├── vision/
│   ├── controller/
│   │   ├── app/
│   │   │   ├── capture/
│   │   │   ├── calibration/
│   │   │   ├── sessions/
│   │   │   └── transport/
│   │   ├── requirements.txt
│   │   └── README.md
│   ├── inference/
│   │   ├── app/
│   │   │   ├── embeddings/
│   │   │   ├── similarity/
│   │   │   ├── subtraction/
│   │   │   ├── slot_mapping/
│   │   │   └── pipelines/
│   │   ├── requirements.txt
│   │   └── README.md
│   └── test/
├── scripts/
│   ├── dev/
│   ├── seed/
│   ├── calibration/
│   └── migration/
└── tests/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

---

## 5. Why This “After” Structure Is More Readable

### A. `docs/` becomes the home for design knowledge
Right now, root markdown files are useful but will keep growing. Moving long-lived technical documents into `docs/` makes the root cleaner.

Use this rule:
- root = entrypoint docs only
- `docs/` = detailed reference docs

### B. `vision/` becomes a first-class subsystem
This is the biggest structural improvement.

Instead of hiding image logic inside `backend/`, create a dedicated `vision/` area with two concerns separated:
- `vision/controller/` = edge orchestration
- `vision/inference/` = ML/CV processing

This makes it obvious where to look when debugging:
- camera timing issue → controller
- wrong classification → inference

### C. Backend should separate transport from business logic
Current backend is route-centric, which is acceptable for CRUD. But with drawer sessions and slot events, logic will become harder to read if it lives mostly inside route files.

Readable backend rule:
- `routes/` = HTTP layer only
- `services/` = business workflows
- `repositories/` = persistence/data access rules
- `models/` = ORM structure
- `schemas/` = API contracts

### D. Frontend should group by feature, not only by technical type
The current frontend already has decent separation, but feature folders will improve readability as drawer and exception flows grow.

Good split:
- shared UI stays in `components/`
- business-specific UI goes in `features/`

### E. Kiosk firmware should look like firmware, not just one sketch
As hardware behavior becomes more complex, a single `kiosk_main.ino` file will be harder to maintain.

Readable firmware rule:
- `include/` = config and headers
- `src/` = state machine, sensors, networking, lock control
- tests separate from production firmware

---

## 6. Before vs After by Responsibility

| Responsibility | Before | After |
|---|---|---|
| User authentication | `backend/` + `kiosk/` | same |
| Item identification | RFID in `kiosk/` | vision in `vision/inference/` |
| Drawer control | partial in `kiosk/` | clearer in `kiosk/firmware/` |
| Snapshot capture | not present | `vision/controller/` |
| Slot occupancy | not present | `backend/app/services/` + `vision/` |
| Exception resolution | limited logs | `backend/` + `frontend/features/admin-exceptions/` |
| Architecture docs | scattered root `.md` | structured under `docs/` |

---

## 7. Practical Rules for Keeping the Code Readable

### Rule 1: Keep files small by responsibility
Avoid files that do more than one of these at once:
- parse HTTP requests
- run business logic
- run SQL/ORM queries
- run ML inference
- control hardware

### Rule 2: Name folders by domain when possible
Prefer meaningful names like:
- `drawer_sessions`
- `inventory_events`
- `item_types`
- `exceptions`

Instead of vague names like:
- `utils`
- `helpers`
- `misc`

### Rule 3: Promote workflows, not just entities
The new system is workflow-heavy. Structure should highlight workflows like:
- registration
- drawer session processing
- exception recovery
- calibration

### Rule 4: Separate “edge control” from “business truth”
- Edge devices decide when to capture and send signals
- Backend decides what counts as a borrow/return event

That separation should be visible in folders.

### Rule 5: Keep one place for each type of logic
Examples:
- image diff logic should not also appear in backend route files
- notification formatting should not be scattered across UI and backend
- slot coordinate calibration should not live in random scripts

---

## 8. Minimal Migration Path

The repository does not need a full restructure in one commit.

Recommended sequence:

### Phase 1
Add documents only:
- `VISION_BASED_INVENTORY_ARCHITECTURE.md`
- `PROJECT_STRUCTURE_BEFORE_AFTER.md`

### Phase 2
Create new top-level homes without moving everything yet:
- `vision/`
- `docs/`

### Phase 3
Refactor backend incrementally:
- add `services/`
- add `repositories/`
- keep existing routes working

### Phase 4
Refactor kiosk layout if firmware grows beyond one main sketch

This avoids a readability refactor turning into a risky rewrite.

---

## 9. Recommended Folder Ownership

### Root
Only keep files that help a newcomer start immediately:
- `README.md`
- `RUN_GUIDE.md`
- top-level architecture overview

### `docs/`
Owns:
- architecture decisions
- hardware diagrams
- calibration guides
- deployment and ops notes

### `backend/`
Owns:
- business truth
- persistence
- session/event APIs
- notification dispatch

### `frontend/`
Owns:
- user/admin interaction
- dashboards
- exception review screens

### `kiosk/`
Owns:
- lock/unlock logic
- card tap flow
- local sensor state machine
- buzzer and light trigger requests

### `vision/`
Owns:
- capture orchestration
- calibration
- diff/classification pipeline
- confidence scoring

---

## 10. Final Recommendation

For this project, readability will improve most if the structure starts communicating system boundaries explicitly.

### The key structural shift is:
From:
- `backend + frontend + kiosk`

To:
- `backend + frontend + kiosk + vision + docs`

That one change makes the repository match the real architecture.

When the folder tree matches the mental model, the codebase becomes easier to:
- navigate
- review
- onboard into
- test
- refactor safely

---

## 11. Definition of a Good Structure for This Repo

The structure is good when a new contributor can answer these questions in under a minute:
- Where is drawer hardware logic?
- Where is image capture logic?
- Where is slot-diff logic?
- Where is business logic for borrow/return?
- Where is admin exception UI?
- Where are the architecture docs?

If those answers are obvious from folder names alone, the structure is doing its job.
