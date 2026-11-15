import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string; nameSize?: number};
export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'hammerdb-drpc', role: 'records the requested move and its progression', scope: 'hub · openshift-dr-ops', box: [120, 105, 620, 190], color: C.orange},
  annotation: {kind: 'Annotation', name: 'drplacementcontrol.ramendr.openshift.io/resync-on-primary', role: 'opts the application into primary-side resync', scope: 'hub · on the DRPC', box: [820, 105, 760, 190], color: C.purple, nameSize: 15},
  status: {kind: 'Status', name: 'DRPC conditions', role: 'phase, progression and readiness', scope: 'hub · observed state', box: [1660, 105, 650, 190], color: C.blue},

  vrg0: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'coordinates the old site disks', scope: 'spoke-0 · openshift-dr-ops', box: [120, 455, 520, 190], color: C.spoke1},
  vr0: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'old site root disk', scope: 'spoke-0 · hammerdb', box: [700, 455, 490, 190], color: C.amber},
  csi0: {kind: 'Controller', name: 'csi-addons-controller-manager', role: 'translates VR into CSI calls', scope: 'spoke-0 · csi-addons-system', box: [700, 675, 490, 190], color: C.purple},
  driver0: {kind: 'Controller', name: 'powerstore-controller', role: 'executes against VSA-A', scope: 'spoke-0 · powerstore', box: [700, 895, 490, 190], color: C.purple},

  vrg1: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'coordinates the active site disks', scope: 'spoke-1 · openshift-dr-ops', box: [1285, 455, 520, 190], color: C.spoke0},
  vr1: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'active site root disk', scope: 'spoke-1 · hammerdb', box: [1870, 455, 490, 190], color: C.amber},
  csi1: {kind: 'Controller', name: 'csi-addons-controller-manager', role: 'translates VR into CSI calls', scope: 'spoke-1 · csi-addons-system', box: [1870, 675, 490, 190], color: C.purple},
  driver1: {kind: 'Controller', name: 'powerstore-controller', role: 'executes against VSA-B', scope: 'spoke-1 · powerstore', box: [1870, 895, 490, 190], color: C.purple},

  sessionA: {kind: 'PowerStore session', name: 'VSA-A · hammerdb-rhel9-rootdisk', role: 'array role on the old site', scope: 'VSA-A · storage session', box: [120, 1270, 520, 190], color: C.array},
  sessionB: {kind: 'PowerStore session', name: 'VSA-B · hammerdb-rhel9-rootdisk', role: 'array role on the active site', scope: 'VSA-B · storage session', box: [1870, 1270, 490, 190], color: C.array},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const FOCUS: Record<string, string[]> = {
  '2.1': ['drpc', 'vrg0', 'vrg1', 'vr0', 'vr1', 'sessionA', 'sessionB'],
  '2.2': ['drpc', 'vrg1', 'vr1', 'sessionB'],
  '2.3': ['sessionA', 'sessionB', 'status'],
  '2.4': ['sessionA', 'sessionB'],
  '3.1': ['vr0', 'vr1'],
  '3.2': ['vr0', 'csi0'],
  '3.3': ['driver1', 'sessionB'],
  '3.4': ['csi0', 'driver0', 'sessionA', 'csi1'],
  '3.5': ['vr0', 'vr1', 'sessionA', 'sessionB'],
  '4.1': ['vr1', 'csi1'],
  '4.2': ['csi1', 'driver1', 'sessionB', 'sessionA'],
  '4.3': ['drpc', 'sessionB', 'sessionA'],
  '4.4': ['driver1', 'vr1', 'status'],
  '4.5': ['vr1', 'status'],
  '5.1': ['drpc'],
  '5.2': ['drpc', 'annotation', 'vrg1'],
  '5.3': ['vr1'],
  '5.4': ['vr1'],
  '5.5': ['vr1', 'status'],
  '5.6': ['vr1', 'csi1'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

export const CH: [string, number, string, string][] = [
  ['2.1', 0.1, 'drpc', 'Deployed'],
  ['2.1', 0.1, 'vrg0', 'Primary'],
  ['2.1', 0.1, 'vrg1', 'Secondary'],
  ['2.1', 0.1, 'vr0', 'primary'],
  ['2.1', 0.1, 'vr1', 'secondary'],
  ['2.1', 0.1, 'sessionA', 'Source · OK'],
  ['2.1', 0.1, 'sessionB', 'Destination · OK'],
  ['2.1', 0.1, 'csi0', 'idle'],
  ['2.1', 0.1, 'csi1', 'idle'],
  ['2.1', 0.1, 'driver0', 'idle'],
  ['2.1', 0.1, 'driver1', 'idle'],
  ['2.2', 0.3, 'drpc', 'FailedOver'],
  ['2.2', 0.3, 'vrg1', 'Primary'],
  ['2.2', 0.3, 'vr1', 'primary'],
  ['2.2', 0.3, 'vrg0', 'unreachable'],
  ['2.2', 0.3, 'vr0', 'unreachable'],
  ['2.2', 0.3, 'sessionB', 'Source · Failed_Over'],
  ['2.2', 0.3, 'sessionA', 'unreachable'],
  ['2.3', 0.3, 'sessionA', 'Destination · Failed_Over'],
  ['2.3', 0.3, 'sessionB', 'Source · Failed_Over'],
  ['2.3', 0.3, 'status', 'no standby copy'],
  ['3.1', 0.3, 'vr1', 'primary'],
  ['3.1', 0.3, 'vr0', 'secondary'],
  ['3.4', 0.3, 'csi0', 'ResyncVolume'],
  ['3.4', 0.3, 'driver0', 'OutOfRange'],
  ['3.4', 0.3, 'sessionA', 'Destination · OutOfRange'],
  ['3.4', 0.3, 'csi1', 'no resync call'],
  ['3.5', 0.3, 'sessionB', 'Source · can reverse'],
  ['4.1', 0.3, 'annotation', 'absent'],
  ['4.2', 0.3, 'csi1', 'ResyncVolume'],
  ['4.2', 0.3, 'driver1', 'Reprotect'],
  ['4.2', 0.3, 'sessionB', 'Reprotect · running'],
  ['4.2', 0.3, 'sessionA', 'Destination · receiving'],
  ['4.3', 0.3, 'sessionB', 'Failed_Over · call missed'],
  ['4.3', 0.3, 'drpc', 'WaitOnUserCleanUp'],
  ['4.4', 0.3, 'driver1', 'Reprotect failed'],
  ['4.4', 0.3, 'vr1', 'FailedToResync'],
  ['4.4', 0.3, 'status', 'DataReady=False'],
  ['5.2', 0.3, 'annotation', 'present'],
  ['5.2', 0.3, 'vrg1', 'annotation copied'],
  ['5.3', 0.3, 'vr1', 'Replicating=False'],
  ['5.4', 0.3, 'vr1', 'resync'],
  ['5.4', 0.7, 'vr1', 'primary'],
  ['5.5', 0.3, 'status', 'DataReady=True · DataProtected=Progressing'],
];

const BASE: Record<string, string> = {
  drpc: 'Deployed',
  annotation: 'absent',
  status: 'observed state',
  vrg0: 'Primary',
  vr0: 'primary',
  csi0: 'idle',
  driver0: 'idle',
  vrg1: 'Secondary',
  vr1: 'secondary',
  csi1: 'idle',
  driver1: 'idle',
  sessionA: 'Source · OK',
  sessionB: 'Destination · OK',
};

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const keys = FOCUS[c.id] ?? [];
  const chapter = phase(c.id);
  const status = (key: string) => {
    let v = BASE[key] ?? '';
    for (const [beat, frac, k, value] of CH) {
      if (k === key && reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac)) v = value;
    }
    return v;
  };
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : 0.08);
  const appear = chapter === 2 ? prog(c.f, -15, 35) : 1;
  const failedOver = reached(c.id, '2.2');
  const reprotected = reached(c.id, '4.2');
  const missed = reached(c.id, '4.3');
  const failed = reached(c.id, '4.4');
  const annotated = reached(c.id, '5.2');
  const signal = reached(c.id, '5.3');
  const resyncing = c.id === '5.4' && c.f < c.dur * 0.7;
  const arrow = (d: string, color: string, dashed: boolean, label: string, lx: number, ly: number, opacity = 1) => (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={5} strokeDasharray={dashed ? '14 11' : undefined} markerEnd="url(#tipRP)" />
      <rect x={lx - 210} y={ly - 20} width={420} height={38} rx={11} fill={C.bg} opacity={0.94} />
      <text x={lx} y={ly + 6} textAnchor="middle" fill={color} fontSize={20} fontFamily={sans}>{label}</text>
    </g>
  );
  return <div style={{position: 'absolute', width: 2480, height: 1600}}>
    <Region b={{x: 70, y: 45, w: 2340, h: 280}} title="HUB · edge36" sub="the control record and the switch" color={C.blue} />
    <Region b={{x: 70, y: 390, w: 1170, h: 790}} title="SPOKE-0 · edge95 · OLD SITE" sub={failedOver ? 'returned, demoted, waiting' : 'the primary before the failure'} color={C.spoke1} />
    <Region b={{x: 1235, y: 390, w: 1175, h: 790}} title="SPOKE-1 · edge97 · ACTIVE SITE" sub="serves the workload after failover" color={C.spoke0} />
    <Region b={{x: 70, y: 1205, w: 1170, h: 320}} title="VSA-A · OLD SITE ARRAY" color={C.array} />
    <Region b={{x: 1235, y: 1205, w: 1175, h: 320}} title="VSA-B · ACTIVE SITE ARRAY" color={C.array} />

    {Object.entries(NODES).map(([key, n]) => {
      const col = failed && (key === 'driver1' || key === 'vr1' || key === 'status') ? C.red
        : missed && (key === 'sessionB' || key === 'drpc') ? C.red
        : annotated && key === 'annotation' ? C.green
        : n.color;
      return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role}
        lines={[n.scope, status(key)]} appear={appear} focus={focus(key)} hl={keys.includes(key) ? 0.28 : 0}
        color={col} detail={Math.max(0, Math.min(1, (c.zoom - 0.65) / 0.2))} nameSize={n.nameSize ?? 22} />;
    })}

    <svg width={2480} height={1600} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <defs>
        <marker id="tipRP" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.cyan} /></marker>
      </defs>

      {chapter >= 2 && !failedOver ? arrow('M640,1365 L1860,1365', C.orange, false, 'baseline copy · A to B', 1250, 1322, prog(c.f, c.dur * 0.15, c.dur * 0.15 + 24)) : null}

      {failedOver && !reprotected ? arrow('M1860,1415 L650,1415', C.orange, true, 'reverse copy · not started', 1250, 1472, prog(c.f, c.dur * 0.1, c.dur * 0.1 + 24)) : null}
      {reprotected ? arrow('M1860,1415 L650,1415', C.green, false, 'Reprotect · copying B to A', 1250, 1472, 1) : null}

      {reached(c.id, '2.2') && !reached(c.id, '2.3') ? arrow('M430,295 C430,370 1390,355 1390,445', C.cyan, true, 'DRPC moves the workload', 880, 360, prog(c.f, c.dur * 0.1, c.dur * 0.1 + 24)) : null}

      {c.id === '3.4' ? <>
        <path d="M945,645 L945,675" stroke={C.red} strokeWidth={5} markerEnd="url(#tipRP)" />
        <path d="M945,865 L945,895" stroke={C.red} strokeWidth={5} markerEnd="url(#tipRP)" />
        <path d="M945,1085 L945,1145 L380,1145 L380,1260" fill="none" stroke={C.red} strokeWidth={5} strokeDasharray="14 11" markerEnd="url(#tipRP)" />
        <rect x={880} y={1105} width={330} height={36} rx={10} fill={C.bg} />
        <text x={1045} y={1130} textAnchor="middle" fill={C.red} fontSize={19} fontFamily={sans}>ResyncVolume · secondary</text>
        <g transform="translate(380,1205)"><circle r={24} fill={C.bg} stroke={C.red} strokeWidth={4} /><path d="M-10,-10 L10,10 M10,-10 L-10,10" stroke={C.red} strokeWidth={6} strokeLinecap="round" /></g>
      </> : null}

      {c.id === '4.2' ? <>
        <path d="M2115,645 L2115,675" stroke={C.green} strokeWidth={5} markerEnd="url(#tipRP)" />
        <path d="M2115,865 L2115,895" stroke={C.green} strokeWidth={5} markerEnd="url(#tipRP)" />
        <path d="M2115,1085 L2115,1260" stroke={C.green} strokeWidth={5} markerEnd="url(#tipRP)" />
        <rect x={1980} y={1128} width={390} height={36} rx={10} fill={C.bg} />
        <text x={2175} y={1153} textAnchor="middle" fill={C.green} fontSize={19} fontFamily={sans}>ResyncVolume · primary</text>
      </> : null}

      {annotated ? <>
        <path d="M740,200 L810,200" stroke={C.cyan} strokeWidth={4} strokeDasharray="10 8" markerEnd="url(#tipRP)" />
        <path d="M1200,295 C1200,370 1500,360 1500,445" fill="none" stroke={C.cyan} strokeWidth={4} strokeDasharray="10 8" markerEnd="url(#tipRP)" />
        <rect x={1320} y={330} width={380} height={36} rx={10} fill={C.bg} />
        <text x={1510} y={355} textAnchor="middle" fill={C.cyan} fontSize={19} fontFamily={sans}>copied to the VRG</text>
      </> : null}

      {signal ? <>
        <rect x={1870} y={660} width={490} height={34} rx={8} fill={`${C.amber}22`} stroke={C.amber} strokeWidth={2} />
        <text x={2115} y={684} textAnchor="middle" fill={C.amber} fontSize={19} fontFamily={mono}>Replicating=False</text>
      </> : null}

      {resyncing ? <>
        <rect x={1870} y={660} width={490} height={34} rx={8} fill={`${C.purple}22`} stroke={C.purple} strokeWidth={2} />
        <text x={2115} y={684} textAnchor="middle" fill={C.purple} fontSize={19} fontFamily={mono}>replicationState: resync</text>
      </> : null}

      {missed ? <g transform="translate(1250,1365)"><circle r={30} fill={C.bg} stroke={C.red} strokeWidth={4} /><path d="M-12,-12 L12,12 M12,-12 L-12,12" stroke={C.red} strokeWidth={7} strokeLinecap="round" /></g> : null}
    </svg>
  </div>;
};
