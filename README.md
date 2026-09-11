# ChatApp

แอปแชท/โซเชียลมือถือ สร้างด้วย [Expo](https://expo.dev) (React Native + TypeScript) ติดตั้งลงเครื่องได้จริง ใช้งานเป็นแอปเนทีฟ ไม่ใช่เว็บเบราว์เซอร์

## ฟีเจอร์

- ตั้งค่าโปรไฟล์ (ชื่อ, สีอวาตาร์, ประวัติย่อ) ตอนเปิดแอปครั้งแรก
- หน้ารายการแชท พร้อมข้อความล่าสุดของแต่ละคน
- ห้องแชทแบบฟองข้อความ ส่ง/รับข้อความ
- **คุยกับ AI จริง** (ขับเคลื่อนด้วย Claude ผ่าน backend ของเราเอง — ผู้ใช้ไม่ต้องมี API key) พร้อมเพื่อนแชทจำลองอีก 3 คนสำหรับทดสอบ UI
- หน้าโปรไฟล์ แก้ไขประวัติย่อได้
- ข้อมูลถูกเก็บไว้ในเครื่องด้วย AsyncStorage (ใช้งานได้ทันทีแบบออฟไลน์)

## เริ่มใช้งาน

### 1. รัน backend (จำเป็นสำหรับแชทกับ AI)

```bash
cd server
npm install
cp .env.example .env   # ใส่ ANTHROPIC_API_KEY ของคุณ
npm start
```

ดูรายละเอียดเพิ่มเติมที่ [server/README.md](server/README.md)

### 2. รันแอปมือถือ

```bash
npm install
cp .env.example .env   # ตั้งค่า EXPO_PUBLIC_API_URL ให้ชี้ไปที่ backend
npm start
```

จากนั้นสแกน QR code ด้วยแอป **Expo Go** (iOS/Android) เพื่อรันบนมือถือจริง หรือรันบน emulator ด้วย:

```bash
npm run android   # Android emulator
npm run ios       # iOS simulator (ต้องใช้ macOS)
```

## สร้างไฟล์ติดตั้ง (APK / IPA)

เมื่อพร้อม build เป็นแอปติดตั้งจริงบนเครื่อง (ไม่ผ่าน Expo Go) ให้ใช้ [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## โครงสร้างโปรเจกต์

```
App.tsx                  จุดเริ่มต้น + การตั้งค่า navigation
src/screens/              หน้าจอต่างๆ (Onboarding, ChatList, ChatRoom, Profile)
src/storage/db.ts         เก็บ/อ่านข้อมูลด้วย AsyncStorage
src/data/contacts.ts      รายชื่อผู้ติดต่อ (รวม AI) + ข้อความตอบกลับอัตโนมัติสำหรับบอททดสอบ
src/api/aiChat.ts          เรียก backend เพื่อคุยกับ AI จริง
src/types/                type ของ User, Chat, Message
server/                    backend เก็บ API key + ส่งต่อข้อความไปยัง Claude
```

## ขั้นตอนถัดไป (แนะนำ)

- เชื่อมต่อ backend สำหรับแชทกับคนจริงแบบเรียลไทม์ (เช่น Firebase / Supabase)
- เพิ่มระบบ authentication (เข้าสู่ระบบด้วยเบอร์โทร/อีเมล)
- เพิ่มการแจ้งเตือน (push notifications)
- Deploy backend ขึ้นจริง (ดู server/README.md) แล้วตั้ง `EXPO_PUBLIC_API_URL` ให้ชี้ไปที่ URL นั้นตอน build แอปจริง
