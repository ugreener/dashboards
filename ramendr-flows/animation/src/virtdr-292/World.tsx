import React from 'react';
import {interpolate} from 'remotion';
import {C, mono, sans} from '../theme';
import {Card, Cond, Pill, Region} from '../components/primitives';
import {Envelope, Flow, P} from '../components/flows';
import {lerp, prog} from '../lib/anim';

/** Rendering context: which beat we are in and where inside it. */
export type Ctx = {
  order: string[];
  id: string; // current beat id
  f: number; // frame inside the beat's audio window (negative during lead-in)
  dur: number; // audio frames of current beat
  g: number; // global frame (looping motion)
  zoom: number; // current camera zoom (drives card detail)
};

/** Elements the narration is about in each beat; everything else dims. Beats without an entry show everything. */
export const FOCUS: Record<string, string[]> = {
  '2.2': ['vm1', 'pvc1'],
  '2.3': ['git', 'drpc', 'placement', 'appset', 'pd', 'drpolicy'],
  '2.4': ['placement', 'pd', 'ramenHub', 'sched'],
  '2.5': ['appset', 'appsetCtrl', 'pd', 'app1'],
  '2.6': ['app1', 'prop', 'wa1', 'argo1', 'git', 'vm1'],
  '2.7': ['git', 'argo1', 'vm1'],
  '3.2': ['drpc', 'ramenHub', 'vrg1', 'vrg0', 'wa1', 'wa0'],
  '3.3': ['vrg1', 'ramen1', 'pvc1', 'vr1'],
  '3.4': ['vr1', 'csi1', 'volB', 'volA'],
  '3.5': ['vrg1', 'pvc1', 'minio'],
  '4.1': ['volB', 'volA'],
  '4.2': ['drpc', 'pd'],
  '4.3': ['volB', 'volA'],
  '4.4': ['drpc', 'pd'],
  '4.5': ['volB', 'volA'],
  '5.1': ['volB', 'volA'],
  '5.2': ['drpc', 'pd'],
  '5.3': ['drpc', 'pd'],
  '5.4': ['drpc', 'ramenHub'],
  '5.5': ['drpc', 'ramenHub'],
  '6.1': ['drpc', 'ramenHub', 'vrg0'],
  '6.2': ['drpc', 'ramenHub'],
  '6.3': ['pd', 'ramenHub', 'appset', 'app1'],
  '6.4': ['drpc', 'ramenHub', 'wa0', 'vrg0'],
  '6.5': ['drpc', 'pd', 'vrg0'],
  '7.1': ['vrg0', 'ramen0', 'minio', 'pvc0'],
  '7.2': ['vrg0', 'pvc0'],
  '7.3': ['vrg0', 'vr0', 'csi0', 'volA'],
  '7.4': ['volA', 'volB'],
  '7.5': ['vrg0', 'vr0'],
  '7.6': ['vrg0', 'pvc0', 'vr0', 'volA'],
  '8.1': ['vm1', 'pvc1', 'volB'],
  '8.2': ['vm1', 'pvc1'],
  '8.3': ['vm1', 'volB', 'volA'],
  '9.1': ['vrg0', 'ramenHub', 'drpc'],
  '9.2': ['pd', 'ramenHub'],
  '9.3': ['drpc', 'pd'],
  '9.4': ['drpc', 'pd'],
  '9.5': ['drpc', 'pd', 'vrg0'],
  '10.1': ['appset', 'appsetCtrl', 'pd', 'app0'],
  '10.2': ['app0', 'prop', 'wa0', 'argo0', 'git'],
  '10.3': ['argo0', 'pvc0'],
  '10.4': ['pvc0', 'volA'],
  '10.5': ['app0', 'argo0', 'pvc0'],
  '11.1': ['vm0', 'pvc0'],
  '11.2': ['vm0'],
  '11.3': ['vm0', 'pvc0', 'volA'],
  '12.1': ['ramenHub', 'vrg1', 'pd', 'wa1'],
  '12.2': ['appset', 'app1', 'prop', 'pd'],
  '12.3': ['argo1', 'vm1', 'pvc1', 'vrg1'],
  '12.4': ['vrg1', 'pvc1'],
  '12.5': ['vrg1', 'vr1', 'csi1', 'pvc1'],
  '12.6': ['vrg1', 'vm1', 'pvc1'],
  '13.1': ['drpc', 'vrg1', 'ramenHub'],
  '13.2': ['drpc', 'pd'],
  '13.3': ['volA', 'volB'],
  '14.1': ['vm0'],
  '14.2': ['vm0'],
  '14.3': ['vm0'],
  '14.4': ['vm0'],
  '15.1': ['volA', 'volB'],
  '15.2': ['vm0'],
};

// ---------------- run state machine ----------------
type Val = string;
const INIT: Record<string, Val> = {
  phase: 'Deployed',
  prog: 'Completed',
  peer: 'True',
  action: '',
  pd: 'S1',
  app1: 'on',
  app0: 'off',
  vm1: 'run',
  vm0: 'none',
  pvc1: 'on',
  pvc0: 'none',
  vrg1: 'Primary',
  vrg0: 'Secondary',
  cdr0: '',
  vr1: 'primary',
  vr0: 'none',
  arr: 'B2A',
};
/** [beat, fraction of beat audio, key, value]: recorded run (and source-traced) state changes, in order. */
export const CH: [string, number, string, Val][] = [
  ['5.4', 0.35, 'action', 'Failover'],
  ['6.1', 0.45, 'prog', 'CheckingFailoverPrerequisites'],
  ['6.1', 0.62, 'phase', 'FailingOver'],
  ['6.1', 0.75, 'peer', 'False'],
  ['6.2', 0.55, 'prog', 'FailingOverToCluster'],
  ['6.3', 0.35, 'pd', 'S1R'],
  ['6.4', 0.75, 'prog', 'WaitingForResourceRestore'],
  ['7.1', 0.12, 'vrg0', 'Primary'],
  ['7.1', 0.7, 'pvc0', 'restored'],
  ['7.2', 0.15, 'cdr0', 'True'],
  ['7.3', 0.25, 'vr0', 'primary'],
  ['7.4', 0.25, 'arr', 'promoted'],
  ['8.2', 0.15, 'vm1', 'paused'],
  ['9.2', 0.35, 'pd', 'S1R+S0'],
  ['9.3', 0.12, 'phase', 'FailedOver'],
  ['9.3', 0.18, 'prog', 'Cleaning Up'],
  ['10.1', 0.62, 'app0', 'on'],
  ['11.1', 0.25, 'vm0', 'run'],
  ['12.1', 0.3, 'vrg1', 'Secondary requested'],
  ['12.1', 0.75, 'pd', 'S0'],
  ['12.2', 0.3, 'app1', 'off'],
  ['12.3', 0.3, 'vm1', 'gone'],
  ['12.3', 0.5, 'pvc1', 'terminating'],
  ['12.5', 0.3, 'vr1', 'secondary'],
  ['12.5', 0.65, 'vr1', 'none'],
  ['12.5', 0.72, 'pvc1', 'gone'],
  ['12.5', 0.85, 'vrg1', 'Secondary'],
  ['13.1', 0.35, 'peer', 'True'],
  ['13.1', 0.4, 'prog', 'Completed'],
  ['13.3', 0.6, 'arr', 'A2B'],
];

export const mk = (c: Ctx) => {
  const bi = c.order.indexOf(c.id);
  const idx = (id: string) => {
    const i = c.order.indexOf(id);
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };
  /** Appearance of an element that debuts in beat `since` at fraction `frac` of that beat. */
  const A = (since: string, frac = 0, len = 0.07) => {
    const si = idx(since);
    if (bi > si) return 1;
    if (bi < si) return 0;
    return prog(c.f, c.dur * frac, c.dur * (frac + len));
  };
  /** Highlight pulse during [a,b] fractions of beat `id`. */
  const H = (id: string, a = 0, b = 1) => {
    if (c.id !== id) return 0;
    const s = c.dur * a;
    const e = c.dur * b;
    return Math.min(prog(c.f, s, s + 20), 1 - prog(c.f, e - 20, e));
  };
  /** Progress 0..1 across [a,b] of beat `id`; 1 after, 0 before. */
  const T = (id: string, a: number, b: number) => {
    const si = idx(id);
    if (bi > si) return 1;
    if (bi < si) return 0;
    return prog(c.f, c.dur * a, c.dur * b);
  };
  const is = (...ids: string[]) => ids.includes(c.id);
  /** Transient element: visible in beat `id`, fades out at the start of the next beat. */
  const K = (id: string) => {
    const si = idx(id);
    if (bi === si) return 1;
    if (bi === si + 1) return 1 - prog(c.f, -20, 25);
    return 0;
  };
  const after = (id: string) => bi >= idx(id);
  const prevId = bi > 0 ? c.order[bi - 1] : null;
  const fOf = (id: string | null, key: string) => {
    const set = id ? FOCUS[id] : undefined;
    return !set || set.includes(key) ? 1 : 0;
  };
  const blend = prog(c.f, -20, 20);
  const F = (key: string) => lerp(fOf(prevId, key), fOf(c.id, key), blend);
  /** Current value of a state key, previous value, and change progress p (0..1 over ~0.7 s). */
  const S = (key: string) => {
    let v = INIT[key];
    let prev = INIT[key];
    let p = 1;
    for (const [b, fr, k, val] of CH) {
      if (k !== key) continue;
      const i = idx(b);
      if (i > bi) break;
      if (i === bi && c.f < c.dur * fr) break;
      prev = v;
      v = val;
      p = i < bi ? 1 : prog(c.f, c.dur * fr, c.dur * fr + 40);
    }
    const flash = p < 1 ? Math.sin(p * Math.PI) : 0;
    return {v, prev, p, flash};
  };
  /** Presence 0..1 of something that exists while the key's value is not in `off`. */
  const pres = (key: string, off: string[]) => {
    const s = S(key);
    const on = !off.includes(s.v);
    const was = !off.includes(s.prev);
    if (on && was) return 1;
    if (on) return s.p;
    if (was) return 1 - s.p;
    return 0;
  };
  return {A, H, T, K, F, S, pres, is, after, bi};
};

// ---- layout (world units, 2400 x 1500) ----
export const L = {
  hub: {x: 380, y: 40, w: 1980, h: 640},
  nsHub: {x: 410, y: 100, w: 1530, h: 440},
  minio: {x: 1990, y: 100, w: 340, h: 200},
  git: {x: 20, y: 140, w: 330},
  s1: {x: 40, y: 750, w: 1140, h: 545},
  s0: {x: 1220, y: 750, w: 1140, h: 545},
  vsaB: {x: 190, y: 1335, w: 840, h: 150},
  vsaA: {x: 1370, y: 1335, w: 840, h: 150},
};
const DX = L.s0.x - L.s1.x;
const W = 300;

const card = {
  drpc: [440, 140] as P,
  placement: [790, 140] as P,
  appset: [1140, 140] as P,
  app1: [1490, 140] as P,
  app0: [1490, 345] as P,
  pd: [790, 345] as P,
  drpolicy: [1995, 340] as P,
};
const sp = (x: number, y: number, s: 0 | 1): P => [x + (s === 0 ? DX : 0), y];
const spoke = {
  vm: (s: 0 | 1) => sp(90, 890, s),
  vrg: (s: 0 | 1) => sp(620, 890, s),
  pvcR: (s: 0 | 1) => sp(90, 1075, s),
  pvcD: (s: 0 | 1) => sp(355, 1075, s),
  vrR: (s: 0 | 1) => sp(620, 1085, s),
  vrD: (s: 0 | 1) => sp(885, 1085, s),
};
const CHIP_X = [70, 330, 590, 880];
const CHIP_W = [240, 240, 270, 250];
const chip = (i: number, s: 0 | 1): P => sp(CHIP_X[i], 772, s);
const chipMid = (i: number, s: 0 | 1, dy = 0): P => [chip(i, s)[0] + CHIP_W[i] / 2, chip(i, s)[1] + dy];
const mid = (p: P, dx = W / 2, dy = 0): P => [p[0] + dx, p[1] + dy];
const HUBCHIP: Record<string, [number, number]> = {ramen: [440, 255], sched: [720, 230], appset: [975, 300], prop: [1300, 290]};
const hubChip = (k: string, dx = 0.5, dy = 0): P => [HUBCHIP[k][0] + HUBCHIP[k][1] * dx, 575 + dy];

/** World-space rectangles per focus key, for the auto camera. */
export const RECT: Record<string, [number, number, number, number]> = (() => {
  const r: Record<string, [number, number, number, number]> = {
    drpc: [440, 140, 300, 250],
    placement: [790, 140, 300, 170],
    appset: [1140, 140, 300, 180],
    app1: [1490, 140, 320, 170],
    app0: [1490, 345, 320, 170],
    pd: [790, 345, 330, 170],
    drpolicy: [1995, 340, 330, 160],
    minio: [1990, 100, 340, 200],
    git: [20, 140, 330, 400],
    ramenHub: [440, 575, 255, 50],
    sched: [720, 575, 230, 50],
    appsetCtrl: [975, 575, 300, 50],
    prop: [1300, 575, 290, 50],
    volB: [L.vsaB.x, L.vsaB.y - 20, L.vsaB.w, L.vsaB.h + 20],
    volA: [L.vsaA.x, L.vsaA.y - 20, L.vsaA.w, L.vsaA.h + 20],
  };
  for (const s of [0, 1] as const) {
    r[`vm${s}`] = [spoke.vm(s)[0], spoke.vm(s)[1], 300, 160];
    r[`vrg${s}`] = [spoke.vrg(s)[0], spoke.vrg(s)[1], 320, 180];
    r[`pvc${s}`] = [spoke.pvcR(s)[0], spoke.pvcR(s)[1], 515, 200];
    r[`vr${s}`] = [spoke.vrR(s)[0], spoke.vrR(s)[1], 515, 170];
    CHIP_X.forEach((x, i) => {
      const k = ['wa', 'ramen', 'csi', 'argo'][i];
      r[`${k}${s}`] = [chip(i, s)[0], chip(i, s)[1], CHIP_W[i], 50];
    });
  }
  return r;
})();

const Chip: React.FC<{p: P; label: string; appear: number; hl?: number; color?: string; off?: boolean; w?: number; focus?: number}> = ({
  p,
  label,
  appear,
  hl = 0,
  color = C.purple,
  off,
  w = 240,
  focus = 1,
}) =>
  appear > 0 ? (
    <div
      style={{
        position: 'absolute',
        left: p[0],
        top: p[1],
        width: w,
        height: 50,
        opacity: Math.min(1, appear * 1.5) * (off ? 0.45 : 1) * (0.3 + 0.7 * focus),
        transform: `scale(${0.9 + 0.1 * appear + hl * 0.04})`,
        borderRadius: 11,
        border: `2px ${off ? 'dashed' : 'solid'} ${hl ? color : `${color}88`}`,
        background: `${color}${hl ? '30' : '14'}`,
        boxShadow: hl ? `0 0 ${30 * hl}px ${color}` : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 12px',
        fontFamily: sans,
        fontSize: 19,
        fontWeight: 600,
        color: off ? C.faint : C.text,
        textDecoration: off ? 'line-through' : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" style={{flex: 'none'}}>
        <path
          fill={color}
          d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9.4 5.5-2-.3a7.6 7.6 0 0 1-.7 1.7l1.2 1.6-1.7 1.7-1.6-1.2c-.5.3-1.1.6-1.7.7l-.3 2h-2.4l-.3-2a7.6 7.6 0 0 1-1.7-.7l-1.6 1.2-1.7-1.7 1.2-1.6a7.6 7.6 0 0 1-.7-1.7l-2-.3v-2.4l2-.3c.2-.6.4-1.2.7-1.7L5.2 6.9l1.7-1.7 1.6 1.2c.5-.3 1.1-.6 1.7-.7l.3-2h2.4l.3 2c.6.2 1.2.4 1.7.7l1.6-1.2 1.7 1.7-1.2 1.6c.3.5.6 1.1.7 1.7l2 .3v2.4Z"
        />
      </svg>
      {label}
    </div>
  ) : null;

const Volume: React.FC<{x: number; y: number; name: string; role: string; appear: number; hl?: number; roleColor: string; focus?: number}> = ({
  x,
  y,
  name,
  role,
  appear,
  hl = 0,
  roleColor,
  focus = 1,
}) =>
  appear > 0 ? (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 360,
        height: 108,
        opacity: Math.min(1, appear * 1.5) * (0.3 + 0.7 * focus),
        borderRadius: 12,
        background: C.panel,
        border: `2px solid ${hl ? C.array : C.border}`,
        boxShadow: hl ? `0 0 ${30 * hl}px ${C.array}` : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 16px',
      }}
    >
      <svg width={36} height={42} viewBox="0 0 34 40" style={{flex: 'none'}}>
        <ellipse cx={17} cy={7} rx={15} ry={6} fill="none" stroke={C.array} strokeWidth={2.5} />
        <path d="M2 7v26c0 3.3 6.7 6 15 6s15-2.7 15-6V7" fill="none" stroke={C.array} strokeWidth={2.5} />
        <path d="M2 20c0 3.3 6.7 6 15 6s15-2.7 15-6" fill="none" stroke={C.array} strokeWidth={1.5} opacity={0.6} />
      </svg>
      <div style={{minWidth: 0}}>
        <div style={{fontFamily: mono, fontSize: 16, color: C.text, overflowWrap: 'anywhere'}}>{name}</div>
        <div style={{marginTop: 6}}>
          <Pill text={role} color={roleColor} size={15} />
        </div>
      </div>
    </div>
  ) : null;

/** VM state badge. */
const vmLine = (v: string) =>
  v === 'paused' ? <Cond k="VMI" v="Paused (PausedIOError)" ok={false} /> : <Cond k="VMI" v="Running" ok />;

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const {A, H, T, K, F, S, pres, is, after} = mk(c);
  const loop = (period: number) => (c.g % period) / period;
  const detail = interpolate(c.zoom, [0.8, 1.0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // ---------- debut schedule (chapters 2 and 3) ----------
  const aCl = A('2.1', 0.0, 0.1);
  const aHub = A('2.1', 0.3, 0.1);
  const aS1 = A('2.1', 0.42, 0.1);
  const aS0 = A('2.1', 0.47, 0.1);
  const aArr = A('2.1', 0.6, 0.1);
  const aLink = T('2.1', 0.78, 0.95);
  const aMinio = A('2.1', 0.34, 0.08);
  const aWork = A('2.2', 0.3, 0.08);
  const aDisks = A('2.2', 0.5, 0.08);
  const aLbl = A('2.2', 0.75, 0.08);
  const aGit = A('2.3', 0.02, 0.06);
  const aNs = A('2.3', 0.32, 0.06);
  const aPl = A('2.3', 0.36, 0.06);
  const aDrpc = A('2.3', 0.42, 0.06);
  const aSet = A('2.3', 0.48, 0.06);
  const aPd = A('2.3', 0.56, 0.06);
  const aPol = A('2.3', 0.64, 0.06);
  const aSched = A('2.4', 0.15, 0.06);
  const aRamenHub = A('2.4', 0.3, 0.06);
  const aSetCtrl = A('2.5', 0.05, 0.06);
  const aApp1 = A('2.5', 0.6, 0.06);
  const aProp = A('2.6', 0.3, 0.06);
  const aSpokeChips = A('2.6', 0.45, 0.06);
  const aVrg = A('3.2', 0.25, 0.08);
  const aFin = A('3.3', 0.3, 0.06);
  const aVr = A('3.3', 0.72, 0.08);
  const aCsi = A('3.4', 0.0, 0.06);
  const aVol = A('3.4', 0.3, 0.08);
  const aCdp = A('3.5', 0.65, 0.06);

  // ---------- run state ----------
  const sPhase = S('phase');
  const sProg = S('prog');
  const sPeer = S('peer');
  const sAct = S('action');
  const sPd = S('pd');
  const sVrg1 = S('vrg1');
  const sVrg0 = S('vrg0');
  const sCdr0 = S('cdr0');
  const sVr1 = S('vr1');
  const sVr0 = S('vr0');
  const sArr = S('arr');
  const sVm1 = S('vm1');
  const pApp1 = pres('app1', ['off']);
  const pApp0 = pres('app0', ['off']);
  const pVm1 = pres('vm1', ['gone']);
  const pVm0 = pres('vm0', ['none']);
  const pPvc1 = pres('pvc1', ['gone']);
  const pPvc0 = pres('pvc0', ['none']);
  const pVr1 = pres('vr1', ['none']);
  const pVr0 = pres('vr0', ['none']);

  const fMinio = F('minio');
  const vsaRoles = (() => {
    if (sArr.v === 'B2A') return {B: ['source', C.green], A: ['replica (read-only)', C.amber]};
    if (sArr.v === 'promoted') return {B: ['read-only after failover', C.amber], A: ['promoted · writable', C.green]};
    return {B: ['destination', C.amber], A: ['source', C.green]};
  })();
  const arrFlash = sArr.flash;

  const pdRows: React.ReactNode[] = [];
  if (sPd.v.startsWith('S1')) pdRows.push(<Pill text={sPd.v.includes('R') ? 'spoke-1 · RetainedForFailover' : 'spoke-1'} color={C.spoke1} size={16} />);
  if (sPd.v.includes('S0')) pdRows.push(<Pill text="spoke-0" color={C.spoke0} size={16} appear={sPd.v === 'S0' ? 1 : S('pd').p} />);

  const drpcLines: React.ReactNode[] = [
    <Cond k="phase" v={sPhase.v} ok={sPhase.v === 'FailingOver' ? null : true} flash={sPhase.flash} />,
    <Cond k="progression" v={sProg.v} ok={sProg.v === 'Completed' ? true : null} flash={sProg.flash} />,
    <Cond k="PeerReady" v={sPeer.v} ok={sPeer.v === 'True'} flash={sPeer.flash} />,
  ];
  if (sAct.v) drpcLines.push(<span style={{color: C.amber, textShadow: sAct.flash ? `0 0 12px ${C.amber}` : undefined}}>action: Failover · failoverCluster: spoke-0</span>);

  const hiDrpc = sPhase.flash + sProg.flash + sPeer.flash + sAct.flash;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 2400, height: 1500}}>
      <svg width={2400} height={1500} style={{position: 'absolute', opacity: 0.35 * aCl}}>
        <defs>
          <pattern id="g" width={40} height={40} patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#1b2430" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width={2400} height={1500} fill="url(#g)" />
      </svg>

      {/* regions */}
      <Region b={L.hub} title="hub" sub="edge36 · ACM · Ramen hub · OpenShift GitOps" color={C.hub} opacity={aHub} />
      <Region b={L.s1} title="spoke-1" sub="edge97 · source in the recorded run" color={C.spoke1} opacity={aS1} />
      <Region b={L.s0} title="spoke-0" sub="edge95 · home cluster · target in the recorded run" color={C.spoke0} opacity={aS0} />
      <Region b={L.vsaB} title="VSA-B" sub="PowerStore · spoke-1 storage" color={C.array} opacity={aArr} small glow={H('7.4', 0.2, 0.8) * 0.6} />
      <Region b={L.vsaA} title="VSA-A" sub="PowerStore · spoke-0 storage" color={C.array} opacity={aArr} small glow={H('7.4', 0.2, 0.8) * 0.6} />
      <Region b={L.minio} title="minio" sub="S3" color={C.s3} opacity={aMinio * (0.3 + 0.7 * fMinio)} small glow={(H('3.5', 0.4, 0.9) + H('7.1', 0.3, 0.8)) * 0.6} />
      {aNs > 0 ? <Region b={L.nsHub} title="openshift-gitops" color={C.blue} opacity={aNs} small dashed /> : null}
      {aWork > 0 ? <Region b={{x: 70, y: 860, w: 1080, h: 425}} title="gitops-vms" color={C.spoke1} opacity={aWork} small dashed /> : null}
      {aVrg > 0 ? <Region b={{x: 70 + DX, y: 860, w: 1080, h: 425}} title="gitops-vms" color={C.spoke0} opacity={aVrg} small dashed /> : null}

      {/* bucket */}
      {aMinio > 0 ? (
        <div style={{position: 'absolute', left: 2020, top: 140, opacity: aMinio * (0.3 + 0.7 * fMinio), fontFamily: mono, color: C.s3, fontSize: 21}}>
          <svg width={60} height={60} viewBox="0 0 24 24" style={{verticalAlign: 'middle'}}>
            <path fill="none" stroke={C.s3} strokeWidth={1.6} d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0 1.6 13c.2 1.2 3 2 6.4 2s6.2-.8 6.4-2L20 6" />
          </svg>
          <span style={{marginLeft: 10}}>ramen-metadata</span>
          <div style={{marginTop: 16, opacity: aCdp}}>
            <Pill text="PV + PVC definitions" color={C.s3} size={17} />
          </div>
        </div>
      ) : null}

      {/* git repo */}
      {aGit > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: L.git.x,
            top: L.git.y,
            width: L.git.w,
            opacity: Math.min(1, aGit * 1.5) * (0.3 + 0.7 * F('git')),
            borderRadius: 14,
            border: `2px solid ${C.text}55`,
            background: C.panel,
            padding: 18,
            fontFamily: mono,
            fontSize: 17,
            color: C.dim,
            boxShadow: H('2.3', 0.02, 0.3) + H('2.7', 0.0, 0.5) ? `0 0 40px ${C.text}55` : undefined,
          }}
        >
          <div style={{fontFamily: sans, fontWeight: 700, fontSize: 24, color: C.text}}>Git</div>
          <div style={{fontFamily: sans, fontStyle: 'italic', fontSize: 17, color: C.dim, marginTop: 4}}>the desired VM definition</div>
          <div style={{marginTop: 8, color: C.text, overflowWrap: 'break-word'}}>elsapassaro/ ramendr-starter-kit</div>
          <div style={{marginTop: 8}}>ocp-4.22-rhdr-dell</div>
          <div style={{marginTop: 8}}>clusters/dell-s4/workloads/</div>
          <div style={{marginTop: 4, paddingLeft: 14, opacity: detail}}>datavolumes.yaml</div>
          <div style={{paddingLeft: 14, opacity: detail}}>virtualmachine.yaml</div>
          <div style={{paddingLeft: 14, opacity: detail}}>service.yaml</div>
          <div style={{marginTop: 8, color: C.amber, textShadow: H('2.7', 0.0, 0.5) ? `0 0 12px ${C.amber}` : undefined}}>no namespace.yaml</div>
        </div>
      ) : null}

      {/* hub cards */}
      <Card x={card.drpc[0]} y={card.drpc[1]} kind="DRPlacementControl" name="dell-vm-drpc" role="DR control panel for this app" lines={after('3.6') ? drpcLines : ['preferredCluster: spoke-0', 'pvcSelector drprotection=true']} appear={aDrpc} hl={H('2.3', 0.42, 0.56) + H('3.6', 0.5, 1) + Math.min(1, hiDrpc)} focus={F('drpc')} detail={Math.max(detail, after('5.4') ? 1 : 0)} />
      <Card
        x={card.placement[0]}
        y={card.placement[1]}
        kind="Placement"
        name="dell-vm-placement"
        role="asks: which cluster runs the app?"
        lines={[<span style={{color: H('2.4', 0.05, 0.6) ? C.amber : C.dim}}>ACM scheduler disabled</span>]}
        appear={aPl}
        hl={H('2.3', 0.36, 0.48) + H('2.4', 0.05, 0.95)}
        focus={F('placement')}
        detail={Math.max(detail, H('2.4', 0.0, 1))}
      />
      <Card x={card.appset[0]} y={card.appset[1]} kind="ApplicationSet" name="dell-vm-workload" role="one Application per listed cluster" lines={['clusterDecisionResource', 'requeueAfterSeconds 180']} appear={aSet} hl={H('2.3', 0.48, 0.6) + H('2.5', 0.0, 0.6) + H('10.1', 0.4, 0.75) + H('12.2', 0.0, 0.4)} focus={F('appset')} detail={detail} />
      <Card x={card.pd[0]} y={card.pd[1]} w={330} kind="PlacementDecision" name="dell-vm-placement-decision-1" role="answer: the chosen cluster list" lines={pdRows} appear={aPd} hl={H('2.3', 0.56, 0.7) + H('2.4', 0.4, 0.9) + H('2.5', 0.25, 0.55) + sPd.flash} focus={F('pd')} detail={1} />
      <Card x={card.drpolicy[0]} y={card.drpolicy[1]} w={330} kind="DRPolicy" name="dr-policy-15m" role="pairs the spokes · 15 min" color={C.orange} lines={['cluster-scoped', 'schedulingInterval 15m']} appear={aPol} hl={H('2.3', 0.64, 0.76) + H('13.3', 0.05, 0.5)} focus={F('drpolicy')} detail={detail} />
      <Card x={card.app1[0]} y={card.app1[1]} w={320} kind="Application" name="dell-vm-workload-spoke-1" role="deploy Git folder to spoke-1" lines={['skip-reconcile (hub copy)']} appear={aApp1 * pApp1} hl={H('2.5', 0.6, 0.85) + H('2.6', 0.0, 0.35) + H('12.2', 0.15, 0.4)} focus={F('app1')} detail={detail} />
      <Card x={card.app0[0]} y={card.app0[1]} w={320} kind="Application" name="dell-vm-workload-spoke-0" role="deploy Git folder to spoke-0" lines={['skip-reconcile (hub copy)']} appear={pApp0} hl={H('10.1', 0.6, 0.95) + H('10.2', 0.0, 0.3)} focus={F('app0')} detail={detail} />

      {/* hub controllers */}
      <Chip p={[HUBCHIP.ramen[0], 575]} w={HUBCHIP.ramen[1]} label="Ramen hub operator" appear={aRamenHub} hl={H('2.4', 0.3, 0.9) + H('3.2', 0.1, 0.5) + H('5.5', 0.2, 0.9) + H('6.1', 0, 0.9) + H('6.2', 0, 0.9) + H('6.3', 0.1, 0.5) + H('6.4', 0.1, 0.5) + H('9.1', 0.1, 0.8) + H('9.2', 0.1, 0.5) + H('12.1', 0.0, 0.5) + H('13.1', 0.1, 0.5)} color={C.orange} focus={F('ramenHub')} />
      <Chip p={[HUBCHIP.sched[0], 575]} w={HUBCHIP.sched[1]} label="ACM scheduler" appear={aSched} off={T('2.4', 0.2, 0.25) > 0.5} color={C.blue} focus={F('sched')} />
      <Chip p={[HUBCHIP.appset[0], 575]} w={HUBCHIP.appset[1]} label="ApplicationSet controller" appear={aSetCtrl} hl={H('2.5', 0.05, 0.6) + H('10.1', 0.3, 0.7) + H('12.2', 0.0, 0.3)} color={C.pink} focus={F('appsetCtrl')} />
      <Chip p={[HUBCHIP.prop[0], 575]} w={HUBCHIP.prop[1]} label="propagation controller" appear={aProp} hl={H('2.6', 0.3, 0.6) + H('10.2', 0.0, 0.5) + H('12.2', 0.4, 0.8)} color={C.cyan} focus={F('prop')} />

      {/* spoke controllers */}
      {([1, 0] as const).map((s) => (
        <React.Fragment key={s}>
          <Chip p={chip(0, s)} w={CHIP_W[0]} label="work agent" appear={s === 1 ? Math.max(aSpokeChips, A('3.2', 0.1)) : A('3.2', 0.1)} hl={s === 1 ? H('3.2', 0.3, 0.55) + H('12.1', 0.2, 0.5) : H('3.2', 0.42, 0.62) + H('6.4', 0.4, 0.8) + H('10.2', 0.3, 0.6)} color={C.cyan} focus={F(`wa${s}`)} />
          <Chip p={chip(1, s)} w={CHIP_W[1]} label="Ramen VRG ctrl" appear={A('3.2', 0.2)} hl={s === 1 ? H('3.3', 0.0, 0.7) + H('12.4', 0, 0.8) : H('7.1', 0.0, 0.8)} color={C.orange} focus={F(`ramen${s}`)} />
          <Chip p={chip(2, s)} w={CHIP_W[2]} label="csi-addons + CSI" appear={aCsi} hl={s === 1 ? H('3.4', 0.0, 0.45) + H('12.5', 0.2, 0.6) : H('7.3', 0.3, 0.8)} color={C.amber} focus={F(`csi${s}`)} />
          <Chip p={chip(3, s)} w={CHIP_W[3]} label="Argo CD (spoke)" appear={aSpokeChips} hl={s === 1 ? H('2.6', 0.55, 0.95) + H('12.3', 0.0, 0.6) : H('10.2', 0.6, 0.95) + H('10.3', 0.0, 0.5)} color={C.pink} focus={F(`argo${s}`)} />
        </React.Fragment>
      ))}

      {/* spoke-1 workload (source in the recorded run) */}
      <Card x={spoke.vm(1)[0]} y={spoke.vm(1)[1]} kind="VirtualMachine" name="hammerdb-rhel9" role="the database VM" lines={[vmLine(sVm1.v), 'PostgreSQL + HammerDB']} appear={aWork * pVm1} hl={H('2.2', 0.05, 0.3) + H('8.1', 0.1, 0.9) + sVm1.flash} focus={F('vm1')} detail={Math.max(detail, after('8.1') ? 1 : 0)} color={sVm1.v === 'paused' ? C.red : undefined} />
      {(['rootdisk', 'datadisk'] as const).map((d) => {
        const p = d === 'rootdisk' ? spoke.pvcR(1) : spoke.pvcD(1);
        return (
          <Card
            key={d}
            x={p[0]}
            y={p[1]}
            w={250}
            kind="PersistentVolumeClaim"
            name={`hammerdb-rhel9-${d}`}
            role={d === 'rootdisk' ? 'VM root disk' : 'database disk'}
            lines={[d === 'rootdisk' ? '35Gi · powerstore-sc' : '20Gi · powerstore-sc', <span style={{opacity: aLbl, color: C.amber}}>drprotection=true</span>]}
            appear={aDisks * pPvc1}
            hl={H('2.2', 0.5, 0.85) + H('3.3', 0.05, 0.3) + H('12.4', 0.2, 0.8)}
            focus={F('pvc1')}
            detail={Math.max(detail, H('2.2', 0.5, 1))}
            badge={S('pvc1').v === 'terminating' ? <Pill text="Terminating · finalizer held" color={C.red} size={14} /> : aFin > 0 ? <Pill text="finalizer" color={C.orange} appear={aFin} size={14} /> : undefined}
          />
        );
      })}
      <Card
        x={spoke.vrg(1)[0]}
        y={spoke.vrg(1)[1]}
        w={320}
        kind="VolumeReplicationGroup"
        name="dell-vm-drpc"
        role="Ramen's site manager on spoke-1"
        lines={[<Cond k="state" v={sVrg1.v} ok={sVrg1.v === 'Primary' ? true : null} flash={sVrg1.flash} />, aCdp > 0 ? <Cond k="ClusterDataProtected" v="True" ok flash={H('3.5', 0.6, 0.9)} /> : <span />]}
        appear={aVrg}
        hl={H('3.2', 0.25, 0.5) + H('3.3', 0.0, 0.35) + H('3.5', 0.2, 0.7) + H('12.1', 0.3, 0.7) + H('12.4', 0, 1) + sVrg1.flash}
        focus={F('vrg1')}
        detail={1}
      />
      {(['rootdisk', 'datadisk'] as const).map((d) => {
        const p = d === 'rootdisk' ? spoke.vrR(1) : spoke.vrD(1);
        return (
          <Card key={d} x={p[0]} y={p[1]} w={250} kind="VolumeReplication" name={`hammerdb-rhel9-${d}`} lines={[<Cond k="role" v={sVr1.v === 'none' ? 'secondary' : sVr1.v} ok={sVr1.v === 'primary' ? true : null} flash={sVr1.flash} />, 'powerstore-vrc-15m']} appear={aVr * pVr1} hl={H('3.3', 0.72, 1) + H('3.4', 0.05, 0.3) + sVr1.flash} focus={F('vr1')} detail={Math.max(detail, after('12.5') ? 1 : 0)} />
        );
      })}

      {/* spoke-0 (home cluster; target in the recorded run) */}
      <Card x={spoke.vm(0)[0]} y={spoke.vm(0)[1]} kind="VirtualMachine" name="hammerdb-rhel9" role="the database VM" lines={[vmLine('run'), 'worker-2 · Ready']} appear={pVm0} hl={H('11.1', 0.2, 0.7) + H('11.2', 0.1, 0.9)} focus={F('vm0')} detail={1} />
      {(['rootdisk', 'datadisk'] as const).map((d) => {
        const p = d === 'rootdisk' ? spoke.pvcR(0) : spoke.pvcD(0);
        return (
          <Card
            key={d}
            x={p[0]}
            y={p[1]}
            w={250}
            kind="PersistentVolumeClaim"
            name={`hammerdb-rhel9-${d}`}
            role="restored from S3"
            lines={[d === 'rootdisk' ? '9e3b6608-30f4-42e8-aaca-4f774fe7662a' : '41b0880b-916d-42a1-b4b6-a55f9c853c91']}
            appear={pPvc0}
            hl={H('7.1', 0.7, 1) + H('7.2', 0.05, 0.5) + H('10.3', 0.4, 0.9) + H('10.4', 0.1, 0.9)}
            focus={F('pvc0')}
            detail={Math.max(detail, after('10.4') ? 1 : 0)}
          />
        );
      })}
      <Card
        x={spoke.vrg(0)[0]}
        y={spoke.vrg(0)[1]}
        w={320}
        kind="VolumeReplicationGroup"
        name="dell-vm-drpc"
        role="Ramen's site manager on spoke-0"
        lines={[<Cond k="state" v={sVrg0.v} ok={sVrg0.v === 'Primary' ? true : null} flash={sVrg0.flash} />, sCdr0.v ? <Cond k="ClusterDataReady" v="True" ok flash={sCdr0.flash} /> : <span />]}
        appear={aVrg}
        hl={H('3.2', 0.35, 0.6) + H('6.1', 0.2, 0.5) + H('6.4', 0.6, 1) + H('9.1', 0.3, 0.9) + sVrg0.flash + sCdr0.flash}
        focus={F('vrg0')}
        detail={1}
      />
      {(['rootdisk', 'datadisk'] as const).map((d) => {
        const p = d === 'rootdisk' ? spoke.vrR(0) : spoke.vrD(0);
        return (
          <Card key={d} x={p[0]} y={p[1]} w={250} kind="VolumeReplication" name={`hammerdb-rhel9-${d}`} lines={[<Cond k="role" v={sVr0.v} ok flash={sVr0.flash} />, 'powerstore-vrc-15m']} appear={pVr0} hl={H('7.3', 0.2, 0.6) + sVr0.flash} focus={F('vr0')} detail={1} />
        );
      })}

      {/* array volumes */}
      <Volume x={L.vsaB.x + 40} y={L.vsaB.y + 42} name="1282bca9-29aa-416f-b890-2a29a44e3fac" role={`root disk · ${vsaRoles.B[0]}`} roleColor={vsaRoles.B[1]} appear={aVol} hl={H('3.4', 0.38, 0.6) + arrFlash} focus={F('volB')} />
      <Volume x={L.vsaB.x + 440} y={L.vsaB.y + 42} name="e5ecb946-25b6-4f1a-afe0-8173392f2b7d" role={`data disk · ${vsaRoles.B[0]}`} roleColor={vsaRoles.B[1]} appear={aVol} hl={H('3.4', 0.38, 0.6) + arrFlash} focus={F('volB')} />
      <Volume x={L.vsaA.x + 40} y={L.vsaA.y + 42} name="9e3b6608-30f4-42e8-aaca-4f774fe7662a" role={`root disk · ${vsaRoles.A[0]}`} roleColor={vsaRoles.A[1]} appear={aVol} hl={H('10.4', 0.1, 0.9) + arrFlash} focus={F('volA')} />
      <Volume x={L.vsaA.x + 440} y={L.vsaA.y + 42} name="41b0880b-916d-42a1-b4b6-a55f9c853c91" role={`data disk · ${vsaRoles.A[0]}`} roleColor={vsaRoles.A[1]} appear={aVol} hl={H('10.4', 0.1, 0.9) + arrFlash} focus={F('volA')} />

      {/* ---------- connections ---------- */}
      <svg width={2400} height={1500} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* array link: direction follows run state */}
        {sArr.v === 'B2A' ? (
          <Flow a={[L.vsaB.x + L.vsaB.w, L.vsaB.y + 84]} b={[L.vsaA.x, L.vsaA.y + 84]} bend="straight" kind="data" draw={aLink} label={after('3.4') ? 'VSA-B to VSA-A · ~every 12 min' : 'async replication'} flowT={after('3.4') ? loop(150) : undefined} packets={2} width={4} />
        ) : sArr.v === 'promoted' ? (
          <Flow a={[L.vsaB.x + L.vsaB.w, L.vsaB.y + 84]} b={[L.vsaA.x, L.vsaA.y + 84]} bend="straight" kind="ref" draw={1} label="failed over · not yet reversed" />
        ) : (
          <Flow a={[L.vsaA.x, L.vsaA.y + 84]} b={[L.vsaB.x + L.vsaB.w, L.vsaB.y + 84]} bend="straight" kind="data" draw={sArr.p} label="VSA-A to VSA-B · reversed" flowT={loop(150)} packets={2} width={4} />
        )}
        <Flow a={[L.s1.x + 570, L.s1.y + L.s1.h]} b={[L.vsaB.x + 420, L.vsaB.y]} bend="straight" kind="data" draw={A('2.1', 0.62)} label="NVMe/TCP" opacity={0.75} labelAt={0.45} />
        <Flow a={[L.s0.x + 570, L.s0.y + L.s0.h]} b={[L.vsaA.x + 420, L.vsaA.y]} bend="straight" kind="data" draw={A('2.1', 0.66)} label="NVMe/TCP" opacity={0.75} labelAt={0.45} />

        {/* hub references */}
        <Flow a={mid(card.drpc, W, 45)} b={mid(card.placement, 0, 45)} bend="h" kind="ref" draw={T('2.3', 0.44, 0.5)} />
        <Flow a={mid(card.placement, W / 2, 140)} b={mid(card.pd, W / 2, 0)} bend="v" kind="ref" draw={T('2.3', 0.58, 0.64)} label="answered by" labelAt={0.5} />
        <Flow a={hubChip('ramen', 0.6)} b={mid(card.pd, 0, 75)} bend="v" kind="reconcile" draw={T('2.4', 0.36, 0.5)} label="only writer" opacity={K('2.4')} />
        <Flow a={mid(card.appset, 60, 145)} b={mid(card.pd, 330, 55)} bend="v" kind="observe" draw={T('2.5', 0.25, 0.35)} label="polls every 180 s" labelAt={0.4} opacity={K('2.5')} />
        <Flow a={mid(card.appset, W, 55)} b={mid(card.app1, 0, 55)} bend="h" kind="reconcile" draw={T('2.5', 0.6, 0.66)} opacity={K('2.5')} label="generates" />
        <Flow a={mid(card.app1, 160, 150)} b={chipMid(3, 1)} bend="v" kind="delivery" draw={T('2.6', 0.3, 0.45)} opacity={K('2.6')} />
        <Envelope a={mid(card.app1, 160, 150)} b={chipMid(3, 1)} t={is('2.6') ? T('2.6', 0.35, 0.58) : 0} label="ManifestWork (Application)" />
        <Flow a={[L.git.x + 170, L.git.y + 400]} b={chipMid(3, 1, 0)} bend="v" kind="ref" draw={T('2.6', 0.6, 0.72)} label="pulls manifests" labelAt={0.12} opacity={K('2.6')} />
        <Flow a={chipMid(3, 1, 50)} b={mid(spoke.vm(1), W, 50)} bend="v" kind="reconcile" draw={T('2.6', 0.74, 0.86)} label="syncs · prune · selfHeal" labelAt={0.55} opacity={K('2.6')} />

        {/* 3.2 VRG ManifestWorks */}
        <Flow a={hubChip('ramen', 0.3, 50)} b={chipMid(0, 1)} bend="v" kind="delivery" draw={T('3.2', 0.18, 0.3)} opacity={K('3.2')} />
        <Flow a={hubChip('ramen', 0.75, 50)} b={chipMid(0, 0)} bend="v" kind="delivery" draw={T('3.2', 0.3, 0.42)} opacity={K('3.2')} />
        <Envelope a={hubChip('ramen', 0.3, 50)} b={chipMid(0, 1)} t={is('3.2') ? T('3.2', 0.2, 0.34) : 0} label="ManifestWork: VRG Primary" />
        <Envelope a={hubChip('ramen', 0.75, 50)} b={chipMid(0, 0)} t={is('3.2') ? T('3.2', 0.32, 0.46) : 0} label="ManifestWork: VRG Secondary" />
        <Flow a={chipMid(0, 1, 50)} b={mid(spoke.vrg(1), 40, 0)} bend="v" kind="reconcile" draw={T('3.2', 0.34, 0.42)} opacity={K('3.2')} label="applies" labelAt={0.45} />
        <Flow a={chipMid(0, 0, 50)} b={mid(spoke.vrg(0), 40, 0)} bend="v" kind="reconcile" draw={T('3.2', 0.46, 0.54)} opacity={K('3.2')} label="applies" labelAt={0.45} />
        <Flow a={[chip(0, 1)[0] + 30, chip(0, 1)[1]]} b={hubChip('ramen', 0.08, 50)} bend="v" kind="observe" draw={T('3.2', 0.72, 0.85)} opacity={K('3.2')} label="status via ManagedClusterView" labelAt={0.3} labelDx={40} />
        <Flow a={[chip(0, 0)[0] + 30, chip(0, 0)[1]]} b={hubChip('ramen', 0.95, 50)} bend="v" kind="observe" draw={T('3.2', 0.75, 0.88)} opacity={K('3.2')} />

        {/* 3.3 VRG selects PVCs, creates VRs */}
        <Flow a={mid(spoke.vrg(1), 0, 70)} b={mid(spoke.pvcD(1), 125, 0)} bend="h" kind="reconcile" draw={T('3.3', 0.08, 0.22)} opacity={K('3.3') * (1 - T('3.3', 0.6, 0.66))} label="selects drprotection=true" labelAt={0.5} labelDx={-190} labelDy={-10} />
        <Flow a={mid(spoke.vrg(1), 120, 180)} b={mid(spoke.vrR(1), 125, 0)} bend="v" kind="reconcile" draw={T('3.3', 0.7, 0.8)} opacity={K('3.3')} label="creates" labelAt={0.5} />
        <Flow a={mid(spoke.vrg(1), 220, 180)} b={mid(spoke.vrD(1), 125, 0)} bend="v" kind="reconcile" draw={T('3.3', 0.72, 0.82)} opacity={K('3.3')} />

        {/* 3.4 VR to csi to array */}
        <Flow a={chipMid(2, 1, 50)} b={mid(spoke.vrD(1), 125, 0)} bend="v" kind="reconcile" draw={T('3.4', 0.05, 0.18)} opacity={K('3.4')} label="watches VolumeReplication" labelAt={0.2} labelDx={150} />
        <Flow a={mid(spoke.vrR(1), 125, 150)} b={[L.vsaB.x + 220, L.vsaB.y + 42]} bend="v" kind="data" draw={T('3.4', 0.22, 0.34)} opacity={K('3.4')} label="gRPC: enable replication" labelAt={0.5} />
        <Flow a={mid(spoke.vrD(1), 125, 150)} b={[L.vsaB.x + 620, L.vsaB.y + 42]} bend="v" kind="data" draw={T('3.4', 0.24, 0.36)} opacity={K('3.4')} />

        {/* 3.5 metadata to S3 */}
        <Flow a={mid(spoke.vrg(1), 160, 0)} b={[1185, 712]} bend="v" kind="delivery" color={C.s3} draw={T('3.5', 0.3, 0.38)} opacity={K('3.5')} />
        <Flow a={[1185, 712]} b={[1990, 280]} bend="h" kind="delivery" color={C.s3} draw={T('3.5', 0.38, 0.48)} opacity={K('3.5')} label="uploads PV + PVC YAML" labelAt={0.1} labelDy={-6} />
        <Envelope a={[1185, 712]} b={[1990, 280]} bend="h" t={is('3.5') ? T('3.5', 0.4, 0.6) : 0} label="PV + PVC" color={C.s3} />

        {/* 5.4 console writes the DRPC */}
        <Flow a={[590, 20]} b={mid(card.drpc, 150, 0)} bend="v" kind="reconcile" draw={T('5.4', 0.15, 0.3)} opacity={K('5.4')} label="console edits spec" labelAt={0.3} labelDx={170} />
        {/* 5.5 / 6.1 Ramen reads DRPC, checks target VRG */}
        <Flow a={mid(card.drpc, 150, 250)} b={hubChip('ramen', 0.5)} bend="v" kind="observe" draw={T('5.5', 0.3, 0.5)} opacity={K('5.5')} label="reconciles" />
        <Flow a={[chip(0, 0)[0] + 30, chip(0, 0)[1]]} b={hubChip('ramen', 0.9, 50)} bend="v" kind="observe" draw={T('6.1', 0.15, 0.35)} opacity={K('6.1')} label="target VRG settled Secondary?" labelAt={0.35} />
        {/* 6.3 retained entry */}
        <Flow a={hubChip('ramen', 0.6)} b={mid(card.pd, 0, 75)} bend="v" kind="reconcile" draw={T('6.3', 0.2, 0.35)} opacity={K('6.3')} label="tags RetainedForFailover" labelAt={0.45} />
        {/* 6.4 request target Primary */}
        <Flow a={hubChip('ramen', 0.75, 50)} b={chipMid(0, 0)} bend="v" kind="delivery" draw={T('6.4', 0.15, 0.35)} opacity={K('6.4')} />
        <Envelope a={hubChip('ramen', 0.75, 50)} b={chipMid(0, 0)} t={is('6.4') ? T('6.4', 0.2, 0.45) : 0} label="ManifestWork: VRG primary · Failover" />
        <Flow a={chipMid(0, 0, 50)} b={mid(spoke.vrg(0), 40, 0)} bend="v" kind="reconcile" draw={T('6.4', 0.45, 0.6)} opacity={K('6.4')} label="applies" labelAt={0.45} />

        {/* 7.1 restore from S3 */}
        <Flow a={[1990, 280]} b={[2210, 712]} bend="v" kind="delivery" color={C.s3} draw={T('7.1', 0.3, 0.42)} opacity={K('7.1')} />
        <Flow a={[2210, 712]} b={mid(spoke.vrg(0), 300, 0)} bend="v" kind="delivery" color={C.s3} draw={T('7.1', 0.42, 0.5)} opacity={K('7.1')} label="downloads PV + PVC" labelAt={0.2} labelDx={-130} />
        <Envelope a={[1990, 280]} b={[2210, 712]} t={is('7.1') ? T('7.1', 0.32, 0.5) : 0} label="PV + PVC" color={C.s3} />
        <Flow a={mid(spoke.vrg(0), 0, 90)} b={mid(spoke.pvcD(0), 125, 0)} bend="h" kind="reconcile" draw={T('7.1', 0.6, 0.72)} opacity={K('7.1')} label="recreates claims" labelAt={0.5} labelDx={-150} labelDy={-14} />
        {/* 7.3 VR + promote */}
        <Flow a={mid(spoke.vrg(0), 120, 180)} b={mid(spoke.vrR(0), 125, 0)} bend="v" kind="reconcile" draw={T('7.3', 0.15, 0.25)} opacity={K('7.3')} label="creates" labelAt={0.5} />
        <Flow a={mid(spoke.vrg(0), 220, 180)} b={mid(spoke.vrD(0), 125, 0)} bend="v" kind="reconcile" draw={T('7.3', 0.17, 0.27)} opacity={K('7.3')} />
        <Flow a={mid(spoke.vrR(0), 125, 150)} b={[L.vsaA.x + 220, L.vsaA.y + 42]} bend="v" kind="data" draw={T('7.3', 0.45, 0.58)} opacity={K('7.3')} label="gRPC: Promote" labelAt={0.5} />
        <Flow a={mid(spoke.vrD(0), 125, 150)} b={[L.vsaA.x + 620, L.vsaA.y + 42]} bend="v" kind="data" draw={T('7.3', 0.47, 0.6)} opacity={K('7.3')} />

        {/* 8.1 source write rejected */}
        <Flow a={mid(spoke.vm(1), 150, 160)} b={[L.vsaB.x + 620, L.vsaB.y + 42]} bend="v" kind="data" color={C.red} draw={T('8.1', 0.55, 0.75)} opacity={K('8.1')} label="write rejected: read-only" labelAt={0.55} labelDx={60} />

        {/* 9.1 readiness view, 9.2 decision update */}
        <Flow a={[chip(0, 0)[0] + 30, chip(0, 0)[1]]} b={hubChip('ramen', 0.9, 50)} bend="v" kind="observe" draw={T('9.1', 0.3, 0.5)} opacity={K('9.1')} label="Primary · DataReady · ClusterDataReady" labelAt={0.35} />
        <Flow a={hubChip('ramen', 0.6)} b={mid(card.pd, 0, 75)} bend="v" kind="reconcile" draw={T('9.2', 0.15, 0.32)} opacity={K('9.2')} label="adds spoke-0" labelAt={0.45} />

        {/* 10.1 generator, 10.2 delivery */}
        <Flow a={mid(card.appset, 60, 180)} b={mid(card.pd, 330, 55)} bend="v" kind="observe" draw={T('10.1', 0.45, 0.55)} opacity={K('10.1')} label="next poll" labelAt={0.4} />
        <Flow a={mid(card.appset, W, 120)} b={mid(card.app0, 0, 55)} bend="h" kind="reconcile" draw={T('10.1', 0.6, 0.68)} opacity={K('10.1')} label="generates" />
        <Flow a={mid(card.app0, 160, 170)} b={chipMid(3, 0)} bend="v" kind="delivery" draw={T('10.2', 0.1, 0.3)} opacity={K('10.2')} />
        <Envelope a={mid(card.app0, 160, 170)} b={chipMid(3, 0)} t={is('10.2') ? T('10.2', 0.12, 0.4) : 0} label="ManifestWork (Application)" />
        <Flow a={[L.git.x + 300, L.git.y + 400]} b={chipMid(3, 0, 0)} bend="h" kind="ref" draw={T('10.2', 0.6, 0.75)} label="pulls clusters/dell-s4/workloads" labelAt={0.3} opacity={K('10.2')} />
        <Flow a={chipMid(3, 0, 50)} b={mid(spoke.pvcD(0), 200, 0)} bend="v" kind="reconcile" draw={T('10.3', 0.15, 0.3)} opacity={K('10.3')} label="DataVolumes find existing claims" labelAt={0.5} />

        {/* 11.3 target VM uses replicas */}
        <Flow a={mid(spoke.pvcD(0), 125, 200)} b={[L.vsaA.x + 620, L.vsaA.y + 42]} bend="v" kind="data" draw={T('11.3', 0.2, 0.4)} opacity={K('11.3')} label="promoted replicas" />

        {/* 12.1 source Secondary request, 12.2 app removal */}
        <Flow a={hubChip('ramen', 0.3, 50)} b={chipMid(0, 1)} bend="v" kind="delivery" draw={T('12.1', 0.15, 0.3)} opacity={K('12.1')} />
        <Envelope a={hubChip('ramen', 0.3, 50)} b={chipMid(0, 1)} t={is('12.1') ? T('12.1', 0.18, 0.4) : 0} label="ManifestWork: VRG secondary" />
        <Flow a={[chip(0, 1)[0] + 30, chip(0, 1)[1]]} b={hubChip('ramen', 0.08, 50)} bend="v" kind="observe" draw={T('12.1', 0.45, 0.6)} opacity={K('12.1')} label="spec accepted" labelAt={0.3} labelDx={40} />
        <Flow a={hubChip('ramen', 0.6)} b={mid(card.pd, 0, 75)} bend="v" kind="reconcile" draw={T('12.1', 0.65, 0.78)} opacity={K('12.1')} label="removes spoke-1" labelAt={0.45} />
        <Flow a={mid(card.appset, 60, 180)} b={mid(card.pd, 330, 55)} bend="v" kind="observe" draw={T('12.2', 0.05, 0.2)} opacity={K('12.2')} label="next poll" labelAt={0.4} />
        {/* 12.3 prune */}
        <Flow a={chipMid(3, 1, 50)} b={mid(spoke.vm(1), W, 50)} bend="v" kind="reconcile" color={C.red} draw={T('12.3', 0.1, 0.25)} opacity={K('12.3')} label="prunes" labelAt={0.55} />
        {/* 12.5 demote */}
        <Flow a={mid(spoke.vrR(1), 125, 150)} b={[L.vsaB.x + 220, L.vsaB.y + 42]} bend="v" kind="data" draw={T('12.5', 0.25, 0.4)} opacity={K('12.5')} label="gRPC: Demote, Resync" labelAt={0.5} />
        {/* 13.1 completion observed */}
        <Flow a={[chip(0, 1)[0] + 30, chip(0, 1)[1]]} b={hubChip('ramen', 0.08, 50)} bend="v" kind="observe" draw={T('13.1', 0.15, 0.32)} opacity={K('13.1')} label="source VRG Secondary" labelAt={0.3} labelDx={40} />
      </svg>

      {/* 9.1 gate / 12.4 disuse lock */}
      {is('12.4') ? <Lock x={spoke.vrg(1)[0] + 330} y={spoke.vrg(1)[1] + 40} open={T('12.4', 0.55, 0.7)} /> : null}
      {is('9.1') ? <Lock x={HUBCHIP.ramen[0] + 262} y={570} open={T('9.1', 0.6, 0.72)} /> : null}
    </div>
  );
};

const Lock: React.FC<{x: number; y: number; open: number}> = ({x, y, open}) => {
  const col = open > 0.5 ? C.green : C.amber;
  return (
    <svg width={64} height={70} viewBox="0 0 32 36" style={{position: 'absolute', left: x, top: y, filter: `drop-shadow(0 0 10px ${col})`}}>
      <rect x={4} y={15} width={24} height={18} rx={3} fill={`${col}33`} stroke={col} strokeWidth={2.5} />
      <path d={`M10 15 V9 a6 6 0 0 1 12 0 V${15 - open * 7}`} fill="none" stroke={col} strokeWidth={2.5} transform={`translate(${open * 6} ${-open * 3})`} />
    </svg>
  );
};
