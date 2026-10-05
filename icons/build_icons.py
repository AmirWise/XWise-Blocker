#!/usr/bin/env python3
import math
from PIL import Image, ImageDraw, ImageFilter

def draw_pro_icon(size=1024):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # Base squircle geometry
    margin = 56
    box = [margin, margin, size - margin, size - margin]
    radius = 216

    # 1. Background squircle
    bg_mask = Image.new("L", (size, size), 0)
    b_draw = ImageDraw.Draw(bg_mask)
    b_draw.rounded_rectangle(box, radius=radius, fill=255)

    # Render smooth dark gradient inside squircle
    bg_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    for y in range(margin, size - margin):
        t = (y - margin) / (size - 2 * margin)
        # Deep space navy (#0f172a) -> dark obsidian (#050811)
        r = int(14 * (1 - t) + 5 * t)
        g = int(22 * (1 - t) + 8 * t)
        b = int(38 * (1 - t) + 16 * t)
        line = Image.new("RGBA", (size, 1), (r, g, b, 255))
        bg_layer.paste(line, (0, y))

    # Paste background using mask
    img.paste(bg_layer, (0, 0), bg_mask)

    # 2. Ambient radial glow behind emblem
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    cx, cy = size // 2, int(size * 0.50)
    for r in range(360, 40, -15):
        alpha = int(38 * (1 - r / 360))
        g_draw.ellipse(
            (cx - r, cy - int(r * 0.9), cx + r, cy + int(r * 0.9)),
            fill=(29, 155, 240, alpha)
        )
    glow = glow.filter(ImageFilter.GaussianBlur(35))
    img.alpha_composite(glow)

    # 3. Outer border with dual-tone electric gradient
    border_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd_draw = ImageDraw.Draw(border_img)
    bd_draw.rounded_rectangle(box, radius=radius, outline=(30, 45, 70, 255), width=8)

    # Top-left cyan highlight
    cyan_glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cg_draw = ImageDraw.Draw(cyan_glow)
    cg_draw.rounded_rectangle(box, radius=radius, outline=(29, 155, 240, 160), width=4)
    # Clip to top-left half
    tl_mask = Image.new("L", (size, size), 0)
    tl_draw = ImageDraw.Draw(tl_mask)
    tl_draw.polygon([(0, 0), (size, 0), (0, size)], fill=255)
    border_img.paste(cyan_glow, (0, 0), tl_mask)

    # Bottom-right violet highlight
    purp_glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pg_draw = ImageDraw.Draw(purp_glow)
    pg_draw.rounded_rectangle(box, radius=radius, outline=(139, 92, 246, 160), width=4)
    br_mask = Image.new("L", (size, size), 0)
    br_draw = ImageDraw.Draw(br_mask)
    br_draw.polygon([(size, 0), (size, size), (0, size)], fill=255)
    border_img.paste(purp_glow, (0, 0), br_mask)

    img.alpha_composite(border_img)

    # 4. Shield Dimensions & Paths
    top_y = 220
    notch_y = 280
    shoulder_y = 450
    bottom_y = 800
    w_outer = 270
    w_inner = 200

    # Outer Shield Wings with Gradient & Metallic Bevel
    # Left Shield Wing
    left_pts = [
        (cx, notch_y),
        (cx - w_outer, top_y),
        (cx - w_outer - 15, shoulder_y),
        (cx, bottom_y),
    ]

    # Right Shield Wing
    right_pts = [
        (cx, notch_y),
        (cx + w_outer, top_y),
        (cx + w_outer + 15, shoulder_y),
        (cx, bottom_y),
    ]

    # Draw left shield wing (Electric Twitter Cyan)
    left_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    l_mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(l_mask).polygon(left_pts, fill=255)

    ld_draw = ImageDraw.Draw(left_layer)
    for step in range(w_outer + 30):
        x = cx - step
        ratio = step / (w_outer + 30)
        # Gradient from center bright (#38bdf8) to edge electric (#0284c7)
        r = int(56 * (1 - ratio) + 2 * ratio)
        g = int(189 * (1 - ratio) + 132 * ratio)
        b = int(248 * (1 - ratio) + 199 * ratio)
        ld_draw.line([(x, top_y - 20), (x, bottom_y + 20)], fill=(r, g, b, 255), width=2)
    left_layer.putalpha(l_mask)

    # Draw right shield wing (Vibrant Royal Purple)
    right_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    r_mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(r_mask).polygon(right_pts, fill=255)

    rd_draw = ImageDraw.Draw(right_layer)
    for step in range(w_outer + 30):
        x = cx + step
        ratio = step / (w_outer + 30)
        # Gradient from center bright (#c084fc) to edge violet (#7c3aed)
        r = int(192 * (1 - ratio) + 124 * ratio)
        g = int(132 * (1 - ratio) + 58 * ratio)
        b = int(252 * (1 - ratio) + 237 * ratio)
        rd_draw.line([(x, top_y - 20), (x, bottom_y + 20)], fill=(r, g, b, 255), width=2)
    right_layer.putalpha(r_mask)

    # Shadow under wings
    shield_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(shield_shadow).polygon(
        [(cx, notch_y + 12), (cx - w_outer, top_y + 12), (cx - w_outer - 15, shoulder_y + 12),
         (cx, bottom_y + 15),
         (cx + w_outer + 15, shoulder_y + 12), (cx + w_outer, top_y + 12)],
        fill=(0, 0, 0, 180)
    )
    shield_shadow = shield_shadow.filter(ImageFilter.GaussianBlur(18))
    img.alpha_composite(shield_shadow)

    # Composite wings
    img.alpha_composite(left_layer)
    img.alpha_composite(right_layer)

    # 5. Inner Core Cutout (Dark Obsidian Recess with fine glowing border)
    recess = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rec_draw = ImageDraw.Draw(recess)
    inner_pts = [
        (cx, notch_y + 44),
        (cx - w_inner, top_y + 44),
        (cx - w_inner - 10, shoulder_y - 10),
        (cx, bottom_y - 55),
        (cx + w_inner + 10, shoulder_y - 10),
        (cx + w_inner, top_y + 44),
    ]
    rec_draw.polygon(inner_pts, fill=(11, 14, 22, 255))
    rec_draw.polygon(inner_pts, outline=(30, 42, 65, 255), width=4)
    img.alpha_composite(recess)

    # 6. Sleek Stylized "X" Blades inside the shield
    # Blade A: Top-Left to Bottom-Right (Electric Cyan)
    blade_a = [
        (cx - 155, 330),
        (cx - 85, 315),
        (cx + 140, 650),
        (cx + 70, 665),
    ]
    # Blade B: Top-Right to Bottom-Left (Luminous Violet)
    blade_b = [
        (cx + 155, 330),
        (cx + 85, 315),
        (cx - 140, 650),
        (cx - 70, 665),
    ]

    blades = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bld_draw = ImageDraw.Draw(blades)

    # Draw Blade B (Violet)
    bld_draw.polygon(blade_b, fill=(147, 51, 234, 255))
    # Bevel highlight on Blade B
    bld_draw.line([(cx + 155, 330), (cx - 70, 665)], fill=(216, 180, 254, 220), width=5)

    # Draw Blade A (Cyan)
    bld_draw.polygon(blade_a, fill=(14, 165, 233, 255))
    # Bevel highlight on Blade A
    bld_draw.line([(cx - 155, 330), (cx + 70, 665)], fill=(186, 230, 253, 240), width=5)

    # Diamond / Core Intersection Highlight
    core_pts = [
        (cx, 460),
        (cx + 42, 490),
        (cx, 520),
        (cx - 42, 490),
    ]
    bld_draw.polygon(core_pts, fill=(240, 249, 255, 255))
    img.alpha_composite(blades)

    # 7. Foreground Element: The Verified Wisdom Crest / Quill Checkmark
    # Glowing white-cyan checkmark representing RastNevis precision + XWise verified shield
    crest = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(crest)

    # Checkmark drop shadow
    c_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cs_draw = ImageDraw.Draw(c_shadow)
    chk_poly = [
        (cx - 95, 515),
        (cx - 25, 585),
        (cx + 105, 435),
        (cx + 125, 455),
        (cx - 25, 630),
        (cx - 115, 538),
    ]
    cs_draw.polygon([(x, y + 6) for x, y in chk_poly], fill=(0, 0, 0, 190))
    c_shadow = c_shadow.filter(ImageFilter.GaussianBlur(10))
    img.alpha_composite(c_shadow)

    # Pure white checkmark with rounded thick lines
    c_draw.polygon(chk_poly, fill=(255, 255, 255, 255))
    # Subtle cyan edge tint
    c_draw.line([(cx - 95, 515), (cx - 25, 585)], fill=(255, 255, 255, 255), width=8)
    c_draw.line([(cx - 25, 585), (cx + 105, 435)], fill=(255, 255, 255, 255), width=8)
    img.alpha_composite(crest)

    # 8. Subtle Glass Specular Reflection on top half of the squircle
    refl_mask = Image.new("L", (size, size), 0)
    rm_draw = ImageDraw.Draw(refl_mask)
    rm_draw.rounded_rectangle(box, radius=radius, fill=255)

    refl = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rf_draw = ImageDraw.Draw(refl)
    rf_draw.ellipse((margin - 40, margin - 60, size - margin + 40, int(size * 0.44)), fill=(255, 255, 255, 18))
    refl = refl.filter(ImageFilter.GaussianBlur(16))

    # Composite specular reflection safely
    img.alpha_composite(refl)

    return img

def main():
    print("Building Pro XWise Blocker v3.5.0 Logo...")
    master = draw_pro_icon(1024)

    # 128x128
    icon128 = master.resize((128, 128), Image.Resampling.LANCZOS)
    icon128.save("icons/icon128.png", "PNG", optimize=True)
    print("Generated icons/icon128.png")

    # 48x48
    icon48 = master.resize((48, 48), Image.Resampling.LANCZOS)
    icon48.save("icons/icon48.png", "PNG", optimize=True)
    print("Generated icons/icon48.png")

    # 16x16 with sharpness
    icon16 = master.resize((16, 16), Image.Resampling.LANCZOS)
    icon16 = icon16.filter(ImageFilter.SHARPEN)
    icon16.save("icons/icon16.png", "PNG", optimize=True)
    print("Generated icons/icon16.png")

if __name__ == "__main__":
    main()
