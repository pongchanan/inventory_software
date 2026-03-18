# Backend Database Table Guide (v2)

เอกสารนี้อธิบายโครงสร้างฐานข้อมูลของ Backend ตามไฟล์ `backend/db/schema_v2.sql` แบบรายตาราง โดยเน้น:
- หน้าที่ของแต่ละตาราง
- คอลัมน์สำคัญและข้อควรระวัง
- ความสัมพันธ์ (Foreign Key)
- ดัชนี (Index) ที่กระทบประสิทธิภาพ
- Use case ที่เจอได้จริงในการใช้งานระบบ

## ภาพรวมโครงสร้าง

Schema ใช้งานชื่อ `v2` และออกแบบให้รองรับทั้ง 2 modality:
- RFID
- Vision-based detection

แกนกลางของข้อมูลคือแนวคิด:
1. ผู้ใช้เปิดตู้/หน่วยจัดเก็บ (`access_sessions`)
2. ระบบเก็บการสังเกตจากเซ็นเซอร์ (`observations` + detail table)
3. ระบบสรุปเป็นเหตุการณ์ธุรกิจจริง (`inventory_events`)
4. ระบบบันทึกการกระทำด้านความปลอดภัย/ตรวจสอบย้อนหลัง (`audit_logs`)
5. ระบบเก็บสถานะล่าสุดแบบ cache ต่อช่อง (`slot_occupancies`)

---

## 1) users

### หน้าที่
เก็บข้อมูลผู้ใช้งานที่เข้าถึงระบบ เช่น นักศึกษา, เจ้าหน้าที่, แอดมิน

### คอลัมน์สำคัญ
- `id`: Primary Key
- `nfc_card_uid`: UID ของบัตร (Unique, Not Null)
- `name`: ชื่อผู้ใช้
- `email`: อีเมล (Unique, nullable)
- `role`: บทบาท (`user`, `admin`)
- `password_hash`: ใช้กรณี login ด้วยรหัสผ่าน
- `active`: สถานะเปิดใช้งานบัญชี
- `created_at`, `updated_at`: เวลาเก็บประวัติ

### ความสัมพันธ์
- ถูกอ้างอิงโดย `access_sessions.user_id`
- ถูกอ้างอิงโดย `inventory_events.user_id`

### ดัชนีที่สำคัญ
- `idx_users_nfc_card_uid`
- `idx_users_email`
- `idx_users_role`

### Use case
- แตะบัตร NFC เพื่อยืนยันตัวตนก่อนเปิดตู้
- ค้นหาผู้ใช้จาก email ในหน้า admin
- ปิดการใช้งานบัญชี (`active = false`) โดยไม่ลบข้อมูลประวัติ

---

## 2) item_types

### หน้าที่
เก็บ "ชนิดอุปกรณ์" หรือ "ประเภทสิ่งของ" (ไม่ได้เก็บเป็นรายชิ้น serial)

### คอลัมน์สำคัญ
- `id`: Primary Key
- `name`: ชื่อชนิดอุปกรณ์
- `active`: เปิด/ปิดการใช้งานชนิดนี้
- `created_at`, `updated_at`

### ความสัมพันธ์
- ถูกอ้างอิงโดย `item_type_images.item_type_id`
- ถูกอ้างอิงโดย `inventory_events.item_type_id`
- ถูกอ้างอิงโดย `slot_occupancies.item_type_id`

### ดัชนีที่สำคัญ
- `idx_item_types_name`
- `idx_item_types_active`

### Use case
- สร้างประเภทใหม่ เช่น "Multimeter", "Soldering Iron"
- ซ่อนประเภทที่เลิกใช้งานโดยตั้ง `active = false`
- ใช้เป็น master data ให้ vision model map class name เข้ากับระบบ

---

## 3) item_type_images

### หน้าที่
เก็บรูปอ้างอิงของ `item_types` สำหรับ UI หรือใช้ช่วยงาน vision/training

### คอลัมน์สำคัญ
- `id`: Primary Key
- `item_type_id`: FK ไป `item_types`
- `image_url`: URL ของรูป
- `is_primary`: ระบุรูปหลักของ item type
- `created_at`

### ความสัมพันธ์
- `item_type_id -> item_types.id` (ON DELETE CASCADE)

### ดัชนีที่สำคัญ
- `idx_item_type_images_item_type_id`
- `idx_item_type_images_is_primary`

### Use case
- แสดง thumbnail ของประเภทอุปกรณ์ในหน้า frontend
- เก็บหลายรูปต่อหนึ่งประเภท แล้วเลือก `is_primary = true` สำหรับรูปหลัก
- ลบ `item_types` แล้วรูปทั้งหมดถูกลบตามอัตโนมัติ (cascade)

---

## 4) storage_units

### หน้าที่
นิยาม "หน่วยจัดเก็บ" เช่น ลิ้นชัก, ชั้นวาง, ตู้แขวน

### คอลัมน์สำคัญ
- `id`: Primary Key
- `unit_type`: ประเภทหน่วย (`drawer`, `shelf`, `hanger_cabinet`)
- `layout_type`: รูปแบบผัง (`grid`, `zone`, `none`)
- `active`
- `created_at`, `updated_at`

### ความสัมพันธ์
- ถูกอ้างอิงโดย `storage_locations.unit_id`
- ถูกอ้างอิงโดย `access_sessions.unit_id`

### ดัชนีที่สำคัญ
- `idx_storage_units_unit_type`
- `idx_storage_units_layout_type`

### Use case
- เพิ่มหน่วยจัดเก็บใหม่เมื่อขยายห้องแลบ
- กำหนดว่า unit นี้ใช้การระบุตำแหน่งแบบช่องตาราง (`grid`) หรือโซน (`zone`)
- ปิด unit ชั่วคราวตอนซ่อมบำรุงด้วย `active = false`

---

## 5) storage_locations

### หน้าที่
เก็บตำแหน่งย่อยภายใน `storage_units` เช่น ชั้น/แถว/คอลัมน์ หรือโซน

### คอลัมน์สำคัญ
- `id`: Primary Key
- `unit_id`: FK ไป `storage_units`
- `level_no`: ชั้น
- `row_no`, `col_no`: ใช้ใน layout แบบ grid
- `zone_code`: ใช้ใน layout แบบ zone
- `active`
- `created_at`

### ความสัมพันธ์
- `unit_id -> storage_units.id` (ON DELETE CASCADE)
- ถูกอ้างอิงโดย `observations.location_id`
- ถูกอ้างอิงโดย `inventory_events.location_id`
- ถูกอ้างอิงโดย `slot_occupancies.location_id`

### ดัชนี/ข้อกำหนดสำคัญ
- `idx_storage_locations_unit_id`
- `idx_storage_locations_location (unit_id, level_no)`
- Unique partial index สำหรับ grid:
  - `(unit_id, level_no, row_no, col_no)` เมื่อ `row_no` และ `col_no` ไม่เป็น null
- Unique partial index สำหรับ zone:
  - `(unit_id, level_no, zone_code)` เมื่อ `zone_code` ไม่เป็น null

### Use case
- ระบุตำแหน่งที่ vision camera มองเห็นเป็นช่อง A1/B2
- รองรับบาง unit ที่แบ่งเป็นโซน เช่น "LEFT_BIN", "RIGHT_BIN"
- กันข้อมูลซ้ำตำแหน่งใน unit เดียวกันด้วย unique index

---

## 6) access_sessions

### หน้าที่
แทน "ช่วงเวลาการเข้าถึง" หน่วยจัดเก็บของผู้ใช้หนึ่งคน

### คอลัมน์สำคัญ
- `id`: Primary Key
- `user_id`: FK ไป `users`
- `unit_id`: FK ไป `storage_units`
- `opened_at`, `closed_at`
- `status`: `open` หรือ `closed`
- `created_at`, `updated_at`

### ความสัมพันธ์
- `user_id -> users.id` (ON DELETE RESTRICT)
- `unit_id -> storage_units.id` (ON DELETE RESTRICT)
- ถูกอ้างอิงโดย `observations.session_id`
- ถูกอ้างอิงโดย `inventory_events.session_id`

### ดัชนีที่สำคัญ
- `idx_access_sessions_user_id`
- `idx_access_sessions_unit_id`
- `idx_access_sessions_status`
- `idx_access_sessions_opened_at`

### Use case
- ผู้ใช้แตะบัตรและปลดล็อกตู้ -> เปิด session ใหม่
- ระบบ sensor ทั้งหมดในช่วงนั้นผูกกับ `session_id` เดียวกัน
- ปิด session เมื่อปิดประตูหรือ timeout

---

## 7) observations

### หน้าที่
ตารางแกนกลางสำหรับเก็บข้อมูลสังเกตจาก sensor แบบเป็นเหตุการณ์ดิบ

### คอลัมน์สำคัญ
- `id`: Primary Key
- `session_id`: FK ไป `access_sessions` (บังคับ)
- `location_id`: FK ไป `storage_locations` (nullable เพื่อรองรับ RFID)
- `source_type`: `rfid` หรือ `vision`
- `change_type`: `added`, `removed`, `changed`, `unchanged`, `unknown`
- `confidence`: ค่า 0.0 ถึง 1.0
- `review_status`: `normal`, `needs_review`, `resolved`
- `review_note`: หมายเหตุจากผู้ตรวจสอบ
- `observed_at`, `created_at`

### ความสัมพันธ์
- `session_id -> access_sessions.id` (ON DELETE RESTRICT)
- `location_id -> storage_locations.id` (ON DELETE SET NULL)
- ถูกอ้างอิงโดย:
  - `rfid_observation_details.observation_id`
  - `vision_observation_details.observation_id`
  - `inventory_events.observation_id`

### ดัชนีที่สำคัญ
- `idx_observations_session_id`
- `idx_observations_location_id`
- `idx_observations_source_type`
- `idx_observations_review_status`
- `idx_observations_observed_at`

### Constraint สำคัญ
- `ck_vision_needs_location`:
  - ถ้า `source_type = 'vision'` ต้องมี `location_id`

### Use case
- RFID reader อ่าน tag ได้หลายครั้งใน session เดียว -> เก็บ observation หลายรายการ
- Vision พบความเปลี่ยนแปลงที่ช่อง A1 -> สร้าง observation ที่ผูก location
- เจ้าหน้าที่ mark รายการความเชื่อมั่นต่ำเป็น `needs_review`

---

## 8) rfid_observation_details

### หน้าที่
เก็บรายละเอียดเฉพาะของ observation ที่มาจาก RFID (แยกจากตารางกลาง)

### คอลัมน์สำคัญ
- `observation_id`: Primary Key + FK ไป `observations`
- `tag_uid`: UID ของแท็ก RFID
- `reader_id`: อุปกรณ์ reader ที่อ่านได้
- `rssi`: สัญญาณ
- `read_count`: จำนวนครั้งที่อ่านซ้ำ
- `created_at`

### ความสัมพันธ์
- `observation_id -> observations.id` (ON DELETE CASCADE)

### ดัชนีที่สำคัญ
- `idx_rfid_observation_details_tag_uid`

### Constraint สำคัญ
- `ck_rfid_detail_valid`: `tag_uid` ต้องไม่เป็น null

### Use case
- วิเคราะห์ว่า tag ไหนถูกอ่านบ่อยผิดปกติใน session
- ใช้ `rssi` ประเมินคุณภาพการอ่าน
- ลบ observation แล้ว detail RFID ถูกลบตามอัตโนมัติ

---

## 9) vision_observation_details

### หน้าที่
เก็บรายละเอียดเฉพาะของ observation ที่มาจาก Vision

### คอลัมน์สำคัญ
- `observation_id`: Primary Key + FK ไป `observations`
- `before_image_url`, `after_image_url`: รูปก่อน/หลัง
- `crop_url`: รูปครอปวัตถุ
- `model_version`: รุ่นโมเดลที่ใช้ infer
- `raw_predictions_json`: ผลทำนายดิบแบบ JSONB
- `created_at`

### ความสัมพันธ์
- `observation_id -> observations.id` (ON DELETE CASCADE)

### ดัชนี
- ไม่มี index เพิ่มเติมในสคีมาปัจจุบัน

### Use case
- ตรวจสอบผลโมเดลย้อนหลังจาก `raw_predictions_json`
- เทียบ before/after image เพื่อยืนยันการหยิบ/คืนอุปกรณ์
- ใช้ `model_version` ในการเปรียบเทียบ performance แต่ละรุ่น

---

## 10) inventory_events

### หน้าที่
เก็บ "ความจริงทางธุรกิจ" ที่ระบบตัดสินแล้วว่าเป็นการยืม/คืน/ปรับยอด

### คอลัมน์สำคัญ
- `id`: Primary Key
- `session_id`: FK ไป `access_sessions`
- `user_id`: FK ไป `users`
- `item_type_id`: FK ไป `item_types`
- `event_type`: `borrow`, `return`, `adjustment`, `manual_resolution`
- `quantity`: จำนวน (default 1)
- `location_id`: FK ไป `storage_locations` (nullable)
- `observation_id`: FK ไป `observations` (nullable)
- `note`
- `created_at`

### ความสัมพันธ์
- `session_id -> access_sessions.id` (ON DELETE RESTRICT)
- `user_id -> users.id` (ON DELETE RESTRICT)
- `item_type_id -> item_types.id` (ON DELETE RESTRICT)
- `location_id -> storage_locations.id` (ON DELETE SET NULL)
- `observation_id -> observations.id` (ON DELETE SET NULL)

### ดัชนีที่สำคัญ
- `idx_inventory_events_session_id`
- `idx_inventory_events_user_id`
- `idx_inventory_events_item_type_id`
- `idx_inventory_events_event_type`
- `idx_inventory_events_created_at`

### Use case
- สรุปในตอนปิด session ว่าผู้ใช้ยืม item type ใดบ้าง
- ปรับยอดด้วย `adjustment` เมื่อมีการนับสต็อกและเจอคลาดเคลื่อน
- แก้เคสผิดพลาดด้วย `manual_resolution` โดยผูกกับ `observation_id`

---

## 11) audit_logs

### หน้าที่
เก็บประวัติการกระทำเพื่อความปลอดภัย การตรวจสอบ และ debugging

### คอลัมน์สำคัญ
- `id`: Primary Key
- `ts`: เวลาเหตุการณ์
- `actor_type`: `user`, `system`, `device`, `admin`
- `actor_id`: ผู้กระทำ (ID หรือชื่ออุปกรณ์)
- `action`: เช่น `scan`, `unlock`, `lock`, `approve`, `sync`, `violation`, `login`
- `target_type`, `target_id`: สิ่งที่ถูกกระทำ
- `result`: `success` หรือ `failed`
- `ip_address`
- `message`
- `correlation_id`: ใช้ผูกเหตุการณ์หลายระบบเข้าด้วยกัน

### ความสัมพันธ์
- ไม่มี Foreign Key บังคับข้ามตาราง เพื่อให้เก็บ log ได้แม้ target ถูกลบไปแล้ว

### ดัชนีที่สำคัญ
- `idx_audit_logs_ts`
- `idx_audit_logs_actor_type`
- `idx_audit_logs_action`
- `idx_audit_logs_correlation_id`

### Use case
- Trace เหตุการณ์ end-to-end ด้วย `correlation_id`
- วิเคราะห์ความพยายามเข้าใช้งานล้มเหลวจาก `result = failed`
- สร้างรายงานการเข้าถึงตู้รายวัน/รายสัปดาห์

---

## 12) slot_occupancies

### หน้าที่
เก็บ "สถานะล่าสุด" ต่อช่องจัดเก็บ เพื่อ query เร็ว โดยไม่ต้องคำนวณจาก event ทั้งหมดทุกครั้ง

### คอลัมน์สำคัญ
- `location_id`: Primary Key + FK ไป `storage_locations`
- `state`: `empty`, `occupied`, `unknown`, `error`
- `item_type_id`: item type ล่าสุดที่เชื่อว่าอยู่ในช่อง
- `confidence`: ค่า 0.0 ถึง 1.0
- `last_event_id`: FK ไป `inventory_events`
- `updated_at`

### ความสัมพันธ์
- `location_id -> storage_locations.id` (ON DELETE CASCADE)
- `item_type_id -> item_types.id` (ON DELETE SET NULL)
- `last_event_id -> inventory_events.id` (ON DELETE SET NULL)

### ดัชนีที่สำคัญ
- `idx_slot_occupancies_state`
- `idx_slot_occupancies_item_type_id`

### Use case
- หน้า dashboard ต้องการสถานะปัจจุบันทันทีของทุกช่อง
- แสดงช่องที่ `state = unknown` เพื่อให้เจ้าหน้าที่ตรวจสอบ
- query ช่องว่าง (`empty`) เพื่อช่วยหา location ที่พร้อมวางของ

---

## กฎธุรกิจและข้อควรระวังสำคัญ

1. Cross-table validation บางส่วนไม่ได้ enforce ใน DB โดยตรง
- ในสคีมาระบุว่า PostgreSQL ไม่อนุญาต subquery ใน CHECK constraint
- กรณีตรวจว่า `inventory_events.location_id` อยู่ใน unit เดียวกับ session ต้องตรวจใน application logic หรือ trigger

2. ลักษณะการลบข้อมูลถูกออกแบบต่างกันตามบริบท
- ตารางหลักที่อาจกระทบประวัติธุรกิจใช้ `ON DELETE RESTRICT` เยอะ เพื่อป้องกันข้อมูลหาย
- ตาราง detail/cached ใช้ `CASCADE` หรือ `SET NULL` เพื่อความยืดหยุ่น

3. observations เป็นชั้นข้อมูลดิบ ส่วน inventory_events เป็นชั้นข้อมูลตัดสินแล้ว
- หลีกเลี่ยงใช้ observations ไปทำรายงานธุรกิจโดยตรง
- รายงานธุรกิจควรใช้ inventory_events เป็นหลัก

---

## ตัวอย่าง data flow (End-to-End)

1. ผู้ใช้แตะบัตร NFC
- lookup ที่ `users` และสร้าง `access_sessions`

2. ระบบอ่านเซ็นเซอร์
- บันทึกที่ `observations`
- ถ้าเป็น RFID ใส่รายละเอียดใน `rfid_observation_details`
- ถ้าเป็น Vision ใส่รายละเอียดใน `vision_observation_details`

3. ระบบสรุปผลเป็นธุรกรรม
- เขียน `inventory_events` (borrow/return/etc.)

4. อัปเดตสถานะล่าสุด
- upsert ลง `slot_occupancies`

5. บันทึกด้านความปลอดภัย
- เขียน `audit_logs` ทุก action สำคัญ

เอกสารนี้ควรใช้อ้างอิงร่วมกับ API docs และ business rules ฝั่ง service layer เพื่อให้เข้าใจ behavior ครบถ้วนทั้งระบบ