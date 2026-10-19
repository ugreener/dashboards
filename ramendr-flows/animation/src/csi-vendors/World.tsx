import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; lines: string[]; box: Box; color: string};
export const NODES: Record<string, Node> = {
  csi: {kind: 'CSI Specification', name: 'container-storage-interface/spec', role: 'the standard contract for storage plug-ins', lines: ['document · public repository'], box: [130, 190, 540, 170], color: C.blue},
  addons: {kind: 'CSI-Addons Specification', name: 'csi-addons/spec', role: 'extends CSI with replication requests', lines: ['document · public repository'], box: [900, 190, 540, 170], color: C.purple},
  ramen: {kind: 'DR Orchestrator', name: 'RamenDR/ramen', role: 'decides when recovery operations run', lines: ['software · runs on the clusters'], box: [130, 640, 540, 170], color: C.green},
  k8saddons: {kind: 'Kubernetes implementation', name: 'csi-addons/kubernetes-csi-addons', role: 'speaks the add-ons contract inside the cluster', lines: ['software · controller + sidecars'], box: [900, 640, 540, 175], color: C.cyan},
  csm: {kind: 'Dell modules', name: 'Dell CSM Replication', role: 'enterprise add-ons: authz, resiliency, observability', lines: ['Dell Container Storage Modules'], box: [1720, 190, 460, 180], color: C.orange},
  pstore_drv: {kind: 'Dell CSI driver', name: 'csi-powerstore', role: 'translates the contracts for PowerStore arrays', lines: ["Owen's builds · as drawn", 'CSI + add-ons sidecar'], box: [1720, 520, 460, 185], color: C.orange},
  pstore_hw: {kind: 'Storage array', name: 'PowerStore Array', role: 'Dell storage appliances', lines: ['PSa97b49e924cd · as drawn', 'PSdc7f3064c752 · as drawn'], box: [2240, 520, 430, 185], color: C.orange},
  rook: {kind: 'Operator', name: 'Rook', role: 'runs and manages a Ceph cluster on Kubernetes', lines: ['storage orchestration'], box: [1720, 990, 460, 165], color: C.red},
  ceph_drv: {kind: 'Ceph CSI driver', name: 'ceph-csi', role: 'translates the contracts for Ceph storage', lines: ['CSI + add-ons sidecar'], box: [1720, 1330, 460, 165], color: C.red},
  ceph_hw: {kind: 'Software storage', name: 'Ceph Cluster', role: 'RBD block disks and CephFS files', lines: ['grown by Rook on the cluster'], box: [2240, 1330, 430, 165], color: C.red},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const REGIONS: {key: string; b: {x: number; y: number; w: number; h: number}; title: string; sub?: string; color: string}[] = [
  {key: 'shared', b: {x: 60, y: 80, w: 1440, h: 800}, title: 'THE SHARED STACK', sub: 'from the first diagram', color: C.blue},
  {key: 'dell', b: {x: 1660, y: 80, w: 1020, h: 680}, title: 'DELL STACK', sub: 'appliance storage', color: C.orange},
  {key: 'rh', b: {x: 1660, y: 920, w: 1020, h: 680}, title: 'RED HAT STACK', sub: 'software storage', color: C.red},
];
export const REGION_OF: Record<string, string> = {csi: 'shared', addons: 'shared', k8saddons: 'shared', ramen: 'shared', csm: 'dell', pstore_drv: 'dell', pstore_hw: 'dell', rook: 'rh', ceph_drv: 'rh', ceph_hw: 'rh'};
export const TOPMOST: Record<string, string> = {shared: 'csi', dell: 'csm', rh: 'rook'};

export const FOCUS: Record<string, string[]> = {
  '1.1': ['csi', 'addons', 'k8saddons', 'ramen'], '1.2': ['csi'], '1.3': ['csi', 'addons'], '1.4': ['addons', 'k8saddons'], '1.5': ['k8saddons', 'ramen'],
  '1.6': ['csi', 'addons', 'k8saddons', 'ramen'],
  '3.1': ['csm', 'pstore_drv', 'pstore_hw'], '3.2': ['pstore_drv', 'pstore_hw'], '3.3': ['pstore_drv', 'pstore_hw'], '3.4': ['pstore_drv', 'pstore_hw'],
  '4.1': ['rook', 'ceph_drv', 'ceph_hw'], '4.2': ['rook', 'ceph_drv', 'ceph_hw'], '4.3': ['ceph_drv', 'ceph_hw'],
  '4.4': ['pstore_hw', 'ceph_hw'],
  '5.1': ['csi', 'pstore_drv', 'ceph_drv'],
  '5.2': ['csi', 'addons', 'k8saddons', 'pstore_drv', 'ceph_drv'],
  '5.3': Object.keys(NODES),
  '5.4': ['csi', 'addons', 'k8saddons', 'ramen'],
  '6.1': Object.keys(NODES), '6.2': Object.keys(NODES), '6.3': Object.keys(NODES),
};

type Edge = {
  d: string; label?: string; lx?: number; ly?: number; color: string; intro: string; src: string; dst: string; frac?: number;
  dashed?: boolean; end: [number, number]; ang: number; packets?: boolean; noArrow?: boolean; dot?: [number, number, number, number];
};
const EDGES: Record<string, Edge> = {
  // Shared half chain: CSI extends into csi-addons, implemented by kubernetes-csi-addons, consumed by Ramen.
  extends: {d: 'M675,275 L895,275', label: 'extends', lx: 785, ly: 232, color: C.purple, intro: '1.3', src: 'csi', dst: 'addons', dashed: true, end: [895, 275], ang: 0},
  implK8s: {d: 'M1170,365 L1170,635', label: 'implements', lx: 1170, ly: 500, color: C.blue, intro: '1.4', src: 'addons', dst: 'k8saddons', end: [1170, 635], ang: 90},
  consumed: {d: 'M895,725 L675,725', label: 'consumed by', lx: 785, ly: 725, color: C.green, intro: '1.5', src: 'k8saddons', dst: 'ramen', end: [675, 725], ang: 180},
  // Dell stack internals.
  csmLink: {d: 'M1950,375 L1950,512', color: C.dim, intro: '3.1', src: 'csm', dst: 'pstore_drv', dashed: true, end: [1950, 512], ang: 90, noArrow: true},
  pstoreCmd: {d: 'M2185,610 L2235,610', color: C.orange, intro: '3.1', src: 'pstore_drv', dst: 'pstore_hw', end: [2235, 610], ang: 0, packets: true, dot: [2185, 2235, 610, 0]},
  // Red Hat stack internals.
  rookLink: {d: 'M1950,1160 L1950,1322', color: C.dim, intro: '4.1', src: 'rook', dst: 'ceph_drv', dashed: true, end: [1950, 1322], ang: 90, noArrow: true},
  cephCmd: {d: 'M2185,1415 L2235,1415', color: C.orange, intro: '4.2', src: 'ceph_drv', dst: 'ceph_hw', end: [2235, 1415], ang: 0, packets: true, dot: [2185, 2235, 1415, 0]},
  // Cross arrows: the same three relationships, into both vendor stacks.
  xCsiPstore: {d: 'M400,182 C700,115 1500,115 1590,320 C1660,460 1780,500 1900,512', label: 'implements', lx: 1000, ly: 150, color: C.blue, intro: '5.1', src: 'csi', dst: 'pstore_drv', frac: 0.18, end: [1900, 512], ang: 74},
  xCsiCeph: {d: 'M400,178 C700,82 1500,82 1500,660 C1500,1250 1580,1305 1715,1335', label: 'implements', lx: 760, ly: 55, color: C.blue, intro: '5.1', src: 'csi', dst: 'ceph_drv', frac: 0.3, end: [1715, 1335], ang: 8},
  xAddonsPstore: {d: 'M1445,265 C1540,265 1640,400 1715,555', label: 'via sidecar', lx: 1540, ly: 360, color: C.blue, intro: '5.2', src: 'addons', dst: 'pstore_drv', frac: 0.16, dashed: true, end: [1715, 555], ang: 55},
  xAddonsCeph: {d: 'M1445,290 C1530,290 1530,950 1530,1250 C1530,1420 1620,1438 1715,1445', label: 'via sidecar', lx: 1580, ly: 1000, color: C.blue, intro: '5.2', src: 'addons', dst: 'ceph_drv', frac: 0.32, dashed: true, end: [1715, 1445], ang: 6},
  xK8sPstore: {d: 'M1445,715 C1560,715 1650,660 1715,625', label: 'gRPC', lx: 1570, ly: 762, color: C.cyan, intro: '5.2', src: 'k8saddons', dst: 'pstore_drv', frac: 0.52, end: [1715, 625], ang: -22},
  xK8sCeph: {d: 'M1170,820 C1170,1050 1400,1200 1530,1300 C1610,1380 1660,1395 1715,1400', label: 'gRPC', lx: 1450, ly: 1250, color: C.cyan, intro: '5.2', src: 'k8saddons', dst: 'ceph_drv', frac: 0.66, end: [1715, 1400], ang: 8},
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number); const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const keys = FOCUS[c.id] ?? [];
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : 0.08);
  const chapter = phase(c.id);
  const firstWorldBeat = c.id === '1.1';

  const edgeG = (key: string) => {
    const e = EDGES[key];
    if (!reached(c.id, e.intro)) return null;
    const introCh = phase(e.intro);
    const recap = chapter === 6;
    const focusOp = keys.length === 0 ? 1 : keys.includes(e.src) && keys.includes(e.dst) ? 1 : keys.includes(e.src) || keys.includes(e.dst) ? 0.35 : 0.15;
    const op = recap ? 0.9 : introCh === chapter ? focusOp : 0.24;
    const draw = c.id === e.intro ? prog(c.f, c.dur * (e.frac ?? 0.18), c.dur * (e.frac ?? 0.18) + 30) : 1;
    if (draw <= 0.01) return null;
    return (
      <g key={key} opacity={op}>
        <path d={e.d} stroke={e.color} strokeOpacity={0.16} strokeWidth={9} fill="none" pathLength={1} strokeDasharray={`${draw} 1`} />
        <path d={e.d} stroke={e.color} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={`${draw} 1`} strokeLinecap="round" style={e.dashed ? {strokeDasharray: '0.012 0.012', opacity: Math.min(1, draw * 1.6)} : undefined} />
        {!e.noArrow ? <polygon points="0,-8 15,0 0,8" fill={e.color} transform={`translate(${e.end[0]},${e.end[1]}) rotate(${e.ang})`} opacity={draw > 0.9 ? 1 : 0} /> : null}
        {e.packets && e.dot && draw >= 1 && (introCh === chapter || recap)
          ? [0, 1].map((i) => {
              const t = ((c.f % 130) / 130 + i / 2) % 1;
              const x = e.dot![0] + (e.dot![1] - e.dot![0]) * t;
              return <circle key={i} cx={x} cy={e.dot![2]} r={6} fill={e.color} opacity={Math.sin(t * Math.PI)} style={{filter: `drop-shadow(0 0 8px ${e.color})`}} />;
            })
          : null}
        {e.label && draw > 0.55 ? (
          <g transform={`translate(${e.lx},${e.ly})`}>
            <rect x={-e.label.length * 6.3 - 14} y={-19} width={e.label.length * 12.6 + 28} height={38} rx={19} fill={C.bg} stroke={e.color} strokeWidth={1.8} />
            <text x={0} y={7} textAnchor="middle" fill={e.color} fontFamily={mono} fontSize={20} fontWeight={600}>{e.label}</text>
          </g>
        ) : null}
      </g>
    );
  };

  return (
    <div style={{position: 'absolute', width: 2720, height: 1660}}>
      {REGIONS.map((r) => (
        <Region key={r.key} b={r.b} title={r.title} sub={r.sub} color={r.color} />
      ))}
      {Object.entries(NODES).map(([key, n], i) => {
        const appear = firstWorldBeat ? prog(c.f, -12 + i * 4, 32 + i * 4) : 1;
        return (
          <Card
            key={key}
            x={n.box[0]}
            y={n.box[1]}
            w={n.box[2]}
            kind={n.kind}
            name={n.name}
            role={n.role}
            lines={n.lines}
            appear={appear}
            focus={focus(key)}
            hl={keys.includes(key) ? 0.25 : 0}
            color={n.color}
            detail={Math.max(0, Math.min(1, (c.zoom - 0.65) / 0.2))}
          />
        );
      })}
      <svg width={2720} height={1660} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        {Object.keys(EDGES).map((k) => edgeG(k))}
        {chapter >= 5 ? (
          <text x={1360} y={1648} textAnchor="middle" fill={C.faint} fontFamily={sans} fontSize={22}>
            three relationships on the left, two vendors on the right, six arrows, zero exceptions
          </text>
        ) : null}
      </svg>
    </div>
  );
};
