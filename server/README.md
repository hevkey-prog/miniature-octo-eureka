# ChatApp backend

Backend เล็กๆ ที่เก็บ Anthropic API key ไว้ฝั่งเซิร์ฟเวอร์ แล้วรับข้อความจากแอปมือถือส่งต่อไปยัง Claude — ผู้ใช้แอปไม่ต้องมี API key ของตัวเอง

## รันในเครื่อง (local dev)

```bash
cd server
npm install
cp .env.example .env   # แล้วใส่ ANTHROPIC_API_KEY ของคุณใน .env
npm start
```

เซิร์ฟเวอร์จะรันที่ `http://localhost:3000`

**สำคัญ:** ไฟล์ `.env` ถูกใส่ไว้ใน `.gitignore` แล้ว ห้าม commit หรือแชร์ไฟล์นี้เด็ดขาด เพราะมี API key จริงที่มีค่าใช้จ่ายตามการใช้งาน

## ทดสอบ

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"สวัสดี"}]}'
```

## เชื่อมกับแอปมือถือ

ในแอป (โฟลเดอร์หลักของโปรเจกต์) สร้างไฟล์ `.env` แล้วตั้งค่า:

```
EXPO_PUBLIC_API_URL=http://<IP เครื่องคุณในวง LAN>:3000
```

ใช้ `localhost` ไม่ได้ถ้าทดสอบบนมือถือจริงผ่าน Expo Go เพราะมือถือกับคอมเป็นคนละเครื่อง ต้องใช้ IP ของคอมในวง Wi-Fi เดียวกัน (หาได้ด้วย `ipconfig getifaddr en0` บน Mac หรือ `ipconfig` บน Windows)

## Deploy ขึ้นจริง (แนะนำ Render หรือ Railway — มี free tier)

1. Push โฟลเดอร์ `server/` ขึ้น GitHub (หรือทั้ง repo ก็ได้ แล้วตั้ง root directory เป็น `server`)
2. สร้างเว็บเซอร์วิสใหม่บน Render/Railway ชี้ไปที่ repo นี้
3. ตั้งค่า Environment Variable ชื่อ `ANTHROPIC_API_KEY` เป็น key ของคุณ (ใส่ในหน้าเว็บของ Render/Railway โดยตรง **ไม่ใช่ในโค้ด**)
4. Build command: `npm install`, Start command: `npm start`
5. เมื่อ deploy เสร็จจะได้ URL เช่น `https://your-app.onrender.com` — เอา URL นี้ไปใส่ใน `EXPO_PUBLIC_API_URL` ของแอปตอน build จริง
