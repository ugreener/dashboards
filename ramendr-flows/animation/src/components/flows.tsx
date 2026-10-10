import React from 'react';
import {C, mono} from '../theme';

export type P = [number, number];

/** Cubic path between two points, bending vertically or horizontally. */
export const pathD = (a: P, b: P, bend: 'v' | 'h' | 'straight' = 'v') => {
  if (bend === 'straight') return `M${a[0]},${a[1]} L${b[0]},${b[1]}`;
  if (bend === 'v') {
    const my = (a[1] + b[1]) / 2;
    return `M${a[0]},${a[1]} C${a[0]},${my} ${b[0]},${my} ${b[0]},${b[1]}`;
  }
  const mx = (a[0] + b[0]) / 2;
  return `M${a[0]},${a[1]} C${mx},${a[1]} ${mx},${b[1]} ${b[0]},${b[1]}`;
};

/** Point on the same cubic at t (0..1). */
export const pointAt = (a: P, b: P, t: number, bend: 'v' | 'h' | 'straight' = 'v'): P => {
  if (bend === 'straight') return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const c1: P = bend === 'v' ? [a[0], (a[1] + b[1]) / 2] : [(a[0] + b[0]) / 2, a[1]];
  const c2: P = bend === 'v' ? [b[0], (a[1] + b[1]) / 2] : [(a[0] + b[0]) / 2, b[1]];
  const u = 1 - t;
  const f = (i: 0 | 1) => u * u * u * a[i] + 3 * u * u * t * c1[i] + 3 * u * t * t * c2[i] + t * t * t * b[i];
  return [f(0), f(1)];
};

export type FlowKind = 'ref' | 'delivery' | 'observe' | 'data' | 'reconcile';
const FLOW_COLOR: Record<FlowKind, string> = {
  ref: C.dim,
  delivery: C.cyan,
  observe: C.purple,
  data: C.orange,
  reconcile: C.green,
};

/**
 * An SVG connection drawn with progress `draw` (0..1), optional label,
 * and travelling packets when `flowT` is provided (seconds-like phase).
 */
export const Flow: React.FC<{
  a: P;
  b: P;
  kind?: FlowKind;
  bend?: 'v' | 'h' | 'straight';
  draw?: number;
  label?: string;
  labelAt?: number;
  flowT?: number;
  packets?: number;
  width?: number;
  opacity?: number;
  color?: string;
  labelDx?: number;
  labelDy?: number;
}> = ({a, b, kind = 'ref', bend = 'v', draw = 1, label, labelAt = 0.5, flowT, packets = 3, width = 3, opacity = 1, color, labelDx = 0, labelDy = 0}) => {
  if (draw <= 0) return null;
  const col = color ?? FLOW_COLOR[kind];
  const d = pathD(a, b, bend);
  const dashed = kind === 'observe' || kind === 'ref';
  const end = pointAt(a, b, Math.min(draw, 1), bend);
  const before = pointAt(a, b, Math.max(Math.min(draw, 1) - 0.02, 0), bend);
  const ang = (Math.atan2(end[1] - before[1], end[0] - before[0]) * 180) / Math.PI;
  const lp = pointAt(a, b, labelAt, bend);
  return (
    <g opacity={opacity}>
      <path d={d} stroke={col} strokeOpacity={0.18} strokeWidth={width + 8} fill="none" pathLength={1} strokeDasharray={`${draw} 1`} />
      <path
        d={d}
        stroke={col}
        strokeWidth={width}
        fill="none"
        pathLength={1}
        strokeDasharray={dashed ? undefined : `${draw} 1`}
        strokeLinecap="round"
        style={dashed ? {strokeDasharray: '0.012 0.012', clipPath: undefined} : undefined}
        opacity={dashed ? Math.min(1, draw * 1.5) : 1}
      />
      <polygon points="0,-8 16,0 0,8" fill={col} transform={`translate(${end[0]},${end[1]}) rotate(${ang})`} opacity={draw > 0.05 ? 1 : 0} />
      {flowT !== undefined && draw >= 1
        ? Array.from({length: packets}).map((_, i) => {
            const t = (flowT + i / packets) % 1;
            const p = pointAt(a, b, t, bend);
            return <circle key={i} cx={p[0]} cy={p[1]} r={7} fill={col} opacity={Math.sin(t * Math.PI)} style={{filter: `drop-shadow(0 0 8px ${col})`}} />;
          })
        : null}
      {label && draw > labelAt ? (
        <g transform={`translate(${lp[0] + labelDx},${lp[1] + labelDy})`}>
          <rect x={-label.length * 6.3 - 14} y={-19} width={label.length * 12.6 + 28} height={38} rx={19} fill={C.bg} stroke={col} strokeWidth={1.8} />
          <text x={0} y={7} textAnchor="middle" fill={col} fontFamily={mono} fontSize={20} fontWeight={600}>
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** A ManifestWork "envelope" travelling along a path. */
export const Envelope: React.FC<{a: P; b: P; t: number; bend?: 'v' | 'h' | 'straight'; label?: string; color?: string}> = ({
  a,
  b,
  t,
  bend = 'v',
  label = 'ManifestWork',
  color = C.cyan,
}) => {
  if (t <= 0 || t >= 1) return null;
  const p = pointAt(a, b, t, bend);
  const o = Math.min(1, t * 8, (1 - t) * 8);
  return (
    <g transform={`translate(${p[0]},${p[1]})`} opacity={o}>
      <rect x={-34} y={-24} width={68} height={48} rx={6} fill={C.panel2} stroke={color} strokeWidth={2.5} style={{filter: `drop-shadow(0 0 12px ${color})`}} />
      <polyline points="-34,-24 0,4 34,-24" fill="none" stroke={color} strokeWidth={2.5} />
      <text y={50} textAnchor="middle" fill={color} fontFamily={mono} fontSize={20} fontWeight={600} stroke={C.bg} strokeWidth={5} paintOrder="stroke">
        {label}
      </text>
    </g>
  );
};
