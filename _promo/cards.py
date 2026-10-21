# -*- coding: utf-8 -*-
"""生成宣传片标题卡与字幕条（纯 Pillow，无外部素材依赖）。

输出到 docs/promo/media/_cards/：
  card-intro.png  card-perm.png  card-plan.png  card-surfaces.png  card-outro.png
  cap-1.png  cap-2.png   （1920x1080 透明叠加层，底部字幕）
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "promo", "media", "_cards")
OUT = os.path.abspath(OUT)
os.makedirs(OUT, exist_ok=True)

BG = (13, 17, 23)
INK = (233, 238, 245)
MUTED = (139, 152, 168)
AMBER = (255, 180, 84)
TEAL = (127, 211, 200)
GRID = (26, 33, 43)

LATIN_B = "C:/Windows/Fonts/segoeuib.ttf"
LATIN_R = "C:/Windows/Fonts/segoeui.ttf"
CJK_B = "C:/Windows/Fonts/msyhbd.ttc"
CJK_R = "C:/Windows/Fonts/msyh.ttc"
MONO = "C:/Windows/Fonts/consola.ttf"


def has_cjk(text):
    return any("\u4e00" <= ch <= "\u9fff" for ch in text)


def font(size, bold=False, text=""):
    path = CJK_B if (bold and has_cjk(text)) else CJK_R if has_cjk(text) else (LATIN_B if bold else LATIN_R)
    return ImageFont.truetype(path, size)


def backdrop():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for x in range(0, W, 60):
        d.line([(x, 0), (x, H)], fill=GRID, width=1)
    for y in range(0, H, 60):
        d.line([(0, y), (W, y)], fill=GRID, width=1)
    # 左下角渐亮，避免整屏死平
    glow = Image.new("L", (W, H), 0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-500, H - 500, 900, H + 400], fill=46)
    img = Image.composite(Image.new("RGB", (W, H), (30, 42, 56)), img, glow)
    return img


def wrap(draw, text, f, max_width):
    lines, line = [], ""
    for word in text.split(" "):
        probe = (line + " " + word).strip()
        if draw.textlength(probe, font=f) <= max_width:
            line = probe
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def title_card(name, kicker, headline, sub, foot, accent=AMBER, mono_foot=False):
    img = backdrop()
    d = ImageDraw.Draw(img)
    x0 = 200

    f_kick = font(28, bold=True, text=kicker)
    d.text((x0, 300), kicker.upper(), font=f_kick, fill=accent)

    f_head = font(88, bold=True, text=headline)
    y = 356
    for line in wrap(d, headline, f_head, 1500)[:3]:
        d.text((x0, y), line, font=f_head, fill=INK)
        y += 108

    if sub:
        f_sub = font(36, text=sub)
        y += 26
        for line in wrap(d, sub, f_sub, 1420)[:3]:
            d.text((x0, y), line, font=f_sub, fill=MUTED)
            y += 52

    if foot:
        f_foot = ImageFont.truetype(MONO, 26) if mono_foot else font(26, text=foot)
        d.text((x0, H - 200), foot, font=f_foot, fill=TEAL if mono_foot else MUTED)

    d.rectangle([x0 - 60, 300, x0 - 44, 300 + 260], fill=accent)
    img.save(os.path.join(OUT, name))
    print("card:", name)


def caption(name, text, sub=None):
    """透明字幕条：给实拍片段用，压在画面左下。"""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font(40, bold=True, text=text)
    pad_x, pad_y = 34, 24
    box_w = int(max(d.textlength(text, font=f), 600)) + pad_x * 2
    box_h = 78 + (46 if sub else 0)
    x, y = 96, H - 210
    d.rounded_rectangle([x, y, x + box_w, y + box_h], radius=16, fill=(10, 14, 20, 214))
    d.rectangle([x, y, x + 5, y + box_h], fill=AMBER + (255,))
    d.text((x + pad_x, y + pad_y), text, font=f, fill=INK + (255,))
    if sub:
        f2 = font(26, text=sub)
        d.text((x + pad_x, y + pad_y + 52), sub, font=f2, fill=MUTED + (255,))
    img.save(os.path.join(OUT, name))
    print("caption:", name)


title_card(
    "card-intro.png",
    "local-first ai coding agent",
    "DeepSeekCode",
    "Runs in your terminal. Serves a Web UI and an HTTP/WebSocket API from the same local runtime.",
    "dscode  ·  npm install -g @deepseekcode/cli",
    mono_foot=True,
)
title_card(
    "card-perm.png",
    "permission layer",
    "Every tool call asks first",
    "Scopes system > project > user > local > session. ask / deny policies, timeout means deny.",
    "在终端里跑，文件与命令的每一步都要过权限层",
    accent=TEAL,
)
title_card(
    "card-plan.png",
    "plan mode",
    "Read-only until you approve",
    "The checklist is genuinely read-only — nothing executes while the loop is in plan mode.",
    "计划模式真的只读：批准之前一行都不会执行",
)
title_card(
    "card-surfaces.png",
    "one runtime",
    "Terminal, Web UI, API",
    "One local process. Any OpenAI-compatible model. No vendor lock-in, nothing leaves your machine.",
    "同一份运行时，三种入口；模型可换，代码不出本机",
    accent=TEAL,
)
title_card(
    "card-outro.png",
    "get started",
    "npm install -g @deepseekcode/cli",
    "Then run dscode. Windows · macOS · Linux, prebuilt binaries for x64 and ARM64.",
    "deepseekcode.github.io/deepseekwork",
    mono_foot=False,
)

caption("cap-1.png", "Describe the task — the agent reads, plans, edits", "它读文件、调工具、给出 diff，全程可见")
caption("cap-2.png", "Approvals, tool calls and diffs stay in the transcript", "每一次调用都留痕，可以回看、可以改")
print("done ->", OUT)
