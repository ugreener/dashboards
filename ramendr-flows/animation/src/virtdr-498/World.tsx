import React from 'react';
import {C, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; lines: (s: string) => string[]; box: Box; color: string; nameSize?: number};
const GROUP_NAME = 'vg-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d-VSA-A-Fifteen_Minutes';
const VGR_NAME = 'vgr-4251c970ec7af885d6ec79c1d2c40661-hammerdb-drpc';
const VR_NAME = 'vr-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d';
const CONTENT_NAME = 'vgrcontent-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d';

export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'hammerdb-drpc', role: 'the hub record for this application', lines: (s) => ['hub · openshift-dr-ops', s], box: [110, 120, 600, 185], color: C.orange},
  policy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'pairs the sites and sets the 15-minute objective', lines: (s) => ['hub · cluster scope', s], box: [750, 120, 430, 185], color: C.orange, nameSize: 21},
  placement: {kind: 'Placement', name: 'hammerdb-placement', role: 'asks for a cluster for the application', lines: (s) => ['hub · openshift-dr-ops', s], box: [1220, 120, 500, 185], color: C.blue},
  decision: {kind: 'PlacementDecision', name: 'hammerdb-placement-decision-1', role: 'records the cluster the placement chose', lines: (s) => ['hub · openshift-dr-ops', s], box: [1760, 120, 600, 185], color: C.blue, nameSize: 18},

  vrg1: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: "coordinates the old site's role", lines: (s) => ['spoke-1 · openshift-dr-ops', s], box: [110, 470, 1090, 170], color: C.orange},
  vgr1: {kind: 'VolumeGroupReplication', name: VGR_NAME, role: 'one request for the two claims', lines: (s) => ['spoke-1 · hammerdb', s], box: [110, 670, 520, 190], color: C.purple, nameSize: 12},
  vr1: {kind: 'VolumeReplication', name: VR_NAME, role: 'the work order csi-addons drives', lines: (s) => ['spoke-1 · hammerdb', s], box: [670, 670, 530, 190], color: C.amber, nameSize: 13},
  vm1: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'RHEL 9 guest running PostgreSQL and the writer', lines: (s) => ['spoke-1 · hammerdb', s], box: [110, 900, 480, 190], color: C.green, nameSize: 19},
  pvcRoot1: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk-grp', role: 'the root disk claim', lines: (s) => ['spoke-1 · hammerdb', s], box: [620, 900, 270, 190], color: C.dim, nameSize: 12},
  pvcData1: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-datadisk-grp', role: 'the database disk claim', lines: (s) => ['spoke-1 · hammerdb', s], box: [910, 900, 290, 190], color: C.dim, nameSize: 12},

  vrg0: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'coordinates the new primary', lines: (s) => ['spoke-0 · openshift-dr-ops', s], box: [1275, 470, 1095, 170], color: C.orange},
  vgr0: {kind: 'VolumeGroupReplication', name: VGR_NAME, role: 'one object for the whole group', lines: (s) => ['spoke-0 · hammerdb', s], box: [1275, 670, 500, 190], color: C.purple, nameSize: 12},
  content0: {kind: 'VolumeGroupReplicationContent', name: CONTENT_NAME, role: 'holds the group handle and disk mapping', lines: (s) => ['cluster scope · group manifest', s], box: [1795, 670, 575, 190], color: C.cyan, nameSize: 13},
  vr0: {kind: 'VolumeReplication', name: VR_NAME, role: 'drives the group state machine', lines: (s) => ['spoke-0 · hammerdb', s], box: [1275, 880, 500, 170], color: C.amber, nameSize: 13},
  vm0: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'the recovered guest', lines: (s) => ['spoke-0 · hammerdb', s], box: [1795, 880, 575, 170], color: C.green, nameSize: 19},
  pvcRoot0: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk-grp', role: 'bound to the promoted root disk', lines: (s) => ['spoke-0 · hammerdb', s], box: [1275, 1080, 260, 180], color: C.dim, nameSize: 12},
  pvcData0: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-datadisk-grp', role: 'bound to the promoted data disk', lines: (s) => ['spoke-0 · hammerdb', s], box: [1555, 1080, 280, 180], color: C.dim, nameSize: 12},

  groupB: {kind: 'PowerStore volume group', name: GROUP_NAME, role: 'the hammerdb group on the old array', lines: (s) => ['VSA-B · PSff392f423bd6', s], box: [140, 1385, 1030, 190], color: C.array, nameSize: 15},
  groupA: {kind: 'PowerStore volume group', name: GROUP_NAME, role: 'the hammerdb group on the recovery array', lines: (s) => ['VSA-A · PS3b37452a6e0f', s], box: [1305, 1385, 1035, 190], color: C.array, nameSize: 15},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;
RECT.driver1 = [140, 1595, 500, 70];
RECT.driver0 = [1305, 1595, 500, 70];

export const FOCUS: Record<string, string[]> = {
  '2.1': ['drpc', 'vrg1', 'vgr1', 'vr1', 'vm1'],
  '2.2': ['drpc', 'vrg1'],
  '2.3': ['drpc', 'policy'],
  '2.4': ['vgr1', 'vr1'],
  '2.5': ['drpc'],
  '3.1': ['drpc', 'vm1'],
  '3.2': ['drpc'],
  '3.3': ['drpc'],
  '3.4': ['vm1'],
  '4.1': ['vrg0', 'content0', 'vr0', 'vm0'],
  '4.2': ['vrg0', 'vgr0', 'content0'],
  '4.3': ['vgr0', 'vr0', 'driver0'],
  '4.4': ['groupA', 'groupB', 'driver0', 'vgr0'],
  '4.5': ['pvcRoot0', 'pvcData0', 'groupA'],
  '4.6': ['vm0'],
  '4.7': ['drpc', 'decision'],
  '4.8': ['vrg0', 'groupA'],
  '5.1': ['groupA'],
  '5.2': ['groupB'],
  '5.3': ['groupB', 'groupA'],
  '5.4': ['groupA'],
  '6.1': ['groupA', 'groupB', 'vgr0', 'vr0'],
  '6.2': ['vgr0', 'vr0'],
  '6.3': ['groupA', 'groupB'],
  '6.4': ['vrg1', 'drpc'],
  '6.5': ['drpc', 'vrg1'],
  '7.1': ['vm1', 'pvcRoot1', 'pvcData1', 'vrg1'],
  '7.2': ['pvcRoot1', 'pvcData1'],
  '7.3': ['pvcRoot1', 'pvcData1', 'vrg1'],
  '7.4': ['pvcRoot1', 'pvcData1', 'driver1'],
  '7.5': ['pvcRoot1', 'pvcData1'],
  '8.1': ['drpc', 'vrg1', 'vrg0', 'groupA', 'groupB', 'vm0'],
  '8.2': ['groupA'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

export const CH: [string, number, string, string][] = [
  ['3.2', 0.2, 'drpc', 'FailingOver'],
  ['3.2', 0.4, 'decision', 'spoke-0'],
  ['3.2', 0.5, 'vrg0', 'Primary requested'],
  ['3.3', 0.3, 'drpc', 'FailedOver · Cleaning Up'],
  ['4.1', 0.3, 'content0', 'restored'],
  ['4.1', 0.4, 'vm0', 'restored'],
  ['4.1', 0.5, 'pvcRoot0', 'restored'],
  ['4.1', 0.6, 'pvcData0', 'restored'],
  ['4.2', 0.2, 'vrg0', 'Primary'],
  ['4.2', 0.3, 'vgr0', 'primary'],
  ['4.2', 0.4, 'content0', 'restored'],
  ['4.2', 0.5, 'vr0', 'Primary'],
  ['4.3', 0.3, 'vr0', 'PromoteVolume'],
  ['4.3', 0.5, 'driver0', 'group failover'],
  ['4.4', 0.3, 'groupA', 'Source · OK'],
  ['4.4', 0.4, 'groupB', 'Destination · OK'],
  ['4.4', 0.5, 'vgr0', 'Replicating'],
  ['4.4', 0.6, 'vr0', 'Primary'],
  ['4.5', 0.4, 'pvcRoot0', 'Bound'],
  ['4.5', 0.5, 'pvcData0', 'Bound'],
  ['4.6', 0.3, 'vm0', 'Running'],
  ['4.7', 0.2, 'drpc', 'FailedOver'],
  ['4.7', 0.3, 'decision', 'spoke-0'],
  ['6.1', 0.2, 'groupA', 'Source · OK'],
  ['6.1', 0.3, 'groupB', 'Destination · OK'],
  ['6.1', 0.4, 'vgr0', 'Replicating'],
  ['6.4', 0.2, 'vrg1', 'Secondary'],
  ['6.4', 0.3, 'drpc', 'Completed · PeerReady'],
  ['7.1', 0.2, 'vm1', 'deleted'],
  ['7.1', 0.3, 'pvcRoot1', 'deleted'],
  ['7.1', 0.4, 'pvcData1', 'deleted'],
  ['7.1', 0.5, 'vgr1', 'deleted'],
  ['7.1', 0.6, 'vrg1', 'Secondary'],
  ['7.2', 0.2, 'pvcRoot1', 'PV Retain'],
  ['7.2', 0.3, 'pvcData1', 'PV Retain'],
  ['7.3', 0.4, 'pvcRoot1', 'Delete · 422'],
  ['7.3', 0.5, 'pvcData1', 'Delete · 422'],
  ['7.4', 0.3, 'pvcRoot1', 'Released · retry'],
  ['7.4', 0.4, 'pvcData1', 'Released · retry'],
  ['7.5', 0.3, 'pvcRoot1', 'Retain patched'],
  ['7.5', 0.4, 'pvcData1', 'Retain patched'],
];

const BAND: Record<string, string> = {
  drpc: 'hub', policy: 'hub', placement: 'hub', decision: 'hub',
  vrg1: 'spoke1', vgr1: 'spoke1', vr1: 'spoke1', vm1: 'spoke1', pvcRoot1: 'spoke1', pvcData1: 'spoke1',
  vrg0: 'spoke0', vgr0: 'spoke0', content0: 'spoke0', vr0: 'spoke0', vm0: 'spoke0', pvcRoot0: 'spoke0', pvcData0: 'spoke0',
  groupA: 'arrayA', groupB: 'arrayB', driver0: 'spoke0', driver1: 'spoke1',
};

const BASE: Record<string, string> = {
  drpc: 'Deployed · Protected · PeerReady',
  policy: '900 s · async',
  placement: 'spoke-1',
  decision: 'spoke-1',
  vrg1: 'Primary',
  vgr1: 'primary',
  vr1: 'Primary',
  vm1: 'Running',
  pvcRoot1: 'Bound',
  pvcData1: 'Bound',
  vrg0: 'Secondary',
  vgr0: 'not created yet',
  content0: 'not created yet',
  vr0: 'not created yet',
  vm0: 'not created yet',
  pvcRoot0: 'not created yet',
  pvcData0: 'not created yet',
  groupB: 'Source · OK',
  groupA: 'Destination · OK',
  driver1: 'idle',
  driver0: 'idle',
};

const DRIVER = (x: number, y: number, side: string, status: string) => (
  <div style={{position: 'absolute', left: x, top: y, width: 500, padding: '8px 14px', border: `1.5px dashed ${C.purple}99`, borderRadius: 10, background: `${C.bg}d9`, fontFamily: sans, color: C.dim, fontSize: 16}}>
    <span style={{color: C.purple, fontWeight: 700}}>csi-addons + Dell CSI</span>
    <span style={{margin: '0 8px', color: C.faint}}>·</span>
    {side} · {status}
  </div>
);

export const World: React.FC<{c: Ctx; panel?: boolean}> = ({c, panel}) => {
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
  const active = new Set(keys.map((k) => BAND[k]).filter(Boolean));
  const bandOn = (b: string) => keys.length === 0 || active.has(b);
  const bandOpacity = (b: string) => (panel && !bandOn(b) ? 0 : bandOn(b) ? 1 : 0.16);
  const bandHide = (b: string) => panel || !bandOn(b);
  const appearAll = chapter === 2 ? prog(c.f, -15, 35) : 1;
  const failover = reached(c.id, '3.2');
  const restored = reached(c.id, '4.1');
  const promoted = reached(c.id, '4.4');
  const cleaned = reached(c.id, '7.1');

  const arrow = (d: string, color: string, dashed: boolean, label: string | null, lx: number, ly: number, opacity = 1) => (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={5} strokeDasharray={dashed ? '14 11' : undefined} markerEnd="url(#tip498)" />
      {label ? <>
        <rect x={lx - 175} y={ly - 19} width={350} height={36} rx={10} fill={C.bg} opacity={0.95} />
        <text x={lx} y={ly + 6} textAnchor="middle" fill={color} fontSize={18} fontFamily={sans}>{label}</text>
      </> : null}
    </g>
  );

  const node = (key: string, appear = appearAll) => {
    const n = NODES[key];
    return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role}
      lines={n.lines(status(key))} appear={appear} focus={focus(key)} hl={keys.includes(key) ? 0.26 : 0}
      color={n.color} detail={Math.max(0, Math.min(1, (c.zoom - 0.6) / 0.2))} nameSize={n.nameSize ?? 22} />;
  };

  return <div style={{position: 'absolute', width: 2480, height: 1720}}>
    <Region b={{x: 70, y: 45, w: 2340, h: 300}} title="HUB · ocp-edge36" sub="the control record and the decision" color={C.blue} opacity={bandOpacity('hub')} hideTitle={bandHide('hub')} />
    <Region b={{x: 70, y: 400, w: 1170, h: 880}} title="SPOKE-1 · ocp-edge97 · OLD SITE" sub="holds VSA-B, the source before the move" color={C.spoke1} opacity={bandOpacity('spoke1')} hideTitle={bandHide('spoke1')} />
    <Region b={{x: 1235, y: 400, w: 1175, h: 880}} title="SPOKE-0 · ocp-edge95 · RECOVERY SITE" sub="holds VSA-A, the target of the move" color={C.spoke0} opacity={bandOpacity('spoke0')} hideTitle={bandHide('spoke0')} />
    <Region b={{x: 70, y: 1320, w: 1170, h: 360}} title="VSA-B · OLD ARRAY" color={C.array} opacity={bandOpacity('arrayB')} hideTitle={bandHide('arrayB')} />
    <Region b={{x: 1235, y: 1320, w: 1175, h: 360}} title="VSA-A · RECOVERY ARRAY" color={C.array} opacity={bandOpacity('arrayA')} hideTitle={bandHide('arrayA')} />

    {Object.keys(NODES).map((key) => {
      if ((key === 'vgr0' || key === 'content0' || key === 'vr0' || key === 'vm0' || key === 'pvcRoot0' || key === 'pvcData0') && !failover) return null;
      return node(key, failover && key.startsWith('vrg0') ? prog(c.f, -10, 24) : appearAll);
    })}
    {DRIVER(140, 1595, 'spoke-1', status('driver1'))}
    {DRIVER(1305, 1595, 'spoke-0', status('driver0'))}

    <svg width={2480} height={1720} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <defs>
        <marker id="tip498" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="context-stroke" /></marker>
      </defs>

      {!failover ? arrow('M410,305 C410,370 410,400 410,470', C.cyan, true, 'delivers the VRG', 690, 380, prog(c.f, c.dur * 0.05, c.dur * 0.05 + 24)) : null}
      {failover ? <>
        {arrow('M410,305 C410,360 1525,360 1525,470', C.cyan, true, 'target VRG as Primary', 1000, 380)}
        {arrow('M410,305 C410,350 200,350 200,470', C.purple, true, 'old VRG to Secondary', 300, 390)}
      </> : null}
      {!failover ? <>
        {arrow('M370,640 L370,670', C.green, false, null, 0, 0)}
        {arrow('M630,765 L670,765', C.cyan, false, null, 0, 0)}
      </> : null}
      {failover && restored ? <>
        {arrow('M1525,640 L1525,670', C.green, false, null, 0, 0)}
        {arrow('M1775,765 L1795,765', C.cyan, false, null, 0, 0)}
        {arrow('M1525,860 L1525,880', C.green, false, null, 0, 0)}
      </> : null}

      {!promoted ? arrow('M1170,1475 L1305,1475', C.orange, false, null, 0, 0) : null}
      {promoted ? arrow('M1170,1475 L1305,1475', C.orange, false, null, 0, 0) : null}

      {promoted ? <>
        {arrow('M1775,950 C1900,980 2380,1100 2380,1385', C.purple, true, 'PromoteVolume · one group', 2010, 1210)}
        {arrow('M390,1090 C390,1200 250,1200 250,1385', C.purple, true, 'role + state', 620, 1270, 0.9)}
      </> : null}

      {cleaned ? arrow('M110,1000 C70,1100 70,1250 140,1385', C.red, true, 'PV delete retries', 320, 1180) : null}
    </svg>
  </div>;
};
