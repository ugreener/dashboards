import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string; nameSize?: number};
export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'dell-vm-drpc', role: 'records the failover and the reprotect', scope: 'hub · openshift-gitops', box: [110, 100, 520, 150], color: C.orange},
  policy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'pairs the sites, RPO 900 seconds', scope: 'hub · cluster scope', box: [670, 100, 480, 150], color: C.orange},
  console: {kind: 'Console', name: 'Protected applications', role: 'the operator view, built from status', scope: 'hub · Data Services', box: [1190, 100, 520, 150], color: C.purple},
  gate: {kind: 'Preflight check', name: 'two completed copies', role: 'since creation or last reversal', scope: 'lab runbook', box: [1750, 100, 610, 150], color: C.cyan},

  vm0: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'the recovered database VM', scope: 'spoke-0 · gitops-vms', box: [110, 395, 520, 150], color: C.green},
  vrg0: {kind: 'VolumeReplicationGroup', name: 'dell-vm-drpc', role: 'coordinates both disks on this site', scope: 'spoke-0 · gitops-vms', box: [670, 395, 480, 150], color: C.spoke0},
  vr0r: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'root disk work order', scope: 'spoke-0 · gitops-vms', box: [110, 575, 520, 85], color: C.amber, nameSize: 19},
  vr0d: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-datadisk', role: 'data disk work order', scope: 'spoke-0 · gitops-vms', box: [670, 575, 480, 85], color: C.amber, nameSize: 19},

  vrg1: {kind: 'VolumeReplicationGroup', name: 'dell-vm-drpc', role: 'standby side after the move', scope: 'spoke-1 · gitops-vms', box: [1380, 395, 480, 150], color: C.spoke1},
  nowork: {kind: 'Workload', name: 'no VirtualMachine', role: 'GitOps removed it after the move', scope: 'spoke-1 · gitops-vms', box: [1900, 395, 480, 150], color: C.dim},
  vr1r: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'standby work order', scope: 'spoke-1 · gitops-vms', box: [1380, 575, 480, 85], color: C.amber, nameSize: 19},
  vr1d: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-datadisk', role: 'standby work order', scope: 'spoke-1 · gitops-vms', box: [1900, 575, 480, 85], color: C.amber, nameSize: 19},

  sa_r: {kind: 'Replication session', name: '6116fde0-2d07-4f2f-89b5-56b7682c712e', role: 'root disk csivol-ec5862ac71', scope: 'VSA-A · Source', box: [110, 795, 500, 195], color: C.orange, nameSize: 20},
  sa_d: {kind: 'Replication session', name: '23dfdc6d-3feb-4281-83bb-69287b7b1a35', role: 'data disk csivol-f756724d1d', scope: 'VSA-A · Source', box: [620, 795, 500, 195], color: C.orange, nameSize: 20},
  sb_r: {kind: 'Replication session', name: '6116fde0-2d07-4f2f-89b5-56b7682c712e', role: 'root disk csivol-ec5862ac71', scope: 'VSA-B · Destination', box: [1420, 795, 480, 195], color: C.cyan, nameSize: 20},
  sb_d: {kind: 'Replication session', name: '23dfdc6d-3feb-4281-83bb-69287b7b1a35', role: 'data disk csivol-f756724d1d', scope: 'VSA-B · Destination', box: [1920, 795, 480, 195], color: C.cyan, nameSize: 20},
};

export const BAND_BOX: Box = [70, 1085, 2340, 300];
export const RECT: Record<string, Box> = {...Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])), band: BAND_BOX};

export const FOCUS: Record<string, string[]> = {
  '2.1': ['sb_r', 'sb_d', 'band'],
  '2.2': ['sb_r', 'sb_d', 'band'],
  '2.3': ['policy', 'drpc'],
  '2.4': ['console', 'drpc'],
  '2.5': ['sb_r', 'sb_d', 'band'],
  '3.1': ['drpc', 'console'],
  '3.2': ['sa_r', 'sa_d', 'sb_r', 'sb_d'],
  '3.3': ['sa_r', 'sa_d', 'band'],
  '3.4': ['sa_r', 'sa_d', 'band'],
  '3.5': ['console', 'vm0'],
  '3.6': ['sa_r', 'sa_d', 'band'],
  '4.1': ['sa_r', 'sa_d'],
  '4.2': ['band'],
  '4.3': ['band'],
  '4.4': ['sa_d'],
  '4.5': ['band'],
  '4.6': ['band'],
  '4.7': ['sa_r', 'sa_d', 'band'],
  '5.1': ['console', 'sa_d'],
  '5.2': ['policy', 'console'],
  '5.3': ['sa_d', 'band'],
  '5.4': ['sa_d', 'band'],
  '5.5': ['sa_d', 'band'],
  '6.1': ['sa_d'],
  '6.2': ['sa_r', 'sa_d'],
  '6.3': ['sa_r', 'sa_d'],
  '6.4': ['sa_r', 'sa_d'],
  '7.1': ['gate'],
  '7.2': ['gate'],
  '7.3': ['policy', 'gate'],
  '7.4': ['console', 'sa_r', 'sa_d'],
  '7.5': ['sa_d'],
  '7.6': ['sa_r', 'sa_d', 'band'],
  '7.7': ['sa_r', 'sa_d', 'band'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

const BASE: Record<string, string> = {
  drpc: 'FailedOver · Completed',
  policy: 'dr-policy-15m · 900s',
  console: 'all volumes are synced',
  gate: 'two COMPLETED copies',
  vm0: 'Running · worker-2',
  vrg0: 'Primary',
  vr0r: 'Primary',
  vr0d: 'Primary',
  vrg1: 'Secondary',
  nowork: 'removed by GitOps',
  vr1r: 'Secondary',
  vr1d: 'Secondary',
  sa_r: 'Source · OK',
  sa_d: 'Source · OK',
  sb_r: 'Destination · OK',
  sb_d: 'Destination · OK',
};

export const CH: [string, number, string, string][] = [
  ['3.2', 0.2, 'sa_r', 'Source · failover 13:26:42'],
  ['3.2', 0.2, 'sa_d', 'Source · failover 13:26:41'],
  ['3.2', 0.2, 'sb_r', 'Destination · failed over'],
  ['3.2', 0.2, 'sb_d', 'Destination · failed over'],
  ['3.2', 0.2, 'drpc', 'FailedOver · Cleaning Up'],
  ['3.3', 0.2, 'sa_r', 'Source · reprotected 13:26:45'],
  ['3.3', 0.2, 'sa_d', 'Source · reprotected 13:26:45'],
  ['4.2', 0.2, 'sa_r', 'Source · OK · last 13:37:01'],
  ['4.4', 0.2, 'sa_d', 'Source · OK · last 13:22:27'],
  ['4.5', 0.2, 'sa_d', 'Source · OK · last 13:45:11'],
  ['4.6', 0.2, 'sa_d', 'Source · OK · last 13:56:19'],
  ['4.6', 0.2, 'sa_r', 'Source · OK · last 14:00:59'],
  ['5.1', 0.2, 'console', 'all volumes are synced'],
  ['7.1', 0.2, 'gate', 'two COMPLETED copies'],
  ['7.4', 0.2, 'console', 'timestamp from the driver'],
];

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const keys = FOCUS[c.id] ?? [];
  const status = (key: string) => {
    let v = BASE[key] ?? '';
    for (const [beat, frac, k, value] of CH) if (k === key && reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac)) v = value;
    return v;
  };
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : 0.08);
  const ch = phase(c.id);
  const reversed = reached(c.id, '3.2');
  const afterFailover = reached(c.id, '3.2');
  const appear = (key: string) => (key === 'gate' ? (reached(c.id, '7.1') ? prog(c.f, -15, 35) : 0) : ch === 2 ? prog(c.f, -15, 35) : 1);
  return <div style={{position: 'absolute', width: 2480, height: 1420}}>
    <Region b={{x: 70, y: 45, w: 2340, h: 250}} title="HUB · edge36" sub="Ramen control objects and the operator view" color={C.blue}/>
    <Region b={{x: 70, y: 335, w: 1100, h: 350}} title="SPOKE-0 · edge95" sub={afterFailover ? 'workload site after the failover' : 'standby before the failover'} color={C.spoke0}/>
    <Region b={{x: 1380, y: 335, w: 1030, h: 350}} title="SPOKE-1 · edge97" sub={afterFailover ? 'old site · now the destination' : 'workload site before the failover'} color={C.spoke1}/>
    <Region b={{x: 70, y: 735, w: 1100, h: 300}} title="VSA-A · spoke-0 storage" sub="PS3b37452a6e0f" color={C.array}/>
    <Region b={{x: 1380, y: 735, w: 1030, h: 300}} title="VSA-B · spoke-1 storage" sub="PSff392f423bd6" color={C.array}/>
    <Region b={{x: 70, y: 1085, w: 2340, h: 300}} title="ARRAY JOB HISTORY" sub={ch === 2 ? 'VSA-B · before the reversal' : 'VSA-A · after the reversal'} color={C.cyan}/>

    {Object.entries(NODES).map(([key, n]) => <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role} nameSize={n.nameSize ?? 22} lines={[n.scope, status(key) || 'recorded configuration']} appear={appear(key)} focus={focus(key)} hl={keys.includes(key) ? 0.25 : 0} color={n.color} detail={Math.max(0, Math.min(1, (c.zoom - .65) / .2))}/>)}

    <svg width={2480} height={1420} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <defs>
        <marker id="tip334" markerWidth="12" markerHeight="12" refX="9" refY="4" orient="auto"><path d="M0,0 L0,8 L11,4 z" fill={C.orange}/></marker>
      </defs>
      {ch >= 2 ? <g opacity={reversed ? 1 : .9}>
        <path d={reversed ? 'M1178,905 L1368,905' : 'M1368,905 L1178,905'} fill="none" stroke={C.orange} strokeWidth={6} markerEnd="url(#tip334)"/>
        <text x={1273} y={882} textAnchor="middle" fill={C.orange} fontSize={19} fontFamily={sans}>copies</text>
        <text x={1273} y={946} textAnchor="middle" fill={C.dim} fontSize={17} fontFamily={mono}>RPO 900s</text>
      </g> : null}
      {ch === 2 ? (
        <g>
          <text x={160} y={1160} fill={C.dim} fontSize={22} fontFamily={sans}>VSA-B · scheduled copies every</text>
          <text x={470} y={1160} fill={C.cyan} fontSize={22} fontFamily={mono}>12m</text>
          <text x={160} y={1200} fill={C.dim} fontSize={20} fontFamily={sans}>root</text>
          <text x={160} y={1280} fill={C.dim} fontSize={20} fontFamily={sans}>data</text>
          <text x={160} y={1350} fill={C.amber} fontSize={19} fontFamily={sans}>last completed 13:22:27, both disks</text>
          {[12 * 60 + 34, 12 * 60 + 46, 12 * 60 + 58, 13 * 60 + 10, 13 * 60 + 22].map((m) => {
            const x = 170 + (m * 60 + 27 - (12 * 3600 + 30 * 60)) * 0.6;
            return <g key={m}>
              <rect x={x - 5} y={1208} width={10} height={30} rx={3} fill={C.cyan}/>
              <rect x={x - 5} y={1288} width={10} height={30} rx={3} fill={C.cyan}/>
            </g>;
          })}
        </g>
      ) : null}
      {ch >= 3 ? <JobBand id={c.id}/> : null}
    </svg>
  </div>;
};

// --- after-reversal job history -------------------------------------------------
const T0 = 13 * 3600 + 20 * 60; // 13:20:00
const PX = 0.8;
const jx = (h: number, m: number, s = 0) => 170 + ((h * 3600 + m * 60 + s) - T0) * PX;
const show = (id: string, beat: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = beat.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

const JobBand: React.FC<{id: string}> = ({id}) => {
  const ticks = [
    [13, 20], [13, 25], [13, 30], [13, 35], [13, 40], [13, 45], [13, 50], [13, 55], [14, 0], [14, 5],
  ] as [number, number][];
  const rootY = 1225, dataY = 1305;
  const rootJobs: [number, number, number, string][] = [
    [13, 22, 28, 'sync'], [13, 26, 42, 'failover'], [13, 26, 45, 'reprotect'],
    [13, 36, 57, 'sync'], [13, 48, 57, 'sync'], [14, 0, 57, 'sync'],
  ];
  const dataJobs: [number, number, number, string][] = [
    [13, 22, 28, 'sync'], [13, 26, 41, 'failover'], [13, 26, 45, 'reprotect'],
    [13, 44, 17, 'sync'], [13, 56, 17, 'sync'],
  ];
  const col = (k: string) => (k === 'sync' ? C.cyan : k === 'failover' ? C.amber : C.green);
  const deadline = jx(13, 41, 45);
  const firstData = jx(13, 44, 17);
  const bar = (jobs: [number, number, number, string][], y: number) => jobs.map(([h, m, s, k]) => {
    const gate = k === 'sync' && h >= 13 && m >= 30 && s >= 57 ? '4.2' : k === 'sync' && (h > 13 || (h === 13 && m >= 44)) ? '4.5' : k === 'sync' ? '3.1' : k === 'failover' ? '3.2' : '3.3';
    if (!show(id, gate)) return null;
    const x = jx(h, m, s);
    return <g key={`${y}-${h}-${m}-${s}`}>
      <rect x={x - 5} y={y - 15} width={10} height={30} rx={3} fill={col(k)}/>
    </g>;
  });
  return <g>
    {ticks.map(([h, m]) => {
      const x = jx(h, m);
      return <g key={`t${h}${m}`}>
        <line x1={x} y1={1150} x2={x} y2={1158} stroke={C.faint} strokeWidth={1.5}/>
        <text x={x} y={1140} textAnchor="middle" fill={C.faint} fontSize={16} fontFamily={mono}>{`${h}:${String(m).padStart(2, '0')}`}</text>
      </g>;
    })}
    <line x1={170} y1={1150} x2={2350} y2={1150} stroke={C.border} strokeWidth={2}/>
    <text x={160} y={1200} fill={C.dim} fontSize={19} fontFamily={sans}>root</text>
    <text x={160} y={1280} fill={C.dim} fontSize={19} fontFamily={sans}>data</text>
    <line x1={170} y1={rootY} x2={2350} y2={rootY} stroke={`${C.border}88`} strokeWidth={1.5}/>
    <line x1={170} y1={dataY} x2={2350} y2={dataY} stroke={`${C.border}88`} strokeWidth={1.5}/>
    {bar(rootJobs, rootY)}
    {bar(dataJobs, dataY)}

    {show(id, '3.3') ? <g>
      <rect x={jx(13, 26, 43) - 4} y={dataY - 22} width={8} height={44} rx={2} fill={C.red} opacity={.9}/>
      <text x={jx(13, 26, 43)} y={dataY - 30} textAnchor="middle" fill={C.red} fontSize={15} fontFamily={sans}>3 FAILED</text>
      <rect x={jx(13, 26, 43) - 4} y={rootY - 22} width={8} height={44} rx={2} fill={C.red} opacity={.9}/>
      <text x={jx(13, 26, 43)} y={rootY - 30} textAnchor="middle" fill={C.red} fontSize={15} fontFamily={sans}>2 FAILED</text>
    </g> : null}

    {show(id, '3.4') ? <text x={jx(13, 26, 45) + 16} y={1338} fill={C.green} fontSize={18} fontFamily={sans}>reprotect COMPLETED 13:26:45</text> : null}

    {show(id, '4.2') ? <text x={jx(13, 36, 57)} y={rootY - 26} textAnchor="middle" fill={C.cyan} fontSize={18} fontFamily={sans}>first copy 13:36:57</text> : null}

    {show(id, '4.3') ? <g>
      <line x1={deadline} y1={1180} x2={deadline} y2={1330} stroke={C.red} strokeWidth={2.5} strokeDasharray="8 7"/>
      <text x={deadline + 8} y={1372} fill={C.red} fontSize={18} fontFamily={sans}>RPO deadline 13:41:45</text>
    </g> : null}

    {show(id, '4.3') ? <g opacity={show(id, '4.5') ? 1 : .55}>
      <rect x={deadline} y={dataY - 17} width={firstData - deadline} height={34} rx={5} fill={`${C.red}44`}/>
    </g> : null}

    {show(id, '4.5') ? <g>
      <text x={firstData} y={dataY - 26} textAnchor="middle" fill={C.orange} fontSize={18} fontFamily={sans}>first copy 13:44:17</text>
      <text x={(deadline + firstData) / 2} y={dataY + 44} textAnchor="middle" fill={C.red} fontSize={17} fontFamily={sans}>2m 32s past</text>
    </g> : null}

    {show(id, '4.6') ? <text x={jx(13, 56, 17)} y={dataY - 26} textAnchor="middle" fill={C.cyan} fontSize={17} fontFamily={sans}>13:56:17</text> : null}
    {show(id, '4.6') ? <text x={jx(14, 0, 57)} y={rootY - 26} textAnchor="middle" fill={C.cyan} fontSize={17} fontFamily={sans}>14:00:57</text> : null}
  </g>;
};
