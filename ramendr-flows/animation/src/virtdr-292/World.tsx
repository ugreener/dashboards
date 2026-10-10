import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Cond, Pill, Region} from '../components/primitives';
import {Envelope, Flow, P} from '../components/flows';
import {prog} from '../lib/anim';

/** Rendering context: which beat we are in and where inside it. */
export type Ctx = {
  order: string[];
  id: string; // current beat id
  f: number; // frame inside the beat's audio window (may be negative during lead-in)
  dur: number; // audio frames of current beat
  g: number; // global frame (for looping motion)
};

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
  /** Highlight pulse during [a,b] fractions of beat `id` (0..1, eased in/out). */
  const H = (id: string, a = 0, b = 1) => {
    if (c.id !== id) return 0;
    const s = c.dur * a;
    const e = c.dur * b;
    return Math.min(prog(c.f, s, s + 20), 1 - prog(c.f, e - 20, e));
  };
  /** Progress 0..1 across [a,b] of beat `id`; 1 after that beat, 0 before. */
  const T = (id: string, a: number, b: number) => {
    const si = idx(id);
    if (bi > si) return 1;
    if (bi < si) return 0;
    return prog(c.f, c.dur * a, c.dur * b);
  };
  const is = (...ids: string[]) => ids.includes(c.id);
  /** Transient element: fully visible in beat `id`, fades out early in the following beat. */
  const K = (id: string) => {
    const si = idx(id);
    if (bi === si) return 1;
    if (bi === si + 1) return 1 - prog(c.f, -20, 25);
    return 0;
  };
  const after = (id: string) => bi >= idx(id);
  return {A, H, T, K, is, after, bi};
};

// ---- layout (world units, 2400 x 1500) ----
export const L = {
  hub: {x: 400, y: 40, w: 1600, h: 600},
  nsHub: {x: 430, y: 100, w: 1175, h: 400},
  minio: {x: 1640, y: 100, w: 330, h: 190},
  git: {x: 30, y: 140, w: 330},
  s1: {x: 60, y: 720, w: 1100, h: 530},
  s0: {x: 1250, y: 720, w: 1100, h: 530},
  vsaB: {x: 230, y: 1310, w: 760, h: 170},
  vsaA: {x: 1420, y: 1310, w: 760, h: 170},
};
const DX = L.s0.x - L.s1.x;

// card anchor helpers
const card = {
  drpc: [460, 140] as P,
  placement: [760, 140] as P,
  appset: [1060, 140] as P,
  app1: [1340, 140] as P,
  app0: [1340, 310] as P,
  pd: [760, 320] as P,
  drpolicy: [1650, 330] as P,
};
const sp = (x: number, y: number, s: 0 | 1): P => [x + (s === 0 ? DX : 0), y];
const spoke = {
  vm: (s: 0 | 1) => sp(120, 860, s),
  vrg: (s: 0 | 1) => sp(640, 860, s),
  pvcR: (s: 0 | 1) => sp(120, 1050, s),
  pvcD: (s: 0 | 1) => sp(380, 1050, s),
  vrR: (s: 0 | 1) => sp(640, 1050, s),
  vrD: (s: 0 | 1) => sp(900, 1050, s),
  chip: (i: number, s: 0 | 1) => sp(90 + i * 260, 742, s),
};
const W = 240; // card width
const mid = (p: P, dx = W / 2, dy = 0): P => [p[0] + dx, p[1] + dy];

const Chip: React.FC<{p: P; label: string; appear: number; hl?: number; color?: string; off?: boolean; w?: number}> = ({
  p,
  label,
  appear,
  hl = 0,
  color = C.purple,
  off,
  w = 240,
}) =>
  appear > 0 ? (
    <div
      style={{
        position: 'absolute',
        left: p[0],
        top: p[1],
        width: w,
        height: 46,
        opacity: appear * (off ? 0.45 : 1),
        borderRadius: 10,
        border: `1.5px ${off ? 'dashed' : 'solid'} ${hl ? color : `${color}88`}`,
        background: `${color}${hl ? '30' : '14'}`,
        boxShadow: hl ? `0 0 ${28 * hl}px ${color}` : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 12px',
        fontFamily: sans,
        fontSize: 17,
        fontWeight: 600,
        color: off ? C.faint : C.text,
        textDecoration: off ? 'line-through' : undefined,
      }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24">
        <path
          fill={color}
          d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9.4 5.5-2-.3a7.6 7.6 0 0 1-.7 1.7l1.2 1.6-1.7 1.7-1.6-1.2c-.5.3-1.1.6-1.7.7l-.3 2h-2.4l-.3-2a7.6 7.6 0 0 1-1.7-.7l-1.6 1.2-1.7-1.7 1.2-1.6a7.6 7.6 0 0 1-.7-1.7l-2-.3v-2.4l2-.3c.2-.6.4-1.2.7-1.7L5.2 6.9l1.7-1.7 1.6 1.2c.5-.3 1.1-.6 1.7-.7l.3-2h2.4l.3 2c.6.2 1.2.4 1.7.7l1.6-1.2 1.7 1.7-1.2 1.6c.3.5.6 1.1.7 1.7l2 .3v2.4Z"
        />
      </svg>
      {label}
    </div>
  ) : null;

const Volume: React.FC<{x: number; y: number; name: string; role: string; appear: number; hl?: number; roleColor: string}> = ({
  x,
  y,
  name,
  role,
  appear,
  hl = 0,
  roleColor,
}) =>
  appear > 0 ? (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 320,
        height: 78,
        opacity: appear,
        borderRadius: 12,
        background: C.panel,
        border: `1.5px solid ${hl ? C.array : C.border}`,
        boxShadow: hl ? `0 0 ${30 * hl}px ${C.array}` : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 14px',
      }}
    >
      <svg width={34} height={40} viewBox="0 0 34 40">
        <ellipse cx={17} cy={7} rx={15} ry={6} fill="none" stroke={C.array} strokeWidth={2.5} />
        <path d="M2 7v26c0 3.3 6.7 6 15 6s15-2.7 15-6V7" fill="none" stroke={C.array} strokeWidth={2.5} />
        <path d="M2 20c0 3.3 6.7 6 15 6s15-2.7 15-6" fill="none" stroke={C.array} strokeWidth={1.5} opacity={0.6} />
      </svg>
      <div>
        <div style={{fontFamily: mono, fontSize: 16, color: C.text}}>{name}</div>
        <div style={{marginTop: 6}}>
          <Pill text={role} color={roleColor} size={13} />
        </div>
      </div>
    </div>
  ) : null;

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const {A, H, T, K, is, after} = mk(c);
  const loop = (period: number) => (c.g % period) / period;

  // ---------- debut schedule ----------
  const aCl = A('1.1', 0.0, 0.1);
  const aHub = A('1.1', 0.04, 0.1);
  const aS1 = A('1.1', 0.28, 0.1);
  const aS0 = A('1.1', 0.33, 0.1);
  const aArr = A('1.1', 0.6, 0.1);
  const aLink = T('1.1', 0.82, 0.97);
  const aMinio = A('1.1', 0.18, 0.08);
  const aWork = A('1.2', 0.08, 0.08);
  const aDisks = A('1.2', 0.42, 0.08);
  const aLbl = A('1.2', 0.62, 0.08);
  const aGit = A('1.3', 0.02, 0.06);
  const aNs = A('1.3', 0.3, 0.06);
  const aPl = A('1.3', 0.38, 0.06);
  const aDrpc = A('1.3', 0.48, 0.06);
  const aPol = A('1.3', 0.6, 0.06);
  const aSet = A('1.3', 0.7, 0.06);
  const aPd = A('1.3', 0.82, 0.06);
  const aSched = A('1.4', 0.2, 0.06);
  const aRamenHub = A('1.4', 0.36, 0.06);
  const aSetCtrl = A('1.5', 0.05, 0.06);
  const aApp1 = A('1.5', 0.55, 0.06);
  const aProp = A('1.6', 0.3, 0.06);
  const aSpokeChips = A('1.6', 0.45, 0.06);
  const aVrg = A('2.1', 0.2, 0.08);
  const aVr = A('2.2', 0.65, 0.08);
  const aFin = A('2.2', 0.35, 0.06);
  const aVol = A('2.3', 0.38, 0.08);
  const aSyncLink = T('2.3', 0.5, 0.62);
  const aCdp = A('2.4', 0.6, 0.06);

  // ---------- highlights ----------
  const hPlacement = H('1.3', 0.38, 0.5) + H('1.4', 0.05, 0.95);
  const hDrpc = H('1.3', 0.48, 0.62) + H('2.1', 0.05, 0.3);
  const hSet = H('1.3', 0.7, 0.82) + H('1.5', 0.0, 0.6);
  const hPd = H('1.3', 0.82, 1) + H('1.4', 0.45, 0.9) + H('1.5', 0.25, 0.55);
  const hVm = H('1.2', 0.05, 0.4);
  const hDisks = H('1.2', 0.4, 0.75) + H('2.2', 0.05, 0.3);

  const s1Name = 'hammerdb-rhel9';
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 2400, height: 1500}}>
      {/* grid backdrop */}
      <svg width={2400} height={1500} style={{position: 'absolute', opacity: 0.35 * aCl}}>
        <defs>
          <pattern id="g" width={40} height={40} patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#1b2430" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width={2400} height={1500} fill="url(#g)" />
      </svg>

      {/* regions */}
      <Region b={L.hub} title="hub" sub="edge36 · ACM 2.17 · Ramen hub · OpenShift GitOps" color={C.hub} opacity={aHub} />
      <Region b={L.s1} title="spoke-1" sub="edge97 · OCP 4.22.9 · Virtualization" color={C.spoke1} opacity={aS1} glow={hVm * 0.4} />
      <Region b={L.s0} title="spoke-0" sub="edge95 · OCP 4.22.9 · Virtualization" color={C.spoke0} opacity={aS0} />
      <Region b={L.vsaB} title="VSA-B" sub="PowerStore · NVMe/TCP" color={C.array} opacity={aArr} small />
      <Region b={L.vsaA} title="VSA-A" sub="PowerStore · NVMe/TCP" color={C.array} opacity={aArr} small />
      <Region b={L.minio} title="minio" sub="S3" color={C.s3} opacity={aMinio} small />
      {aNs > 0 ? <Region b={L.nsHub} title="openshift-gitops" color={C.blue} opacity={aNs} small dashed /> : null}
      {aWork > 0 ? <Region b={{x: 90, y: 830, w: 1040, h: 400}} title="gitops-vms" color={C.spoke1} opacity={aWork} small dashed /> : null}
      {aVrg > 0 ? <Region b={{x: 90 + DX, y: 830, w: 1040, h: 400}} title="gitops-vms" color={C.spoke0} opacity={aVrg} small dashed /> : null}

      {/* bucket */}
      {aMinio > 0 ? (
        <div style={{position: 'absolute', left: 1670, top: 140, opacity: aMinio, fontFamily: mono, color: C.s3, fontSize: 18}}>
          <svg width={60} height={60} viewBox="0 0 24 24" style={{verticalAlign: 'middle'}}>
            <path fill="none" stroke={C.s3} strokeWidth={1.6} d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0 1.6 13c.2 1.2 3 2 6.4 2s6.2-.8 6.4-2L20 6" />
          </svg>
          <span style={{marginLeft: 10}}>ramen-metadata</span>
          <div style={{marginTop: 14, opacity: aCdp}}>
            <Pill text="PV + PVC definitions" color={C.s3} size={15} />
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
            opacity: aGit,
            borderRadius: 14,
            border: `2px solid ${C.text}55`,
            background: C.panel,
            padding: 16,
            fontFamily: mono,
            fontSize: 15,
            color: C.dim,
            boxShadow: H('1.3', 0.02, 0.3) ? `0 0 40px ${C.text}55` : undefined,
          }}
        >
          <div style={{fontFamily: sans, fontWeight: 700, fontSize: 20, color: C.text}}>Git</div>
          <div style={{marginTop: 8, color: C.text}}>elsapassaro/ramendr-starter-kit</div>
          <div style={{marginTop: 6}}>branch ocp-4.22-rhdr-dell</div>
          <div style={{marginTop: 6}}>clusters/dell-s4/workloads/</div>
          <div style={{marginTop: 4, paddingLeft: 14}}>datavolumes.yaml</div>
          <div style={{paddingLeft: 14}}>virtualmachine.yaml</div>
          <div style={{paddingLeft: 14}}>service.yaml</div>
          <div style={{marginTop: 6, color: C.amber}}>no namespace.yaml</div>
        </div>
      ) : null}

      {/* hub cards */}
      <Card x={card.drpc[0]} y={card.drpc[1]} w={W} kind="DRPlacementControl" name="dell-vm-drpc" lines={['policy dr-policy-15m', 'pvcSelector drprotection=true']} appear={aDrpc} hl={hDrpc} />
      <Card
        x={card.placement[0]}
        y={card.placement[1]}
        w={W}
        kind="Placement"
        name="dell-vm-placement"
        lines={[<span style={{color: H('1.4', 0.05, 0.6) ? C.amber : C.dim}}>scheduling-disable: "true"</span>]}
        appear={aPl}
        hl={hPlacement}
      />
      <Card x={card.appset[0]} y={card.appset[1]} w={W} kind="ApplicationSet" name="dell-vm-workload" lines={['clusterDecisionResource', 'requeueAfterSeconds 180']} appear={aSet} hl={hSet} />
      <Card x={card.pd[0]} y={card.pd[1]} w={290} kind="PlacementDecision" name="dell-vm-placement-decision-1" lines={[<Pill text="spoke-1" color={C.spoke1} size={14} />]} appear={aPd} hl={hPd} />
      <Card x={card.drpolicy[0]} y={card.drpolicy[1]} w={300} kind="DRPolicy" name="dr-policy-15m" color={C.orange} lines={['cluster-scoped', 'schedulingInterval 15m']} appear={aPol} hl={H('1.3', 0.6, 0.72)} />
      <Card x={card.app1[0]} y={card.app1[1]} w={W} kind="Application" name="dell-vm-workload-spoke-1" lines={['skip-reconcile (hub)']} appear={aApp1} hl={H('1.5', 0.55, 0.8) + H('1.6', 0.0, 0.35)} />

      {/* hub controllers */}
      <Chip p={[450, 540]} label="Ramen hub operator" appear={aRamenHub} hl={H('1.4', 0.36, 0.9)} color={C.orange} />
      <Chip p={[720, 540]} label="ACM scheduler" appear={aSched} off={T('1.4', 0.25, 0.3) > 0.5} color={C.blue} />
      <Chip p={[990, 540]} label="ApplicationSet controller" w={280} appear={aSetCtrl} hl={H('1.5', 0.05, 0.6)} color={C.pink} />
      <Chip p={[1300, 540]} label="propagation controller" w={270} appear={aProp} hl={H('1.6', 0.3, 0.6)} color={C.cyan} />

      {/* spoke-1 controllers */}
      <Chip p={spoke.chip(0, 1)} label="work agent" appear={Math.max(aSpokeChips, A('2.1', 0.1))} hl={H('2.1', 0.3, 0.55)} color={C.cyan} />
      <Chip p={spoke.chip(1, 1)} label="Ramen (VRG ctrl)" appear={A('2.1', 0.2)} hl={H('2.2', 0.0, 0.7)} color={C.orange} />
      <Chip p={spoke.chip(2, 1)} label="csi-addons + PowerStore CSI" w={250} appear={A('2.3', 0.0)} hl={H('2.3', 0.0, 0.45)} color={C.amber} />
      <Chip p={spoke.chip(3, 1)} label="Argo CD (spoke)" w={230} appear={aSpokeChips} hl={H('1.6', 0.55, 0.95)} color={C.pink} />
      {/* spoke-0 controllers (same stack) */}
      <Chip p={spoke.chip(0, 0)} label="work agent" appear={A('2.1', 0.1)} color={C.cyan} />
      <Chip p={spoke.chip(1, 0)} label="Ramen (VRG ctrl)" appear={A('2.1', 0.2)} color={C.orange} />
      <Chip p={spoke.chip(2, 0)} label="csi-addons + PowerStore CSI" w={250} appear={A('2.3', 0.0)} color={C.amber} />
      <Chip p={spoke.chip(3, 0)} label="Argo CD (spoke)" w={230} appear={aSpokeChips} color={C.pink} />

      {/* spoke-1 workload */}
      <Card x={spoke.vm(1)[0]} y={spoke.vm(1)[1]} w={W} kind="VirtualMachine" name={s1Name} lines={['RHEL 9 · PostgreSQL 16', 'HammerDB TPC-C writer']} appear={aWork} hl={hVm} />
      <Card
        x={spoke.pvcR(1)[0]}
        y={spoke.pvcR(1)[1]}
        w={W}
        kind="PersistentVolumeClaim"
        name="…-rootdisk"
        lines={['35Gi · powerstore-sc', <span style={{opacity: aLbl, color: C.amber}}>drprotection=true</span>]}
        appear={aDisks}
        hl={hDisks}
        badge={aFin > 0 ? <Pill text="pvc-vr-protection" color={C.orange} appear={aFin} size={12} /> : undefined}
      />
      <Card
        x={spoke.pvcD(1)[0]}
        y={spoke.pvcD(1)[1]}
        w={W}
        kind="PersistentVolumeClaim"
        name="…-datadisk"
        lines={['20Gi · powerstore-sc', <span style={{opacity: aLbl, color: C.amber}}>drprotection=true</span>]}
        appear={aDisks}
        hl={hDisks}
        badge={aFin > 0 ? <Pill text="pvc-vr-protection" color={C.orange} appear={aFin} size={12} /> : undefined}
      />
      <Card
        x={spoke.vrg(1)[0]}
        y={spoke.vrg(1)[1]}
        w={W + 20}
        kind="VolumeReplicationGroup"
        name="dell-vm-drpc"
        lines={[<Cond k="state" v="Primary" ok />, aCdp > 0 ? <Cond k="ClusterDataProtected" v="True" ok flash={H('2.4', 0.6, 0.9)} /> : <span />]}
        appear={aVrg}
        hl={H('2.1', 0.2, 0.5) + H('2.2', 0.0, 0.35)}
      />
      <Card x={spoke.vrR(1)[0]} y={spoke.vrR(1)[1]} w={W - 10} kind="VolumeReplication" name="…-rootdisk" lines={[<Cond k="state" v="primary" ok />, 'powerstore-vrc-15m']} appear={aVr} hl={H('2.2', 0.65, 1) + H('2.3', 0.05, 0.3)} />
      <Card x={spoke.vrD(1)[0]} y={spoke.vrD(1)[1]} w={W - 10} kind="VolumeReplication" name="…-datadisk" lines={[<Cond k="state" v="primary" ok />, 'powerstore-vrc-15m']} appear={aVr} hl={H('2.2', 0.65, 1) + H('2.3', 0.05, 0.3)} />

      {/* spoke-0 secondary VRG */}
      <Card x={spoke.vrg(0)[0]} y={spoke.vrg(0)[1]} w={W + 20} kind="VolumeReplicationGroup" name="dell-vm-drpc" lines={[<Cond k="state" v="Secondary" ok={null} />]} appear={aVrg} hl={H('2.1', 0.35, 0.6)} />

      {/* array volumes */}
      <Volume x={L.vsaB.x + 40} y={L.vsaB.y + 60} name="rootdisk volume" role="source" roleColor={C.green} appear={aVol} hl={H('2.3', 0.38, 0.6)} />
      <Volume x={L.vsaB.x + 400} y={L.vsaB.y + 60} name="datadisk volume" role="source" roleColor={C.green} appear={aVol} hl={H('2.3', 0.38, 0.6)} />
      <Volume x={L.vsaA.x + 40} y={L.vsaA.y + 60} name="rootdisk replica" role="destination · read-only" roleColor={C.amber} appear={aVol} />
      <Volume x={L.vsaA.x + 400} y={L.vsaA.y + 60} name="datadisk replica" role="destination · read-only" roleColor={C.amber} appear={aVol} />

      {/* ---------- connections (SVG layer on top) ---------- */}
      <svg width={2400} height={1500} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* array link */}
        <Flow a={[L.vsaB.x + L.vsaB.w, L.vsaB.y + 95]} b={[L.vsaA.x, L.vsaA.y + 95]} bend="straight" kind="data" draw={aLink} label={after('2.3') ? 'async · sync every ~12 min' : 'async replication'} flowT={after('2.3') ? loop(150) : undefined} packets={2} width={4} />
        {/* spoke to array NVMe */}
        <Flow a={[L.s1.x + 550, L.s1.y + L.s1.h]} b={[L.vsaB.x + 380, L.vsaB.y]} bend="straight" kind="data" draw={A('1.1', 0.7)} label="NVMe/TCP" opacity={0.75} />
        <Flow a={[L.s0.x + 550, L.s0.y + L.s0.h]} b={[L.vsaA.x + 380, L.vsaA.y]} bend="straight" kind="data" draw={A('1.1', 0.74)} label="NVMe/TCP" opacity={0.75} />

        {/* hub references */}
        <Flow a={mid(card.drpc, W, 40)} b={mid(card.placement, 0, 40)} bend="h" kind="ref" draw={T('1.3', 0.52, 0.6)} />
        <Flow a={mid(card.drpc, W - 20, 130)} b={mid(card.drpolicy, 0, 50)} bend="h" kind="ref" draw={T('1.3', 0.62, 0.7)} opacity={Math.max(K('1.3'), 0.0)} />
        <Flow a={mid(card.placement, W / 2, 110)} b={mid(card.pd, W / 2, 0)} bend="v" kind="ref" draw={T('1.3', 0.84, 0.92)} label="decision" />
        {/* Ramen writes PlacementDecision */}
        <Flow a={[580, 540]} b={mid(card.pd, 0, 70)} bend="h" kind="reconcile" draw={T('1.4', 0.42, 0.55)} label="writes" opacity={K('1.4')} />
        {/* AppSet reads PD, generates app */}
        <Flow a={mid(card.appset, 0, 110)} b={mid(card.pd, W, 50)} bend="h" kind="observe" draw={T('1.5', 0.25, 0.35)} label="polls / 180 s" opacity={K('1.5')} />
        <Flow a={mid(card.appset, W, 50)} b={mid(card.app1, 0, 50)} bend="h" kind="reconcile" draw={T('1.5', 0.55, 0.62)} label={is('1.5') ? 'generates' : undefined} />
        {/* app delivered to spoke-1 Argo CD */}
        <Flow a={mid(card.app1, W / 2, 100)} b={[spoke.chip(3, 1)[0] + 115, spoke.chip(3, 1)[1]]} bend="v" kind="delivery" draw={T('1.6', 0.3, 0.45)} opacity={K('1.6')} />
        <Envelope a={mid(card.app1, W / 2, 100)} b={[spoke.chip(3, 1)[0] + 115, spoke.chip(3, 1)[1]]} t={is('1.6') ? T('1.6', 0.35, 0.58) : 0} label="ManifestWork (Application)" />
        {/* git to spoke argo */}
        <Flow a={[L.git.x + 200, L.git.y + 300]} b={[spoke.chip(3, 1)[0] + 30, spoke.chip(3, 1)[1]]} bend="v" kind="ref" draw={T('1.6', 0.6, 0.72)} label="pulls manifests" opacity={K('1.6')} />
        {/* argo syncs workload */}
        <Flow a={[spoke.chip(3, 1)[0] + 60, spoke.chip(3, 1)[1] + 46]} b={mid(spoke.vm(1), W, 40)} bend="v" kind="reconcile" draw={T('1.6', 0.74, 0.86)} label="prune · selfHeal" opacity={K('1.6')} />

        {/* 2.1 VRG ManifestWorks + MCV, written/read by the Ramen hub operator */}
        <Flow a={[520, 586]} b={mid(spoke.vrg(1), 130, 0)} bend="v" kind="delivery" draw={T('2.1', 0.18, 0.3)} opacity={K('2.1')} />
        <Flow a={[620, 586]} b={mid(spoke.vrg(0), 130, 0)} bend="v" kind="delivery" draw={T('2.1', 0.3, 0.42)} opacity={K('2.1')} />
        <Envelope a={[520, 586]} b={mid(spoke.vrg(1), 130, 0)} t={is('2.1') ? T('2.1', 0.2, 0.36) : 0} label="ManifestWork (VRG Primary)" />
        <Envelope a={[620, 586]} b={mid(spoke.vrg(0), 130, 0)} t={is('2.1') ? T('2.1', 0.32, 0.48) : 0} label="ManifestWork (VRG Secondary)" />
        <Flow a={mid(spoke.vrg(1), 230, 0)} b={[470, 586]} bend="v" kind="observe" draw={T('2.1', 0.72, 0.85)} opacity={K('2.1')} label="ManagedClusterView" labelAt={0.35} />
        <Flow a={mid(spoke.vrg(0), 30, 0)} b={[670, 586]} bend="v" kind="observe" draw={T('2.1', 0.75, 0.88)} opacity={K('2.1')} />

        {/* 2.2 VRG selects PVCs, creates VRs */}
        <Flow a={mid(spoke.vrg(1), 0, 60)} b={mid(spoke.pvcD(1), W / 2, 0)} bend="h" kind="reconcile" draw={T('2.2', 0.1, 0.25)} opacity={K('2.2')} label="selects by label" />
        <Flow a={mid(spoke.vrg(1), 130, 110)} b={mid(spoke.vrR(1), W / 2 - 5, 0)} bend="v" kind="reconcile" draw={T('2.2', 0.62, 0.72)} opacity={K('2.2')} />
        <Flow a={mid(spoke.vrg(1), 200, 110)} b={mid(spoke.vrD(1), W / 2 - 5, 0)} bend="v" kind="reconcile" draw={T('2.2', 0.64, 0.74)} opacity={K('2.2')} />

        {/* 2.3 VR to csi to array */}
        <Flow a={[spoke.chip(2, 1)[0] + 125, spoke.chip(2, 1)[1] + 46]} b={mid(spoke.vrD(1), 115, 0)} bend="v" kind="reconcile" draw={T('2.3', 0.05, 0.18)} opacity={K('2.3')} label="gRPC EnableVolumeReplication" labelAt={0.2} />
        <Flow a={mid(spoke.vrR(1), 115, 120)} b={[L.vsaB.x + 200, L.vsaB.y + 60]} bend="v" kind="data" draw={T('2.3', 0.25, 0.38)} opacity={K('2.3')} />
        <Flow a={mid(spoke.vrD(1), 115, 120)} b={[L.vsaB.x + 560, L.vsaB.y + 60]} bend="v" kind="data" draw={T('2.3', 0.27, 0.4)} opacity={K('2.3')} />
        {aSyncLink > 0 && is('2.3') ? (
          <g opacity={aSyncLink}>
            {[0, 1].map((i) => (
              <Flow key={i} a={[L.vsaB.x + 200 + i * 360, L.vsaB.y + 140]} b={[L.vsaA.x + 200 + i * 360, L.vsaA.y + 140]} bend="v" kind="data" draw={1} flowT={loop(120 + i * 7)} packets={3} width={2.5} opacity={0.8} />
            ))}
          </g>
        ) : null}

        {/* 2.4 metadata to S3 */}
        <Flow a={mid(spoke.vrg(1), 130, 0)} b={[1800, 290]} bend="v" kind="delivery" color={C.s3} draw={T('2.4', 0.3, 0.45)} opacity={K('2.4')} label="upload PV/PVC YAML" />
        <Envelope a={mid(spoke.vrg(1), 130, 0)} b={[1800, 290]} t={is('2.4') ? T('2.4', 0.38, 0.6) : 0} label="PV + PVC" color={C.s3} />
      </svg>
    </div>
  );
};
