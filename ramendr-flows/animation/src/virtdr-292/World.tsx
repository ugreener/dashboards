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
const FOCUS: Record<string, string[]> = {
  '1.2': ['vm1', 'pvc1'],
  '1.3': ['git', 'drpc', 'placement', 'appset', 'pd', 'drpolicy'],
  '1.4': ['placement', 'pd', 'ramenHub', 'sched'],
  '1.5': ['appset', 'appsetCtrl', 'pd', 'app1'],
  '1.6': ['app1', 'prop', 'argo1', 'git', 'vm1', 'pvc1'],
  '2.1': ['drpc', 'ramenHub', 'vrg1', 'vrg0', 'wa1', 'wa0'],
  '2.2': ['vrg1', 'ramen1', 'pvc1', 'vr1'],
  '2.3': ['vr1', 'csi1', 'vols'],
  '2.4': ['vrg1', 'pvc1', 'minio'],
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
  /** Focus 0..1 for an element key, blended across the beat boundary. */
  const prevId = bi > 0 ? c.order[bi - 1] : null;
  const fOf = (id: string | null, key: string) => {
    const set = id ? FOCUS[id] : undefined;
    return !set || set.includes(key) ? 1 : 0;
  };
  const blend = prog(c.f, -20, 20);
  const F = (key: string) => lerp(fOf(prevId, key), fOf(c.id, key), blend);
  return {A, H, T, K, F, is, after, bi};
};

// ---- layout (world units, 2400 x 1500) ----
export const L = {
  hub: {x: 380, y: 40, w: 1980, h: 640},
  nsHub: {x: 410, y: 100, w: 1530, h: 420},
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
  pd: [790, 335] as P,
  drpolicy: [1995, 340] as P,
};
const sp = (x: number, y: number, s: 0 | 1): P => [x + (s === 0 ? DX : 0), y];
const spoke = {
  vm: (s: 0 | 1) => sp(90, 890, s),
  vrg: (s: 0 | 1) => sp(620, 890, s),
  pvcR: (s: 0 | 1) => sp(90, 1085, s),
  pvcD: (s: 0 | 1) => sp(355, 1085, s),
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
      <svg width={36} height={42} viewBox="0 0 34 40">
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

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const {A, H, T, K, F, is, after} = mk(c);
  const loop = (period: number) => (c.g % period) / period;
  // secondary card lines only when the camera is close enough to read them
  const detail = interpolate(c.zoom, [0.8, 1.0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

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

  const hDisks = H('1.2', 0.4, 0.75) + H('2.2', 0.05, 0.3);
  const fMinio = F('minio');

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
      <Region b={L.hub} title="hub" sub="edge36 · ACM 2.17 · Ramen hub · OpenShift GitOps" color={C.hub} opacity={aHub} />
      <Region b={L.s1} title="spoke-1" sub="edge97 · OCP 4.22.9 · Virtualization" color={C.spoke1} opacity={aS1} />
      <Region b={L.s0} title="spoke-0" sub="edge95 · OCP 4.22.9 · Virtualization" color={C.spoke0} opacity={aS0} />
      <Region b={L.vsaB} title="VSA-B" sub="PowerStore" color={C.array} opacity={aArr} small />
      <Region b={L.vsaA} title="VSA-A" sub="PowerStore" color={C.array} opacity={aArr} small />
      <Region b={L.minio} title="minio" sub="S3" color={C.s3} opacity={aMinio * (0.3 + 0.7 * fMinio)} small glow={H('2.4', 0.4, 0.9) * 0.6} />
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
            boxShadow: H('1.3', 0.02, 0.3) ? `0 0 40px ${C.text}55` : undefined,
          }}
        >
          <div style={{fontFamily: sans, fontWeight: 700, fontSize: 24, color: C.text}}>Git</div>
          <div style={{marginTop: 8, color: C.text, overflowWrap: 'break-word'}}>elsapassaro/ ramendr-starter-kit</div>
          <div style={{marginTop: 8}}>ocp-4.22-rhdr-dell</div>
          <div style={{marginTop: 8}}>clusters/dell-s4/workloads/</div>
          <div style={{marginTop: 4, paddingLeft: 14, opacity: detail}}>datavolumes.yaml</div>
          <div style={{paddingLeft: 14, opacity: detail}}>virtualmachine.yaml</div>
          <div style={{paddingLeft: 14, opacity: detail}}>service.yaml</div>
          <div style={{marginTop: 8, color: C.amber}}>no namespace.yaml</div>
        </div>
      ) : null}

      {/* hub cards */}
      <Card x={card.drpc[0]} y={card.drpc[1]} kind="DRPlacementControl" name="dell-vm-drpc" lines={['preferredCluster spoke-0', 'pvcSelector drprotection=true']} appear={aDrpc} hl={H('1.3', 0.48, 0.62) + H('2.1', 0.05, 0.3)} focus={F('drpc')} detail={detail} />
      <Card
        x={card.placement[0]}
        y={card.placement[1]}
        kind="Placement"
        name="dell-vm-placement"
         lines={[<span style={{color: H('1.4', 0.05, 0.6) ? C.amber : C.dim}}>ACM scheduler disabled</span>]}
        appear={aPl}
        hl={H('1.3', 0.38, 0.5) + H('1.4', 0.05, 0.95)}
        focus={F('placement')}
        detail={Math.max(detail, H('1.4', 0.0, 1))}
      />
      <Card x={card.appset[0]} y={card.appset[1]} kind="ApplicationSet" name="dell-vm-workload" lines={['clusterDecisionResource', 'requeueAfterSeconds 180']} appear={aSet} hl={H('1.3', 0.7, 0.82) + H('1.5', 0.0, 0.6)} focus={F('appset')} detail={detail} />
       <Card x={card.pd[0]} y={card.pd[1]} w={330} kind="PlacementDecision" name="Selected clusters" lines={['For dell-vm-placement', <Pill text="spoke-1 (recorded run)" color={C.spoke1} size={16} />]} appear={aPd} hl={H('1.3', 0.82, 1) + H('1.4', 0.45, 0.9) + H('1.5', 0.25, 0.55)} focus={F('pd')} />
      <Card x={card.drpolicy[0]} y={card.drpolicy[1]} w={330} kind="DRPolicy" name="dr-policy-15m" color={C.orange} lines={['cluster-scoped', 'schedulingInterval 15m']} appear={aPol} hl={H('1.3', 0.6, 0.72)} focus={F('drpolicy')} detail={detail} />
      <Card x={card.app1[0]} y={card.app1[1]} w={320} kind="Application" name="dell-vm-workload-spoke-1" lines={['skip-reconcile (hub copy)']} appear={aApp1} hl={H('1.5', 0.55, 0.8) + H('1.6', 0.0, 0.35)} focus={F('app1')} detail={detail} />

      {/* hub controllers */}
      <Chip p={[HUBCHIP.ramen[0], 575]} w={HUBCHIP.ramen[1]} label="Ramen hub operator" appear={aRamenHub} hl={H('1.4', 0.36, 0.9) + H('2.1', 0.15, 0.5)} color={C.orange} focus={F('ramenHub')} />
      <Chip p={[HUBCHIP.sched[0], 575]} w={HUBCHIP.sched[1]} label="ACM scheduler" appear={aSched} off={T('1.4', 0.25, 0.3) > 0.5} color={C.blue} focus={F('sched')} />
      <Chip p={[HUBCHIP.appset[0], 575]} w={HUBCHIP.appset[1]} label="ApplicationSet controller" appear={aSetCtrl} hl={H('1.5', 0.05, 0.6)} color={C.pink} focus={F('appsetCtrl')} />
      <Chip p={[HUBCHIP.prop[0], 575]} w={HUBCHIP.prop[1]} label="propagation controller" appear={aProp} hl={H('1.6', 0.3, 0.6)} color={C.cyan} focus={F('prop')} />

      {/* spoke controllers */}
      {([1, 0] as const).map((s) => (
        <React.Fragment key={s}>
          <Chip p={chip(0, s)} w={CHIP_W[0]} label="work agent" appear={s === 1 ? Math.max(aSpokeChips, A('2.1', 0.1)) : A('2.1', 0.1)} hl={s === 1 ? H('2.1', 0.3, 0.55) : H('2.1', 0.42, 0.62)} color={C.cyan} focus={F(`wa${s}`)} />
          <Chip p={chip(1, s)} w={CHIP_W[1]} label="Ramen VRG ctrl" appear={A('2.1', 0.2)} hl={s === 1 ? H('2.2', 0.0, 0.7) : 0} color={C.orange} focus={F(`ramen${s}`)} />
          <Chip p={chip(2, s)} w={CHIP_W[2]} label="csi-addons + CSI" appear={A('2.3', 0.0)} hl={s === 1 ? H('2.3', 0.0, 0.45) : 0} color={C.amber} focus={F(`csi${s}`)} />
          <Chip p={chip(3, s)} w={CHIP_W[3]} label="Argo CD (spoke)" appear={aSpokeChips} hl={s === 1 ? H('1.6', 0.55, 0.95) : 0} color={C.pink} focus={F(`argo${s}`)} />
        </React.Fragment>
      ))}

      {/* spoke-1 workload */}
      <Card x={spoke.vm(1)[0]} y={spoke.vm(1)[1]} kind="VirtualMachine" name="hammerdb-rhel9" lines={['RHEL 9 · PostgreSQL 16', 'HammerDB TPC-C writer']} appear={aWork} hl={H('1.2', 0.05, 0.4)} focus={F('vm1')} detail={detail} />
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
            lines={[d === 'rootdisk' ? '35Gi · powerstore-sc' : '20Gi · powerstore-sc', <span style={{opacity: aLbl, color: C.amber}}>drprotection=true</span>]}
            appear={aDisks}
            hl={hDisks}
            focus={F('pvc1')}
            detail={Math.max(detail, H('1.2', 0.4, 1))}
             badge={aFin > 0 ? <Pill text="Protected PVC" color={C.orange} appear={aFin} size={14} /> : undefined}
          />
        );
      })}
      <Card
        x={spoke.vrg(1)[0]}
        y={spoke.vrg(1)[1]}
        w={320}
        kind="VolumeReplicationGroup"
        name="dell-vm-drpc"
        lines={[<Cond k="state" v="Primary" ok />, aCdp > 0 ? <Cond k="ClusterDataProtected" v="True" ok flash={H('2.4', 0.6, 0.9)} /> : <span />]}
        appear={aVrg}
        hl={H('2.1', 0.2, 0.5) + H('2.2', 0.0, 0.35) + H('2.4', 0.2, 0.7)}
        focus={F('vrg1')}
        detail={Math.max(detail, aCdp * H('2.4', 0.55, 1))}
      />
      {(['rootdisk', 'datadisk'] as const).map((d) => {
        const p = d === 'rootdisk' ? spoke.vrR(1) : spoke.vrD(1);
        return (
          <Card key={d} x={p[0]} y={p[1]} w={250} kind="VolumeReplication" name={`hammerdb-rhel9-${d}`} lines={[<Cond k="state" v="primary" ok />, 'powerstore-vrc-15m']} appear={aVr} hl={H('2.2', 0.65, 1) + H('2.3', 0.05, 0.3)} focus={F('vr1')} detail={detail} />
        );
      })}

      {/* spoke-0 secondary VRG */}
      <Card x={spoke.vrg(0)[0]} y={spoke.vrg(0)[1]} w={320} kind="VolumeReplicationGroup" name="dell-vm-drpc" lines={[<Cond k="state" v="Secondary" ok={null} />]} appear={aVrg} hl={H('2.1', 0.35, 0.6)} focus={F('vrg0')} detail={Math.max(detail, H('2.1', 0.3, 1))} />

      {/* array volumes */}
       <Volume x={L.vsaB.x + 40} y={L.vsaB.y + 42} name="1282bca9-29aa-416f-b890-2a29a44e3fac" role="root disk · source" roleColor={C.green} appear={aVol} hl={H('2.3', 0.38, 0.6)} focus={F('vols')} />
       <Volume x={L.vsaB.x + 440} y={L.vsaB.y + 42} name="e5ecb946-25b6-4f1a-afe0-8173392f2b7d" role="data disk · source" roleColor={C.green} appear={aVol} hl={H('2.3', 0.38, 0.6)} focus={F('vols')} />
       <Volume x={L.vsaA.x + 40} y={L.vsaA.y + 42} name="9e3b6608-30f4-42e8-aaca-4f774fe7662a" role="root disk · replica" roleColor={C.amber} appear={aVol} focus={F('vols')} />
       <Volume x={L.vsaA.x + 440} y={L.vsaA.y + 42} name="41b0880b-916d-42a1-b4b6-a55f9c853c91" role="data disk · replica" roleColor={C.amber} appear={aVol} focus={F('vols')} />

      {/* ---------- connections ---------- */}
      <svg width={2400} height={1500} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* array link */}
        <Flow a={[L.vsaB.x + L.vsaB.w, L.vsaB.y + 84]} b={[L.vsaA.x, L.vsaA.y + 84]} bend="straight" kind="data" draw={aLink} label={after('2.3') ? 'async · every ~12 min' : 'async replication'} flowT={after('2.3') ? loop(150) : undefined} packets={2} width={4} />
        {/* spoke to array NVMe */}
        <Flow a={[L.s1.x + 570, L.s1.y + L.s1.h]} b={[L.vsaB.x + 420, L.vsaB.y]} bend="straight" kind="data" draw={A('1.1', 0.7)} label="NVMe/TCP" opacity={0.75} labelAt={0.45} />
        <Flow a={[L.s0.x + 570, L.s0.y + L.s0.h]} b={[L.vsaA.x + 420, L.vsaA.y]} bend="straight" kind="data" draw={A('1.1', 0.74)} label="NVMe/TCP" opacity={0.75} labelAt={0.45} />

        {/* hub references */}
        <Flow a={mid(card.drpc, W, 45)} b={mid(card.placement, 0, 45)} bend="h" kind="ref" draw={T('1.3', 0.52, 0.6)} />
        <Flow a={mid(card.drpc, W - 30, 150)} b={mid(card.drpolicy, 0, 55)} bend="h" kind="ref" draw={T('1.3', 0.62, 0.7)} label="drPolicyRef" labelAt={0.72} opacity={K('1.3')} />
        <Flow a={mid(card.placement, W / 2, 120)} b={mid(card.pd, W / 2, 0)} bend="v" kind="ref" draw={T('1.3', 0.84, 0.92)} label="decision" />
        {/* Ramen writes PlacementDecision */}
        <Flow a={hubChip('ramen', 0.6)} b={mid(card.pd, 0, 75)} bend="v" kind="reconcile" draw={T('1.4', 0.42, 0.55)} label="only writer" opacity={K('1.4')} />
        {/* AppSet reads PD, generates app */}
        <Flow a={mid(card.appset, 60, 125)} b={mid(card.pd, 330, 55)} bend="v" kind="observe" draw={T('1.5', 0.25, 0.35)} label="polls every 180 s" labelAt={0.4} opacity={K('1.5')} />
        <Flow a={mid(card.appset, W, 55)} b={mid(card.app1, 0, 55)} bend="h" kind="reconcile" draw={T('1.5', 0.55, 0.62)} />
        {/* app delivered to spoke-1 Argo CD */}
        <Flow a={mid(card.app1, 160, 110)} b={chipMid(3, 1)} bend="v" kind="delivery" draw={T('1.6', 0.3, 0.45)} opacity={K('1.6')} />
        <Envelope a={mid(card.app1, 160, 110)} b={chipMid(3, 1)} t={is('1.6') ? T('1.6', 0.35, 0.58) : 0} label="ManifestWork (Application)" />
        <Flow a={[L.git.x + 170, L.git.y + 345]} b={chipMid(3, 1, 0)} bend="v" kind="ref" draw={T('1.6', 0.6, 0.72)} label="pulls manifests" labelAt={0.12} opacity={K('1.6')} />
        <Flow a={chipMid(3, 1, 50)} b={mid(spoke.vm(1), W, 50)} bend="v" kind="reconcile" draw={T('1.6', 0.74, 0.86)} label="syncs · prune · selfHeal" labelAt={0.55} opacity={K('1.6')} />

        {/* 2.1 VRG ManifestWorks delivered to each spoke's work agent, which applies the VRG; status returns via ManagedClusterView */}
        <Flow a={hubChip('ramen', 0.3, 50)} b={chipMid(0, 1)} bend="v" kind="delivery" draw={T('2.1', 0.18, 0.3)} opacity={K('2.1')} />
        <Flow a={hubChip('ramen', 0.75, 50)} b={chipMid(0, 0)} bend="v" kind="delivery" draw={T('2.1', 0.3, 0.42)} opacity={K('2.1')} />
        <Envelope a={hubChip('ramen', 0.3, 50)} b={chipMid(0, 1)} t={is('2.1') ? T('2.1', 0.2, 0.34) : 0} label="ManifestWork: VRG Primary" />
        <Envelope a={hubChip('ramen', 0.75, 50)} b={chipMid(0, 0)} t={is('2.1') ? T('2.1', 0.32, 0.46) : 0} label="ManifestWork: VRG Secondary" />
        <Flow a={chipMid(0, 1, 50)} b={mid(spoke.vrg(1), 40, 0)} bend="v" kind="reconcile" draw={T('2.1', 0.34, 0.42)} opacity={K('2.1')} label="applies" labelAt={0.45} />
        <Flow a={chipMid(0, 0, 50)} b={mid(spoke.vrg(0), 40, 0)} bend="v" kind="reconcile" draw={T('2.1', 0.46, 0.54)} opacity={K('2.1')} label="applies" labelAt={0.45} />
        <Flow a={[chip(0, 1)[0] + 30, chip(0, 1)[1]]} b={hubChip('ramen', 0.08, 50)} bend="v" kind="observe" draw={T('2.1', 0.72, 0.85)} opacity={K('2.1')} label="status via ManagedClusterView" labelAt={0.3} labelDx={40} />
        <Flow a={[chip(0, 0)[0] + 30, chip(0, 0)[1]]} b={hubChip('ramen', 0.95, 50)} bend="v" kind="observe" draw={T('2.1', 0.75, 0.88)} opacity={K('2.1')} />

        {/* 2.2 VRG selects PVCs, creates VRs */}
        <Flow a={mid(spoke.vrg(1), 0, 70)} b={mid(spoke.pvcD(1), 125, 0)} bend="h" kind="reconcile" draw={T('2.2', 0.1, 0.25)} opacity={K('2.2') * (1 - T('2.2', 0.55, 0.6))} label="selects drprotection=true" labelAt={0.5} labelDx={-190} labelDy={-10} />
        <Flow a={mid(spoke.vrg(1), 120, 125)} b={mid(spoke.vrR(1), 125, 0)} bend="v" kind="reconcile" draw={T('2.2', 0.62, 0.72)} opacity={K('2.2')} label="creates" labelAt={0.5} />
        <Flow a={mid(spoke.vrg(1), 220, 125)} b={mid(spoke.vrD(1), 125, 0)} bend="v" kind="reconcile" draw={T('2.2', 0.64, 0.74)} opacity={K('2.2')} />

        {/* 2.3 VR to csi to array */}
        <Flow a={chipMid(2, 1, 50)} b={mid(spoke.vrD(1), 125, 0)} bend="v" kind="reconcile" draw={T('2.3', 0.05, 0.18)} opacity={K('2.3')} label="watches VolumeReplication" labelAt={0.62} labelDx={-60} />
        <Flow a={mid(spoke.vrR(1), 125, 135)} b={[L.vsaB.x + 220, L.vsaB.y + 42]} bend="v" kind="data" draw={T('2.3', 0.25, 0.38)} opacity={K('2.3')} label="gRPC: enable replication" labelAt={0.5} />
        <Flow a={mid(spoke.vrD(1), 125, 135)} b={[L.vsaB.x + 620, L.vsaB.y + 42]} bend="v" kind="data" draw={T('2.3', 0.27, 0.4)} opacity={K('2.3')} />
        {aSyncLink > 0 && is('2.3') ? (
          <g opacity={aSyncLink}>
            {[0, 1].map((i) => (
              <Flow key={i} a={[L.vsaB.x + 220 + i * 400, L.vsaB.y + 178]} b={[L.vsaA.x + 220 + i * 400, L.vsaA.y + 178]} bend="straight" kind="data" draw={1} flowT={loop(120 + i * 7)} packets={3} width={2.5} opacity={0.8} />
            ))}
          </g>
        ) : null}

        {/* 2.4 metadata to S3: up out of spoke-1, along the gap under the hub, into the bucket */}
        <Flow a={mid(spoke.vrg(1), 160, 0)} b={[1185, 712]} bend="v" kind="delivery" color={C.s3} draw={T('2.4', 0.3, 0.38)} opacity={K('2.4')} />
        <Flow a={[1185, 712]} b={[1990, 280]} bend="h" kind="delivery" color={C.s3} draw={T('2.4', 0.38, 0.48)} opacity={K('2.4')} label="uploads PV + PVC YAML" labelAt={0.1} labelDy={-6} />
        <Envelope a={[1185, 712]} b={[1990, 280]} bend="h" t={is('2.4') ? T('2.4', 0.4, 0.6) : 0} label="PV + PVC" color={C.s3} />
      </svg>
    </div>
  );
};
