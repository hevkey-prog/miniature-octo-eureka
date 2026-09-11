# ChatApp

แอปแชท/โซเชียลมือถือ สร้างด้วย [Expo](https://expo.dev) (React Native + TypeScript) ติดตั้งลงเครื่องได้จริง ใช้งานเป็นแอปเนทีฟ ไม่ใช่เว็บเบราว์เซอร์

## ฟีเจอร์

- ตั้งค่าโปรไฟล์ (ชื่อ, สีอวาตาร์, ประวัติย่อ) ตอนเปิดแอปครั้งแรก
- หน้ารายการแชท พร้อมข้อความล่าสุดของแต่ละคน
- ห้องแชทแบบฟองข้อความ ส่ง/รับข้อความ พร้อมบอทตอบกลับอัตโนมัติสำหรับทดสอบ
- หน้าโปรไฟล์ แก้ไขประวัติย่อได้
- ข้อมูลถูกเก็บไว้ในเครื่องด้วย AsyncStorage (ใช้งานได้ทันทีแบบออฟไลน์)

## เริ่มใช้งาน

```bash
npm install
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
src/data/contacts.ts      รายชื่อผู้ติดต่อตัวอย่าง + ข้อความตอบกลับอัตโนมัติ
src/types/                type ของ User, Chat, Message
```

## ขั้นตอนถัดไป (แนะนำ)

- เชื่อมต่อ backend จริง (เช่น Firebase / Supabase) เพื่อแชทกับผู้ใช้จริงแบบเรียลไทม์
- เพิ่มระบบ authentication (เข้าสู่ระบบด้วยเบอร์โทร/อีเมล)
- เพิ่มการแจ้งเตือน (push notifications)
