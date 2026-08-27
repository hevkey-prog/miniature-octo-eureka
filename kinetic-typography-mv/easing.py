import math


def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def ease_out_back(t, overshoot=1.7):
    """0..1 -> slight overshoot past 1 then settle. Good for pop-in text."""
    t = clamp(t)
    c1 = overshoot
    c3 = c1 + 1
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2


def ease_out_cubic(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_in_cubic(t):
    t = clamp(t)
    return t ** 3


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_color(c1, c2, t):
    t = clamp(t)
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))
