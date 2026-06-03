#!/usr/bin/env python3
"""Generate Deadline OS icons: a countdown progress-ring mark.
Rendered at 4x then downsampled with LANCZOS for crisp anti-aliased edges."""
from PIL import Image, ImageDraw

BG = (12, 12, 13, 255)        # #0c0c0d near-black
TRACK = (60, 59, 56, 255)     # faint full ring
ACCENT = (255, 92, 56, 255)   # #ff5c38 warm signal orange

SUP = 1024  # supersampled canvas


def render():
    img = Image.new("RGBA", (SUP, SUP), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # rounded-square plate
    pad = 0
    radius = int(SUP * 0.235)
    d.rounded_rectangle([pad, pad, SUP - pad - 1, SUP - pad - 1], radius=radius, fill=BG)

    # progress ring geometry
    cx = cy = SUP / 2
    r = SUP * 0.30
    w = int(SUP * 0.105)
    box = [cx - r, cy - r, cx + r, cy + r]

    # faint full track
    d.arc(box, 0, 360, fill=TRACK, width=w)
    # accent arc: ~73% elapsed, starting at 12 o'clock going clockwise
    d.arc(box, -90, -90 + int(360 * 0.73), fill=ACCENT, width=w)

    # leading dot at the head of the accent arc (round cap)
    import math
    ang = math.radians(-90 + 360 * 0.73)
    hx = cx + r * math.cos(ang)
    hy = cy + r * math.sin(ang)
    cap = w / 2
    d.ellipse([hx - cap, hy - cap, hx + cap, hy + cap], fill=ACCENT)
    # round cap at the start (12 o'clock)
    sx, sy = cx, cy - r
    d.ellipse([sx - cap, sy - cap, sx + cap, sy + cap], fill=ACCENT)

    # center pip
    pip = SUP * 0.052
    d.ellipse([cx - pip, cy - pip, cx + pip, cy + pip], fill=ACCENT)
    return img


def main():
    master = render()
    for size in (16, 48, 128, 512):
        out = master.resize((size, size), Image.LANCZOS)
        out.save(f"icons/icon{size}.png")
        print(f"wrote icons/icon{size}.png")


if __name__ == "__main__":
    main()
