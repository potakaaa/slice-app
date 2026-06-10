#!/usr/bin/env python3
"""Generate SLICE app icons from the brand logo mark.

Outputs (1024x1024):
  - icon.png          iOS / fallback app icon: opaque white rounded-bordered bg + logo
  - adaptive-icon.png Android adaptive foreground: transparent, logo in safe zone
  - splash-icon.png   Splash logo: transparent slice mark
  - favicon.png       Web favicon source: white bg + logo
"""
from PIL import Image, ImageDraw

ASSETS = "apps/mobile/assets"
LOGO_SRC = f"{ASSETS}/logo/slice-logo-mark-1024.png"
OUT = f"{ASSETS}/images"

SIZE = 1024
WHITE = (255, 255, 255, 255)
BORDER = (229, 229, 229, 255)  # subtle neutral hairline (#E5E5E5)
# iOS-style corner radius ~22.37% of the icon size
RADIUS = int(SIZE * 0.2237)


def trimmed_logo():
    """Load the logo and crop away transparent padding so we control sizing."""
    logo = Image.open(LOGO_SRC).convert("RGBA")
    bbox = logo.getbbox()
    if bbox:
        logo = logo.crop(bbox)
    return logo


def fit_logo(logo, target):
    """Scale logo to fit within a target square, preserving aspect ratio."""
    w, h = logo.size
    scale = target / max(w, h)
    return logo.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def make_icon():
    """Opaque white rounded-bordered background with the slice logo centered."""
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    # White rounded background
    bg = Image.new("RGBA", (SIZE, SIZE), WHITE)
    mask = rounded_mask(SIZE, RADIUS)
    canvas.paste(bg, (0, 0), mask)
    # Subtle inset rounded border
    draw = ImageDraw.Draw(canvas)
    inset = int(SIZE * 0.012)
    draw.rounded_rectangle(
        [inset, inset, SIZE - 1 - inset, SIZE - 1 - inset],
        radius=RADIUS - inset,
        outline=BORDER,
        width=max(2, int(SIZE * 0.006)),
    )
    # Logo centered at ~64% of canvas
    logo = fit_logo(trimmed_logo(), int(SIZE * 0.64))
    x = (SIZE - logo.width) // 2
    y = (SIZE - logo.height) // 2
    canvas.alpha_composite(logo, (x, y))
    canvas.save(f"{OUT}/icon.png")
    print("wrote icon.png")


def make_adaptive():
    """Android adaptive foreground: transparent, logo within the safe zone (~58%)."""
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    logo = fit_logo(trimmed_logo(), int(SIZE * 0.58))
    x = (SIZE - logo.width) // 2
    y = (SIZE - logo.height) // 2
    canvas.alpha_composite(logo, (x, y))
    canvas.save(f"{OUT}/adaptive-icon.png")
    print("wrote adaptive-icon.png")


def make_splash():
    """Splash logo: transparent slice mark at ~50% for white background."""
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    logo = fit_logo(trimmed_logo(), int(SIZE * 0.5))
    x = (SIZE - logo.width) // 2
    y = (SIZE - logo.height) // 2
    canvas.alpha_composite(logo, (x, y))
    canvas.save(f"{OUT}/splash-icon.png")
    print("wrote splash-icon.png")


def make_favicon():
    """Web favicon source: white rounded bg + logo (reuse icon look)."""
    icon = Image.open(f"{OUT}/icon.png").convert("RGBA")
    icon.resize((48, 48), Image.LANCZOS).save(f"{OUT}/favicon.png")
    print("wrote favicon.png")


if __name__ == "__main__":
    make_icon()
    make_adaptive()
    make_splash()
    make_favicon()
