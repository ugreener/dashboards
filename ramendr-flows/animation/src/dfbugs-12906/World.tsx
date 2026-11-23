import React from 'react';
import {C, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; lines: (s: string) => string[]; box: Box; color: string; nameSize?: number};

const VGR_NAME = 'vgr-4251c970ec7af885d6ec79c1d2c40661-hammerdb-drpc';
const GROUP_NAME = 'vg-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d-VSA-A-Fifteen_Minutes';

export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'hammerdb-drpc', role: 'the hub record for this application', lines: (s) => ['hub · openshift-dr-ops', s], box: [110, 120, 700, 185], color: C.orange},
  policy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'pairs the sites and sets the recovery point', lines: (s) => ['hub · cluster scope', s], box: [850, 120, 430, 185], color: C.orange, nameSize: 20},

  vrg1: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: "tells this site what its job is", lines: (s) => ['spoke-1 · openshift-dr-ops', s], box: [110, 460, 1090, 150], color: C.orange},
  vm1: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'the guest that ran here', lines: (s) => ['spoke-1 · hammerdb', s], box: [110, 640, 330, 170], color: C.green, nameSize: 18},
  pvcRoot1: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk-grp', role: 'the root disk claim', lines: (s) => ['spoke-1 · hammerdb', s], box: [460, 640, 330, 170], color: C.dim, nameSize: 11},
  pvcData1: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-datadisk-grp', role: 'the database disk claim', lines: (s) => ['spoke-1 · hammerdb', s], box: [810, 640, 310, 170], color: C.dim, nameSize: 11},
  pvRoot1: {kind: 'PersistentVolume', name: 'csivol-31136f5c90', role: 'the root disk record: handle, policy, mark', lines: (s) => ['spoke-1 · cluster scope', s], box: [110, 850, 520, 200], color: C.dim, nameSize: 24},
  pvData1: {kind: 'PersistentVolume', name: 'csivol-2a761d921f', role: 'the database disk record: handle, policy, mark', lines: (s) => ['spoke-1 · cluster scope', s], box: [660, 850, 520, 200], color: C.dim, nameSize: 24},
  vgr1: {kind: 'VolumeGroupReplication', name: VGR_NAME, role: 'the request that drives the group session', lines: (s) => ['spoke-1 · hammerdb', s], box: [110, 1070, 430, 190], color: C.purple, nameSize: 9},

  vrg0: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'tells this site what its job is', lines: (s) => ['spoke-0 · openshift-dr-ops', s], box: [1275, 460, 1095, 150], color: C.orange},
  vm0: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'the guest, running here now', lines: (s) => ['spoke-0 · hammerdb', s], box: [1275, 640, 330, 170], color: C.green, nameSize: 18},
  pvcRoot0: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk-grp', role: 'the root disk claim', lines: (s) => ['spoke-0 · hammerdb', s], box: [1625, 640, 330, 170], color: C.dim, nameSize: 11},
  pvcData0: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-datadisk-grp', role: 'the database disk claim', lines: (s) => ['spoke-0 · hammerdb', s], box: [1975, 640, 300, 170], color: C.dim, nameSize: 11},
  pvRoot0: {kind: 'PersistentVolume', name: 'csivol-31136f5c90', role: 'same name, the promoted disk', lines: (s) => ['spoke-0 · cluster scope', s], box: [1275, 850, 520, 200], color: C.dim, nameSize: 24},
  pvData0: {kind: 'PersistentVolume', name: 'csivol-2a761d921f', role: 'same name, the promoted disk', lines: (s) => ['spoke-0 · cluster scope', s], box: [1825, 850, 520, 200], color: C.dim, nameSize: 24},

  groupB: {kind: 'PowerStore volume group', name: GROUP_NAME, role: 'the hammerdb group on the old array', lines: (s) => ['VSA-B · PSff392f423bd6', s], box: [140, 1500, 1030, 190], color: C.array, nameSize: 14},
  groupA: {kind: 'PowerStore volume group', name: GROUP_NAME, role: 'the hammerdb group on the new array', lines: (s) => ['VSA-A · PS3b37452a6e0f', s], box: [1305, 1500, 1035, 190], color: C.array, nameSize: 14},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;
RECT.driver1 = [570, 1085, 610, 72];
RECT.driver0 = [1305, 1110, 610, 72];
RECT.err = [660, 1165, 520, 80];

export const FOCUS: Record<string, string[]> = {
  '2.1': ['drpc', 'vrg1', 'vrg0'],
  '2.2': ['vrg1', 'pvRoot1', 'pvData1'],
  '2.3': ['pvRoot1', 'pvData1'],
  '2.4': ['pvRoot1', 'pvData1', 'vrg1'],
  '2.5': ['pvRoot1', 'pvData1'],
  '3.1': ['vm1', 'pvcRoot1', 'pvcData1'],
  '3.2': ['pvcRoot1', 'pvcData1', 'vrg1'],
  '3.3': ['drpc', 'vrg1'],
  '3.4': ['vrg1', 'vgr1'],
  '3.5': ['vgr1', 'vrg1', 'pvcRoot1'],
  '3.6': ['pvRoot1', 'pvData1'],
  '3.7': ['pvRoot1', 'pvData1', 'pvcRoot1', 'pvcData1'],
  '4.1': ['pvcRoot1', 'pvRoot1', 'vrg1'],
  '4.2': ['pvRoot1', 'pvData1'],
  '4.3': ['pvRoot0', 'pvData0'],
  '4.4': ['vrg1', 'pvRoot1', 'pvData1'],
  '4.5': ['vrg1', 'vgr1', 'pvRoot1'],
  '4.6': ['pvRoot1', 'pvData1', 'pvRoot0', 'pvData0'],
  '5.1': ['pvRoot1', 'pvData1', 'driver1'],
  '5.2': ['pvRoot1', 'pvData1', 'driver1'],
  '5.3': ['driver1', 'groupB'],
  '5.4': ['driver1', 'groupB', 'pvRoot1'],
  '5.5': ['pvRoot1', 'pvData1', 'err'],
  '5.6': ['pvRoot1', 'pvData1', 'err'],
  '6.1': ['vrg1'],
  '6.2': ['vrg1', 'drpc'],
  '6.3': ['groupA', 'groupB'],
  '6.4': ['pvRoot1', 'pvData1', 'pvRoot0', 'pvData0'],
  '6.5': ['vgr1', 'vrg1', 'groupB'],
  '6.6': ['vrg1', 'groupB', 'pvRoot1'],
  '7.1': ['vrg0', 'vm0'],
  '7.2': ['pvRoot1', 'pvData1'],
  '7.3': ['pvRoot1', 'pvData1', 'pvRoot0', 'pvData0'],
  '7.4': ['pvRoot1', 'pvData1', 'groupB'],
  '7.5': ['pvRoot1', 'pvData1', 'groupB', 'vrg1'],
  '7.6': ['drpc', 'vrg1', 'vrg0'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

// [beat, fraction, key, value] — drives card status, presence and the flip sound.
export const CH: [string, number, string, string][] = [
  ['2.1', 0.3, 'drpc', 'FailedOver · cleanup pending'],
  ['2.1', 0.5, 'vrg1', 'Secondary'],
  ['3.1', 0.2, 'vm1', 'deleting'],
  ['3.1', 0.5, 'pvcRoot1', 'deleting'],
  ['3.1', 0.7, 'pvcData1', 'deleting'],
  ['3.2', 0.2, 'vm1', 'deleted'],
  ['3.2', 0.5, 'pvcRoot1', 'deleted'],
  ['3.2', 0.6, 'pvcData1', 'deleted'],
  ['3.3', 0.2, 'drpc', 'FailedOver · PeerReady'],
  ['3.4', 0.4, 'vgr1', 'deleted'],
  ['3.5', 0.3, 'vgr1', 'gone'],
  ['3.6', 0.3, 'pvRoot1', 'Delete · mark gone'],
  ['3.6', 0.45, 'pvData1', 'Delete · mark gone'],
  ['3.7', 0.3, 'pvRoot1', 'Released · Delete'],
  ['3.7', 0.4, 'pvData1', 'Released · Delete'],
  ['5.1', 0.3, 'driver1', 'DeleteVolume'],
  ['5.3', 0.4, 'driver1', 'RemoveMembersFromVolumeGroup'],
  ['5.4', 0.4, 'driver1', 'HTTP 422'],
  ['5.5', 0.3, 'pvRoot1', 'Released · retrying'],
  ['5.5', 0.4, 'pvData1', 'Released · retrying'],
  ['6.1', 0.3, 'vrg1', 'Secondary · 0 claims'],
  ['6.3', 0.2, 'groupB', 'Destination · OK · syncing'],
  ['7.1', 0.2, 'vm0', 'Running'],
  ['7.5', 0.3, 'pvRoot1', 'Retain · patched'],
  ['7.5', 0.4, 'pvData1', 'Retain · patched'],
];

const BAND: Record<string, string> = {
  drpc: 'hub', policy: 'hub',
  vrg1: 'spoke1', vm1: 'spoke1', pvcRoot1: 'spoke1', pvcData1: 'spoke1', pvRoot1: 'spoke1', pvData1: 'spoke1', vgr1: 'spoke1', driver1: 'spoke1', err: 'spoke1',
  vrg0: 'spoke0', vm0: 'spoke0', pvcRoot0: 'spoke0', pvcData0: 'spoke0', pvRoot0: 'spoke0', pvData0: 'spoke0', driver0: 'spoke0',
  groupA: 'arrayA', groupB: 'arrayB',
};

const BASE: Record<string, string> = {
  drpc: 'Deployed · Protected · PeerReady',
  policy: '900 s · async',
  vrg1: 'Primary',
  vm1: 'Running',
  pvcRoot1: 'Bound',
  pvcData1: 'Bound',
  pvRoot1: 'Bound · Retain · marked',
  pvData1: 'Bound · Retain · marked',
  vgr1: 'primary',
  vrg0: 'Primary',
  vm0: 'Running',
  pvcRoot0: 'Bound',
  pvcData0: 'Bound',
  pvRoot0: 'Bound · Retain · marked',
  pvData0: 'Bound · Retain · marked',
  groupB: 'Destination · OK',
  groupA: 'Source · OK',
  driver1: 'idle',
  driver0: 'idle',
};

const DRIVER = (x: number, y: number, side: string, status: string) => (
  <div style={{position: 'absolute', left: x, top: y, width: 610, padding: '8px 14px', border: `1.5px dashed ${C.purple}99`, borderRadius: 10, background: `${C.bg}d9`, fontFamily: sans, color: C.dim, fontSize: 16}}>
    <span style={{color: C.purple, fontWeight: 700}}>csi-powerstore</span>
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
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : panel ? 0 : 0.08);
  const on = (...k: string[]) => k.every((x) => keys.includes(x));
  const active = new Set(keys.map((k) => BAND[k]).filter(Boolean));
  const bandOn = (b: string) => keys.length === 0 || active.has(b);
  const bandOpacity = (b: string) => (panel && !bandOn(b) ? 0 : bandOn(b) ? 1 : 0.16);
  const bandHide = (b: string) => panel || !bandOn(b);
  const appearAll = chapter === 2 ? prog(c.f, -15, 35) : 1;
  const cleanup = reached(c.id, '3.1');
  const restored = reached(c.id, '2.1');
  const stuck = reached(c.id, '5.4');
  const node = (key: string, appear = appearAll) => {
    const n = NODES[key];
    return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role}
      lines={n.lines(status(key))} appear={appear} focus={focus(key)} hl={keys.includes(key) ? 0.26 : 0} exit={panel && !keys.includes(key) ? 1 : 0}
      color={n.color} detail={1} nameSize={n.nameSize ?? 22} />;
  };
  const chip = (k: string, x: number, y: number, side: string) => {
    const op = panel ? (keys.includes(k) ? 1 : 0) : bandOn(BAND[k]) ? 1 : 0.16;
    return op > 0 ? <div style={{opacity: op}}>{DRIVER(x, y, side, status(k))}</div> : null;
  };
  const marker = (x: number, y: number, w: number, text: string, color: string, show: boolean) =>
    show ? <div style={{position: 'absolute', left: x, top: y, width: w, padding: '10px 16px', borderRadius: 12, border: `2px solid ${color}`, background: `${C.bg}f2`, color, fontFamily: sans, fontWeight: 700, fontSize: 19, boxShadow: `0 0 24px ${color}44`}}>{text}</div> : null;

  return <div style={{position: 'absolute', width: 2480, height: 1780}}>
    <Region b={{x: 70, y: 45, w: 2340, h: 300}} title="HUB · ocp-edge36" sub="the control record and the policy" color={C.blue} opacity={bandOpacity('hub')} hideTitle={bandHide('hub')} />
    <Region b={{x: 70, y: 400, w: 1170, h: 860}} title="SPOKE-1 · ocp-edge97" sub="OLD SITE after the failover · VSA-B" color={C.spoke1} opacity={bandOpacity('spoke1')} hideTitle={bandHide('spoke1')} />
    <Region b={{x: 1235, y: 400, w: 1175, h: 860}} title="SPOKE-0 · ocp-edge95" sub="NEW PRIMARY · VSA-A" color={C.spoke0} opacity={bandOpacity('spoke0')} hideTitle={bandHide('spoke0')} />
    <Region b={{x: 70, y: 1440, w: 1170, h: 310}} title="VSA-B · OLD ARRAY" color={C.array} opacity={bandOpacity('arrayB')} hideTitle={bandHide('arrayB')} />
    <Region b={{x: 1235, y: 1440, w: 1175, h: 310}} title="VSA-A · NEW ARRAY" color={C.array} opacity={bandOpacity('arrayA')} hideTitle={bandHide('arrayA')} />

    {Object.keys(NODES).map((key) => {
      if (key.endsWith('0') && key !== 'policy' && !restored && key !== 'vrg0' && key !== 'driver0') return null;
      return node(key, appearAll);
    })}
    {chip('driver1', 570, 1085, 'spoke-1')}
    {chip('driver0', 1305, 1110, 'spoke-0')}

    {marker(660, 1165, 520, status('err') || 'VolumeFailedDelete · retrying', C.red, stuck && keys.includes('err'))}

    <svg width={2480} height={1780} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <defs>
        <marker id="tip12906" markerWidth={12} markerHeight={12} refX={9} refY={4} orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L0,8 L11,4 z" fill="context-stroke" /></marker>
      </defs>

      {on('drpc', 'vrg1') ? arrow('M410,305 C410,380 410,410 410,458', C.cyan, true, 'delivers the work order', 700, 375, prog(c.f, c.dur * 0.05, c.dur * 0.05 + 24)) : null}
      {on('drpc', 'vrg0') ? arrow('M1575,305 C1575,380 1575,410 1575,458', C.cyan, true, null, 0, 0, prog(c.f, c.dur * 0.05, c.dur * 0.05 + 24)) : null}

      {on('vrg1', 'vm1') ? arrow('M410,610 L410,638', C.green, false, null, 0, 0) : null}
      {on('vrg0', 'vm0') ? arrow('M1575,610 L1575,638', C.green, false, null, 0, 0) : null}

      {on('pvcRoot1', 'pvRoot1') ? arrow('M275,810 L310,848', C.purple, false, 'claim gone, record handled', 690, 800, prog(c.f, c.dur * 0.1, c.dur * 0.1 + 24)) : null}
      {on('pvcData1', 'pvData1') ? arrow('M1010,810 L1010,848', C.purple, false, null, 0, 0, prog(c.f, c.dur * 0.1, c.dur * 0.1 + 24)) : null}
      {on('pvcRoot0', 'pvRoot0') ? arrow('M1790,810 L1600,848', C.green, false, null, 0, 0) : null}
      {on('pvcData0', 'pvData0') ? arrow('M2125,810 L2125,848', C.green, false, null, 0, 0) : null}

      {on('driver1', 'groupB') ? arrow('M760,1157 C760,1300 400,1330 400,1498', C.red, true, 'DeleteVolume · group member first', 700, 1350, prog(c.f, c.dur * 0.05, c.dur * 0.05 + 24)) : null}
      {on('groupA', 'groupB') ? arrow('M1290,1595 L1190,1595', C.orange, false, null, 0, 0) : null}
      {on('vrg0', 'groupA') ? arrow('M1575,610 C1600,900 1450,1250 1420,1498', C.purple, true, 'reverse copy', 1500, 1360, prog(c.f, c.dur * 0.05, c.dur * 0.05 + 24)) : null}
    </svg>
  </div>;
};

function arrow(d: string, color: string, dashed: boolean, label: string | null, lx: number, ly: number, opacity = 1) {
  if (opacity <= 0) return null;
  return <g opacity={opacity}>
    <path d={d} fill="none" stroke={color} strokeWidth={5} strokeDasharray={dashed ? '14 11' : undefined} markerEnd="url(#tip12906)" />
    {label ? <>
      <rect x={lx - 200} y={ly - 19} width={400} height={38} rx={10} fill={C.bg} opacity={0.95} />
      <text x={lx} y={ly + 7} textAnchor="middle" fill={color} fontSize={18} fontFamily={sans}>{label}</text>
    </> : null}
  </g>;
}
