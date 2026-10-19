import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; lines: string[]; box: Box; color: string};
export const NODES: Record<string, Node> = {
  csi: {kind: 'CSI Specification', name: 'container-storage-interface/spec', role: 'the standard contract for storage plug-ins', lines: ['document · public repository'], box: [130, 170, 560, 170], color: C.blue},
  addons: {kind: 'CSI-Addons Specification', name: 'csi-addons/spec', role: 'extends CSI with replication requests', lines: ['document · public repository'], box: [130, 620, 560, 170], color: C.purple},
  k8saddons: {kind: 'Kubernetes implementation', name: 'csi-addons/kubernetes-csi-addons', role: 'speaks the add-ons contract inside the cluster', lines: ['software · controller + sidecars'], box: [130, 1070, 560, 175], color: C.cyan},
  ramen: {kind: 'DR Orchestrator', name: 'RamenDR/ramen', role: 'decides when recovery operations run', lines: ['software · runs on the clusters'], box: [130, 1450, 560, 170], color: C.green},
  csm: {kind: 'Dell modules', name: 'Dell CSM Replication', role: 'enterprise add-ons: authz, resiliency, observability', lines: ['Dell Container Storage Modules'], box: [1060, 190, 460, 180], color: C.orange},
  pstore_drv: {kind: 'Dell CSI driver', name: 'csi-powerstore', role: 'translates the contracts for PowerStore arrays', lines: ["Owen's builds · as drawn", 'CSI + add-ons sidecar'], box: [1060, 560, 460, 185], color: C.orange},
  pstore_hw: {kind: 'Storage array', name: 'PowerStore Array', role: 'Dell storage appliances', lines: ['PSa97b49e924cd · as drawn', 'PSdc7f3064c752 · as drawn'], box: [1960, 560, 540, 185], color: C.orange},
  rook: {kind: 'Operator', name: 'Rook', role: 'runs and manages a Ceph cluster on Kubernetes', lines: ['storage orchestration'], box: [1060, 1050, 460, 165], color: C.red},
  ceph_drv: {kind: 'Ceph CSI driver', name: 'ceph-csi', role: 'translates the contracts for Ceph storage', lines: ['CSI + add-ons sidecar'], box: [1060, 1420, 460, 165], color: C.red},
  ceph_hw: {kind: 'Software storage', name: 'Ceph Cluster', role: 'RBD block disks and CephFS files', lines: ['grown by Rook on the cluster'], box: [1960, 1420, 540, 165], color: C.red},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const REGIONS: {key: string; b: {x: number; y: number; w: number; h: number}; title: string; sub?: string; color: string}[] = [
  {key: 'shared', b: {x: 60, y: 80, w: 760, h: 1560}, title: 'THE SHARED STACK', sub: 'from the first diagram', color: C.blue},
  {key: 'dell', b: {x: 1000, y: 80, w: 1560, h: 700}, title: 'DELL STACK', sub: 'appliance storage', color: C.orange},
  {key: 'rh', b: {x: 1000, y: 940, w: 1560, h: 700}, title: 'RED HAT STACK', sub: 'software storage', color: C.red},
];
export const REGION_OF: Record<string, string> = {csi: 'shared', addons: 'shared', k8saddons: 'shared', ramen: 'shared', csm: 'dell', pstore_drv: 'dell', pstore_hw: 'dell', rook: 'rh', ceph_drv: 'rh', ceph_hw: 'rh'};
export const TOPMOST: Record<string, string> = {shared: 'csi', dell: 'csm', rh: 'rook'};

export const FOCUS: Record<string, string[]> = {
  '1.1': ['csi', 'addons', 'k8saddons', 'ramen'], '1.2': ['csi'], '1.3': ['csi', 'addons'], '1.4': ['addons', 'k8saddons'], '1.5': ['k8saddons', 'ramen'],
  '1.6': ['csi', 'addons', 'k8saddons', 'ramen'],
  '3.1': ['csm', 'pstore_drv', 'pstore_hw'], '3.2': ['pstore_drv', 'pstore_hw'], '3.3': ['pstore_drv', 'pstore_hw'], '3.4': ['pstore_drv', 'pstore_hw'],
  '4.1': ['rook', 'ceph_drv', 'ceph_hw'], '4.2': ['rook', 'ceph_drv', 'ceph_hw'], '4.3': ['ceph_drv', 'ceph_hw'],
  '4.4': ['csm', 'pstore_drv', 'pstore_hw', 'rook', 'ceph_drv', 'ceph_hw'],
  '5.1': ['csi', 'pstore_drv', 'ceph_drv'],
  '5.2': ['csi', 'addons', 'k8saddons', 'pstore_drv', 'ceph_drv'],
  '5.3': ['ramen', 'k8saddons', 'pstore_drv', 'ceph_drv', 'pstore_hw', 'ceph_hw'],
  '5.4': ['csi', 'addons', 'k8saddons', 'ramen', 'pstore_drv', 'ceph_drv'],
  '6.1': Object.keys(NODES), '6.2': Object.keys(NODES), '6.3': Object.keys(NODES),
};

type Edge = {
  d: string; label?: string; lx?: number; ly?: number; color: string; intro: string; frac?: number;
  dashed?: boolean; end: [number, number]; ang: number; packets?: boolean; noArrow?: boolean; dot?: [number, number, number, number];
};
const EDGES: Record<string, Edge> = {
  // Left column: the shared half.
  extends: {d: 'M410,345 C410,440 410,510 410,615', label: 'extends', lx: 410, ly: 480, color: C.purple, intro: '1.3', dashed: true, end: [410, 615], ang: 90},
  implK8s: {d: 'M410,795 C410,890 410,960 410,1065', label: 'implements', lx: 410, ly: 930, color: C.blue, intro: '1.4', end: [410, 1065], ang: 90},
  consumed: {d: 'M410,1245 C410,1300 410,1370 410,1445', label: 'consumed by', lx: 410, ly: 1345, color: C.green, intro: '1.5', end: [410, 1445], ang: 90},
  // Dell stack internals.
  csmLink: {d: 'M1290,368 L1290,552', color: C.dim, intro: '3.1', dashed: true, end: [1290, 552], ang: 90, noArrow: true},
  pstoreCmd: {d: 'M1525,645 L1952,645', label: 'commands', lx: 1740, ly: 645, color: C.orange, intro: '3.1', end: [1952, 645], ang: 0, packets: true, dot: [1525, 1952, 645, 0]},
  // Red Hat stack internals.
  rookLink: {d: 'M1290,1228 L1290,1412', color: C.dim, intro: '4.1', dashed: true, end: [1290, 1412], ang: 90, noArrow: true},
  cephCmd: {d: 'M1525,1505 L1952,1505', label: 'commands', lx: 1740, ly: 1505, color: C.orange, intro: '4.2', end: [1952, 1505], ang: 0, packets: true, dot: [1525, 1952, 1505, 0]},
  // Cross arrows: the same three relationships, twice.
  xCsiPstore: {d: 'M690,255 C950,255 1040,380 1150,550', label: 'implements', lx: 890, ly: 330, color: C.blue, intro: '5.1', frac: 0.18, end: [1150, 550], ang: 62},
  xCsiCeph: {d: 'M690,255 C930,255 930,700 930,1300 C930,1440 980,1462 1053,1462', label: 'implements', lx: 962, ly: 560, color: C.blue, intro: '5.1', frac: 0.3, end: [1053, 1462], ang: 12},
  xAddonsPstore: {d: 'M690,705 C850,705 950,678 1053,670', label: 'via sidecar', lx: 855, ly: 638, color: C.blue, intro: '5.2', frac: 0.16, dashed: true, end: [1053, 670], ang: -4},
  xAddonsCeph: {d: 'M690,705 C860,705 860,1200 860,1400 C860,1530 950,1538 1053,1538', label: 'via sidecar', lx: 828, ly: 1120, color: C.blue, intro: '5.2', frac: 0.3, dashed: true, end: [1053, 1538], ang: 8},
  xK8sPstore: {d: 'M690,1155 C1000,1155 1030,950 1048,790 C1058,740 1056,716 1053,712', label: 'gRPC', lx: 1240, ly: 528, color: C.cyan, intro: '5.2', frac: 0.5, end: [1053, 712], ang: -95, packets: false},
  xK8sCeph: {d: 'M690,1155 C850,1155 900,1300 938,1436 C958,1500 998,1502 1053,1502', label: 'gRPC', lx: 1150, ly: 1392, color: C.cyan, intro: '5.2', frac: 0.64, end: [1053, 1502], ang: 6},
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
    const op = recap || introCh === chapter ? 1 : 0.26;
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
    <div style={{position: 'absolute', width: 2620, height: 1700}}>
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
      <svg width={2620} height={1700} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        {Object.keys(EDGES).map((k) => edgeG(k))}
        {chapter >= 5 ? (
          <text x={1310} y={1672} textAnchor="middle" fill={C.faint} fontFamily={sans} fontSize={22}>
            three relationships on the left, two vendors on the right, six arrows, zero exceptions
          </text>
        ) : null}
      </svg>
    </div>
  );
};
