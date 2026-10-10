import {Easing, interpolate} from 'remotion';

export const FPS = 60;

const ease = Easing.bezier(0.22, 1, 0.36, 1);

/** 0..1 progress between frames a and b with a smooth ease-out. */
export const prog = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/** In-out progress, for camera moves. */
export const progIO = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Cue helper: frame at a fraction of the beat duration. */
export const at = (dur: number, frac: number) => Math.round(dur * frac);

export const sec = (s: number) => Math.round(s * FPS);
