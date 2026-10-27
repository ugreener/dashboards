import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string};

export const NODES: Record<string, Node> = {
  drpcA: {kind: 'DRPlacementControl', name: 'dell-vm-drpc', role: 'records the requested move and its progression', scope: 'hub · openshift-gitops', box: [95, 88, 505, 112], color: C.orange},
  drpcB: {kind: 'DRPlacementControl', name: 'dell-win-drpc', role: 'the second protected application', scope: 'hub · openshift-gitops', box: [625, 88, 505, 112], color: C.orange},
  csi0: {kind: 'CSIDriver', name: 'csi-powerstore', role: 'turns replication requests into array calls', scope: 'spoke-0 · cluster scope', box: [95, 300, 505, 108], color: C.amber},
  csi1: {kind: 'CSIDriver', name: 'csi-powerstore', role: 'turns replication requests into array calls', scope: 'spoke-1 · cluster scope', box: [1255, 300, 505, 108], color: C.amber},
  nA0: {kind: 'Appliance node', name: 'VSA-A-A', role: 'Node A of VSA-A', scope: 'VSA-A · 10.46.48.22', box: [95, 600, 505, 205], color: C.green},
  nB0: {kind: 'Appliance node', name: 'VSA-A-B', role: 'Node B of VSA-A', scope: 'VSA-A · 10.46.48.23', box: [635, 600, 505, 205], color: C.green},
  nA1: {kind: 'Appliance node', name: 'VSA-B-A', role: 'Node A of VSA-B', scope: 'VSA-B · 10.46.48.32', box: [1255, 600, 505, 205], color: C.green},
  nB1: {kind: 'Appliance node', name: 'VSA-B-B', role: 'Node B of VSA-B', scope: 'VSA-B · 10.46.48.33', box: [1795, 600, 505, 205], color: C.green},
  cs0: {kind: 'Cluster service', name: 'VSA-A-appliance-1', role: 'keeps both nodes acting as one array', scope: 'VSA-A · management 10.46.48.20', box: [95, 840, 1045, 150], color: C.blue},
  cs1: {kind: 'Cluster service', name: 'VSA-B-appliance-1', role: 'keeps both nodes acting as one array', scope: 'VSA-B · management 10.46.48.30', box: [1255, 840, 1045, 150], color: C.blue},
  io0: {kind: 'Array state', name: 'IO servicing', role: 'the line between a slow copy and no copy', scope: 'VSA-A', box: [95, 1025, 1045, 175], color: C.cyan},
  io1: {kind: 'Array state', name: 'IO servicing', role: 'the line between a slow copy and no copy', scope: 'VSA-B', box: [1255, 1025, 1045, 175], color: C.cyan},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const FOCUS: Record<string, string[]> = {
  '2.1': ['drpcA', 'drpcB', 'nA0', 'nB0', 'nA1', 'nB1'],
  '2.2': ['nA0', 'nB0', 'cs0', 'io0'],
  '2.3': ['drpcA', 'drpcB', 'io0', 'io1'],
  '3.1': ['nB1', 'nA1'],
  '3.2': ['nB1', 'csi1'],
  '3.3': ['nB0', 'nB1', 'cs0', 'cs1'],
  '3.4': ['nB0', 'nB1', 'cs0', 'cs1'],
  '4.1': ['nA0', 'cs0'],
  '4.2': ['nA0'],
  '4.3': ['nA0', 'nA1'],
  '4.4': ['cs0', 'io0', 'nA0'],
  '4.5': ['nA0', 'cs0', 'io0'],
  '5.1': ['io0', 'io1', 'csi0', 'csi1'],
  '5.2': ['io0', 'io1'],
  '5.3': ['io0', 'io1', 'cs0', 'cs1'],
  '6.1': ['nA0', 'nA1'],
  '6.2': ['nA0', 'nA1', 'nB0', 'nB1'],
  '6.3': ['nB0', 'nB1'],
  '6.4': ['nB0', 'nB1', 'cs0'],
  '7.1': ['cs0', 'cs1', 'nA0', 'nB0'],
  '7.2': ['nA0', 'nB0', 'cs0'],
  '7.3': ['io0', 'csi0', 'cs0'],
  '7.4': ['io0', 'io1'],
  '7.5': ['nA0', 'nB0', 'cs0', 'io0'],
  '7.6': ['drpcA', 'drpcB', 'io0', 'io1'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};

const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

/** [beat, fraction, key, value] — the state of every card over time. */
export const CH: [string, number, string, string][] = [
  ['3.1', 0.34, 'nB1', 'stopped · 15:20:53'],
  ['3.2', 0.3, 'io1', 'System_Paused · remote unreachable'],
  ['3.3', 0.3, 'nB0', 'stopped · 15:22:49'],
  ['3.3', 0.62, 'cs0', 'management back online · 15:25:52'],
  ['3.3', 0.62, 'cs1', 'management back online · 15:24:07'],
  ['3.4', 0.2, 'nB0', 'Healthy · 15:27:32'],
  ['3.4', 0.2, 'nB1', 'Healthy · 15:24:34'],
  ['3.4', 0.62, 'nB0', 'stopped again · stop reason 351'],
  ['3.4', 0.62, 'nB1', 'stopped again · stop reason 351'],
  ['4.1', 0.18, 'nA0', 'multipathd blocked · 122 s'],
  ['4.3', 0.3, 'nA0', 'kernel panic · uptime 259642 s'],
  ['4.3', 0.55, 'nA1', 'kernel panic · uptime 260378 s'],
  ['4.4', 0.28, 'cs0', 'no_nodes_in_brick'],
  ['4.4', 0.28, 'io0', 'stopped servicing IOs'],
  ['4.4', 0.5, 'nA0', 'stopped · 15:27:35'],
  ['4.5', 0.25, 'nA0', 'rebooted · not re-integrated'],
  ['4.5', 0.25, 'io0', 'one node · no redundancy'],
  ['7.1', 0.2, 'nA0', 'powered off together'],
  ['7.1', 0.2, 'nB0', 'powered off together'],
  ['7.1', 0.2, 'cs0', 'cluster service stopped'],
  ['7.2', 0.62, 'nA0', 'on · 07:44:11'],
  ['7.2', 0.62, 'nB0', 'on · 07:44:09'],
  ['7.2', 0.78, 'cs0', 'cluster active · 07:50:22'],
  ['7.2', 0.88, 'io0', 'servicing IOs · 07:50:27'],
  ['7.3', 0.2, 'io0', '2 sessions per initiator'],
  ['7.3', 0.2, 'csi0', 'replication enabled'],
  ['7.3', 0.2, 'io1', '8 sessions · all OK'],
];

const base = (key: string) => {
  const map: Record<string, string> = {
    nA0: 'active · serving IO',
    nB0: 'active · serving IO',
    nA1: 'active · serving IO',
    nB1: 'active · serving IO',
    cs0: 'cluster service active',
    cs1: 'cluster service active',
    io0: 'servicing IOs',
    io1: 'servicing IOs',
    drpcA: 'Protected=true · Available=true',
    drpcB: 'Protected=true · Available=true',
    csi0: 'replication enabled',
    csi1: 'replication enabled',
  };
  return map[key] ?? '';
};

const tone = (status: string, fallback: string) => {
  if (/panic|stopped again|no_nodes|stopped servicing|not re-integrated/.test(status)) return C.red;
  if (/stopped|blocked|System_Paused|no redundancy|powered off|cluster service stopped/.test(status)) return C.amber;
  if (/Healthy ·/.test(status)) return C.amber;
  if (/active|servicing|OK|enabled|Protected/.test(status)) return fallback;
  return fallback;
};

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const keys = FOCUS[c.id] ?? [];
  const status = (key: string) => {
    let v = base(key);
    for (const [beat, frac, k, value] of CH) {
      if (k !== key) continue;
      const hit = reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac);
      if (hit) v = value;
    }
    return v;
  };
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : 0.08);
  const chapter = phase(c.id);
  const paused = reached(c.id, '3.2') && !reached(c.id, '7.3');
  const dead = reached(c.id, '4.4') && !reached(c.id, '7.2');
  const recovered = reached(c.id, '7.3');
  const off = reached(c.id, '7.1') && !reached(c.id, '7.2');
  const sessionColor = recovered ? C.green : paused ? C.amber : C.orange;
  const sessionText = recovered ? 'replication resumed · 8 sessions OK' : paused ? 'replication System_Paused' : 'replication sessions · one per disk';

  return (
    <div style={{position: 'absolute', width: 2400, height: 1500}}>
      <Region b={{x: 60, y: 30, w: 2280, h: 190}} title="HUB · edge36" sub="four protected applications" color={C.blue} />
      <Region b={{x: 60, y: 250, w: 1120, h: 200}} title="SPOKE-0 · edge95" sub="workloads · CSI driver" color={C.spoke0} />
      <Region b={{x: 1220, y: 250, w: 1120, h: 200}} title="SPOKE-1 · edge97" sub="workloads · CSI driver" color={C.spoke1} />
      <Region b={{x: 60, y: 520, w: 1120, h: 720}} title="VSA-A" sub="PS3b37452a6e0f" color={C.array} glow={dead ? 0.5 : 0} />
      <Region b={{x: 1220, y: 520, w: 1120, h: 720}} title="VSA-B" sub="PSff392f423bd6" color={C.array} glow={dead ? 0.5 : 0} />

      <div style={{position: 'absolute', left: 1200, top: 108, width: 1080, fontFamily: sans, fontSize: 21, color: C.dim, lineHeight: 1.35}}>
        <span style={{color: C.text, fontWeight: 700}}>+ 2 more DRPCs</span> · all four report Protected=true only while both array nodes serve
      </div>

      {Object.entries(NODES).map(([key, n]) => {
        const st = status(key);
        const isNode = key.startsWith('n');
        const col = tone(st, n.color);
        const appear = chapter >= 2 ? prog(c.f, -15, 35) : 1;
        return (
          <Card
            key={key}
            x={n.box[0]}
            y={n.box[1]}
            w={n.box[2]}
            kind={n.kind}
            name={n.name}
            role={n.role}
            lines={[n.scope, st]}
            appear={appear}
            focus={focus(key)}
            hl={keys.includes(key) ? 0.3 : 0}
            color={col}
            detail={Math.max(0, Math.min(1, (c.zoom - 0.65) / 0.2))}
            nameSize={isNode ? 26 : 22}
          />
        );
      })}

      <svg width={2400} height={1500} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        <defs>
          <marker id="tip337" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={sessionColor} /></marker>
          <marker id="tip337R" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.red} /></marker>
        </defs>

        {/* replication session link between the arrays */}
        {chapter >= 2 ? <g opacity={prog(c.f, c.dur * 0.05, c.dur * 0.05 + 25)}>
          <path d="M640,1245 L640,1320 L1660,1320 L1660,1245" fill="none" stroke={sessionColor} strokeWidth={5} strokeDasharray={paused && !recovered ? '12 10' : undefined} markerEnd="url(#tip337)" />
          <rect x={770} y={1292} width={760} height={42} rx={12} fill={C.bg} />
          <text x={1150} y={1321} textAnchor="middle" fill={sessionColor} fontSize={23} fontFamily={sans}>{sessionText}</text>
        </g> : null}

        {/* node to cluster service handoff */}
        {chapter >= 2 ? <g opacity={prog(c.f, c.dur * 0.1, c.dur * 0.1 + 22)}>
          <path d="M890,807 L890,838" fill="none" stroke={C.cyan} strokeWidth={4} markerEnd="url(#tip337)" />
          <path d="M2050,807 L2050,838" fill="none" stroke={C.cyan} strokeWidth={4} markerEnd="url(#tip337)" />
        </g> : null}

        {/* the array stops servicing IO */}
        {dead ? <g opacity={prog(c.f, 0, 18)}>
          <path d="M617,992 L617,1023" fill="none" stroke={C.red} strokeWidth={5} strokeDasharray="10 8" markerEnd="url(#tip337R)" />
          <path d="M1777,992 L1777,1023" fill="none" stroke={C.red} strokeWidth={5} strokeDasharray="10 8" markerEnd="url(#tip337R)" />
          <text x={700} y={1018} fill={C.red} fontSize={21} fontFamily={sans}>cluster service stops</text>
          <text x={1860} y={1018} fill={C.red} fontSize={21} fontFamily={sans}>cluster service stops</text>
        </g> : null}

        {/* recovery: both nodes together */}
        {off ? <g opacity={prog(c.f, c.dur * 0.1, c.dur * 0.1 + 20)}>
          <rect x={420} y={470} width={760} height={44} rx={12} fill={C.bg} stroke={C.amber} />
          <text x={800} y={500} textAnchor="middle" fill={C.amber} fontSize={24} fontFamily={sans}>both nodes off together, then Node B first</text>
        </g> : null}
      </svg>
    </div>
  );
};
