# เสี่ยส้ม (Boss Som) — ซีรีส์ละครสั้นตลก AI

> แมวส้มอ้วนที่เชื่อสุดหัวใจว่าตัวเองคือ "เสี่ย" เจ้าของบ้าน
> ส่วนมนุษย์ในบ้านเป็นแค่ "พนักงาน" ที่จ้างมาเปิดกระป๋องให้

- **รูปแบบ:** ซีรีส์ ตอนละ 60–75 วินาที แนวตั้ง 9:16 (TikTok / Reels / Shorts)
- **ตอนละ:** 8–10 ช็อต ช็อตละ 5–8 วินาที
- **เทคนิคเล่าเรื่อง:** ใช้ **เสียงในหัวของเสี่ยส้ม (voice-over)** + ซับไตเติล
  ไม่ให้ตัวละครขยับปากพูด เพราะ AI วิดีโอยังทำลิปซิงก์ภาษาไทยได้ไม่ดี
  มุกเลยมาจาก "สิ่งที่เสี่ยคิด" กับ "สิ่งที่เกิดขึ้นจริง" ไม่ตรงกัน

---

## ตัวละคร (Character Bible)

ทุกครั้งที่เขียน prompt ต้องใช้ **คำบรรยายล็อกตัวละคร** ด้านล่างแบบคำต่อคำ
เพื่อให้หน้าตาเหมือนเดิมทุกช็อตทุกตอน

### 1. เสี่ยส้ม — พระเอก (แมว)
- แมวส้มลายสลิด อ้วนกลม ตาเหลืองอำพัน หน้าบึ้งตลอดเวลา ใส่ปลอกคอทองมีกระดิ่งเล็ก
- นิสัย: หยิ่ง มั่นใจเกินเหตุ คิดว่าทุกอย่างในบ้านเป็นของตัวเอง
- เสียงพากย์: ผู้ชายเสียงทุ้ม พูดช้าๆ วางมาดแบบเสี่ยใหญ่ ลงท้าย "...เข้าใจไหม"
- **ล็อกตัวละคร (EN):**
  `a very chubby orange tabby cat with amber eyes, permanently grumpy face, wearing a thin gold collar with a tiny bell`

### 2. มิ้น — "พนักงาน" (เจ้าของแมว)
- ผู้หญิงไทยอายุ 26 ทำงานออฟฟิศ WFH ผมยาวมัดจุก แว่นกรอบกลมดำ
- ใส่เสื้อยืดสีเหลืองมัสตาร์ดตัวโคร่ง กางเกงขาสั้นลายสก็อต
- นิสัย: ใจดี ขี้เกรงใจ โดนแมวแกล้งตลอดแต่ไม่เคยรู้ตัว
- **ล็อกตัวละคร (EN):**
  `a 26-year-old Thai woman with long black hair in a messy top bun, round black glasses, oversized mustard-yellow t-shirt, plaid shorts`

### 3. ไข่ตุ๋น — คู่ปรับ (หมาข้างบ้าน)
- หมาชิบะสีครีม ยิ้มตลอด ซื่อบื้อ เป็นมิตรกับทุกคน
- ใส่ผ้าพันคอสีแดง
- เสี่ยส้มมองว่าไข่ตุ๋นคือ "บริษัทคู่แข่ง"
- **ล็อกตัวละคร (EN):**
  `a cheerful cream-colored shiba inu with a big goofy smile, wearing a red bandana`

### สถานที่หลัก
- **คอนโดของมิ้น:** ห้องเล็กโทนอบอุ่น โซฟาสีเขียวมะกอก โต๊ะทำงานไม้ติดหน้าต่าง มีต้นไม้ในกระถาง
  `a small cozy Bangkok condo, olive green sofa, wooden desk by the window, potted plants, warm afternoon light`
- **ระเบียงคอนโด:** มองเห็นตึกในกรุงเทพฯ มีระเบียงห้องข้างๆ ที่ไข่ตุ๋นอยู่

---

## สไตล์ภาพ (Style Lock)

ต่อท้ายทุก prompt ด้วยข้อความนี้ เพื่อให้ภาพทั้งซีรีส์ออกมาโทนเดียวกัน:

```
cinematic vertical 9:16, Pixar-like 3D animation style, soft warm lighting, shallow depth of field, vibrant colors, high detail
```

> ถ้าอยากได้แบบ "คนจริง/แมวจริง" ให้เปลี่ยน `Pixar-like 3D animation style`
> เป็น `photorealistic, shot on 35mm film` แต่ต้องใช้แบบเดียวตลอดทั้งซีรีส์

---

## ขั้นตอนการผลิต (Workflow)

1. **สร้างภาพอ้างอิงตัวละครก่อน (สำคัญที่สุด)**
   ใช้แอปสร้างภาพ (เช่น Midjourney, Ideogram, Gemini, ChatGPT) สร้างภาพหน้าตรงของแต่ละตัวละคร
   จาก prompt ในหัวข้อ "ภาพอ้างอิงตัวละคร" ด้านล่าง เลือกภาพที่ชอบที่สุดแล้วเก็บไว้ใช้ตลอด
2. **สร้างวิดีโอแบบ Image-to-Video**
   ในแอปวิดีโอ AI (เช่น Kling, Hailuo, Runway, Veo) อัปโหลดภาพอ้างอิง + ใส่ prompt ของช็อตนั้น
   วิธีนี้ทำให้ตัวละครหน้าเหมือนเดิมกว่าการใช้ข้อความอย่างเดียว
3. **สร้างช็อตละ 2–3 ครั้ง** แล้วเลือกอันที่ดีที่สุด (AI สุ่มผลทุกครั้ง)
4. **อัดเสียงพากย์** อ่านเองหรือใช้ AI พากย์ (เช่น ElevenLabs หรือ text-to-speech ใน CapCut) ตามบทในแต่ละตอน
5. **ตัดต่อใน CapCut** เรียงช็อตตามลำดับ ใส่เสียงพากย์ ซับไตเติล เอฟเฟกต์เสียง และเพลง
6. **ส่งไฟล์กลับมาให้ผมตรวจ** ส่งภาพหน้าจอหรือบอกช็อตที่ไม่ผ่าน ผมจะแก้ prompt ให้

### ภาพอ้างอิงตัวละคร

```
Character reference sheet, front view and side view, plain light grey background,
a very chubby orange tabby cat with amber eyes, permanently grumpy face, wearing a thin gold collar with a tiny bell,
Pixar-like 3D animation style, soft studio lighting, high detail
```

```
Character reference sheet, front view and side view, plain light grey background,
a 26-year-old Thai woman with long black hair in a messy top bun, round black glasses, oversized mustard-yellow t-shirt, plaid shorts,
Pixar-like 3D animation style, soft studio lighting, high detail
```

```
Character reference sheet, front view and side view, plain light grey background,
a cheerful cream-colored shiba inu with a big goofy smile, wearing a red bandana,
Pixar-like 3D animation style, soft studio lighting, high detail
```

---

## รายชื่อตอน (Season 1)

| ตอน | ชื่อตอน | เรื่องย่อ |
|---|---|---|
| 1 | [เสี่ยตรวจงาน](ep01-boss-inspection.md) | เสี่ยส้มนั่งทับคีย์บอร์ดเพื่อ "ตรวจงาน" มิ้น จนอีเมลมั่วๆ หลุดไปถึงหัวหน้า แต่หัวหน้ากลับชม |
| 2 | ประชุมผู้ถือหุ้น | มิ้นประชุม Zoom เสี่ยส้มเดินเข้าเฟรมวางมาดประธาน ทั้งทีมโฟกัสแต่แมว ไม่มีใครฟังมิ้น |
| 3 | บริษัทคู่แข่ง | ไข่ตุ๋นได้ขนมจากมิ้นข้ามระเบียง เสี่ยส้มประกาศสงครามการค้า |
| 4 | ลดต้นทุน | มิ้นเปลี่ยนยี่ห้ออาหารแมวเพราะเงินเดือนไม่พอ เสี่ยส้มประท้วงอดอาหาร... ได้ 4 นาที |
| 5 | ทริปดูงาน | มิ้นพาไปหาหมอ เสี่ยส้มคิดว่าได้ไปดูงานต่างประเทศ |
| 6 | สัมมนาประจำปี | เสี่ยส้มต้องร่วมมือกับไข่ตุ๋นช่วยมิ้นที่ป่วย ตอนจบซีซันแบบอบอุ่นหัวใจ |
