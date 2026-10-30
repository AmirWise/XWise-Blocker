#!/usr/bin/env python3
"""
XWise Blocker Pro Icon Generator
Generates pixel-perfect, ultra-modern icons (128x128, 48x48, 16x16)
with high-contrast silhouettes, electric gradients, and crisp anti-aliasing.
"""

import math
from PIL import Image, ImageDraw, ImageFilter

def draw_pro_icon(size=1024):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    margin = int(size * 0.05)
    box = [margin, margin, size - margin, size - margin]
    radius = int(size * 0.22)

    # 1. Background squircle
    bg_mask = Image.new("L", (size, size), 0)
    b_draw = ImageDraw.Draw(bg_mask)
    b_draw.rounded_rectangle(box, radius=radius, fill=255)

    # Render dark luxury obsidian gradient
    bg_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    for y in range(margin, size - margin):
        t = (y - margin) / (size - 2 * margin)
        # Deep space obsidian (#0c1017 -> #04060a)
        r = int(12 * (1 - t) + 4 * t)
        g = int(16 * (1 - t) + 6 * t)
        b = int(24 * (1 - t) + 10 * t)
        line = Image.new("RGBA", (size, 1), (r, g, b, 255))
        bg_layer.paste(line, (0, y))

    img.paste(bg_layer, (0, 0), bg_mask)

    # 2. Ambient radial glow behind emblem
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    cx, cy = size // 2, int(size * 0.50)
    for r in range(int(size * 0.35), int(size * 0.05), -15):
        alpha = int(45 * (1 - r / (size * 0.35)))
        g_draw.ellipse(
            (cx - r, cy - int(r * 0.95), cx + r, cy + int(r * 0.95)),
            fill=(29, 155, 240, alpha)
        )
    glow = glow.filter(ImageFilter.GaussianBlur(int(size * 0.035)))
    img.alpha_composite(glow)

    # 3. Outer border with electric cyan-to-violet dual tone
    border_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd_draw = ImageDraw.Draw(border_img)
    bd_draw.rounded_rectangle(box, radius=radius, outline=(30, 45, 75, 255), width=int(size * 0.012))

    # Top-left cyan highlight
    cyan_glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cg_draw = ImageDraw.Draw(cyan_glow)
    cg_draw.rounded_rectangle(box, radius=radius, outline=(56, 189, 248, 190), width=int(size * 0.008))
    tl_mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(tl_mask).polygon([(0, 0), (size, 0), (0, size)], fill=255)
    border_img.paste(cyan_glow, (0, 0), tl_mask)

    # Bottom-right violet highlight
    purp_glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pg_draw = ImageDraw.Draw(purp_glow)
    pg_draw.rounded_rectangle(box, radius=radius, outline=(168, 85, 247, 190), width=int(size * 0.008))
    br_mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(br_mask).polygon([(size, 0), (size, size), (0, size)], fill=255)
    border_img.paste(purp_glow, (0, 0), br_mask)

    img.alpha_composite(border_img)

    # 4. Shield Contour Geometry
    top_y = int(size * 0.20)
    shoulder_y = int(size * 0.52)
    bottom_y = int(size * 0.82)
    w_outer = int(size * 0.26)

    shield_pts = [
        (cx, top_y),
        (cx + w_outer, int(top_y + size * 0.08)),
        (cx + w_outer + int(size * 0.015), shoulder_y),
        (cx, bottom_y),
        (cx - w_outer - int(size * 0.015), shoulder_y),
        (cx - w_outer, int(top_y + size * 0.08)),
    ]

    # Shield Drop Shadow
    shield_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(shield_shadow).polygon(
        [(x, y + int(size * 0.018)) for x, y in shield_pts],
        fill=(0, 0, 0, 210)
    )
    shield_shadow = shield_shadow.filter(ImageFilter.GaussianBlur(int(size * 0.02)))
    img.alpha_composite(shield_shadow)

    # Dark Shield Body
    shield_body = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shield_body)
    s_draw.polygon(shield_pts, fill=(10, 14, 22, 255), outline=(45, 60, 90, 255))
    img.alpha_composite(shield_body)

    # 5. Dynamic Crossing "X" Blades
    # Blade 1: Top-Right to Bottom-Left (Royal Violet)
    blade_violet = [
        (cx + int(size * 0.16), int(size * 0.32)),
        (cx + int(size * 0.24), int(size * 0.37)),
        (cx - int(size * 0.14), int(size * 0.72)),
        (cx - int(size * 0.22), int(size * 0.67)),
    ]
    # Blade 2: Top-Left to Bottom-Right (Electric Cyan)
    blade_cyan = [
        (cx - int(size * 0.16), int(size * 0.32)),
        (cx - int(size * 0.24), int(size * 0.37)),
        (cx + int(size * 0.14), int(size * 0.72)),
        (cx + int(size * 0.22), int(size * 0.67)),
    ]

    blades = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bld_draw = ImageDraw.Draw(blades)

    # Draw Violet Blade
    bld_draw.polygon(blade_violet, fill=(139, 92, 246, 255))
    bld_draw.line([(cx + int(size * 0.16), int(size * 0.32)), (cx - int(size * 0.14), int(size * 0.72))], fill=(216, 180, 254, 230), width=int(size * 0.007))

    # Draw Cyan Blade
    bld_draw.polygon(blade_cyan, fill=(14, 165, 233, 255))
    bld_draw.line([(cx - int(size * 0.16), int(size * 0.32)), (cx + int(size * 0.14), int(size * 0.72))], fill=(186, 230, 253, 240), width=int(size * 0.007))

    # Center Prism Diamond
    prism_pts = [
        (cx, int(size * 0.46)),
        (cx + int(size * 0.045), int(size * 0.50)),
        (cx, int(size * 0.54)),
        (cx - int(size * 0.045), int(size * 0.50)),
    ]
    bld_draw.polygon(prism_pts, fill=(255, 255, 255, 240))
    img.alpha_composite(blades)

    # 6. Foreground Verified Checkmark Crest
    crest = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(crest)

    chk_pts = [
        (cx - int(size * 0.09), int(size * 0.50)),
        (cx - int(size * 0.02), int(size * 0.57)),
        (cx + int(size * 0.11), int(size * 0.42)),
    ]

    # Drop shadow for checkmark
    chk_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(chk_shadow).line(
        [(x, y + int(size * 0.01)) for x, y in chk_pts[:2]],
        fill=(0, 0, 0, 180),
        width=int(size * 0.045),
        joint="round"
    )
    ImageDraw.Draw(chk_shadow).line(
        [(x, y + int(size * 0.01)) for x, y in chk_pts[1:]],
        fill=(0, 0, 0, 180),
        width=int(size * 0.045),
        joint="round"
    )
    chk_shadow = chk_shadow.filter(ImageFilter.GaussianBlur(int(size * 0.012)))
    img.alpha_composite(chk_shadow)

    # Bold, clean white checkmark
    c_draw.line(chk_pts[:2], fill=(255, 255, 255, 255), width=int(size * 0.042), joint="round")
    c_draw.line(chk_pts[1:], fill=(255, 255, 255, 255), width=int(size * 0.042), joint="round")
    img.alpha_composite(crest)

    return img

def main():
    print("Building modern Pro XWise Blocker icons...")
    master = draw_pro_icon(1024)

    # Output targets: 128, 48, 16
    for target_size in [128, 48, 16]:
        resized = master.resize((target_size, target_size), Image.Resampling.LANCZOS)
        out_path = f"icons/icon{target_size}.png"
        resized.save(out_path, "PNG", optimize=True)
        print(f"Generated {out_path} ({target_size}x{target_size})")

if __name__ == "__main__":
    main()
