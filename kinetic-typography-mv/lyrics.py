# Placeholder lyrics for the Kinetic Typography MV demo.
# Each line: (start_seconds, end_seconds, text, style)
# style: "verse" | "chorus" | "hook"
#
# Timing is even/approximate since there is no real audio track yet.
# Replace this list (and audio.py's tempo) once real lyrics + a song
# file with timestamps are available.

LINES = [
    (1.0, 4.0, "เริ่ม จาก ศูนย์", "verse"),
    (4.0, 7.0, "ใน คืน ที่ ไม่มี ใคร เห็น", "verse"),
    (7.0, 10.0, "พิมพ์ ที ละ คำ", "verse"),
    (10.0, 13.5, "ก่อ ร่าง เป็น บท เพลง", "verse"),

    (14.0, 17.5, "แสง จาก จอ", "verse"),
    (17.5, 21.0, "คือ ดาว ดวง เดียว ที่ มี", "verse"),
    (21.0, 24.0, "ไม่ รู้ จะ ไป ถึง ไหน", "verse"),
    (24.0, 28.0, "แต่ รู้ ว่า ต้อง ไป ต่อ", "verse"),

    (29.0, 32.0, "ปล่อย ให้ ตัว อักษร", "chorus"),
    (32.0, 35.0, "เต้น ไป ตาม จังหวะ ใจ", "chorus"),
    (35.0, 38.0, "KINETIC", "hook"),
    (38.0, 41.5, "TYPOGRAPHY", "hook"),

    (42.0, 45.0, "ทุก คำ คือ ก้าว ที่ กล้า", "chorus"),
    (45.0, 48.0, "ทุก บรรทัด คือ ฝัน ที่ พา", "chorus"),
    (48.0, 51.5, "ไป สู่ วัน พรุ่งนี้", "chorus"),

    (52.5, 56.0, "โค้ด ที่ เขียน", "verse"),
    (56.0, 59.0, "คือ เรื่องราว ของ เรา", "verse"),
    (59.0, 63.0, "MADE WITH CODE", "hook"),
]

DURATION = 65.0  # seconds, a little padding after the last line
FPS = 30
WIDTH, HEIGHT = 1280, 720
