# ER and Use Case Diagram Instructions

Manual draw spec for **Smart Inventory** as implemented after the `main` rebase (YOLO + MobileNet V3 pipeline). Use Crow’s foot for the ER diagram and UML ovals for the use case diagram. Names match SQLAlchemy models in `backend/app/models/`.

---

## What to change from the previous diagram

The old spec was the unused **v2 slot/observation** schema. Live code is a smaller inventory schema plus an AI gallery. **Redraw the ER from scratch.** Do not keep old boxes and relabel them.

### ER — delete these entities

| Remove | Why |
|---|---|
| `item_types`, `item_type_images` | Replaced by `items` + AI gallery (`ai_labels` / `ai_samples` / `ai_prototypes`) |
| `storage_units`, `storage_locations`, `slot_occupancies` | No slot/grid tables in the current DB |
| `access_sessions` | Replaced by `open_sessions` |
| `observations`, `rfid_observation_details`, `vision_observation_details` | No observation tables; vision is YOLO boxes + embeddings, not persisted as rows |
| `inventory_events` | Replaced by `borrowings` |
| `audit_logs` | No audit table. Admin “activity log” is **derived** from sessions, borrowings, and damage reports |

### ER — add these entities

| Add | Role |
|---|---|
| `items` | Catalog + stock quantity |
| `borrowings` | Official borrow/return (business truth) |
| `open_sessions` | One cabinet open/close visit |
| `damaged_item_reports` | User/admin damage reports |
| `ai_labels` | Recognition class name (usually = item name) |
| `ai_samples` | Cropped enroll samples + embedding blob |
| `ai_prototypes` | One mean embedding per label (1:1 with `ai_labels`) |

### ER — attribute changes on `users`

| Old | New |
|---|---|
| `nfc_card_uid` NOT NULL unique | `card_id` **N**, unique (optional until linked) |
| `email` nullable | `email` **NOT NULL** unique |
| `password_hash` nullable | `password_hash` **NOT NULL** |
| `active` | **`is_blacklist`** (blocked user) |
| `updated_at` | dropped |

### Use case — delete / fold

| Remove from the old one-page set | Why |
|---|---|
| Classify slot changes | No slots |
| Recover from low-confidence (drawer recovery) | No reopen-and-rearrange session state |
| View cabinet occupancy | No occupancy map |
| Manage storage units and slots | No layout admin |
| Review observations needing attention | No observation review queue |
| Manually resolve exception / adjust via `inventory_events` | Stock changes via quantity API + image diff + damage approve |

### Use case — add

| Add | Why |
|---|---|
| Enroll item from video | Admin `POST /api/items/enroll` (YOLO + MobileNet) |
| Detect items in image (YOLO) | Detector stage |
| Recognize item type (MobileNet) | Embedding vs prototype |
| Record borrow/return from close-image diff | Compares previous vs current close photos |
| File damage report | Now a real table + APIs |
| Approve damage report | Admin; can close borrowing and drop quantity |
| Link / unlink NFC card | Current card APIs |
| View activity log | Admin combined event stream (optional; can fold into cabinet logs) |

### Actors — small change

Keep **User**, **Admin**, **Cabinet IoT**.  
Do **not** draw Vision Controller as a separate edge PC unless you still have one. Detection/recognition now runs **inside the FastAPI backend**.  
Optional: drop “Vision Controller”; camera is part of **Cabinet IoT** (ESP32-CAM upload).

---

## Notation legend

| Mark | Meaning |
|---|---|
| **PK** | Primary key |
| **FK** | Foreign key |
| **U** | Unique |
| **N** | Nullable — the column can be empty (`NULL`) |
| **NOT NULL** | Required |

---

# 1. ER diagram

## How to draw it

- **Box** = entity (table)
- **Underline** = primary key
- Crow’s foot: `|o` optional one, `||` exactly one, `}o` zero-or-more, `}|` one-or-more

Suggested layout:

```text
[users] ---- [open_sessions]
    |        [borrowings] ---- [items] ---- [ai_labels] ---- [ai_samples]
    |              |                            |
    +---- [damaged_item_reports]                +---- [ai_prototypes]
```

YOLO / MobileNet are **not** entities. Put a note: “AI models are files + runtime, not tables.”

---

## Entities and attributes

### `users`

| Attribute | Key | Type | Notes |
|---|---|---|---|
| **id** | PK | INT | |
| name | NOT NULL | VARCHAR | |
| email | U, NOT NULL | VARCHAR | |
| password_hash | NOT NULL | VARCHAR | web login |
| role | NOT NULL | VARCHAR | `user` \| `admin` (default `user`) |
| card_id | U, N | VARCHAR | NFC UID; null until linked |
| is_blacklist | NOT NULL | BOOLEAN | default false |
| created_at | NOT NULL | TIMESTAMP | |

### `items`

| Attribute | Key | Type | Notes |
|---|---|---|---|
| **id** | PK | INT | |
| name | NOT NULL | VARCHAR | catalog name; AI matches this to `ai_labels.name` |
| image_path | N | VARCHAR | S3 key |
| quantity | NOT NULL | INT | on-hand count |
| is_active | NOT NULL | BOOLEAN | |
| enroll_status | N | VARCHAR | `null` \| `processing` \| `done` \| `failed` |

### `borrowings`

| Attribute | Key | Type | Notes |
|---|---|---|---|
| **id** | PK | INT | |
| item_id | FK, NOT NULL | INT | → `items.id` |
| user_id | FK, NOT NULL | INT | → `users.id` |
| borrow_at | NOT NULL | TIMESTAMP | |
| due_at | NOT NULL | TIMESTAMP | default +7 days on auto-borrow |
| return_at | N | TIMESTAMP | null = still borrowed |

### `open_sessions`

| Attribute | Key | Type | Notes |
|---|---|---|---|
| **id** | PK | INT | |
| open_by | FK, NOT NULL | INT | → `users.id` |
| open_at | NOT NULL | TIMESTAMP | |
| close_at | N | TIMESTAMP | |
| close_image_path | N | VARCHAR | S3 key of post-close JPEG |

No FK to `borrowings`. Diff uses `open_by` + label counts.

### `damaged_item_reports`

| Attribute | Key | Type | Notes |
|---|---|---|---|
| **id** | PK | INT | |
| topic | NOT NULL | VARCHAR | |
| description | NOT NULL | VARCHAR | |
| item_id | FK, NOT NULL | INT | → `items.id` |
| report_by | FK, NOT NULL | INT | → `users.id` |
| report_at | NOT NULL | TIMESTAMP | |
| illustrated_path | NOT NULL | VARCHAR | S3 key of photo |
| approved | NOT NULL | BOOLEAN | default false |
| approved_by | FK, N | INT | → `users.id` |
| admin_comment | N | VARCHAR | |

### `ai_labels`

| Attribute | Key | Type | Notes |
|---|---|---|---|
| **id** | PK | INT | |
| name | U, NOT NULL | VARCHAR | recognition class |
| item_id | FK, N | INT | → `items.id` SET NULL |
| created_at | NOT NULL | TIMESTAMP | |

### `ai_samples`

| Attribute | Key | Type | Notes |
|---|---|---|---|
| **id** | PK | INT | |
| label_id | FK, NOT NULL | INT | → `ai_labels.id` CASCADE |
| image_path | NOT NULL | VARCHAR | crop file |
| embedding_blob | NOT NULL | BLOB | MobileNet 576-d vector |
| image_hash | U, NOT NULL | VARCHAR | dedup |
| bbox_json | N | VARCHAR | YOLO box |
| quality_blur | N | FLOAT | |
| quality_brightness | N | FLOAT | |
| created_at | NOT NULL | TIMESTAMP | |

### `ai_prototypes`

| Attribute | Key | Type | Notes |
|---|---|---|---|
| **label_id** | PK + FK | INT | → `ai_labels.id` CASCADE |
| embedding_blob | NOT NULL | BLOB | mean embedding for the label |
| updated_at | NOT NULL | TIMESTAMP | |

---

## Relationships (draw these lines)

| # | Parent | Verb | Child | Cardinality | On delete |
|---|---|---|---|---|---|
| R1 | `users` | opens | `open_sessions` | **1 → 0..\*** | (app; FK `open_by`) |
| R2 | `users` | borrows | `borrowings` | **1 → 0..\*** | |
| R3 | `users` | files | `damaged_item_reports` | **1 → 0..\*** | via `report_by` |
| R4 | `users` | approves | `damaged_item_reports` | **1 → 0..\*** | via `approved_by`, optional |
| R5 | `items` | has | `borrowings` | **1 → 0..\*** | |
| R6 | `items` | reported_in | `damaged_item_reports` | **1 → 0..\*** | |
| R7 | `items` | labeled_as | `ai_labels` | **1 → 0..\*** | SET NULL |
| R8 | `ai_labels` | has | `ai_samples` | **1 → 0..\*** | CASCADE |
| R9 | `ai_labels` | summarized_by | `ai_prototypes` | **1 → 0..1** | CASCADE |

### Crow’s foot cheat sheet

```text
users ||------------o{ open_sessions
users ||------------o{ borrowings
users ||------------o{ damaged_item_reports     (report_by)
users ||------------o{ damaged_item_reports     (approved_by, optional)

items ||------------o{ borrowings
items ||------------o{ damaged_item_reports
items ||------------o{ ai_labels

ai_labels ||--------o{ ai_samples
ai_labels ||--------o| ai_prototypes            (1:0..1)
```

### ER legend notes

1. **Business truth** for loans is `borrowings` (`return_at` null = active).
2. **Evidence** for auto borrow/return is close-image files in S3 plus YOLO/MobileNet at runtime — not `observations` rows.
3. Quantity on `items` is a cache updated by image diff, enroll, and damage approve.
4. Activity log is **not** a table; do not draw it.

---

# 2. Use case diagram

You do **not** have to put every use case on one page. The set below is sized for **one page** (~20 ovals).

## How to draw it

- Rectangle: **Smart Inventory System**
- Stick figures outside
- Solid line = association
- Dashed `<<include>>` toward the included use case
- Dashed `<<extend>>` toward the extension

```text
  User          ┌──────── Smart Inventory System ────────┐
                │  Identity (top)                         │  Cabinet IoT
  Admin         │  Drawer + AI (center)                   │  (ESP32 + CAM)
                │  User web (left)     Admin (right)      │
                └─────────────────────────────────────────┘
```

---

## Actors

| Actor | Type | Meaning |
|---|---|---|
| **User** | primary | Student/staff; web + NFC |
| **Admin** | primary | Users, catalog enroll, loans, damage, dashboard |
| **Cabinet IoT** | secondary | NFC reader, lock/door, ESP32-CAM |

Do **not** draw MQTT, S3, YOLO, or MobileNet as actors. Those are inside the box.

Optional: **Admin ▷ User**. If you draw that, do not also draw Admin–Login.

---

## One-page set (draw this)

### A. Identity (top)

| ID | Use case | Actors |
|---|---|---|
| UC01 | Login with email/password | User, Admin |
| UC02 | Register account | User |
| UC03 | Link / unlink NFC card | User, Cabinet IoT |
| UC04 | Authenticate by NFC and open cabinet | User, Cabinet IoT |

Includes:

- UC02 may **include** UC03 if register-with-card is one flow
- UC04 creates `open_sessions`

### B. Drawer + AI (center)

| ID | Use case | Actors |
|---|---|---|
| UC10 | Close drawer and upload image | User, Cabinet IoT |
| UC11 | Detect items in image (YOLO) | *(system)* |
| UC12 | Recognize item type (MobileNet) | *(system)* |
| UC13 | Record borrow/return from image diff | *(system)* |

Includes:

- UC04 **include** wait-for-close / UC10 (session ends on close + photo)
- UC10 **include** UC11
- UC11 **include** UC12
- UC13 **include** UC11 (runs recognize on previous and current close images)
- UC10 **include** UC13 when a previous close image exists

If the page is tight, merge UC11+UC12 into one oval: **Detect and recognize items**.

### C. User web (left)

| ID | Use case | Actors |
|---|---|---|
| UC20 | Browse available items | User, Admin |
| UC21 | View my borrowed items | User |
| UC22 | View my loan history | User |
| UC23 | File damage report | User |

### D. Admin (right)

| ID | Use case | Actors |
|---|---|---|
| UC30 | Manage users | Admin |
| UC31 | Enroll item from video | Admin |
| UC32 | Adjust item quantity | Admin |
| UC33 | Review all borrowings | Admin |
| UC34 | Review cabinet session logs | Admin |
| UC35 | Approve damage report | Admin |
| UC36 | View admin dashboard | Admin |

Includes:

- UC31 **include** UC11 and UC12 (sample frames → boxes → embeddings → prototypes)
- UC35 **include** closing the linked borrowing when a user report is approved
- UC23 **extend** UC35 (admin approval path)

---

## Association lines

**User** → UC01, UC02, UC03, UC04, UC10, UC20, UC21, UC22, UC23

**Admin** → UC01, UC20, UC30, UC31, UC32, UC33, UC34, UC35, UC36

**Cabinet IoT** → UC03, UC04, UC10

UC11, UC12, UC13 sit inside the box with include arrows only (no stick figure), unless you want a generic **System** actor.

---

## Use case legend notes

1. System boundary = web + FastAPI (including YOLO/MobileNet) + MQTT/HTTP from the cabinet.
2. Official loans are `borrowings`, created by close-image **count diff** (fewer in photo = borrow, more = return).
3. YOLO finds boxes; MobileNet V3 embeds the crop; cosine similarity vs `ai_prototypes` names the item.
4. NFC identifies the **person**, not the item.

---

## Appendix: mapping old names → new names

| Old (v2 docs) | New (current code) |
|---|---|
| `access_sessions` | `open_sessions` |
| `inventory_events` | `borrowings` |
| `item_types` | `items` (+ `ai_labels.name`) |
| `item_type_images` | `ai_samples` (plus S3 `items.image_path`) |
| Vision Controller actor | Backend AI pipeline |
| Slot occupancy | `items.quantity` (no per-slot state) |
