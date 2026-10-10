#!/usr/bin/env python3
"""Render review stills per beat and tile them into 2x2 contact sheets.

Usage (system python3 with Pillow, from the animation project root):
  python3 tools/stills.py <ticket> --comp <composition-id> [--chapters 0,1,2] [--beats 1.3,2.1] [--fracs 0.2,0.55,0.9]

Frame math mirrors src/<ticket>/timeline.ts: chapter card (2.6 s) before each chapter > 0,
then per beat 0.35 s lead-in + audio + pause (timing.json "pause", default 0.8 s).
Writes out/stills/<beat>_<frac>.png and out/sheets/sheet<N>.png, and prints the sheet paths.
"""
import argparse
import json
import math
import os
import subprocess
import sys

from PIL import Image

FPS = 60
LEAD = round(0.35 * FPS)
CARD = round(2.6 * FPS)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def frames(ticket, chapters, beats, fracs):
    timing = json.load(open(os.path.join(ROOT, "src", ticket, "timing.json")))
    f, last, out = 0, -1, []
    for bid, v in timing.items():
        ch = int(bid.split(".")[0])
        if ch != last and ch > 0:
            f += CARD
        last = ch
        audio = math.ceil(v["seconds"] * FPS)
        if (not beats or bid in beats) and (not chapters or ch in chapters):
            out += [(bid, fr, f + LEAD + int(audio * fr)) for fr in fracs]
        f += LEAD + audio + round(v.get("pause", 0.8) * FPS)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ticket")
    ap.add_argument("--comp", required=True)
    ap.add_argument("--chapters", default="")
    ap.add_argument("--beats", default="")
    ap.add_argument("--fracs", default="0.2,0.55,0.9")
    a = ap.parse_args()
    chapters = [int(x) for x in a.chapters.split(",") if x]
    beats = {x for x in a.beats.split(",") if x}
    fracs = [float(x) for x in a.fracs.split(",")]
    sd, hd = os.path.join(ROOT, "out", "stills"), os.path.join(ROOT, "out", "sheets")
    os.makedirs(sd, exist_ok=True)
    os.makedirs(hd, exist_ok=True)
    # Frames are always counted over the full timeline: use the full composition.
    todo = [(bid, fr, n, os.path.join(sd, f"{bid}_{fr}.png")) for bid, fr, n in frames(a.ticket, chapters, beats, fracs)]
    job = os.path.join(ROOT, "out", "still_job.json")
    json.dump({"comp": a.comp, "shots": [{"frame": n, "out": p} for _, _, n, p in todo]}, open(job, "w"))
    r = subprocess.run(["node", "tools/still_batch.mjs", job], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-1500:], file=sys.stderr)
    shots = [p for *_, p in todo if os.path.exists(p)]
    for i in range(0, len(shots), 4):
        sheet = Image.new("RGB", (1920, 1080))
        for j, p in enumerate(shots[i:i + 4]):
            sheet.paste(Image.open(p).resize((960, 540)), ((j % 2) * 960, (j // 2) * 540))
        out = os.path.join(hd, f"sheet{i // 4}.png")
        sheet.save(out)
        print(out, "<-", ", ".join(os.path.basename(s)[:-4] for s in shots[i:i + 4]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
