# AI Pipeline Function Plan (KISS, Single Core File, SQLite Isolated)

## เป้าหมาย
ออกแบบ AI pipeline แบบ function-only สำหรับ inventory_software โดยให้:
- ฟังก์ชันหลักทั้ง `enroll_from_detections` และ `recognize_from_detections` อยู่ในไฟล์เดียวกัน
- ใช้ไฟล์ config แยกต่างหากเพื่อปรับ threshold / margin ได้ง่าย
- มีสคริปต์ทดสอบฟังก์ชันแยกออกมาเพื่อ verify behavior
- เก็บข้อมูลใน SQLite แยกจาก database หลักของระบบ
- ไม่แตะ endpoint และไม่ผูกกับ UI
- รองรับ enroll จากวิดีโอ และ recognize จากภาพนิ่งในสคริปต์ทดสอบ
- ใช้ open-source model ไปก่อนระหว่างที่ model เฉพาะทางของทีมยังเทรนไม่เสร็จ

---

## โครงไฟล์ที่เสนอ
ภายใต้ `inventory_software/backend/app/services/`:

ภายใต้ `inventory_software/backend/app/services/ai-pipeline-service/`:

- `ai_service.py`
- `ai_config.py`
- `ai_sqlite_store.py`
- `ai_preprocess_service.py`
- `ai_embedding_service.py`
- `ai_prototype_service.py`
- `ai_types.py`

และสคริปต์ทดสอบอยู่ที่:
- `inventory_software/backend/scripts/ai_pipeline_test_script.py`

สคริปต์ทดสอบควรรองรับอย่างน้อย 2 โหมด:
- video enroll
- image recognize

หมายเหตุ:
- `ai_service.py` คือไฟล์หลักที่รวม flow enroll และ recognize
- `ai_config.py` ใช้เก็บค่าคงที่ทั้งหมด
- `ai_pipeline_test_script.py` คือสคริปต์รันทดสอบแบบ manual/CLI

---

## แนวคิดหลัก

### 1) รวม flow หลักไว้ในไฟล์เดียว
เหตุผล:
- อ่านง่าย
- ลดการกระจาย logic ที่ซับซ้อน
- team สามารถเปิดไฟล์เดียวแล้วเห็นภาพรวม end-to-end ได้ทันที

สิ่งที่ไฟล์ `ai_service.py` ควรมี:
- import config
- import sqlite store
- import preprocess
- import embedding
- import prototype
- expose 2 ฟังก์ชันหลัก:
  - `enroll_from_detections(...)`
  - `recognize_from_detections(...)`

### 2) แยก config ออกไป
ไฟล์ `ai_config.py` ควรมีค่าเหล่านี้:
- `AI_SQLITE_PATH`
- `AI_SAMPLES_DIR`
- `AI_SIMILARITY_THRESHOLD`
- `AI_MIN_MARGIN`
- `AI_BLUR_MIN`
- `AI_BRIGHTNESS_MIN`
- `AI_BRIGHTNESS_MAX`
- `AI_DETECTOR_MODEL_PATH`
- `AI_EMBEDDER_MODEL_NAME`

แนวทาง:
- อ่านจาก environment variables
- มีค่า default ที่ใช้งานได้ทันที
- ปรับ threshold ได้โดยไม่ต้องแก้ business logic

ค่า model เริ่มต้นควรชี้ไปที่ open-source model ก่อน เพราะ model ของทีมยังอยู่ระหว่าง training
- detector: ใช้ YOLO open-source ที่ export เป็น ONNX ได้ เช่น `yolov8n` หรือ `yolov11n`
- recognizer/embedder: ใช้ backbone open-source ที่เบาและรันง่าย เช่น MobileNetV3 หรือ ResNet18

### 3) มี script สำหรับ test ฟังก์ชัน
ไฟล์ `ai_pipeline_test_script.py` ควรทำหน้าที่:
- สร้าง sample input
- เรียก enroll
- เรียก recognize
- ตรวจผลลัพธ์ขั้นต่ำว่า
  - enroll บันทึก sample ได้
  - prototype ถูกสร้างหรืออัปเดต
  - recognize คืน label หรือ unknown ตาม threshold

---

## SQLite Data Model
ฐานข้อมูลชั่วคราวแยกจากระบบหลัก ใช้สำหรับทดลอง pipeline เท่านั้น

### Table: labels
- `id`
- `name`
- `created_at`

### Table: samples
- `id`
- `label_id`
- `image_path`
- `embedding_blob`
- `image_hash`
- `bbox_json`
- `quality_blur`
- `quality_brightness`
- `created_at`

### Table: prototypes
- `label_id`
- `embedding_blob`
- `updated_at`

หลักการ:
- 1 label มีหลาย sample
- 1 label มี prototype 1 แถว
- prototype คำนวณจาก mean embedding ของ sample ทั้งหมด

---

## Function Design

## ai_service.py

### `enroll_from_detections(...)`
หน้าที่:
- รับ image bytes + detections
- crop ภาพตาม bbox
- ตรวจ quality
- กันภาพซ้ำด้วย hash
- สร้าง embedding
- save sample ลง SQLite
- recompute prototype

### `enroll_from_video(...)`
หน้าที่:
- รับ video bytes หรือ video file path
- sample frame ตาม interval
- แปลงแต่ละ frame เป็น image bytes
- detect bbox จาก frame
- ส่งต่อให้ flow enroll เดียวกัน

เหตุผลที่แยกเป็น helper:
- video enroll มีขั้นตอนแตกต่างจาก image enroll ตรงการอ่าน frame
- แต่ logic หลักหลังได้ detections แล้วควรใช้ชุดเดียวกัน

พฤติกรรม:
- ถ้าไม่มี detection ให้คืนผลล้มเหลวแบบอ่านง่าย
- ถ้าผ่านบางอันและบางอันไม่ผ่าน ให้รายงาน accepted/rejected แยกกัน

### `recognize_from_detections(...)`
หน้าที่:
- รับ image bytes + detections
- crop ภาพตาม bbox
- สร้าง embedding
- เทียบกับ prototype ทุก label
- เลือก top1/top2
- ตัดสินด้วย threshold + margin
- ถ้าไม่ผ่านให้เป็น `unknown`

พฤติกรรม:
- รองรับหลาย bbox ในภาพเดียว
- คืนผล per box เป็น list

---

## Pseudocode ของไฟล์หลัก

```python
def enroll_from_detections(db_path, label, image_bytes, detections):
    label_id = get_or_create_label_id(db_path, label)
    accepted_count = 0
    rejected_count = 0

    for det in detections:
        crop = crop_by_bbox(image_bytes, det.bbox)
        quality = summarize_quality(crop)
        if not quality_ok(quality):
            rejected_count += 1
            continue

        crop_hash = image_sha256(crop)
        if sample_hash_exists(db_path, crop_hash):
            rejected_count += 1
            continue

        embedding = embed_image(crop)
        save_crop_file(...)
        insert_sample(...)
        accepted_count += 1

    if accepted_count > 0:
        recompute_label_prototype(db_path, label_id)

    return {"ok": True, "accepted_count": accepted_count, "rejected_count": rejected_count}
```

```python
def recognize_from_detections(db_path, image_bytes, detections):
    prototypes = load_all_prototypes(db_path)
    results = []

    for det in detections:
        crop = crop_by_bbox(image_bytes, det.bbox)
        query = embed_image(crop)

        scores = []
        for label, proto in prototypes.items():
            scores.append((label, cosine_similarity(query, proto)))

        scores.sort(key=lambda item: item[1], reverse=True)
        top1_label, top1_score = scores[0]
        top2_score = scores[1][1] if len(scores) > 1 else 0.0
        margin = top1_score - top2_score

        accepted = top1_score >= AI_SIMILARITY_THRESHOLD and margin >= AI_MIN_MARGIN
        results.append({
            "bbox": det.bbox,
            "label": top1_label if accepted else "unknown",
            "score": top1_score,
            "margin": margin,
            "accepted": accepted,
        })

    return results
```

---

## ai_config.py
ควรเก็บแค่ค่าที่ทีมอยาก tune บ่อย ๆ

ตัวอย่าง:
- similarity threshold
- margin
- blur threshold
- brightness range
- db path
- sample directory

หลักการ:
- ไม่มี business logic
- ไม่มี access DB
- ไม่มี image processing
- เป็นไฟล์ config ล้วน ๆ

---

## ai_pipeline_test_script.py

## เป้าหมาย
สคริปต์นี้ใช้ตรวจว่า logic ของฟังก์ชันทำงานถูกต้อง โดยไม่ต้องพึ่ง endpoint

## สิ่งที่ script ควรทำ
1. init SQLite test database
2. เตรียม video sample สำหรับ enroll หรือ mock video frame sequence
3. เตรียม image sample สำหรับ recognize
4. เตรียม detections จำลอง
5. เรียก `enroll_from_video(...)` หรือ helper ที่แตก frame แล้วส่งเข้า enroll flow
6. เรียก `recognize_from_detections(...)`
7. พิมพ์ผลลัพธ์และ assert เงื่อนไขหลัก

## Test cases ขั้นต่ำ
- enroll จาก video ผ่าน detection เดียวแล้ว sample ถูกบันทึก
- enroll จาก video ข้อมูลซ้ำแล้วถูกกันไว้
- recognize จาก image เมื่อ prototype ตรง -> accepted
- recognize จาก image เมื่อคะแนนไม่พอ -> unknown
- recognize จาก image เมื่อ margin ต่ำ -> unknown

## Output ที่ควรดู
- accepted_count / rejected_count
- prototype updated
- top1 score / margin
- final label

## รูปแบบการรันที่ควรมี
- test enroll video sample
- test recognize image sample
- test mix: enroll video แล้ว recognize image ของ label เดียวกัน

---

## Simple Implementation Order
## Implementation Phases

### Phase 1: Foundation
- สร้าง `ai_config.py`
- สร้าง `ai_sqlite_store.py`
- สร้าง `ai_types.py`
- กำหนดโครง SQLite แยกจากระบบหลัก
- เลือก open-source detector และ recognizer ชั่วคราว

### Phase 2: Core Image Pipeline
- สร้าง `ai_preprocess_service.py`
- สร้าง `ai_embedding_service.py`
- สร้าง `ai_prototype_service.py`
- สร้าง `ai_service.py` สำหรับ image-based enroll/recognize

### Phase 3: Video Enroll Support
- เพิ่ม `enroll_from_video(...)` ในไฟล์หลัก
- แตก video เป็น frames แบบง่าย
- ส่ง frame เข้า enroll flow เดิม

### Phase 4: Test Script
- สร้าง `ai_pipeline_test_script.py`
- ทดสอบ enroll จาก video
- ทดสอบ recognize จาก image
- ตรวจ duplicate / threshold / margin behavior

### Phase 5: Tuning and Hardening
- ปรับ threshold และ margin จาก config
- ปรับ quality gate
- เก็บผลทดสอบจริงเพื่อนำไปปรับ model ที่เทรนเองภายหลัง

Phase 5 ที่ทำแล้วในโค้ด:
- เพิ่ม tuning parameters ใน `ai_config.py`:
    - `AI_DETECTOR_CONF_THRESHOLD`, `AI_DETECTOR_IOU_THRESHOLD`
    - `AI_MIN_CROP_AREA_RATIO`, `AI_MAX_CROP_AREA_RATIO`
    - `AI_REPORTS_DIR`
- เพิ่ม quality gate ใน `enroll_from_detections(...)` ให้คัด bbox ที่เล็ก/ใหญ่เกินไปจากสัดส่วนพื้นที่ภาพ
- สคริปต์ `backend/scripts/ai_pipeline_test_script.py` บันทึกผลรันทดสอบจริงลงไฟล์ JSON report เพื่อใช้วิเคราะห์และปรับ model ภายหลัง

---

## KISS Rules for This Design
- ถ้า logic อะไรเขียนตรง ๆ ได้ ให้เขียนตรง ๆ
- ถ้าไม่จำเป็นอย่าแยก class เยอะ
- ใช้ function ชัดเจนแทน abstraction ที่ลึกเกินไป
- Keep SQLite schema เรียบง่ายที่สุด
- เริ่มจากภาพนิ่งก่อน ไม่แตะ video ในรอบแรก

---

## What Team Can Do Later
เมื่อทีมพร้อมออกแบบ database จริง:
- ย้าย SQLite schema นี้ไปเป็น PostgreSQL schema
- แยก `labels`, `samples`, `prototypes` เป็น ORM models
- เปลี่ยน persistence layer โดยไม่ต้องแก้ pipeline logic มาก

---

## Summary
ถ้าทำตามแผนนี้ จะได้ AI pipeline ที่:
- มีจุดเข้าออกชัดเจน
- อ่านง่าย
- ทดสอบได้ด้วย script เดียว
- ใช้ SQLite แยกจากระบบจริง
- พร้อมให้ทีมต่อยอดเป็น schema จริงภายหลัง
