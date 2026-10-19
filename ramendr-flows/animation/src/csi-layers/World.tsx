import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; layer: string; box: Box; color: string};
export const NODES: Record<string, Node> = {
  csi: {kind: 'CSI Specification', name: 'container-storage-interface/spec', role: 'the standard contract for storage plug-ins', scope: 'document · public repository', layer: 'layer 1 · the base contract', box: [300, 170, 560, 170], color: C.blue},
  addons: {kind: 'CSI-Addons Specification', name: 'csi-addons/spec', role: 'extends CSI with replication requests', scope: 'document · public repository', layer: 'layer 2 · the extension', box: [1450, 170, 560, 170], color: C.purple},
  drivers: {kind: 'CSI Drivers', name: 'ceph-csi / dell-csi / trident', role: 'vendor translators for real storage', scope: 'software · one per vendor', layer: 'layers 1+2 · vendor-side implementation', box: [300, 710, 560, 175], color: C.orange},
  k8saddons: {kind: 'Kubernetes implementation', name: 'csi-addons/kubernetes-csi-addons', role: 'speaks the add-ons contract inside the cluster', scope: 'software · controller + sidecars', layer: 'layer 3 · cluster-side implementation', box: [1450, 710, 560, 175], color: C.cyan},
  ramen: {kind: 'DR Orchestrator', name: 'RamenDR/ramen', role: 'decides when recovery operations run', scope: 'software · runs on the clusters', layer: 'the consumer', box: [1450, 1210, 560, 170], color: C.green},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const REGIONS: {key: string; b: {x: number; y: number; w: number; h: number}; title: string; sub?: string; color: string}[] = [
  {key: 'contracts', b: {x: 60, y: 80, w: 2180, h: 400}, title: 'THE CONTRACTS', sub: 'written standards', color: C.blue},
  {key: 'vendor', b: {x: 60, y: 620, w: 1080, h: 400}, title: 'VENDOR SIDE', sub: 'storage translators', color: C.orange},
  {key: 'k8s', b: {x: 1300, y: 620, w: 1140, h: 400}, title: 'KUBERNETES SIDE', sub: 'cluster software', color: C.cyan},
  {key: 'dr', b: {x: 1300, y: 1120, w: 1140, h: 400}, title: 'DISASTER RECOVERY', sub: 'the consumer', color: C.green},
];
export const REGION_OF: Record<string, string> = {csi: 'contracts', addons: 'contracts', drivers: 'vendor', k8saddons: 'k8s', ramen: 'dr'};
// Topmost card per region: focusing it also pulls the region header into frame.
export const TOPMOST: Record<string, string> = {contracts: 'csi', vendor: 'drivers', k8s: 'k8saddons', dr: 'ramen'};

export const FOCUS: Record<string, string[]> = {
  '3.2': ['csi'], '3.3': ['csi', 'drivers'], '3.4': ['csi', 'drivers'],
  '4.2': ['csi', 'addons'], '4.3': ['addons', 'drivers'], '4.4': ['addons', 'drivers'],
  '5.2': ['addons', 'k8saddons'], '5.3': ['k8saddons', 'drivers'], '5.4': ['k8saddons', 'drivers'],
  '6.1': ['ramen'], '6.2': ['k8saddons', 'ramen'],
  '6.3': ['csi', 'addons', 'drivers', 'k8saddons', 'ramen'], '6.4': ['csi', 'addons', 'drivers', 'k8saddons', 'ramen'],
  '7.1': ['csi', 'addons', 'drivers'], '7.2': ['k8saddons', 'drivers', 'ramen'],
  '7.3': ['csi', 'addons', 'drivers', 'k8saddons', 'ramen'],
};

type Edge = {
  d: string; label?: string; lx?: number; ly?: number; color: string; intro: string;
  dashed?: boolean; end: [number, number]; ang: number; packets?: boolean; noArrow?: boolean;
};
const EDGES: Record<string, Edge> = {
  // CSI extends into the add-ons spec (horizontal, inside the contracts region).
  extends: {d: 'M860,260 L1445,260', label: 'extends', lx: 1152, ly: 260, color: C.purple, intro: '4.2', dashed: true, end: [1445, 260], ang: 0},
  // The drivers implement CSI (vertical, contracts region down to vendor region).
  implDrivers: {d: 'M580,345 C580,525 580,545 580,705', label: 'implements', lx: 580, ly: 530, color: C.blue, intro: '3.3', end: [580, 705], ang: 90},
  // Drivers implement the add-ons spec via a sidecar (wraps left around the CSI card).
  implSidecar: {d: 'M1445,222 C900,128 230,128 230,430 C230,640 300,668 362,703', label: 'implements (via sidecar)', lx: 880, ly: 150, color: C.blue, intro: '4.3', dashed: true, end: [362, 703], ang: 62},
  // kubernetes-csi-addons implements the add-ons spec (vertical).
  implK8s: {d: 'M1730,345 C1730,525 1730,545 1730,705', label: 'implements', lx: 1730, ly: 530, color: C.blue, intro: '5.2', end: [1730, 705], ang: 90},
  // The controller calls the driver sidecars over gRPC (horizontal, with packets).
  grpc: {d: 'M1445,795 L865,795', label: 'calls gRPC to', lx: 1155, ly: 795, color: C.cyan, intro: '5.3', end: [865, 795], ang: 180, packets: true},
  // Ramen consumes kubernetes-csi-addons (vertical).
  consumed: {d: 'M1730,885 L1730,1205', label: 'consumed by', lx: 1730, ly: 1045, color: C.green, intro: '6.2', end: [1730, 1205], ang: 90},
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
  const firstWorldChapter = c.id === '3.1';

  const edgeG = (key: string) => {
    const e = EDGES[key];
    if (!reached(c.id, e.intro)) return null;
    const introCh = phase(e.intro);
    const recap = chapter === 7;
    const op = recap || introCh === chapter ? 1 : 0.26;
    const draw = c.id === e.intro ? prog(c.f, c.dur * 0.16, c.dur * 0.16 + 30) : 1;
    if (draw <= 0.01) return null;
    const pulse = c.id === '6.3' ? 0.7 + 0.3 * Math.sin(c.f / 9) : 1;
    return (
      <g key={key} opacity={op * pulse}>
        <path d={e.d} stroke={e.color} strokeOpacity={0.16} strokeWidth={9} fill="none" pathLength={1} strokeDasharray={`${draw} 1`} />
        <path d={e.d} stroke={e.color} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={`${draw} 1`} strokeLinecap="round" style={e.dashed ? {strokeDasharray: '0.012 0.012', clipPath: undefined, opacity: Math.min(1, draw * 1.6)} : undefined} opacity={e.dashed ? undefined : 1} />
        {!e.noArrow ? <polygon points="0,-8 15,0 0,8" fill={e.color} transform={`translate(${e.end[0]},${e.end[1]}) rotate(${e.ang})`} opacity={draw > 0.9 ? 1 : 0} /> : null}
        {e.packets && draw >= 1 && (introCh === chapter || recap)
          ? [0, 1, 2].map((i) => {
              const t = ((c.f % 140) / 140 + i / 3) % 1;
              const x = 1445 + (865 - 1445) * t;
              return <circle key={i} cx={x} cy={795} r={6} fill={e.color} opacity={Math.sin(t * Math.PI)} style={{filter: `drop-shadow(0 0 8px ${e.color})`}} />;
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
    <div style={{position: 'absolute', width: 2500, height: 1580}}>
      {REGIONS.map((r) => (
        <Region key={r.key} b={r.b} title={r.title} sub={r.sub} color={r.color} />
      ))}
      {Object.entries(NODES).map(([key, n], i) => {
        const appear = firstWorldChapter ? prog(c.f, -12 + i * 7, 32 + i * 7) : 1;
        return (
          <Card
            key={key}
            x={n.box[0]}
            y={n.box[1]}
            w={n.box[2]}
            kind={n.kind}
            name={n.name}
            role={n.role}
            lines={[n.scope, n.layer]}
            appear={appear}
            focus={focus(key)}
            hl={keys.includes(key) ? 0.25 : 0}
            color={n.color}
            detail={Math.max(0, Math.min(1, (c.zoom - 0.65) / 0.2))}
          />
        );
      })}
      <svg width={2500} height={1580} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        {Object.keys(EDGES).map((k) => edgeG(k))}
        {chapter >= 3 && keys.length >= 4 ? (
          <text x={1240} y={1545} textAnchor="middle" fill={C.faint} fontFamily={sans} fontSize={22}>
            every arrow is a handoff between two neighbors
          </text>
        ) : null}
      </svg>
    </div>
  );
};
