import React from 'react';
import {Easing} from 'remotion';
import {C, KIND, mono, sans} from '../theme';

export type Box = {x: number; y: number; w: number; h: number};

/** Cluster or array region with a header strip. */
export const Region: React.FC<{
  b: Box;
  title: string;
  sub?: string;
  color: string;
  opacity?: number;
  dashed?: boolean;
  glow?: number;
  small?: boolean;
}> = ({b, title, sub, color, opacity = 1, dashed, glow = 0, small}) => (
  <div
    style={{
      position: 'absolute',
      left: b.x,
      top: b.y,
      width: b.w,
      height: b.h,
      opacity,
      borderRadius: small ? 14 : 22,
      border: `${small ? 2 : 2.5}px ${dashed ? 'dashed' : 'solid'} ${color}${small ? '88' : 'aa'}`,
      background: small ? `${color}0d` : `linear-gradient(160deg, ${color}14, ${C.bg2}cc 40%)`,
      boxShadow: `0 0 ${20 + glow * 60}px ${color}${glow > 0 ? '66' : '18'}`,
      transform: `scale(${0.96 + 0.04 * opacity})`,
      transformOrigin: 'center',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: small ? 16 : 24,
        top: small ? -15 : -22,
        padding: small ? '3px 12px' : '6px 16px',
        borderRadius: 999,
        background: C.bg,
        border: `2px solid ${color}`,
        color,
        fontFamily: small ? mono : sans,
        fontWeight: 700,
        fontSize: small ? 21 : 28,
        letterSpacing: small ? 0 : 0.5,
        whiteSpace: 'nowrap',
      }}
    >
      {title}
      {sub ? <span style={{color: C.dim, fontWeight: 500, marginLeft: 12, fontSize: small ? 18 : 22}}>{sub}</span> : null}
    </div>
  </div>
);

const springOut = Easing.out(Easing.back(1.7));

/** A Kubernetes resource card. `detail` (0..1) fades the secondary lines (hidden in wide shots). `focus` dims unfocused cards. */
export const Card: React.FC<{
  x: number;
  y: number;
  w?: number;
  kind: string;
  name: string;
  lines?: React.ReactNode[];
  appear?: number;
  hl?: number;
  focus?: number;
  detail?: number;
  color?: string;
  badge?: React.ReactNode;
  exit?: number;
}> = ({x, y, w = 300, kind, name, lines = [], appear = 1, hl = 0, focus = 1, detail = 1, color, badge, exit = 0}) => {
  const col = color ?? KIND[kind] ?? C.blue;
  if (appear <= 0 || exit >= 1) return null;
  const sp = springOut(Math.min(1, appear));
  const kfs = Math.min(15, (w - 40) / (kind.length * 0.78));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        opacity: Math.min(1, appear * 1.6) * (0.3 + 0.7 * focus) * (1 - exit),
        transform: `translateY(${(1 - sp) * 26 + exit * 20}px) scale(${0.9 + 0.1 * sp + hl * 0.035 - exit * 0.08})`,
        transformOrigin: 'center',
        borderRadius: 14,
        background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})`,
        border: `2px solid ${hl > 0 ? col : C.border}`,
        borderLeft: `7px solid ${col}`,
        boxShadow: hl > 0 ? `0 0 ${34 * hl}px ${col}aa, 0 10px 28px #000a` : '0 10px 28px #0009',
        padding: '13px 16px',
        fontFamily: sans,
        filter: focus < 1 ? `saturate(${0.4 + 0.6 * focus})` : undefined,
      }}
    >
      <div style={{fontSize: kfs, letterSpacing: 1.3 * (kfs / 15), textTransform: 'uppercase', color: col, fontWeight: 700, whiteSpace: 'nowrap'}}>{kind}</div>
      <div style={{fontFamily: mono, fontSize: 22, lineHeight: 1.25, color: C.text, fontWeight: 600, marginTop: 5, overflowWrap: 'break-word'}}>{name}</div>
      {lines.length ? (
        <div style={{opacity: detail}}>
          {lines.map((l, i) => (
            <div key={i} style={{fontFamily: mono, fontSize: 17, color: C.dim, marginTop: 6, overflowWrap: 'break-word'}}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
      {badge ? <div style={{position: 'absolute', right: -10, top: -16}}>{badge}</div> : null}
    </div>
  );
};

export const Pill: React.FC<{text: string; color: string; appear?: number; size?: number}> = ({
  text,
  color,
  appear = 1,
  size = 14,
}) => (
  <span
    style={{
      display: 'inline-block',
      opacity: appear,
      transform: `scale(${0.6 + 0.4 * appear})`,
      padding: '3px 10px',
      borderRadius: 999,
      background: `${color}22`,
      border: `1.5px solid ${color}`,
      color,
      fontFamily: mono,
      fontSize: size,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </span>
);

/** Small status/condition row: name = value with color. */
export const Cond: React.FC<{k: string; v: string; ok?: boolean | null; flash?: number}> = ({k, v, ok, flash = 0}) => {
  const col = ok === true ? C.green : ok === false ? C.red : C.amber;
  return (
    <span style={{color: C.dim}}>
      {k}: <span style={{color: col, fontWeight: 600, textShadow: flash ? `0 0 ${12 * flash}px ${col}` : undefined}}>{v}</span>
    </span>
  );
};
