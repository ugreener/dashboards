#!/usr/bin/env python3
"""Check for a newer kokoro-onnx package or Kokoro model release and canary-test it.

Usage:
  ~/.local/share/kokoro-venv/bin/python tools/check_tts.py --ticket <ticket>
  ~/.local/share/kokoro-venv/bin/python tools/check_tts.py --ticket <ticket> --canary --adopt
  ~/.local/share/kokoro-venv/bin/python tools/check_tts.py --ticket <ticket> --background-model
  ~/.local/share/kokoro-venv/bin/python tools/check_tts.py --status

Every check outcome exits 0, so an available or failed update never blocks a
video. Only usage errors exit non-zero.

A package update is small and is canaried synchronously with the pinned model.
A model update needs a 326 MB download, which can take a long time, so it is
deferred by default and can run detached with --background-model. The video
always continues on the pinned stack. A review or fail is recorded in
tools/tts-pin.json and is not retested until the package, model release or
model asset size changes.
"""
import argparse
import contextlib
import fcntl
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import soundfile as sf
import yaml

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PIN_PATH = HERE / "tts-pin.json"
CACHE = Path.home() / ".cache" / "kokoro-canary"
BASE_PY = Path.home() / ".local" / "share" / "kokoro-venv" / "bin" / "python"
BASE_MODELS = Path.home() / ".local" / "share" / "kokoro-models"
PYPI_URL = "https://pypi.org/pypi/kokoro-onnx/json"
GH_RELEASES = "https://api.github.com/repos/thewh1teagle/kokoro-onnx/releases?per_page=30"
MODEL_PREFIX = "model-files-"
MODEL_FILE = "kokoro-v1.0.onnx"
VOICES_FILE = "voices-v1.0.bin"
USER_AGENT = "flow-animation-tts-check"
SAMPLE_RATE = 24000
DOWNLOAD_WORKERS = 8
PART_MIN_BYTES = 8 * 1024 * 1024


def utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_pin():
    with open(PIN_PATH) as f:
        return json.load(f)


def save_pin(pin):
    with open(PIN_PATH, "w") as f:
        json.dump(pin, f, indent=2)
        f.write("\n")


@contextlib.contextmanager
def pin_lock():
    CACHE.mkdir(parents=True, exist_ok=True)
    with open(CACHE / "pin.lock", "w") as handle:
        fcntl.flock(handle, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(handle, fcntl.LOCK_UN)


def http_json(url, timeout):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.load(response)


def latest_package(timeout):
    data = http_json(PYPI_URL, timeout)
    version = data.get("info", {}).get("version")
    if not version:
        raise RuntimeError("PyPI response has no info.version")
    return version


def version_key(tag):
    raw = tag[len(MODEL_PREFIX):].lstrip("v")
    return tuple(int(p) if p.isdigit() else 0 for p in re.split(r"[.-]", raw))


def latest_model(timeout):
    releases = http_json(GH_RELEASES, timeout)
    best = None
    for release in releases:
        tag = release.get("tag_name", "")
        if not tag.startswith(MODEL_PREFIX):
            continue
        assets = {a["name"]: a["size"] for a in release.get("assets", [])}
        if MODEL_FILE not in assets or VOICES_FILE not in assets:
            continue
        key = version_key(tag)
        if best is None or key > best[0]:
            best = (key, tag, assets)
    if best is None:
        raise RuntimeError("no model-files release contains the expected assets")
    return best[1], best[2]


def run(cmd, timeout=600, check=True, cwd=ROOT):
    cp = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True, timeout=timeout)
    if check and cp.returncode != 0:
        tail = (cp.stderr or cp.stdout or "").strip()[-1200:]
        raise RuntimeError(f"{' '.join(str(c) for c in cmd)} failed ({cp.returncode}): {tail}")
    return cp


def _download_range(url, start, end, path, timeout):
    headers = {"User-Agent": USER_AGENT, "Range": f"bytes={start}-{end}"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        if response.status != 206:
            raise RuntimeError(f"range request returned {response.status}")
        with open(path, "wb") as out:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
    expected = end - start + 1
    if path.stat().st_size != expected:
        raise RuntimeError(f"{path.name} size {path.stat().st_size} != {expected}")


def download_parallel(url, dest, expected_size, timeout):
    legacy = dest.with_suffix(dest.suffix + ".part")
    if legacy.exists() and not dest.exists():
        legacy.unlink()
    workers = min(DOWNLOAD_WORKERS, max(1, expected_size // PART_MIN_BYTES))
    span = math.ceil(expected_size / workers)
    chunks = []
    for index in range(workers):
        start = index * span
        end = min(start + span - 1, expected_size - 1)
        if start > end:
            break
        path = dest.with_suffix(dest.suffix + f".part{index}")
        chunks.append((index, start, end, path))
    print(f"downloading {dest.name} in {len(chunks)} parallel ranges", flush=True)
    with ThreadPoolExecutor(max_workers=len(chunks)) as pool:
        pending = []
        for _, start, end, path in chunks:
            expected = end - start + 1
            if path.exists() and path.stat().st_size == expected:
                continue
            pending.append(pool.submit(_download_range, url, start, end, path, timeout))
        for done, future in enumerate(as_completed(pending), 1):
            future.result()
            print(f"  {dest.name}: {done}/{len(pending)} ranges", flush=True)
    temp = dest.with_suffix(dest.suffix + ".part")
    with open(temp, "wb") as out:
        for _, _, _, path in chunks:
            with open(path, "rb") as part:
                shutil.copyfileobj(part, out)
    if temp.stat().st_size != expected_size:
        raise RuntimeError(f"{dest.name} size {temp.stat().st_size} != expected {expected_size}")
    temp.replace(dest)
    for _, _, _, path in chunks:
        path.unlink(missing_ok=True)


def download(url, dest, expected_size=None, timeout=900):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if expected_size and expected_size > PART_MIN_BYTES * 2:
        download_parallel(url, dest, expected_size, timeout)
        return
    partial = dest.with_suffix(dest.suffix + ".part")
    existing = partial.stat().st_size if partial.exists() else 0
    headers = {"User-Agent": USER_AGENT}
    if existing:
        headers["Range"] = f"bytes={existing}-"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as response, open(partial, "ab" if existing and response.status == 206 else "wb") as out:
        if not existing or response.status != 206:
            existing = 0
        else:
            print(f"  resuming {dest.name} at {existing // (1024 * 1024)} MB", flush=True)
        total = existing + int(response.headers.get("Content-Length") or 0)
        done = existing
        next_mark = ((done // (50 * 1024 * 1024)) + 1) * 50 * 1024 * 1024
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)
            done += len(chunk)
            if done >= next_mark:
                suffix = f" / {total // (1024 * 1024)}" if total else ""
                print(f"  {dest.name}: {done // (1024 * 1024)}{suffix} MB", flush=True)
                next_mark += 50 * 1024 * 1024
    if expected_size and partial.stat().st_size != expected_size:
        size = partial.stat().st_size
        raise RuntimeError(f"{dest.name} size {size} != expected {expected_size}")
    partial.replace(dest)


def ensure_venv(version):
    venv = CACHE / f"venv-{version}"
    python = venv / "bin" / "python"
    if python.exists():
        got = run([str(python), "-c", "import importlib.metadata as m; print(m.version('kokoro-onnx'))"]).stdout.strip()
        if got == version:
            return python
        shutil.rmtree(venv)
    venv.parent.mkdir(parents=True, exist_ok=True)
    run(["uv", "venv", "-p", "3.12", str(venv)], timeout=180)
    run(["uv", "pip", "install", "--python", str(python), f"kokoro-onnx=={version}", "soundfile", "pyyaml"], timeout=600)
    return python


def ensure_models(tag, assets):
    dest = CACHE / "models" / tag
    dest.mkdir(parents=True, exist_ok=True)
    for name in (MODEL_FILE, VOICES_FILE):
        expected = assets.get(name)
        path = dest / name
        if path.exists() and expected is not None and path.stat().st_size == expected:
            continue
        url = f"https://github.com/thewh1teagle/kokoro-onnx/releases/download/{tag}/{name}"
        print(f"downloading {tag}/{name}", flush=True)
        download(url, path, expected_size=expected)
    return dest


def mixed_tokens(text):
    return sum(
        1
        for token in re.findall(r"[A-Za-z0-9][A-Za-z0-9./_-]*", str(text))
        if re.search(r"\d", token) and re.search(r"[A-Za-z]", token)
    )


def select_beats(ticket):
    path = ROOT / ticket / "beats.yaml"
    data = yaml.safe_load(open(path))["beats"]
    if not data:
        raise RuntimeError(f"{path} has no beats")
    picks = (
        data[0],
        max(data, key=lambda b: len(str(b.get("narration", "")))),
        max(data, key=lambda b: mixed_tokens(b.get("narration", ""))),
    )
    ids = []
    for beat in picks:
        beat_id = str(beat["id"])
        if beat_id not in ids:
            ids.append(beat_id)
    return ids


def run_tts(python, ticket, beats, models_dir, out_dir, timing_out, env_out, phonemes_out, release):
    cmd = [
        str(python),
        "tools/tts.py",
        ticket,
        "--beats",
        ",".join(beats),
        "--models-dir",
        str(models_dir),
        "--out-dir",
        str(out_dir),
        "--timing-out",
        str(timing_out),
        "--env-out",
        str(env_out),
        "--phonemes-out",
        str(phonemes_out),
        "--model-release",
        release,
        "--allow-stack-change",
    ]
    return run(cmd, check=False)


def read_wav(path):
    info = sf.info(str(path))
    data, rate = sf.read(str(path), dtype="float32", always_2d=True)
    mono = data[:, 0] if data.size else np.zeros(1, dtype="float32")
    rms = float(np.sqrt(np.mean(np.square(mono))))
    peak = float(np.max(np.abs(mono)))
    clipped = float(np.mean(np.abs(mono) >= 0.999))
    return {
        "rate": info.samplerate,
        "channels": info.channels,
        "frames": info.frames,
        "seconds": info.frames / info.samplerate,
        "rms": rms,
        "peak": peak,
        "clipped": clipped,
        "sha256": sha256_file(path),
    }


def db(value):
    return 20.0 * math.log10(max(value, 1e-12))


def canary(ticket, pin, candidate, timeout):
    beats = select_beats(ticket)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    run_dir = CACHE / "runs" / f"{stamp}-{candidate['package']}-{candidate['model_release']}"
    base_dir, cand_dir, fresh_dir = run_dir / "base", run_dir / "cand", run_dir / "fresh"
    for directory in (base_dir, cand_dir, fresh_dir):
        directory.mkdir(parents=True, exist_ok=True)

    base_model = BASE_MODELS / MODEL_FILE
    if not base_model.exists():
        raise RuntimeError(f"baseline model missing at {base_model}")
    if sha256_file(base_model) != pin["model_sha256"]:
        raise RuntimeError("baseline model hash does not match tools/tts-pin.json")
    installed = run(
        [str(BASE_PY), "-c", "import importlib.metadata as m; print(m.version('kokoro-onnx'))"]
    ).stdout.strip()
    if installed != pin["package"]:
        raise RuntimeError(f"baseline venv has kokoro-onnx {installed}, pin says {pin['package']}")

    print(f"canary beats: {', '.join(beats)}", flush=True)
    cp = run_tts(
        BASE_PY, ticket, beats, BASE_MODELS, base_dir,
        run_dir / "base-timing.json", run_dir / "base-env.json",
        run_dir / "base-phonemes.json", pin["model_release"],
    )
    if cp.returncode != 0:
        raise RuntimeError(f"baseline tts.py failed: {(cp.stderr or '').strip()[-800:]}")

    cand_py = ensure_venv(candidate["package"]) if candidate["package_changed"] else BASE_PY
    cand_models = ensure_models(candidate["model_release"], candidate["assets"]) if candidate["model_changed"] else BASE_MODELS
    cp = run_tts(
        cand_py, ticket, beats, cand_models, cand_dir,
        run_dir / "cand-timing.json", run_dir / "cand-env.json",
        run_dir / "cand-phonemes.json", candidate["model_release"],
    )
    if cp.returncode != 0:
        return {
            "kind": "model" if candidate["model_changed"] else "package",
            "verdict": "FAIL",
            "reason": f"candidate tts.py failed: {(cp.stderr or '').strip()[-500:]}",
            "candidate": candidate,
            "beats": beats,
            "run_dir": str(run_dir),
            "rows": [],
            "phoneme_changes": {},
            "max_frame_delta": 0.0,
            "max_duration_pct": 0.0,
            "max_rms_delta_db": 0.0,
            "byte_identical": False,
            "hard_failures": ["candidate tts.py failed"],
            "fresh_process_ok": False,
        }

    cp = run_tts(
        cand_py, ticket, [beats[0]], cand_models, fresh_dir,
        run_dir / "fresh-timing.json", run_dir / "fresh-env.json",
        run_dir / "fresh-phonemes.json", candidate["model_release"],
    )
    fresh_ok = False
    if cp.returncode == 0:
        fresh_ok = sha256_file(fresh_dir / f"{beats[0]}.wav") == sha256_file(cand_dir / f"{beats[0]}.wav")

    base_phon = json.loads((run_dir / "base-phonemes.json").read_text())
    cand_phon = json.loads((run_dir / "cand-phonemes.json").read_text())
    phoneme_changes = {}
    for beat_id in beats:
        base_value = base_phon.get(beat_id, {}).get("phonemes")
        cand_value = cand_phon.get(beat_id, {}).get("phonemes")
        if base_value != cand_value:
            phoneme_changes[beat_id] = {"base": base_value, "candidate": cand_value}

    rows = []
    hard = []
    for beat_id in beats:
        base_wav = base_dir / f"{beat_id}.wav"
        cand_wav = cand_dir / f"{beat_id}.wav"
        if not base_wav.exists() or not cand_wav.exists():
            hard.append(f"{beat_id}: missing WAV")
            continue
        base = read_wav(base_wav)
        cand = read_wav(cand_wav)
        row = {
            "beat": beat_id,
            "base": base,
            "candidate": cand,
            "frame_delta": (cand["seconds"] - base["seconds"]) * 60.0,
            "duration_pct": abs(cand["seconds"] - base["seconds"]) / base["seconds"] * 100.0,
            "rms_delta_db": abs(db(cand["rms"]) - db(base["rms"])),
            "byte_identical": base["sha256"] == cand["sha256"],
        }
        rows.append(row)

        if cand["rate"] != SAMPLE_RATE:
            hard.append(f"{beat_id}: sample rate {cand['rate']} != {SAMPLE_RATE}")
        if cand["channels"] != 1:
            hard.append(f"{beat_id}: {cand['channels']} channels != 1")
        if cand["peak"] < 1e-4 or cand["rms"] < 0.002:
            hard.append(f"{beat_id}: near-silent output")
        if cand["clipped"] > 0.001:
            hard.append(f"{beat_id}: clipped samples above 0.1 percent")
        if base["seconds"] <= 0:
            hard.append(f"{beat_id}: baseline has zero duration")
            continue
        if not 0.5 <= cand["seconds"] / base["seconds"] <= 2.0:
            hard.append(f"{beat_id}: duration ratio {cand['seconds'] / base['seconds']:.2f} outside 0.5 to 2.0")

    if not fresh_ok:
        hard.append(f"{beats[0]}: fresh-process output is not byte-identical")

    max_frame = max((abs(r["frame_delta"]) for r in rows), default=0.0)
    max_pct = max((r["duration_pct"] for r in rows), default=0.0)
    max_rms = max((r["rms_delta_db"] for r in rows), default=0.0)
    byte_identical = bool(rows) and all(r["byte_identical"] for r in rows)

    if hard:
        verdict = "FAIL"
        reason = hard[0]
    elif byte_identical:
        verdict = "PASS"
        reason = "all three beats byte-identical"
    elif candidate["model_changed"]:
        if not phoneme_changes and max_pct <= 5.0 and max_rms <= 1.5:
            verdict = "PASS"
            reason = f"phonemes unchanged, max {max_pct:.1f} percent duration, {max_rms:.2f} dB"
        else:
            verdict = "REVIEW"
            if phoneme_changes:
                reason = f"phoneme change on {', '.join(sorted(phoneme_changes))}"
            else:
                reason = f"max {max_pct:.1f} percent duration, {max_rms:.2f} dB"
    else:
        if not phoneme_changes and max_frame <= 1.0 and max_rms <= 0.5:
            verdict = "PASS"
            reason = f"phonemes unchanged, max {max_frame:.2f} frames, {max_rms:.2f} dB"
        else:
            verdict = "REVIEW"
            if phoneme_changes:
                reason = f"phoneme change on {', '.join(sorted(phoneme_changes))}"
            else:
                reason = f"max {max_frame:.2f} frames, {max_rms:.2f} dB"

    return {
        "kind": "model" if candidate["model_changed"] else "package",
        "verdict": verdict,
        "reason": reason,
        "candidate": candidate,
        "beats": beats,
        "run_dir": str(run_dir),
        "rows": rows,
        "phoneme_changes": phoneme_changes,
        "max_frame_delta": max_frame,
        "max_duration_pct": max_pct,
        "max_rms_delta_db": max_rms,
        "byte_identical": byte_identical,
        "hard_failures": hard,
        "fresh_process_ok": fresh_ok,
    }


def candidate_hashes(candidate, pin):
    models = CACHE / "models" / candidate["model_release"] if candidate["model_changed"] else BASE_MODELS
    return {
        "package": candidate["package"],
        "model_release": candidate["model_release"],
        "model_file": MODEL_FILE,
        "model_bytes": (models / MODEL_FILE).stat().st_size,
        "model_sha256": sha256_file(models / MODEL_FILE),
        "voices_file": VOICES_FILE,
        "voices_bytes": (models / VOICES_FILE).stat().st_size,
        "voices_sha256": sha256_file(models / VOICES_FILE),
        "voice": pin["voice"],
        "speed": pin["speed"],
        "lang": pin["lang"],
        "sample_rate": SAMPLE_RATE,
    }


def record(pin, result):
    candidate = candidate_hashes(result["candidate"], pin)
    result["candidate"] = candidate
    key = f"{candidate['package']}|{candidate['model_release']}|{candidate['model_bytes']}"
    with pin_lock():
        current = load_pin()
        current.setdefault("decisions", {})[key] = {
            "result": result["verdict"].lower(),
            "reason": result["reason"],
            "date": utc_now(),
        }
        current["last_check"] = {
            "package": candidate["package"],
            "model_release": candidate["model_release"],
            "result": result["verdict"].lower(),
            "reason": result["reason"],
            "date": utc_now(),
        }
        current["last_canary"] = {
            "kind": result.get("kind", "package"),
            "candidate": candidate,
            "beats": result.get("beats", []),
            "verdict": result["verdict"],
            "reason": result["reason"],
            "date": utc_now(),
            "run_dir": result["run_dir"],
        }
        save_pin(current)
    pin.clear()
    pin.update(current)


def adopt(pin, force=False):
    with pin_lock():
        current = load_pin()
        last = current.get("last_canary")
        if not last:
            raise RuntimeError("no canary recorded; run --canary first")
        if last.get("adopted") and not force:
            raise RuntimeError("the last canary was already adopted; run a new canary")
        if last.get("verdict") != "PASS" and not force:
            raise RuntimeError("the last canary did not pass; use --force to adopt anyway")
        candidate = last["candidate"]
        kind = last.get("kind", "package")

        if kind == "model":
            if candidate["package"] != current["package"] and not force:
                raise RuntimeError(
                    f"model was canaried under kokoro-onnx {candidate['package']}, "
                    f"pin is {current['package']}; retest before adopting"
                )
        else:
            if candidate["model_release"] != current["model_release"] and not force:
                raise RuntimeError(
                    f"package was canaried with {candidate['model_release']}, "
                    f"pin is {current['model_release']}; retest before adopting"
                )

        if kind == "package" and candidate["package"] != current["package"]:
            run(
                ["uv", "pip", "install", "--python", str(BASE_PY),
                 f"kokoro-onnx=={candidate['package']}", "soundfile", "pyyaml"],
                timeout=600,
            )
            installed = run(
                [str(BASE_PY), "-c", "import importlib.metadata as m; print(m.version('kokoro-onnx'))"]
            ).stdout.strip()
            if installed != candidate["package"]:
                raise RuntimeError(f"base venv installed {installed}, expected {candidate['package']}")
            print(f"INSTALLED PACKAGE: {candidate['package']}")

        if kind == "model" and candidate["model_release"] != current["model_release"]:
            source = CACHE / "models" / candidate["model_release"]
            backup = CACHE / "models" / f"previous-{current['model_release']}"
            backup.mkdir(parents=True, exist_ok=True)
            BASE_MODELS.mkdir(parents=True, exist_ok=True)
            staged = []
            for name in (MODEL_FILE, VOICES_FILE):
                target = BASE_MODELS / name
                temp = target.with_suffix(target.suffix + ".new")
                shutil.copy2(source / name, temp)
                staged.append((name, temp))
            for key, (_, temp) in zip(("model_sha256", "voices_sha256"), staged):
                if sha256_file(temp) != candidate[key]:
                    for _, item in staged:
                        item.unlink(missing_ok=True)
                    raise RuntimeError(f"staged {temp.name} does not match the adopted hash")
            for name, temp in staged:
                target = BASE_MODELS / name
                if target.exists() and not (backup / name).exists():
                    shutil.copy2(target, backup / name)
                os.replace(temp, target)
            print(f"INSTALLED MODEL: {candidate['model_release']} (previous kept at {backup})")

        if kind == "model":
            for key in ("model_release", "model_file", "model_bytes", "model_sha256",
                        "voices_file", "voices_bytes", "voices_sha256"):
                current[key] = candidate[key]
        else:
            current["package"] = candidate["package"]
        current["adopted_utc"] = utc_now()
        current["last_adopted"] = last
        current["last_canary"] = dict(last, adopted=True, adopted_utc=utc_now())
        save_pin(current)
    pin.clear()
    pin.update(current)
    return candidate


def backfill(pin, ticket=None):
    tickets = [ticket] if ticket else [p.parent.name for p in sorted(ROOT.glob("src/*/timing.json"))]
    written = []
    for name in tickets:
        out = ROOT / "src" / name / "tts-env.json"
        if out.exists():
            continue
        env = {
            "package": pin["package"],
            "model_release": pin["model_release"],
            "model_file": pin["model_file"],
            "model_bytes": pin["model_bytes"],
            "model_sha256": pin["model_sha256"],
            "voices_file": pin["voices_file"],
            "voices_bytes": pin["voices_bytes"],
            "voices_sha256": pin["voices_sha256"],
            "voice": pin["voice"],
            "speed": pin["speed"],
            "lang": pin["lang"],
            "sample_rate": pin["sample_rate"],
            "backfilled": True,
        }
        out.write_text(json.dumps(env, indent=2) + "\n")
        written.append(name)
    return written


def verify(ticket, models_dir=BASE_MODELS, pin=None):
    env_path = ROOT / "src" / ticket / "tts-env.json"
    timing_path = ROOT / "src" / ticket / "timing.json"
    if not env_path.exists():
        return [f"missing {env_path}"]
    if not timing_path.exists():
        return [f"missing {timing_path}"]
    env = json.loads(env_path.read_text())
    problems = []

    if pin:
        for key in ("package", "model_release", "model_sha256", "voices_sha256"):
            if env.get(key) != pin.get(key):
                problems.append(f"recorded {key} {env.get(key)} does not match the pin {pin.get(key)}")

    installed = run(
        [str(BASE_PY), "-c", "import importlib.metadata as m; print(m.version('kokoro-onnx'))"]
    ).stdout.strip()
    if installed != env.get("package"):
        problems.append(f"installed package {installed} != recorded {env.get('package')}")

    for key, path in (("model_sha256", models_dir / MODEL_FILE), ("voices_sha256", models_dir / VOICES_FILE)):
        if not path.exists():
            problems.append(f"missing {path}")
        elif env.get(key) and sha256_file(path) != env[key]:
            problems.append(f"{path.name} hash does not match {env_path.name}")

    timing = json.loads(timing_path.read_text())
    for beat_id, entry in timing.items():
        wav = ROOT / "public" / "audio" / ticket / f"{beat_id}.wav"
        if not wav.exists():
            problems.append(f"{beat_id}: missing WAV")
            continue
        info = sf.info(str(wav))
        wav_seconds = info.frames / info.samplerate
        timing_seconds = float(entry["seconds"])
        if abs(wav_seconds - timing_seconds) > 1.5 / 60:
            problems.append(f"{beat_id}: WAV {wav_seconds:.3f}s vs timing {timing_seconds:.3f}s")
    return problems


def print_report(result):
    print(f"CANARY {result['verdict']}: {result['reason']}")
    for row in result["rows"]:
        mark = "identical" if row["byte_identical"] else (
            f"{row['frame_delta']:+.2f} frames, {row['duration_pct']:.1f} percent, "
            f"{row['rms_delta_db']:.2f} dB"
        )
        print(f"  beat {row['beat']}: {row['base']['seconds']:.3f}s -> {row['candidate']['seconds']:.3f}s ({mark})")
    if result["phoneme_changes"]:
        for beat_id, change in sorted(result["phoneme_changes"].items()):
            print(f"  phonemes {beat_id}: {change['base']} -> {change['candidate']}")
    print(f"  fresh-process determinism: {'OK' if result['fresh_process_ok'] else 'FAILED'}")
    print(f"  run dir: {result['run_dir']}")


def launch_background(ticket):
    status = CACHE / "background.pid"
    if status.exists():
        try:
            pid = int(status.read_text().strip())
            os.kill(pid, 0)
            print(f"MODEL_CANARY_BACKGROUND: already running (pid {pid})")
            return
        except (OSError, ValueError):
            pass
    log = CACHE / f"background-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log"
    log.parent.mkdir(parents=True, exist_ok=True)
    cmd = [sys.executable, str(HERE / "check_tts.py"), "--ticket", ticket,
           "--canary", "--download-model", "--model-only"]
    with open(log, "w") as out:
        proc = subprocess.Popen(cmd, cwd=str(ROOT), stdout=out, stderr=subprocess.STDOUT, start_new_session=True)
    status.write_text(str(proc.pid))
    print(f"MODEL_CANARY_BACKGROUND: {log} (pid {proc.pid})")


def handle(kind, pin, candidate, args):
    key = f"{candidate['package']}|{candidate['model_release']}|{candidate['model_bytes']}"
    cached = pin.get("decisions", {}).get(key)
    if cached:
        suffix = " (run --adopt to use it)" if cached["result"] == "pass" else ""
        print(f"{kind.upper()}_CACHED_DECISION: {cached['result']} for {key} ({cached['reason']}){suffix}")
        return pin
    changes = []
    if candidate["package_changed"]:
        changes.append(f"package {pin['package']} -> {candidate['package']}")
    if candidate["model_changed"]:
        changes.append(f"model {pin['model_release']} -> {candidate['model_release']}")
    print(f"{kind.upper()}_UPDATE_AVAILABLE: {', '.join(changes)}")
    if not args.canary:
        return pin
    result = canary(args.ticket, pin, candidate, args.timeout)
    record(pin, result)
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print_report(result)
    if result["verdict"] == "PASS" and args.adopt:
        adopted = adopt(pin)
        print(f"ADOPTED: kokoro-onnx {adopted['package']}, {adopted['model_release']}")
        return load_pin()
    if result["verdict"] == "PASS":
        print("Run with --adopt to use this version for the new video.")
    else:
        print(f"KEPT: kokoro-onnx {pin['package']}, {pin['model_release']}")
    return pin


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ticket", default="", help="ticket whose beats.yaml provides the canary beats")
    ap.add_argument("--canary", action="store_true", help="test an available update")
    ap.add_argument("--model-only", action="store_true", help="skip the package canary")
    ap.add_argument("--download-model", action="store_true", help="allow the 326 MB model download")
    ap.add_argument("--background-model", action="store_true", help="start the model canary detached")
    ap.add_argument("--adopt", action="store_true", help="adopt the last passing canary")
    ap.add_argument("--force", action="store_true", help="adopt even when the last canary did not pass")
    ap.add_argument("--status", action="store_true", help="print the current pin")
    ap.add_argument("--backfill", action="store_true", help="write tts-env.json from the pin for existing tickets")
    ap.add_argument("--verify", action="store_true", help="check a ticket's WAVs and installed stack against tts-env.json")
    ap.add_argument("--new", action="store_true", help="with --verify, also require the recorded stack to match the pin")
    ap.add_argument("--models-dir", default="", help="model directory for --verify (default ~/.local/share/kokoro-models)")
    ap.add_argument("--json", action="store_true", help="print a JSON result")
    ap.add_argument("--timeout", type=float, default=5.0, help="metadata request timeout in seconds")
    args = ap.parse_args()

    pin = load_pin()

    if args.status:
        print(json.dumps(pin, indent=2))
        return 0

    if args.backfill:
        written = backfill(pin, args.ticket or None)
        if written:
            print(f"BACKFILLED: {', '.join(written)}")
        else:
            print("BACKFILLED: nothing to do")
        return 0

    if args.verify:
        if not args.ticket:
            print("ERROR: --verify needs --ticket")
            return 2
        problems = verify(
            args.ticket,
            Path(args.models_dir).expanduser() if args.models_dir else BASE_MODELS,
            pin if args.new else None,
        )
        if problems:
            print("VERIFY FAIL")
            for problem in problems:
                print(f"  {problem}")
            return 1
        print("VERIFY OK")
        return 0

    if args.adopt and not args.canary:
        try:
            candidate = adopt(pin, args.force)
        except RuntimeError as exc:
            print(f"ERROR: {exc}")
            return 1
        print(f"ADOPTED: kokoro-onnx {candidate['package']}, {candidate['model_release']}")
        return 0

    try:
        latest_pkg = latest_package(args.timeout)
        latest_tag, assets = latest_model(args.timeout)
    except Exception as exc:
        pin["last_check"] = {"result": "check_failed", "reason": str(exc), "date": utc_now()}
        save_pin(pin)
        print(f"CHECK_FAILED: {exc}")
        return 0

    package_changed = latest_pkg != pin["package"]
    model_changed = latest_tag != pin["model_release"]

    if not package_changed and not model_changed:
        if args.json:
            print(json.dumps({"status": "up_to_date", "package": latest_pkg, "model": latest_tag}))
        else:
            print(f"UP_TO_DATE: kokoro-onnx {latest_pkg}, {latest_tag}")
        return 0

    if args.canary and not args.ticket:
        print("ERROR: --canary needs --ticket")
        return 2

    if package_changed and not args.model_only:
        candidate = {
            "package": latest_pkg,
            "model_release": pin["model_release"],
            "model_bytes": pin["model_bytes"],
            "assets": assets,
            "package_changed": True,
            "model_changed": False,
        }
        try:
            pin = handle("package", pin, candidate, args)
        except Exception as exc:
            print(f"CANARY ERROR: {exc}")
            return 0

    if model_changed:
        model_key = f"{pin['package']}|{latest_tag}|{assets.get(MODEL_FILE, 0)}"
        cached = pin.get("decisions", {}).get(model_key)
        if cached:
            suffix = " (run --adopt to use it)" if cached["result"] == "pass" else ""
            print(f"MODEL_CACHED_DECISION: {cached['result']} for {model_key} ({cached['reason']}){suffix}")
            return 0
        if not args.download_model:
            print(f"MODEL_UPDATE_DEFERRED: {pin['model_release']} -> {latest_tag} needs a 326 MB download")
            if args.background_model and args.ticket:
                launch_background(args.ticket)
            return 0
        candidate = {
            "package": pin["package"],
            "model_release": latest_tag,
            "model_bytes": assets.get(MODEL_FILE, 0),
            "assets": assets,
            "package_changed": False,
            "model_changed": True,
        }
        try:
            pin = handle("model", pin, candidate, args)
        except Exception as exc:
            print(f"CANARY ERROR: {exc}")
            return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
