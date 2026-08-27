import math

from PIL import Image, ImageDraw, ImageFont

from easing import clamp, ease_out_back, ease_out_cubic, lerp_color

FONT_REGULAR = "/usr/share/fonts/truetype/tlwg/Waree.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/tlwg/Waree-Bold.ttf"

STYLE = {
    "verse": dict(font=FONT_REGULAR, size=64, color=(235, 235, 245), accent=(120, 200, 255)),
    "chorus": dict(font=FONT_BOLD, size=76, color=(255, 235, 180), accent=(255, 140, 90)),
    "hook": dict(font=FONT_BOLD, size=120, color=(255, 255, 255), accent=(255, 60, 140)),
}

_font_cache = {}


def get_font(path, size):
    key = (path, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, size)
    return _font_cache[key]


STAGGER = 0.14
POP_DUR = 0.38
LINE_FADE_IN = 0.12
LINE_FADE_OUT = 0.28


def _word_pop_progress(t, line_start, index):
    """Returns (scale, alpha) for a single word's pop-in animation."""
    word_start = line_start + index * STAGGER
    dt = t - word_start
    if dt <= 0:
        return 0.0, 0.0
    scale = ease_out_back(dt / POP_DUR) if dt < POP_DUR else 1.0
    alpha = ease_out_cubic(dt / (POP_DUR * 0.6)) if dt < POP_DUR * 0.6 else 1.0
    return max(scale, 0.0), clamp(alpha)


def _line_envelope(t, start, end):
    """Overall alpha (0..1) and vertical offset for line enter/exit."""
    if t < start or t > end:
        return 0.0, 0.0
    fade_in = clamp((t - start) / LINE_FADE_IN)
    fade_out = clamp((end - t) / LINE_FADE_OUT)
    alpha = min(fade_in, fade_out)
    rise = (1 - fade_out) * -18  # drift upward as it exits
    return alpha, rise


def _advance_width(draw, font, text):
    return draw.textlength(text, font=font)


def draw_line(img, t, start, end, text, style_name, width, height):
    style = STYLE[style_name]
    font = get_font(style["font"], style["size"])
    words = text.split(" ")

    line_alpha, line_rise = _line_envelope(t, start, end)
    if line_alpha <= 0.0:
        return

    draw = ImageDraw.Draw(img, "RGBA")
    ascent, descent = font.getmetrics()
    common_h = ascent + descent
    gap = style["size"] * 0.32

    sizes = [(_advance_width(draw, font, w), common_h) for w in words]
    total_w = sum(s[0] for s in sizes) + gap * (len(words) - 1)
    max_row_w = width * 0.88

    rows = [list(range(len(words)))]
    if total_w > max_row_w and len(words) > 1:
        rows, cur, cur_w = [], [], 0
        for i, (w, sz) in enumerate(zip(words, sizes)):
            add = sz[0] + (gap if cur else 0)
            if cur_w + add > max_row_w and cur:
                rows.append(cur)
                cur, cur_w = [i], sz[0]
            else:
                cur.append(i)
                cur_w += add
        rows.append(cur)

    line_h = style["size"] * 1.25
    total_h = line_h * len(rows)
    top = height / 2 - total_h / 2 + line_rise

    for row_idx, row in enumerate(rows):
        row_w = sum(sizes[i][0] for i in row) + gap * (len(row) - 1)
        x = width / 2 - row_w / 2
        y_center = top + line_h * row_idx + line_h / 2

        for i in row:
            scale, pop_alpha = _word_pop_progress(t, start, i)
            w_w, w_h = sizes[i]
            alpha = int(255 * line_alpha * pop_alpha)
            if alpha <= 0 or scale <= 0:
                x += w_w + gap
                continue

            bob = math.sin((t - start) * 4.0 + i) * 2.5
            color = lerp_color(style["accent"], style["color"], clamp(pop_alpha))

            pad = 12
            canvas_w, canvas_h = int(w_w) + pad * 2, w_h + pad * 2
            word_img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
            wd = ImageDraw.Draw(word_img)
            wd.text((pad, pad), words[i], font=font, fill=(*color, alpha), anchor="la")
            if scale != 1.0:
                new_size = (max(1, int(canvas_w * scale)), max(1, int(canvas_h * scale)))
                word_img = word_img.resize(new_size, Image.LANCZOS)

            paste_x = int(x - pad * scale)
            paste_y = int(y_center - canvas_h * scale / 2 + bob)
            img.paste(word_img, (paste_x, paste_y), word_img)

            x += w_w + gap
