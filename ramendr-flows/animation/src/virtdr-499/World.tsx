import React from 'react';
import {C, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; lines: (s: string) => string[]; box: Box; color: string; nameSize?: number};

export const NODES: Record<string, Node> = {
  appset: {kind: 'ApplicationSet', name: 'dell-vm-workload', role: 'one template, one Application per selected cluster', lines: (s) => ['hub · openshift-gitops', s], box: [1470, 105, 840, 180], color: C.blue},
  placement: {kind: 'Placement', name: 'dell-vm-placement', role: 'asks for a cluster for the application', lines: (s) => ['hub · openshift-gitops', s], box: [110, 105, 560, 180], color: C.blue},
  decision: {kind: 'PlacementDecision', name: 'dell-vm-placement-decision-1', role: 'records the cluster the placement chose', lines: (s) => ['hub · openshift-gitops', s], box: [720, 105, 700, 180], color: C.blue, nameSize: 18},
  drpc: {kind: 'DRPlacementControl', name: 'dell-vm-placement-drpc', role: 'the hub record for this application', lines: (s) => ['hub · openshift-gitops', s], box: [110, 320, 760, 180], color: C.orange, nameSize: 20},
  policy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'pairs the sites and sets the fifteen-minute objective', lines: (s) => ['hub · cluster scope', s], box: [910, 320, 560, 180], color: C.orange},

  app1: {kind: 'Application', name: 'dell-vm-workload-spoke-1', role: 'the Application Argo CD runs on this spoke', lines: (s) => ['spoke-1 · gitops-vms', s], box: [110, 610, 520, 180], color: C.green, nameSize: 18},
  vrg1: {kind: 'VolumeReplicationGroup', name: 'dell-vm-placement-drpc', role: "coordinates the old site's role", lines: (s) => ['spoke-1 · gitops-vms', s], box: [110, 850, 1090, 165], color: C.orange, nameSize: 20},
  vm1: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'RHEL 9 guest running PostgreSQL and the writer', lines: (s) => ['spoke-1 · gitops-vms', s], box: [110, 1060, 420, 180], color: C.green, nameSize: 20},
  pvcRoot1: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk-mgd-grp', role: 'the root disk claim', lines: (s) => ['spoke-1 · gitops-vms', s], box: [550, 1060, 310, 185], color: C.dim, nameSize: 13},
  pvcData1: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-datadisk-mgd-grp', role: 'the database disk claim', lines: (s) => ['spoke-1 · gitops-vms', s], box: [880, 1060, 310, 185], color: C.dim, nameSize: 13},
  dvRoot1: {kind: 'DataVolume', name: 'hammerdb-rhel9-rootdisk-mgd-grp', role: 'prepares the root disk', lines: (s) => ['spoke-1 · gitops-vms', s], box: [550, 1275, 310, 150], color: C.purple, nameSize: 13},
  dvData1: {kind: 'DataVolume', name: 'hammerdb-rhel9-datadisk-mgd-grp', role: 'prepares the data disk', lines: (s) => ['spoke-1 · gitops-vms', s], box: [880, 1275, 310, 150], color: C.purple, nameSize: 13},

  app0: {kind: 'Application', name: 'dell-vm-workload-spoke-0', role: 'the Application Argo CD runs on the target', lines: (s) => ['spoke-0 · gitops-vms', s], box: [1275, 610, 520, 180], color: C.green, nameSize: 18},
  vrg0: {kind: 'VolumeReplicationGroup', name: 'dell-vm-placement-drpc', role: 'coordinates the new primary', lines: (s) => ['spoke-0 · gitops-vms', s], box: [1275, 850, 1095, 165], color: C.orange, nameSize: 20},
  vm0: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'the recovered guest', lines: (s) => ['spoke-0 · gitops-vms', s], box: [1275, 1060, 420, 180], color: C.green, nameSize: 20},
  pvcRoot0: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk-mgd-grp', role: 'bound to the promoted root disk', lines: (s) => ['spoke-0 · gitops-vms', s], box: [1715, 1060, 310, 185], color: C.dim, nameSize: 13},
  pvcData0: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-datadisk-mgd-grp', role: 'bound to the promoted data disk', lines: (s) => ['spoke-0 · gitops-vms', s], box: [2045, 1060, 310, 185], color: C.dim, nameSize: 13},
  dvRoot0: {kind: 'DataVolume', name: 'hammerdb-rhel9-rootdisk-mgd-grp', role: 'adopts the restored claim', lines: (s) => ['spoke-0 · gitops-vms', s], box: [1715, 1275, 310, 150], color: C.purple, nameSize: 13},
  dvData0: {kind: 'DataVolume', name: 'hammerdb-rhel9-datadisk-mgd-grp', role: 'adopts the restored claim', lines: (s) => ['spoke-0 · gitops-vms', s], box: [2045, 1275, 310, 150], color: C.purple, nameSize: 13},

  groupB: {kind: 'PowerStore array', name: 'VSA-B', role: 'the array at the run source site', lines: (s) => ['10.46.48.30', s], box: [140, 1700, 1030, 175], color: C.array, nameSize: 34},
  groupA: {kind: 'PowerStore array', name: 'VSA-A', role: 'the array at the run recovery site', lines: (s) => ['10.46.48.20', s], box: [1305, 1700, 1035, 175], color: C.array, nameSize: 34},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;
RECT.argo1 = [660, 610, 540, 80];
RECT.argo0 = [1825, 610, 545, 80];
RECT.driver1 = [140, 1890, 500, 58];
RECT.driver0 = [1305, 1890, 500, 58];

export const FOCUS: Record<string, string[]> = {
  '2.1': ['drpc', 'app1'],
  '2.2': ['drpc', 'vrg1'],
  '2.3': ['app1', 'argo1'],
  '2.4': ['drpc', 'vrg1'],
  '2.5': ['drpc', 'vrg1', 'groupB'],
  '2.6': ['app1', 'dvRoot1', 'dvData1', 'pvcRoot1', 'pvcData1'],
  '2.7': ['drpc', 'groupB'],
  '3.1': ['app1', 'drpc'],
  '3.2': ['app1', 'drpc'],
  '3.3': ['drpc', 'decision'],
  '3.4': ['drpc', 'decision'],
  '3.5': ['vm1', 'vm0', 'groupA', 'groupB'],
  '4.1': ['vrg0', 'pvcRoot0', 'pvcData0'],
  '4.2': ['vrg0', 'argo0'],
  '4.3': ['argo0', 'driver0', 'groupA', 'groupB'],
  '4.4': ['pvcRoot0', 'pvcData0', 'groupA'],
  '4.5': ['vrg0', 'argo0', 'groupA'],
  '5.1': ['app1', 'app0', 'vm1'],
  '5.2': ['decision', 'appset'],
  '5.3': ['appset', 'app1', 'app0', 'vm1'],
  '5.4': ['vm1', 'pvcRoot1', 'pvcData1', 'dvRoot1', 'dvData1', 'vrg1'],
  '5.5': ['app0', 'argo0'],
  '5.6': ['dvRoot0', 'dvData0', 'pvcRoot0', 'pvcData0'],
  '5.7': ['vm0', 'groupA'],
  '6.1': ['groupB', 'drpc'],
  '6.2': ['groupB', 'vm0'],
  '6.3': ['groupB', 'groupA'],
  '6.4': ['groupA', 'groupB', 'drpc'],
  '7.1': ['drpc', 'vrg0', 'vrg1'],
  '7.2': ['groupA'],
  '7.3': ['groupB'],
  '7.4': ['pvcRoot1', 'pvcData1'],
  '7.5': ['drpc', 'vm0'],
  '8.1': ['drpc', 'appset', 'vrg1', 'vrg0', 'groupA', 'groupB', 'vm0'],
  '8.2': ['drpc', 'groupA', 'vm0'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

export const CH: [string, number, string, string][] = [
  ['3.3', 0.25, 'drpc', 'FailingOver'],
  ['3.4', 0.3, 'drpc', 'FailedOver · Cleaning Up'],
  ['3.4', 0.7, 'drpc', 'FailedOver · Completed'],
  ['4.2', 0.3, 'vrg0', 'Primary requested'],
  ['4.3', 0.4, 'groupA', 'Local role: Source → VSA-B'],
  ['4.3', 0.5, 'groupB', 'Local role: Destination → VSA-A'],
  ['4.4', 0.4, 'pvcRoot0', 'Bound · promoted'],
  ['4.4', 0.5, 'pvcData0', 'Bound · promoted'],
  ['4.5', 0.3, 'vrg0', 'Primary · Replicating'],
  ['5.2', 0.3, 'decision', 'spoke-0 · reason spoke-0'],
  ['5.3', 0.3, 'app1', 'removed by Argo'],
  ['5.3', 0.5, 'app0', 'created · Healthy'],
  ['5.4', 0.3, 'vm1', 'pruned'],
  ['5.4', 0.4, 'pvcRoot1', 'pruned'],
  ['5.4', 0.5, 'pvcData1', 'pruned'],
  ['5.4', 0.6, 'vrg1', 'Secondary'],
  ['5.6', 0.4, 'dvRoot0', 'Succeeded · adopted'],
  ['5.6', 0.5, 'dvData0', 'Succeeded · adopted'],
  ['5.7', 0.3, 'vm0', 'Running'],
  ['7.1', 0.3, 'drpc', 'Protected · PeerReady'],
  ['7.2', 0.4, 'groupA', 'Local role: Source · sync 11:15'],
  ['7.3', 0.4, 'groupB', 'Local role: Destination · sync 11:15'],
];

const BAND: Record<string, string> = {
  appset: 'hub', placement: 'hub', decision: 'hub', drpc: 'hub', policy: 'hub',
  app1: 'spoke1', vrg1: 'spoke1', vm1: 'spoke1', pvcRoot1: 'spoke1', pvcData1: 'spoke1', dvRoot1: 'spoke1', dvData1: 'spoke1', argo1: 'spoke1',
  app0: 'spoke0', vrg0: 'spoke0', vm0: 'spoke0', pvcRoot0: 'spoke0', pvcData0: 'spoke0', dvRoot0: 'spoke0', dvData0: 'spoke0', argo0: 'spoke0',
  groupA: 'arrayA', groupB: 'arrayB', driver0: 'spoke0', driver1: 'spoke1',
};

const BASE: Record<string, string> = {
  appset: '1 template · requeue 180 s',
  placement: 'preferredCluster spoke-0',
  decision: 'spoke-1 · reason spoke-1',
  drpc: 'FailedOver · Completed',
  policy: '900 s · async',
  app1: 'Healthy · Synced',
  argo1: 'Argo CD · syncs from Git',
  vrg1: 'Primary',
  vm1: 'Running',
  pvcRoot1: 'Bound',
  pvcData1: 'Bound',
  dvRoot1: 'Succeeded',
  dvData1: 'Succeeded',
  app0: 'not created yet',
  argo0: 'Argo CD · syncs from Git',
  vrg0: 'not created yet',
  vm0: 'not created yet',
  pvcRoot0: 'not created yet',
  pvcData0: 'not created yet',
  dvRoot0: 'not created yet',
  dvData0: 'not created yet',
  groupB: 'Local role: Source → VSA-A',
  groupA: 'Local role: Destination → VSA-B',
  driver1: 'idle',
  driver0: 'idle',
};

const GONE = new Set(['vm1', 'pvcRoot1', 'pvcData1', 'dvRoot1', 'dvData1', 'app1']);

const CHIP = (x: number, y: number, w: number, text: string, color: string) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, padding: '8px 14px', border: `1.5px dashed ${color}99`, borderRadius: 10, background: `${C.bg}d9`, fontFamily: sans, color: C.dim, fontSize: 16}}>
    <span style={{color, fontWeight: 700}}>{text}</span>
  </div>
);

export const World: React.FC<{c: Ctx; panel?: boolean}> = ({c, panel}) => {
  const keys = FOCUS[c.id] ?? [];
  const chapter = Number(c.id.split('.')[0]);
  const status = (key: string) => {
    let v = BASE[key] ?? '';
    for (const [beat, frac, k, value] of CH) {
      if (k === key && reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac)) v = value;
    }
    return v;
  };
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : panel ? 0 : 0.08);
  const active = new Set(keys.map((k) => BAND[k]).filter(Boolean));
  const bandOn = (b: string) => keys.length === 0 || active.has(b);
  const bandOpacity = (b: string) => (panel && !bandOn(b) ? 0 : bandOn(b) ? 1 : 0.16);
  const bandHide = (b: string) => panel || !bandOn(b);

  const failover = reached(c.id, '4.1');
  const appPlane = reached(c.id, '5.3');
  const adopted = reached(c.id, '5.6');
  const pruned = reached(c.id, '5.4');
  const appearAll = chapter === 2 ? prog(c.f, -15, 35) : 1;
  const appear = (key: string) => {
    if (key === 'vrg0' || key === 'pvcRoot0' || key === 'pvcData0') return failover ? prog(c.f, -10, 26) : 0;
    if (key === 'app0') return appPlane ? prog(c.f, -10, 26) : 0;
    if (key === 'dvRoot0' || key === 'dvData0') return adopted ? prog(c.f, -10, 26) : 0;
    if (key === 'vm0') return reached(c.id, '5.7') ? prog(c.f, -10, 26) : 0;
    return appearAll;
  };

  const arrow = (d: string, color: string, dashed: boolean, label: string | null, lx: number, ly: number, opacity = 1) => (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={5} strokeDasharray={dashed ? '14 11' : undefined} markerEnd="url(#tip499)" />
      {label ? <>
        <rect x={lx - 185} y={ly - 19} width={370} height={36} rx={10} fill={C.bg} opacity={0.95} />
        <text x={lx} y={ly + 6} textAnchor="middle" fill={color} fontSize={18} fontFamily={sans}>{label}</text>
      </> : null}
    </g>
  );

  const node = (key: string) => {
    const n = NODES[key];
    const gone = GONE.has(key) && pruned && reached(c.id, '5.4');
    return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role}
      lines={n.lines(status(key))} appear={appear(key)} focus={gone ? 0.35 : focus(key)} hl={keys.includes(key) ? 0.26 : 0} exit={panel && !keys.includes(key) ? 1 : 0}
      color={n.color} detail={Math.max(0, Math.min(1, (c.zoom - 0.6) / 0.2))} nameSize={n.nameSize ?? 22} />;
  };

  return <div style={{position: 'absolute', width: 2480, height: 2000}}>
    <Region b={{x: 70, y: 45, w: 2340, h: 470}} title="HUB · ocp-edge36" sub="the control records and the template" color={C.blue} opacity={bandOpacity('hub')} hideTitle={bandHide('hub')} />
    <Region b={{x: 70, y: 560, w: 1170, h: 1010}} title="SPOKE-1 · ocp-edge97" sub="the run source" color={C.spoke1} opacity={bandOpacity('spoke1')} hideTitle={bandHide('spoke1')} />
    <Region b={{x: 1235, y: 560, w: 1175, h: 1010}} title="SPOKE-0 · ocp-edge95" sub="the run target and preferred cluster" color={C.spoke0} opacity={bandOpacity('spoke0')} hideTitle={bandHide('spoke0')} />
    <Region b={{x: 70, y: 1620, w: 1170, h: 350}} title="VSA-B · ocp-edge97" color={C.array} opacity={bandOpacity('arrayB')} hideTitle={bandHide('arrayB')} />
    <Region b={{x: 1235, y: 1620, w: 1175, h: 350}} title="VSA-A · ocp-edge95" color={C.array} opacity={bandOpacity('arrayA')} hideTitle={bandHide('arrayA')} />

    {Object.keys(NODES).map((key) => node(key))}
    {CHIP(660, 610, 540, status('argo1'), C.green)}
    {CHIP(1825, 610, 545, status('argo0'), C.green)}
    {CHIP(140, 1890, 1030, `csi-addons + Dell CSI · ${status('driver1')}`, C.purple)}
    {CHIP(1305, 1890, 1035, `csi-addons + Dell CSI · ${status('driver0')}`, C.purple)}

    <svg width={2480} height={2000} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <defs>
        <marker id="tip499" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="context-stroke" /></marker>
      </defs>

      {arrow('M670,195 L720,195', C.cyan, false, null, 0, 0)}
      {arrow('M1420,195 L1470,195', C.purple, true, 'generator reads', 1600, 300)}
      {arrow('M490,285 L490,320', C.cyan, false, null, 0, 0)}
      {arrow('M870,410 L910,410', C.purple, true, null, 0, 0)}

      {!pruned ? arrow('M370,790 L370,850', C.green, false, null, 0, 0) : null}
      {!pruned ? arrow('M630,1150 L550,1150', C.cyan, true, null, 0, 0) : null}
      {!pruned ? arrow('M630,800 L660,800', C.purple, true, null, 0, 0) : null}

      {appPlane ? arrow('M1535,790 L1535,850', C.green, false, null, 0, 0) : null}
      {appPlane ? arrow('M1795,1150 L1715,1150', C.cyan, true, null, 0, 0) : null}
      {appPlane ? arrow('M1795,800 L1825,800', C.purple, true, null, 0, 0) : null}

      {reached(c.id, '4.3') ? arrow('M1170,1780 L1305,1780', C.orange, false, null, 0, 0) : null}
      {reached(c.id, '7.2') ? arrow('M1305,1808 L1170,1808', C.green, false, null, 0, 0) : null}
      {reached(c.id, '5.4') ? arrow('M370,790 C250,860 250,980 250,1060', C.red, true, 'Argo prunes the source', 470, 960, 0.9) : null}
    </svg>
  </div>;
};
