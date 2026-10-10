#!/usr/bin/env python3
"""Synthesize the small UI sound-effect set used by the animation (no external assets).

Usage: ~/.local/share/kokoro-venv/bin/python tools/sfx.py
Writes public/sfx/<name>.wav (48 kHz mono, peak about -6 dBFS; mixed quietly in Remotion).
"""
import os

import numpy as np
import soundfile as sf

SR = 48000
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "sfx")
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, attack=0.004, decay=0.08):
    x = np.arange(n) / SR
    a = np.clip(x / attack, 0, 1)
    return a * np.exp(-x / decay)


def lowpass(x, cutoff):
    # one-pole low-pass, good enough for soft UI sounds
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def norm(x, peak=0.5):
    x = x - np.mean(x)
    m = np.max(np.abs(x)) or 1
    fade = np.ones_like(x)
    k = min(len(x), int(SR * 0.01))
    fade[-k:] = np.linspace(1, 0, k)
    return (x / m * peak * fade).astype(np.float32)


def click():
    n = int(SR * 0.05)
    x = highpass(rng.standard_normal(n), 1800) * env(n, 0.0005, 0.006)
    x += 0.6 * np.sin(2 * np.pi * 1400 * t(0.05)) * env(n, 0.0005, 0.01)
    return norm(x, 0.55)


def type_key():
    n = int(SR * 0.04)
    x = highpass(rng.standard_normal(n), 2500) * env(n, 0.0003, 0.004)
    x += 0.3 * np.sin(2 * np.pi * 300 * t(0.04)) * env(n, 0.0005, 0.008)
    return norm(x, 0.35)


def pop():
    d = 0.12
    f = np.linspace(520, 880, int(SR * d))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(len(ph), 0.002, 0.035)
    return norm(x, 0.4)


def tick():
    d = 0.08
    x = np.sin(2 * np.pi * 2093 * t(d)) * env(int(SR * d), 0.001, 0.018)
    x += 0.4 * np.sin(2 * np.pi * 3136 * t(d)) * env(int(SR * d), 0.001, 0.01)
    return norm(x, 0.35)


def whoosh():
    d = 0.7
    n = int(SR * d)
    noise = rng.standard_normal(n)
    # sweep a band by blending two low-passes over time
    lo = lowpass(noise, 600)
    hi = lowpass(noise, 3500)
    s = np.sin(np.linspace(0, np.pi, n))
    x = (lo * (1 - s) + hi * s) * np.sin(np.linspace(0, np.pi, n)) ** 2
    return norm(x, 0.35)


def land():
    d = 0.35
    n = int(SR * d)
    f = np.linspace(140, 70, n)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.09)
    x += 0.25 * highpass(rng.standard_normal(n), 2000) * env(n, 0.0005, 0.01)
    return norm(x, 0.5)


def flip():
    d = 0.22
    a = np.sin(2 * np.pi * 660 * t(d / 2)) * env(int(SR * d / 2), 0.002, 0.04)
    b = np.sin(2 * np.pi * 990 * t(d / 2)) * env(int(SR * d / 2), 0.002, 0.06)
    return norm(np.concatenate([a, b]), 0.4)


def chime():
    d = 1.4
    n = int(SR * d)
    x = sum(w * np.sin(2 * np.pi * f * t(d)) for f, w in [(523.25, 1), (783.99, 0.6), (1046.5, 0.35)])
    return norm(x * env(n, 0.01, 0.45), 0.35)


def alert():
    d = 0.5
    n = int(SR * d)
    x = (np.sin(2 * np.pi * 311 * t(d)) + 0.7 * np.sin(2 * np.pi * 330 * t(d))) * env(n, 0.005, 0.18)
    return norm(x, 0.45)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [("click", click), ("type", type_key), ("pop", pop), ("tick", tick), ("whoosh", whoosh),
                     ("land", land), ("flip", flip), ("chime", chime), ("alert", alert)]:
        sf.write(os.path.join(OUT, f"{name}.wav"), fn(), SR, subtype="PCM_16")
        print(name)


if __name__ == "__main__":
    main()
