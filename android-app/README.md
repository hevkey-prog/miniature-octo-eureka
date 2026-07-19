# NFC Keycard (Android)

แอป Android แบบเนทีฟ (Kotlin) ที่ให้ผู้ใช้แตะบัตร NFC keycard ที่มีอยู่แล้วกับด้านหลังโทรศัพท์
เพื่ออ่าน UID ของบัตร แล้วส่งไปตรวจสอบสิทธิ์เปิดประตู/เข้าถึงกับ API ที่มีอยู่แล้วของคุณ

## วิธีใช้งาน

1. เปิดโปรเจกต์ `android-app/` ด้วย Android Studio (Hedgehog ขึ้นไป) — Android Studio จะสร้าง
   Gradle wrapper ให้อัตโนมัติเมื่อ sync โปรเจกต์ครั้งแรก (โปรเจกต์นี้ยังไม่มี `gradlew` เพราะ
   สภาพแวดล้อมที่ใช้สร้างโค้ดไม่มีสิทธิ์เข้าถึงอินเทอร์เน็ตแบบเต็มสำหรับดาวน์โหลด Gradle
   distribution — Android Studio หรือคำสั่ง `gradle wrapper` บนเครื่องคุณจะจัดการให้)
2. เปิดแอปบนมือถือ Android (จริง ไม่ใช่ emulator เพราะต้องใช้ฮาร์ดแวร์ NFC) แล้วกดปุ่มตั้งค่า
   (ไอคอนรูปเฟือง มุมขวาบน) เพื่อกรอก:
   - **API Endpoint**: URL ของ API ตรวจสอบสิทธิ์ที่คุณมีอยู่แล้ว
   - **API Key** (ถ้า API ต้องใช้)
3. กลับไปหน้าหลัก แตะบัตร NFC ที่ด้านหลังเครื่อง แอปจะอ่าน UID แล้วยิง request ไปตรวจสอบสิทธิ์
   ทันที พร้อมแสดงผลเขียว/แดงบนหน้าจอ

## API contract ที่แอปคาดหวัง

แอปจะยิง `POST` ไปยัง endpoint ที่ตั้งค่าไว้ ด้วย body:

```json
{ "cardId": "04A1B2C3D4E5" }
```

`cardId` คือ UID ของบัตร (hex, ตัวพิมพ์ใหญ่, ไม่มี `:` คั่น) ตามที่อ่านได้จาก `Tag.id`

หากตั้งค่า API Key ไว้ แอปจะแนบ header:

```
Authorization: Bearer <API_KEY>
```

และคาดหวัง response กลับมาเป็น JSON:

```json
{ "granted": true, "message": "ยินดีต้อนรับ คุณสมชาย" }
```

- `granted` (boolean, จำเป็น): `true` = อนุญาตให้เข้าถึง (แสดงผลเขียว), `false` = ปฏิเสธ (แสดงผลแดง)
- `message` (string, ไม่บังคับ): ข้อความที่จะแสดงแทนข้อความ default

ถ้ารูปแบบ request/response ของ API จริงของคุณต่างจากนี้ ให้แก้ที่
`app/src/main/java/com/nfckeycard/app/AccessApiClient.kt` — ฟังก์ชัน `buildRequestBody` (ฝั่งส่ง)
และ `parseResponse` (ฝั่งรับ) เท่านั้น ส่วนที่เหลือของแอปไม่ต้องแก้

## โครงสร้างโปรเจกต์

```
android-app/
├── app/src/main/java/com/nfckeycard/app/
│   ├── MainActivity.kt        # หน้าหลัก: จัดการ NFC + แสดงผลสแกน
│   ├── SettingsActivity.kt    # หน้าตั้งค่า endpoint / API key
│   ├── AccessApiClient.kt     # เรียก API ตรวจสอบสิทธิ์
│   └── Prefs.kt               # เก็บค่าตั้งค่าใน SharedPreferences
├── app/src/main/res/          # layout, strings, ไอคอน
└── app/src/main/AndroidManifest.xml
```

## ข้อจำกัดที่ควรรู้

- ต้องทดสอบบนอุปกรณ์ Android จริงที่มีฮาร์ดแวร์ NFC (minSdk 24 / Android 7.0+) — Android Emulator
  ส่วนใหญ่ไม่มี NFC ให้จำลอง
- โค้ดนี้ยังไม่ได้ผ่านการคอมไพล์จริงในสภาพแวดล้อมนี้ เพราะไม่มี Android SDK ติดตั้งอยู่
  (ตรวจสอบด้วย `gradle tasks` แล้วว่าไฟล์ Gradle ถูกต้องและ dependency ทั้งหมด resolve ได้)
  แนะนำให้เปิดใน Android Studio แล้วกด Run เพื่อ build จริงอีกครั้งก่อนใช้งาน
- ปัจจุบันรองรับ UID ของบัตรเท่านั้น (ไม่ได้อ่านข้อมูล NDEF บนบัตร) หากบัตรของคุณต้องอ่านข้อมูล
  อื่นเพิ่มเติม (เช่น sector data บน MIFARE Classic) แจ้งมาได้ จะเพิ่มให้
