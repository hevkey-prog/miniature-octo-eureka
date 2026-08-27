import colorsys
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Precompute normalized diagonal gradient coordinate once per resolution.
_grad_cache = {}


def _diagonal_ramp(width, height):
    key = (width, height)
    if key not in _grad_cache:
        xs = np.linspace(0, 1, width)
        ys = np.linspace(0, 1, height)
        gx, gy = np.meshgrid(xs, ys)
        ramp = (gx + gy) / 2.0  # 0..1 diagonal
        _grad_cache[key] = ramp
    return _grad_cache[key]


def render_background(t, width, height, base_hue=0.62, energy=0.5):
    """Animated diagonal gradient + drifting particles + film grain.

    base_hue: 0..1 hue around which the gradient cycles slowly.
    energy: 0..1, raises particle speed/brightness for hook/chorus sections.
    """
    ramp = _diagonal_ramp(width, height)

    hue_shift = 0.05 * math.sin(t * 0.15)
    hue_a = (base_hue + hue_shift) % 1.0
    hue_b = (base_hue + 0.18 + hue_shift) % 1.0

    val_a = 0.10 + 0.03 * math.sin(t * 0.3)
    val_b = 0.22 + 0.05 * energy + 0.04 * math.sin(t * 0.3 + 1.3)

    r_a, g_a, b_a = colorsys.hsv_to_rgb(hue_a, 0.65, val_a)
    r_b, g_b, b_b = colorsys.hsv_to_rgb(hue_b, 0.55, val_b)

    color_a = np.array([r_a, g_a, b_a])
    color_b = np.array([r_b, g_b, b_b])

    grad = ramp[..., None] * color_b + (1 - ramp[..., None]) * color_a
    grad = np.clip(grad * 255, 0, 255).astype(np.uint8)

    # subtle vignette
    yy, xx = np.mgrid[0:height, 0:width]
    cx, cy = width / 2, height / 2
    dist = np.sqrt(((xx - cx) / (width / 2)) ** 2 + ((yy - cy) / (height / 2)) ** 2)
    vignette = np.clip(1.0 - 0.35 * dist, 0.55, 1.0)
    grad = (grad * vignette[..., None]).astype(np.uint8)

    img = Image.fromarray(grad, "RGB")
    draw = ImageDraw.Draw(img, "RGBA")

    # drifting particles ("kinetic dust"), count/speed scale with energy
    n_particles = 26
    rng_seed_base = 1000
    for i in range(n_particles):
        seed = i * 97 + rng_seed_base
        speed = 12 + 30 * energy + (seed % 7)
        phase = (seed % 360) / 360.0 * 2 * math.pi
        px = (math.sin(phase + t * 0.07 * (1 + (seed % 5) * 0.1)) * 0.5 + 0.5) * width
        py = (height - ((t * speed + seed * 3.3) % (height + 80))) + 40
        radius = 1.5 + (seed % 4) * 0.8 + 1.5 * energy
        alpha = int(60 + 60 * energy)
        draw.ellipse(
            [px - radius, py - radius, px + radius, py + radius],
            fill=(255, 255, 255, alpha),
        )

    img = img.filter(ImageFilter.GaussianBlur(0.6))

    # film grain
    grain = (np.random.default_rng(int(t * 1000) % 99991).normal(0, 6, (height, width, 1))).astype(np.int16)
    arr = np.asarray(img).astype(np.int16) + grain
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB")
