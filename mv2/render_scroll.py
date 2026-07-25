import json, sys, subprocess, math, re
from bisect import bisect_left
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W = H = 1080
FPS = 25
MAX_TEXT_WIDTH = 800
MAX_TEXT_HEIGHT = 380

CENTER_Y = 250     # keep the currently-singing line near the top (~2nd line
                   # down) so more upcoming lines are visible below to read ahead
LINE_GAP = 46      # vertical gap between stacked lines in the credits column
EDGE_FADE = 90     # px band at top/bottom of frame where lines fade out

FONT_DIR = "fonts"
FONTS = {
    "black": f"{FONT_DIR}/Kanit-Black.ttf",
    "bold": f"{FONT_DIR}/Kanit-Bold.ttf",
    "extrabold": f"{FONT_DIR}/Kanit-ExtraBold.ttf",
}

timing = json.load(open("timing.json", encoding="utf-8"))
TEST_RANGE = sys.argv[1] if len(sys.argv) > 1 else None

_font_cache = {}
def get_font(weight, size):
    key = (weight, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(FONTS[weight], size)
    return _font_cache[key]

# ---------------------------------------------------------------- keywords --
RED = (255, 70, 70)
ORANGE = (255, 145, 45)
GOLD = (255, 205, 70)
PURPLE = (195, 120, 255)
CYAN = (140, 220, 255)
GREEN = (120, 230, 160)

THAI_KEYWORDS = [
    ("พังทลาย", ORANGE), ("พัง", ORANGE), ("รักแท้", RED), ("รัก", RED),
    ("เจ็บปวด", RED), ("เจ็บ", RED), ("น้ำตา", CYAN), ("ร้องไห้", CYAN),
    ("หลอก", PURPLE), ("โกหก", PURPLE), ("ทะเลาะ", ORANGE), ("สัญญา", GOLD),
    ("หึงหวง", PURPLE), ("บาดแผล", RED), ("กระจก", CYAN), ("มองข้าม", GOLD),
    ("ทิ้ง", ORANGE), ("โง่", PURPLE), ("เศร้า", CYAN), ("เชื่อใจ", GOLD),
    ("เชื่อ", GOLD), ("แคร์", GOLD), ("ลวง", PURPLE), ("แผล", RED),
    ("ปลอบโยน", CYAN), ("บทเรียน", GOLD),
    # song-2 additions: reckless/spiral era + redemption arc
    ("เที่ยว", PURPLE), ("ดื่ม", PURPLE), ("สุรา", PURPLE), ("วุ่นวาย", ORANGE),
    ("ความเชื่อ", GOLD), ("มั่นคง", GREEN), ("บ้าน", GREEN), ("แต่งงาน", GREEN),
    ("ความสุข", GREEN), ("อบอุ่น", GOLD), ("มองข้าม", GOLD), ("บริสุทธิ์", GREEN),
]
EN_KEYWORDS = {
    "love": RED, "heart": RED, "hurt": RED, "pain": RED,
    "broke": ORANGE, "broken": ORANGE, "break": ORANGE, "breaking": ORANGE,
    "lie": PURPLE, "lying": PURPLE, "lies": PURPLE, "blind": PURPLE, "foolish": PURPLE,
    "trust": GOLD, "promise": GOLD, "promised": GOLD,
    "cry": CYAN, "tears": CYAN, "glass": CYAN, "shattered": CYAN,
    # song-2 additions
    "chaos": ORANGE, "empty": PURPLE, "faith": GOLD, "steady": GREEN,
    "stay": GREEN, "home": GREEN, "understands": GOLD, "storm": ORANGE,
}

def find_hot_token(rows_words):
    for r, words in enumerate(rows_words):
        for w, word in enumerate(words):
            stripped = re.sub(r"[.,!?'\";:]", "", word).lower()
            if stripped in EN_KEYWORDS:
                return r, w, EN_KEYWORDS[stripped]
        for w, word in enumerate(words):
            for sub, color in THAI_KEYWORDS:
                if sub in word:
                    return r, w, color
    return None

# ------------------------------------------------------------- text layout --
def wrap_rows(text, font):
    tmp = Image.new("RGBA", (10, 10))
    d = ImageDraw.Draw(tmp)
    words = text.split(" ")
    rows, cur = [], []
    for wd in words:
        trial = " ".join(cur + [wd])
        bbox = d.textbbox((0, 0), trial, font=font)
        if bbox[2] - bbox[0] <= MAX_TEXT_WIDTH or not cur:
            cur.append(wd)
        else:
            rows.append(cur)
            cur = [wd]
    if cur:
        rows.append(cur)
    return rows

def _max_row_width(rows, font, d):
    widest = 0
    for words in rows:
        bbox = d.textbbox((0, 0), " ".join(words), font=font)
        widest = max(widest, bbox[2] - bbox[0])
    return widest

def fit_font(text, weight, start_size):
    # IMPORTANT: this loop must check BOTH height and width before accepting a
    # size. An earlier bug only checked height, so Thai lines with no spaces
    # (a single unbreakable "word") could overflow the frame width — width
    # only shrinks by lowering font size, so both checks are required.
    size = start_size
    tmp = Image.new("RGBA", (10, 10))
    d = ImageDraw.Draw(tmp)
    while size > 16:
        font = get_font(weight, size)
        rows = wrap_rows(text, font)
        line_h = d.textbbox((0, 0), "กหA", font=font)[3] * 1.28
        fits_h = line_h * len(rows) <= MAX_TEXT_HEIGHT and len(rows) <= 2
        fits_w = _max_row_width(rows, font, d) <= MAX_TEXT_WIDTH
        if fits_h and fits_w:
            return font, rows, line_h
        size -= 3
    font = get_font(weight, size)
    rows = wrap_rows(text, font)
    line_h = d.textbbox((0, 0), "กหA", font=font)[3] * 1.28
    return font, rows, line_h

def render_run(text, font, fill, stroke_w=9, glow=None):
    tmp = Image.new("RGBA", (10, 10))
    d = ImageDraw.Draw(tmp)
    bbox = d.textbbox((0, 0), text, font=font, stroke_width=stroke_w)
    extra = int(glow[2]) * 4 if glow else 0
    w = bbox[2] - bbox[0] + stroke_w * 4 + extra
    h = bbox[3] - bbox[1] + stroke_w * 4 + extra
    img = Image.new("RGBA", (max(w, 1), max(h, 1)), (0, 0, 0, 0))
    pad = stroke_w * 2 + (int(glow[2]) * 2 if glow else 0)
    ox = pad - bbox[0]
    oy = pad - bbox[1]
    if glow:
        glow_color, glow_alpha, blur_r = glow
        gl = Image.new("RGBA", img.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(gl)
        gd.text((ox, oy), text, font=font, fill=(*glow_color, glow_alpha))
        gl = gl.filter(ImageFilter.GaussianBlur(blur_r))
        img = Image.alpha_composite(img, gl)
    dd = ImageDraw.Draw(img)
    dd.text((ox, oy), text, font=font, fill=fill, stroke_width=stroke_w, stroke_fill=(0, 0, 0, 255))
    return img, pad

ACCENTS_PAL = {
    "Intro": [(255, 255, 255), (255, 255, 255), (255, 224, 130)],
    "Verse 1 - Spiral": [(255, 255, 255), (255, 255, 255), (200, 170, 255)],
    "Verse 2 - The Turning Point": [(255, 255, 255), (255, 255, 255), (255, 224, 130)],
    "Slow Bridge - tempo drops, half-time, soft delivery": [(255, 255, 255), (255, 255, 255), (255, 200, 140)],
    "Verse 3 - Present": [(255, 255, 255), (255, 255, 255), (170, 240, 190)],
    "Outro": [(255, 255, 255), (255, 255, 255), (255, 224, 130)],
}

def base_color_for(idx, section):
    pal = ACCENTS_PAL.get(section, [(255, 255, 255)])
    return pal[idx % len(pal)]

class LineAsset:
    def __init__(self, row, idx):
        self.row = row
        self.idx = idx
        section = row["section"]
        base_color = base_color_for(idx, section)
        weight = "extrabold" if idx % 2 == 0 else "black"
        base_size = 60 if len(row["text"]) < 40 else 46
        font, rows, line_h = fit_font(row["text"], weight, base_size)

        hot = find_hot_token(rows)
        tmp = Image.new("RGBA", (10, 10))
        d = ImageDraw.Draw(tmp)
        space_w = d.textlength(" ", font=font)

        # Position pieces using their NATURAL text advance width (d.textlength),
        # not the padded image width — render_run pads images for stroke/glow,
        # and using that padded width as the cursor step stacks padding on top
        # of the space character, blowing the gap between segments way past a
        # normal space (most visible on the multi-piece keyword-split rows).
        pieces = []
        row_metas = []
        for r, words in enumerate(rows):
            if hot and hot[0] == r:
                _, hidx, hcolor = hot
                before = " ".join(words[:hidx])
                keyword = words[hidx]
                after = " ".join(words[hidx + 1:])
                x = 0.0
                row_pieces = []
                if before:
                    img_b, pad_b = render_run(before, font, (*base_color, 255))
                    row_pieces.append((img_b, x, pad_b))
                    x += d.textlength(before, font=font) + space_w
                img_k, pad_k = render_run(keyword, font, (*hcolor, 255), glow=(hcolor, 160, 13))
                row_pieces.append((img_k, x, pad_k))
                x += d.textlength(keyword, font=font) + space_w
                if after:
                    img_a, pad_a = render_run(after, font, (*base_color, 255))
                    row_pieces.append((img_a, x, pad_a))
                    x += d.textlength(after, font=font)
                row_metas.append((row_pieces, x))
            else:
                text = " ".join(words)
                img_r, pad_r = render_run(text, font, (*base_color, 255))
                row_metas.append(([(img_r, 0.0, pad_r)], d.textlength(text, font=font)))

        block_w = int(max(rw for _, rw in row_metas)) + 16
        block_h = int(line_h * len(rows)) + 16

        for r, (row_pieces, row_w) in enumerate(row_metas):
            x_off = (block_w - row_w) / 2
            y = r * line_h + 8
            for img_p, x, pad_p in row_pieces:
                px = int(x_off + x - pad_p)
                py = int(y - pad_p)
                pieces.append((img_p, px, py))

        flat = Image.new("RGBA", (block_w, block_h), (0, 0, 0, 0))
        for img_p, px, py in pieces:
            flat.alpha_composite(img_p, (px, py))
        self.full_img = flat
        self.w, self.h = block_w, block_h


def smoothstep(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)

# ------------------------------------------------------------ credits column --
# Every line sits at a FIXED, non-overlapping slot in one tall virtual column
# (like an end-credits roll). The whole column scrolls upward continuously;
# only the SCROLL SPEED between one line and the next is driven by the real
# lyric timing, so motion always keeps pace with the song without any two
# lines ever occupying the same space.
def build_column(assets):
    pos_center = []
    top = 0.0
    for a in assets:
        pos_center.append(top + a.h / 2.0)
        top += a.h + LINE_GAP
    return pos_center

LEAD_TIME = 1.3  # show each line this many seconds before it's actually sung,
                  # so there's time to read it before the vocal catches up
                  # (bumped from 0.9 — user reported the scroll felt too fast
                  # to keep up with while reading)

def build_offset_fn(pos_center):
    bt = [max(0.0, row["start"] - LEAD_TIME) for row in timing]
    bp = list(pos_center)
    tail_t = max(bt[-1] + 0.5, timing[-1]["end"] + 2.0 - LEAD_TIME)
    tail_p = pos_center[-1] + 260
    bt.append(tail_t)
    bp.append(tail_p)

    def offset(t):
        n = len(bt)
        if t <= bt[0]:
            return bp[0]
        if t >= bt[-1]:
            return bp[-1]
        lo, hi = 0, n - 1
        while lo + 1 < hi:
            mid = (lo + hi) // 2
            if bt[mid] <= t:
                lo = mid
            else:
                hi = mid
        seg_t0, seg_t1 = bt[lo], bt[lo + 1]
        seg_p0, seg_p1 = bp[lo], bp[lo + 1]
        seg_dur = max(1e-6, seg_t1 - seg_t0)
        # Hold each line still (fully readable) for most of its time, then
        # snap up to the next line in a short, fast burst right before it's
        # due — a continuous smoothstep across the whole gap reads as a slow
        # drift; a hold-then-snap reads as a fast, punchy scroll while still
        # landing exactly on the beat.
        trans = min(0.32, seg_dur * 0.4)
        hold_end = seg_t1 - trans
        if t <= hold_end:
            return seg_p0
        frac = (t - hold_end) / trans
        return seg_p0 + (seg_p1 - seg_p0) * smoothstep(frac)

    return offset

def edge_alpha(y, h):
    top_edge = y - h / 2
    bot_edge = y + h / 2
    a_top = 1.0 if top_edge > EDGE_FADE else max(0.0, (top_edge + h) / (EDGE_FADE + h))
    a_bot = 1.0 if bot_edge < H - EDGE_FADE else max(0.0, (H - bot_edge + h) / (EDGE_FADE + h))
    return max(0.0, min(a_top, a_bot, 1.0))

def compose(canvas, assets, pos_center, offset_fn, t_abs):
    off = offset_fn(t_abs)
    lo_p = off - CENTER_Y - 200
    hi_p = off + (H - CENTER_Y) + 200
    n = len(assets)
    lo_i = max(0, bisect_left(pos_center, lo_p))
    hi_i = min(n, bisect_left(pos_center, hi_p) + 1)
    for i in range(lo_i, hi_i):
        a = assets[i]
        y = CENTER_Y + (pos_center[i] - off)
        if y < -a.h or y > H + a.h:
            continue
        alpha = edge_alpha(y, a.h)
        if alpha <= 0.01:
            continue
        img = a.full_img
        if alpha < 0.99:
            al = img.split()[3].point(lambda v, m=alpha: int(v * m))
            img = img.copy()
            img.putalpha(al)
        px = int(W / 2 - a.w / 2)
        py = int(y - a.h / 2)
        canvas.alpha_composite(img, (px, py))


def main():
    assets = [LineAsset(row, i) for i, row in enumerate(timing)]
    pos_center = build_column(assets)
    offset_fn = build_offset_fn(pos_center)

    cap = cv2.VideoCapture("out/background.mp4")
    bg_fps = cap.get(cv2.CAP_PROP_FPS) or FPS
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    full_duration = total_frames / bg_fps

    start_t, end_t = 0.0, full_duration
    if TEST_RANGE:
        if ":" in TEST_RANGE:
            a, b = TEST_RANGE.split(":")
            start_t, end_t = float(a), float(b)
        else:
            end_t = float(TEST_RANGE)

    n_out_frames = int((end_t - start_t) * FPS)
    print(f"bg_fps={bg_fps} total_frames={total_frames} range={start_t}-{end_t} out_frames={n_out_frames}", flush=True)

    out_name = "out/mv_silent.mp4" if not TEST_RANGE else "out/mv_test_silent.mp4"
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
         "-r", str(FPS), "-i", "-",
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
         out_name],
        stdin=subprocess.PIPE
    )

    bg_pos_time = -1
    bg_frame = None
    for i in range(n_out_frames):
        t_abs = start_t + i / FPS
        bg_frame_idx = min(int(t_abs * bg_fps), total_frames - 1)
        if bg_frame_idx != bg_pos_time:
            cap.set(cv2.CAP_PROP_POS_FRAMES, bg_frame_idx)
            ret, bg_frame = cap.read()
            if not ret:
                break
            bg_pos_time = bg_frame_idx

        frame_rgb = cv2.cvtColor(bg_frame, cv2.COLOR_BGR2RGB)
        canvas = Image.fromarray(frame_rgb).convert("RGBA")

        compose(canvas, assets, pos_center, offset_fn, t_abs)

        out_rgb = np.array(canvas.convert("RGB"))
        out_bgr = cv2.cvtColor(out_rgb, cv2.COLOR_RGB2BGR)
        proc.stdin.write(out_bgr.tobytes())

        if i % (FPS * 10) == 0:
            print(f"frame {i}/{n_out_frames}  t={t_abs:.1f}s", flush=True)

    proc.stdin.close()
    proc.wait()
    print("DONE", out_name)

if __name__ == "__main__":
    main()
