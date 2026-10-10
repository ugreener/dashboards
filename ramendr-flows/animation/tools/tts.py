#!/usr/bin/env python3
"""Generate per-beat narration audio with Kokoro (local, offline) and a timing file.

Usage:
  ~/.local/share/kokoro-venv/bin/python tools/tts.py virtdr-292 [--chapters 0,1,2] [--voice af_heart]

Writes public/audio/<ticket>/<beat-id>.wav (git-ignored, regenerable) and
src/<ticket>/timing.json (committed) with each beat's audio duration.
"""
import argparse
import json
import os
import re
import sys

import soundfile as sf
import yaml
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MODELS = os.path.expanduser("~/.local/share/kokoro-models")
DEFAULT_PAUSE = 0.8  # seconds of silence after a beat unless beats.yaml sets pause_after

# Exact-token replacements applied before generic rules (order matters: longest first).
SPOKEN = {
    "volumereplicationgroups.ramendr.openshift.io/pvc-vr-protection": "volume replication groups, ramen D R dot openshift dot I O, slash P V C V R protection",
    "ocp-4.22-rhdr-dell": "O C P four twenty-two R H D R Dell",
    "clusters/dell-s4/workloads": "clusters, dell S four, workloads",
    "experimental-scheduling-disable": "experimental scheduling disable",
    "powerstore-vrc-15m": "powerstore V R C fifteen M",
    "pvc-vr-protection": "P V C V R protection",
    "dell-vm-placement": "dell V M placement",
    "dell-vm-workload-spoke-0": "dell V M workload spoke zero",
    "dell-vm-workload-spoke-1": "dell V M workload spoke one",
    "dell-vm-workload": "dell V M workload",
    "dell-vm-drpc": "dell V M D R P C",
    "dr-policy-15m": "D R policy fifteen M",
    "hammerdb-rhel9": "hammer D B R H E L nine",
    "ramen-metadata": "ramen metadata",
    "openshift-gitops": "openshift git ops",
    "powerstore-sc": "powerstore S C",
    "gitops-vms": "git ops V M S",
    "acm-placement": "A C M placement",
    "ramendr-postgresql.service": "ramen D R Postgres service",
    "ramendr-dr-hammerdb.service": "ramen D R Hammer D B service",
    "skip-reconcile": "skip reconcile",
    "drprotection": "D R protection",
    "PostgreSQL": "Postgres",
    "HammerDB": "Hammer D B",
    "TPC-C": "T P C C",
    "RHEL": "R H E L",
    "VSA-A": "V S A A",
    "VSA-B": "V S A B",
    "edge36": "edge thirty-six",
    "edge95": "edge ninety-five",
    "edge97": "edge ninety-seven",
    "spoke-0": "spoke zero",
    "spoke-1": "spoke one",
    "worker-2": "worker two",
    "gRPC": "G R P C",
    "NVMe": "N V M E",
    "libvirt": "lib virt",
    "PausedIOError": "Paused I O Error",
    "csi-addons": "C S I addons",
    "S3": "S three",
    "Ramen": "Ramen",
    "Argo CD": "Argo C D",
    "ACM's": "A C M's",
    "pvcSelector": "P V C selector",
    "OpenShift 4.22": "OpenShift four twenty-two",
    "MinIO": "min I O",
}
NO_SPLIT = {"OpenShift", "PowerStore", "GitOps"}
ACRONYMS = {"DRPC", "VRG", "VRGs", "PVC", "PVCs", "PV", "PVs", "VMI", "VM", "VMs",
             "UTC", "RPO", "ACM", "CSI", "TCP", "OS", "API", "DR", "YAML", "ID", "OCP", "CDI", "SSH"}


def split_camel(word: str) -> str:
    # ApplicationSet -> Application Set, DRPlacementControl -> D R Placement Control
    m = re.match(r"^([A-Z]{2,})([A-Z][a-z].*)$", word)
    if m:
        return " ".join(m.group(1)) + " " + split_camel(m.group(2))
    if re.search(r"[a-z][A-Z]", word):
        return re.sub(r"(?<=[a-z])(?=[A-Z])", " ", word)
    return word


ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = {2: "twenty", 3: "thirty", 4: "forty", 5: "fifty"}


def num_words(n: int) -> str:
    if n < 20:
        return ONES[n]
    t, o = divmod(n, 10)
    return TENS[t] + ("" if o == 0 else "-" + ONES[o])


def time_words(m: re.Match) -> str:
    h, mi, s = int(m.group(1)), int(m.group(2)), m.group(3)
    minute = "hundred" if mi == 0 else ("oh " + ONES[mi] if mi < 10 else num_words(mi))
    out = f"{num_words(h)} {minute}"
    if s:
        out += f" and {num_words(int(s))} seconds"
    return out


def speakable(text: str) -> str:
    t = " ".join(text.split())
    t = re.sub(r"\ba (RHEL|VRG|VM|PVC|S3)\b", r"an \1", t)
    t = re.sub(r"\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b", time_words, t)
    for k in sorted(SPOKEN, key=len, reverse=True):
        t = re.sub(r"(?<![\w-])" + re.escape(k) + r"(?![\w-])", SPOKEN[k], t)
    words = []
    for w in re.split(r"(\s+)", t):
        core = w.strip(".,;:!?")
        if core in ACRONYMS:
            plural = core.endswith("s") and core[:-1] in ACRONYMS
            spoken = " ".join(core[:-1]) + "s" if plural else " ".join(core)
            w = w.replace(core, spoken)
        elif core in NO_SPLIT:
            pass
        elif re.fullmatch(r"[A-Za-z]+", core):
            w = w.replace(core, split_camel(core))
        words.append(w)
    return "".join(words)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("ticket")
    ap.add_argument("--chapters", default="")
    ap.add_argument("--beats", default="", help="comma-separated beat ids to (re)generate only")
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--dry-run", action="store_true", help="print speakable text only")
    ap.add_argument("--timing-only", action="store_true", help="refresh pause_after values without regenerating audio")
    a = ap.parse_args()

    beats = yaml.safe_load(open(os.path.join(ROOT, a.ticket, "beats.yaml")))["beats"]
    chapters = {c.strip() for c in a.chapters.split(",") if c.strip()}
    if chapters:
        beats = [b for b in beats if str(b["id"]).split(".")[0] in chapters]
    only = {x.strip() for x in a.beats.split(",") if x.strip()}
    if only:
        beats = [b for b in beats if str(b["id"]) in only]

    if a.dry_run:
        for b in beats:
            print(f"[{b['id']}] {speakable(b['narration'])}\n")
        return 0

    kokoro = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
    out_dir = os.path.join(ROOT, "public", "audio", a.ticket)
    os.makedirs(out_dir, exist_ok=True)
    timing_path = os.path.join(ROOT, "src", a.ticket, "timing.json")
    timing = json.load(open(timing_path)) if os.path.exists(timing_path) else {}

    if a.timing_only:
        for b in beats:
            bid = str(b["id"])
            if bid in timing:
                timing[bid]["pause"] = float(b.get("pause_after", DEFAULT_PAUSE))
        beats = []

    for b in beats:
        bid = str(b["id"])
        samples, rate = kokoro.create(speakable(b["narration"]), voice=a.voice, speed=a.speed, lang="en-us")
        sf.write(os.path.join(out_dir, f"{bid}.wav"), samples, rate)
        timing[bid] = {"seconds": round(len(samples) / rate, 3), "voice": a.voice, "pause": float(b.get("pause_after", DEFAULT_PAUSE))}
        print(f"{bid}: {timing[bid]['seconds']}s", flush=True)

    os.makedirs(os.path.dirname(timing_path), exist_ok=True)
    with open(timing_path, "w") as f:
        json.dump(dict(sorted(timing.items(), key=lambda kv: [int(x) for x in kv[0].split(".")])), f, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
