#!/usr/bin/env python3
"""
Composite Praxis brand assets (icon, splash, adaptive icon) from the
curved-P mark. Run from repo root: python3 scripts/generate-brand-assets.py

Output:
  assets/images/icon.png           1024x1024  dark bg + centered mark (iOS)
  assets/images/splash.png         2048x2048  dark bg + centered mark (splash)
  assets/adaptive-icon.png         1024x1024  transparent + mark in safe area (Android)

Background color #0A0815 matches the Praxis web --color-surface token.
"""
from PIL import Image
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MARK = REPO / "assets" / "images" / "praxis-mark.png"

DARK_BG = (10, 8, 21, 255)   # #0A0815

def composite(canvas_size: int, mark_scale: float, bg, out_path: Path):
    mark = Image.open(MARK).convert("RGBA")
    canvas = Image.new("RGBA", (canvas_size, canvas_size), bg)
    target_h = int(canvas_size * mark_scale)
    target_w = int(target_h * (mark.width / mark.height))
    mark_resized = mark.resize((target_w, target_h), Image.LANCZOS)
    x = (canvas_size - target_w) // 2
    y = (canvas_size - target_h) // 2
    canvas.alpha_composite(mark_resized, (x, y))
    if bg[3] == 255:
        canvas = canvas.convert("RGB")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_path, "PNG", optimize=True)
    print(f"wrote {out_path.relative_to(REPO)}  ({canvas_size}x{canvas_size}, mark@{mark_scale:.0%})")

composite(1024, 0.62, DARK_BG, REPO / "assets" / "images" / "icon.png")
composite(2048, 0.28, DARK_BG, REPO / "assets" / "images" / "splash.png")
composite(1024, 0.55, (0, 0, 0, 0), REPO / "assets" / "adaptive-icon.png")
