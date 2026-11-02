"""Draw a clean, labelled mock preview for dsh-session-notify's README."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1040, 600
BG = (245, 246, 248)
CARD = (255, 255, 255)
BORDER = (226, 228, 232)
TEXT = (32, 34, 38)
MUTED = (138, 143, 152)
ACCENT = (59, 108, 240)
RED = (229, 72, 77)
SOFT = (240, 242, 245)

FONT_PATH = "C:/Windows/Fonts/msyh.ttc"


def font(size):
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except Exception:
        return ImageFont.load_default()


f_title = font(19)
f_body = font(15)
f_small = font(13)
f_tiny = font(12)
f_badge = font(13)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# ---------------------------------------------------------------- sidebar mock
sx, sy, sw, sh = 28, 28, 330, 520
d.rounded_rectangle([sx, sy, sx + sw, sy + sh], radius=14, fill=CARD, outline=BORDER)

d.text((sx + 22, sy + 20), "工作区", font=f_title, fill=TEXT)

projects = [
    ("项目 A", False, [], True),
    ("项目 B", False, [], False),
    ("项目 C", True, ["会话 1", "会话 2"], None),
]
y = sy + 58
for name, expanded, children, _ in projects:
    # folder icon
    d.rounded_rectangle([sx + 22, y + 3, sx + 38, y + 17], radius=3, fill=(255, 214, 102))
    d.rectangle([sx + 24, y + 1, sx + 32, y + 4], fill=(255, 214, 102))
    d.text((sx + 48, y), name, font=f_body, fill=ACCENT if expanded else TEXT)
    y += 28
    if expanded and children:
        for child in children:
            d.text((sx + 70, y), child, font=f_small, fill=MUTED)
            y += 24

# footer action with badge
fy = sy + sh - 58
d.line([sx + 14, fy - 12, sx + sw - 14, fy - 12], fill=BORDER, width=1)
# bell
bx, by = sx + 24, fy + 6
d.arc([bx, by, bx + 20, by + 18], start=200, end=340, fill=TEXT, width=2)
d.polygon([(bx, by + 11), (bx + 20, by + 11), (bx + 13, by + 1), (bx + 7, by + 1)], outline=TEXT)
d.ellipse([bx + 7, by + 17, bx + 13, by + 22], fill=TEXT)
# badge
d.ellipse([bx + 13, by - 6, bx + 31, by + 12], fill=RED)
d.text((bx + 18, by - 4), "3", font=f_badge, fill=CARD)
d.text((bx + 44, fy + 4), "3 个会话已完成", font=f_body, fill=TEXT)
d.text((bx + 44, fy + 24), "按项目分组 · 点击直达", font=f_tiny, fill=MUTED)

# ---------------------------------------------------------------- right column
rx = sx + sw + 40
# notification card
nx, ny, nw, nh = rx, 64, 380, 92
d.rounded_rectangle([nx, ny, nx + nw, ny + nh], radius=12, fill=CARD, outline=BORDER)
d.rounded_rectangle([nx + 16, ny + 20, nx + 52, ny + 56], radius=8, fill=(234, 240, 255))
d.ellipse([nx + 30, ny + 30, nx + 38, ny + 38], fill=ACCENT)
d.text((nx + 68, ny + 18), "会话已完成", font=f_title, fill=TEXT)
d.text((nx + 68, ny + 46), "项目 C · 会话 1", font=f_small, fill=MUTED)
d.text((nx + 68, ny + 66), "点击通知可跳到该会话", font=f_tiny, fill=MUTED)

# grouped list card
lx, ly, lw, lh = rx, 184, 380, 200
d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=12, fill=CARD, outline=BORDER)
d.text((lx + 18, ly + 16), "已完成的会话", font=f_title, fill=TEXT)
right = lx + lw - 18
rows = [("项目 C", 2), ("项目 B", 1)]
ry = ly + 56
for name, count in rows:
    d.text((lx + 18, ry), name, font=f_body, fill=TEXT)
    cw = d.textlength(str(count), font=f_small) + 16
    d.rounded_rectangle([right - cw, ry - 2, right, ry + 20], radius=10, fill=(234, 240, 255))
    d.text((right - cw + 8, ry + 1), str(count), font=f_small, fill=ACCENT)
    ry += 38
d.text((lx + 18, ly + lh - 44), "点进会话即自动清除该条未读", font=f_tiny, fill=MUTED)

# caption
d.text((rx, 420), "示意图 — 实际外观随主题/字号变化", font=f_small, fill=MUTED)
d.text((rx, 444), "真实效果：刷新页面后，后台会话跑完即出现角标 + 系统通知", font=f_tiny, fill=MUTED)

out = "D:/work/dsh-plugins/dsh-session-notify/docs/preview-v1.png"
import os
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out, "PNG", optimize=True)
print("saved", out, os.path.getsize(out), "bytes")
