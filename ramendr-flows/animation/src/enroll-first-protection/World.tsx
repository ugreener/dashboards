import React from 'react';
import {C, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string};

export const NODES: Record<string, Node> = {
  policy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'pairs the two clusters and sets the interval', scope: 'hub · cluster scope', box: [110, 95, 400, 150], color: C.orange},
  enroll: {kind: 'Operation', name: 'enroll application', role: 'writes the DR record', scope: 'hub console · or an apply', box: [560, 95, 340, 150], color: C.purple},
  drpc: {kind: 'DRPlacementControl', name: 'hammerdb-drpc', role: 'one protected application', scope: 'hub · DR operations namespace', box: [950, 95, 450, 150], color: C.orange},
  placement: {kind: 'Placement', name: 'hammerdb-placement', role: 'asks which cluster runs the application', scope: 'hub · beside the DRPC', box: [1450, 95, 380, 150], color: C.blue},
  decision: {kind: 'PlacementDecision', name: 'hammerdb-placement-decision-1', role: 'names the selected cluster', scope: 'hub · written by Ramen', box: [1875, 95, 405, 150], color: C.blue},
  vrg0: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'site manager on spoke-0', scope: 'spoke-0 · DR namespace', box: [110, 355, 430, 150], color: C.orange},
  vrc: {kind: 'VolumeReplicationClass', name: 'powerstore-vrc-15m', role: 'names the driver and the schedule', scope: 'both spokes · cluster scope', box: [110, 535, 430, 140], color: C.amber},
  vr0: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'one disk work order', scope: 'spoke-0 · child of the VRG', box: [600, 355, 540, 140], color: C.amber},
  vr1: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-datadisk', role: 'one disk work order', scope: 'spoke-0 · child of the VRG', box: [600, 515, 540, 140], color: C.amber},
  csi: {kind: 'Controller', name: 'csi-addons · csi-powerstore', role: 'translate the work order into array calls', scope: 'spoke-0 · both controllers', box: [110, 690, 1030, 110], color: C.purple},
  vrg1: {kind: 'Absent', name: 'no VRG on the peer', role: 'the peer holds only the array-side replica', scope: 'spoke-1 · no site manager yet', box: [1270, 355, 430, 150], color: C.faint},
  peer: {kind: 'State', name: 'peer cluster', role: 'no workload and no VRG at enrollment', scope: 'spoke-1 · storage target only', box: [1760, 355, 520, 150], color: C.dim},
  rule: {kind: 'Replication rule', name: 'repl-to-vsab-15m', role: 'sets the array copy schedule', scope: 'VSA-A · source array', box: [110, 930, 450, 150], color: C.orange},
  volA: {kind: 'Array volume', name: 'csivol-d56a6a0ee9', role: 'the workload root disk', scope: 'VSA-A · source', box: [610, 930, 500, 150], color: C.green},
  session: {kind: 'Replication session', name: '2 sessions · root + data', role: 'carries the copies to the peer', scope: 'VSA-A · source side', box: [110, 1120, 1000, 180], color: C.orange},
  replica: {kind: 'Array volume', name: 'replica volumes', role: 'standby copies of both disks', scope: 'VSA-B · destination', box: [1270, 930, 990, 150], color: C.dim},
  destNote: {kind: 'State', name: 'destination side', role: 'copies arrive here', scope: 'VSA-B · role Destination', box: [1270, 1120, 990, 180], color: C.dim},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const REGIONS: {key: string; b: {x: number; y: number; w: number; h: number}; title: string; sub?: string; color: string}[] = [
  {key: 'hub', b: {x: 60, y: 30, w: 2280, h: 240}, title: 'HUB · edge36', color: C.blue},
  {key: 's0', b: {x: 60, y: 300, w: 1120, h: 520}, title: 'SPOKE-0 · edge95', color: C.spoke0},
  {key: 's1', b: {x: 1220, y: 300, w: 1120, h: 520}, title: 'SPOKE-1 · edge97', color: C.spoke1},
  {key: 'a', b: {x: 60, y: 860, w: 1120, h: 660}, title: 'VSA-A', sub: 'PS3b37452a6e0f', color: C.array},
  {key: 'b', b: {x: 1220, y: 860, w: 1120, h: 660}, title: 'VSA-B', sub: 'PSff392f423bd6', color: C.array},
];
export const REGION_OF: Record<string, string> = {
  policy: 'hub',
  enroll: 'hub',
  drpc: 'hub',
  placement: 'hub',
  decision: 'hub',
  vrg0: 's0',
  vrc: 's0',
  vr0: 's0',
  vr1: 's0',
  csi: 's0',
  vrg1: 's1',
  peer: 's1',
  rule: 'a',
  volA: 'a',
  session: 'a',
  replica: 'b',
  destNote: 'b',
};
export const TOPMOST: Record<string, string> = {hub: 'drpc', s0: 'vrg0', s1: 'vrg1', a: 'session', b: 'replica'};

export const FOCUS: Record<string, string[]> = {
  '1.1': ['policy', 'drpc', 'vrg0'],
  '1.2': ['policy', 'drpc', 'vrg0', 'vrg1', 'rule', 'replica'],
  '1.3': ['policy', 'drpc'],
  '1.4': ['drpc', 'policy'],
  '1.5': ['placement', 'decision', 'drpc'],
  '1.6': ['vrg0', 'vrg1'],
  '1.7': ['vr0', 'vr1', 'vrg0'],
  '1.8': ['vrc', 'vr0', 'vr1'],
  '1.9': ['csi', 'vr0', 'rule'],
  '1.10': ['session', 'rule', 'replica'],
  '2.1': ['policy', 'drpc'],
  '2.2': ['policy', 'vrc'],
  '2.3': ['policy', 'drpc'],
  '2.4': ['vrc', 'vrg0'],
  '2.5': ['policy', 'drpc'],
  '3.1': ['enroll', 'drpc', 'placement'],
  '3.2': ['drpc', 'placement', 'enroll'],
  '3.3': ['drpc', 'policy'],
  '3.4': ['drpc', 'vrg0', 'vr0', 'vr1'],
  '3.5': ['placement', 'decision', 'drpc'],
  '3.6': ['drpc', 'placement', 'enroll'],
  '3.7': ['drpc', 'placement'],
  '4.1': ['drpc', 'vrg0'],
  '4.2': ['drpc', 'vrg0', 'vrg1'],
  '4.3': ['vrg0', 'vr0', 'vr1'],
  '4.4': ['vrc', 'vr0', 'vr1'],
  '4.5': ['vr0', 'vr1', 'csi'],
  '5.1': ['vr0', 'vr1', 'csi'],
  '5.2': ['csi', 'rule', 'volA'],
  '5.3': ['rule', 'volA', 'session'],
  '5.4': ['rule', 'session'],
  '5.5': ['session', 'replica', 'destNote'],
  '6.1': ['vr0', 'vr1', 'vrg0'],
  '6.2': ['drpc', 'vrg0'],
  '6.3': ['drpc', 'vrg0'],
  '6.4': ['drpc', 'vrg0'],
  '6.5': ['drpc', 'vrg0'],
  '6.6': ['vr0', 'vr1', 'session'],
  '7.1': ['drpc', 'session'],
  '7.2': ['drpc', 'vrg0'],
  '7.3': ['drpc', 'vrg0', 'vr0', 'vr1'],
  '7.4': ['policy', 'drpc'],
  '7.5': ['drpc', 'placement', 'vrg0'],
  '7.6': ['policy', 'drpc', 'vrg0', 'vr0', 'csi', 'rule', 'session'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number; panel?: boolean};

const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

/** [beat, fraction, key, value] */
export const CH: [string, number, string, string][] = [
  ['2.1', 0.3, 'policy', '900 s interval'],
  ['2.2', 0.3, 'vrc', 'must match 900 s'],
  ['2.3', 0.3, 'policy', 'Validated=true'],
  ['2.4', 0.3, 'vrc', 'driver + 900 s on both spokes'],
  ['3.1', 0.2, 'drpc', 'enrolled'],
  ['3.1', 0.4, 'placement', 'created'],
  ['3.2', 0.2, 'placement', 'openshift-dr-ops'],
  ['3.2', 0.4, 'drpc', 'protectedNamespaces [hammerdb]'],
  ['3.3', 0.3, 'drpc', 'drPolicyRef apiVersion/kind/name'],
  ['3.4', 0.3, 'drpc', 'claims: drprotection=true'],
  ['3.5', 0.3, 'placement', 'scheduler off · Ramen decides'],
  ['3.5', 0.5, 'decision', 'spoke-0'],
  ['3.6', 0.3, 'drpc', 'managed: openshift-gitops'],
  ['3.7', 0.3, 'drpc', 'recorded layout: app namespace'],
  ['4.1', 0.3, 'vrg0', 'created'],
  ['4.2', 0.2, 'vrg0', 'Primary'],
  ['4.2', 0.5, 'peer', 'storage target only'],
  ['4.3', 0.25, 'vrg0', '2 work orders'],
  ['4.3', 0.45, 'vr0', 'created'],
  ['4.3', 0.6, 'vr1', 'created'],
  ['4.4', 0.3, 'vrc', 'driver + 900 s match'],
  ['4.5', 0.2, 'vr0', 'role: Primary'],
  ['4.5', 0.35, 'vr1', 'role: Primary'],
  ['4.5', 0.5, 'csi', 'observing'],
  ['5.1', 0.3, 'csi', 'EnableVolumeReplication'],
  ['5.2', 0.25, 'rule', 'repl-to-vsab-15m · 15m'],
  ['5.2', 0.5, 'volA', 'protected'],
  ['5.3', 0.25, 'session', 'first full copy'],
  ['5.4', 0.3, 'rule', 'floor: 5 min'],
  ['5.5', 0.25, 'session', 'source · OK'],
  ['5.5', 0.45, 'replica', 'Destination · OK'],
  ['5.5', 0.6, 'destNote', 'standby copies'],
  ['6.1', 0.2, 'vr0', 'Replicating=true'],
  ['6.1', 0.35, 'vr1', 'Replicating=true'],
  ['6.1', 0.55, 'vrg0', 'DataReady=true'],
  ['6.2', 0.3, 'drpc', 'Protected=true'],
  ['6.4', 0.3, 'drpc', 'console row: last synced'],
  ['6.5', 0.3, 'drpc', 'not a data measurement'],
  ['6.6', 0.3, 'session', 'needs 2 scheduled syncs'],
];

const base = (key: string) => {
  const map: Record<string, string> = {
    policy: 'pairs spoke-0 + spoke-1',
    enroll: 'one application',
    drpc: 'one application',
    placement: 'which cluster',
    decision: 'not yet',
    vrg0: 'not yet',
    vrc: 'driver · 15m',
    vr0: 'no role yet',
    vr1: 'no role yet',
    csi: 'idle',
    vrg1: 'not yet',
    peer: 'empty',
    rule: '15m rule',
    volA: 'workload disk',
    session: 'no session',
    replica: 'no replica',
    destNote: 'empty',
  };
  return map[key] ?? '';
};

const tone = (status: string, fallback: string) => {
  if (/not yet|no role|no session|no replica|empty|idle/.test(status)) return C.faint;
  if (/Protected=true|DataReady=true|Replicating=true|OK/.test(status)) return C.green;
  if (/first full copy|Validated=true|must match|floor|needs|not a/.test(status)) return C.amber;
  if (/created|ManifestWork|observing|EnableVolumeReplication/.test(status)) return C.cyan;
  if (/recorded layout|managed/.test(status)) return C.purple;
  return fallback;
};

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const keys = FOCUS[c.id] ?? [];
  const activeRegions = new Set(keys.map((k) => REGION_OF[k]).filter(Boolean));
  const regionOn = (k: string) => (c.panel && !activeRegions.has(k) ? 0 : 1);
  const status = (key: string) => {
    let v = base(key);
    for (const [beat, frac, k, value] of CH) {
      if (k !== key) continue;
      const hit = reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac);
      if (hit) v = value;
    }
    return v;
  };
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : 0.1);
  const chapter = phase(c.id);
  const appearWorld = prog(c.f, -18, 26);
  const created = reached(c.id, '4.3');
  const copied = reached(c.id, '5.3');
  const ready = reached(c.id, '6.2');

  return (
    <div style={{position: 'absolute', width: 2400, height: 1560, opacity: appearWorld}}>
      {REGIONS.map((r) => (
        <Region key={r.key} b={r.b} title={r.title} sub={r.sub} color={r.color} opacity={c.panel ? 0 : regionOn(r.key)} glow={r.key === 'b' && ready ? 0.3 : 0.15} />
      ))}

      {Object.entries(NODES).map(([key, n]) => {
        const st = status(key);
        const col = tone(st, n.color);
        const show = chapter >= 1 && regionOn(REGION_OF[key] ?? '') > 0;
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
            appear={show ? prog(c.f, -15, 30) : 0}
            focus={focus(key)}
            hl={keys.includes(key) ? 0.3 : 0}
            color={col}
            detail={Math.max(0, Math.min(1, (c.zoom - 0.62) / 0.25))}
            nameSize={key === 'drpc' || key === 'decision' || key === 'vrg0' || key === 'vrg1' ? 22 : 21}
          />
        );
      })}

      <svg width={2400} height={1560} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        <defs>
          {[
            ['eeTipG', C.green],
            ['eeTipC', C.cyan],
            ['eeTipO', C.orange],
            ['eeTipB', C.blue],
            ['eeTipP', C.purple],
          ].map(([id, col]) => (
            <marker key={id} id={id} markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill={col} />
            </marker>
          ))}
        </defs>

        {chapter >= 3 ? (
          <g opacity={prog(c.f, 0, 22) * Math.min(regionOn('hub'), 1)}>
            <path d="M900,170 L946,170" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#eeTipG)" />
            <text x={905} y={150} fill={C.green} fontSize={16} fontFamily={sans}>writes</text>
            <path d="M1400,170 L1446,170" fill="none" stroke={C.blue} strokeWidth={3} strokeDasharray="7 6" markerEnd="url(#eeTipB)" />
            <text x={1404} y={150} fill={C.blue} fontSize={15} fontFamily={sans}>placementRef</text>
            <path d="M1830,170 L1871,170" fill="none" stroke={C.blue} strokeWidth={3} strokeDasharray="7 6" markerEnd="url(#eeTipB)" />
            <text x={1833} y={150} fill={C.blue} fontSize={15} fontFamily={sans}>selects</text>
          </g>
        ) : null}

        {chapter >= 4 ? (
          <g opacity={prog(c.f, 0, 24) * regionOn('hub') * (chapter >= 6 ? 0.22 : 1)}>
            <path d="M1175,245 L1175,290 L325,290 L325,351" fill="none" stroke={C.cyan} strokeWidth={4} strokeDasharray="10 8" markerEnd="url(#eeTipC)" />
            <path d="M1175,290 L1485,290 L1485,351" fill="none" stroke={C.cyan} strokeWidth={4} strokeDasharray="10 8" markerEnd="url(#eeTipC)" />
            <text x={610} y={282} fill={C.cyan} fontSize={17} fontFamily={sans}>ManifestWork</text>
            <text x={1300} y={282} fill={C.cyan} fontSize={17} fontFamily={sans}>ManifestWork</text>
          </g>
        ) : null}

        {chapter >= 4 && !copied ? (
          <g opacity={prog(c.f, 0, 20) * Math.min(regionOn('s0'), 1)}>
            <path d="M540,425 L596,425" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#eeTipG)" />
            <text x={548} y={407} fill={C.green} fontSize={16} fontFamily={sans}>owns</text>
            <path d="M500,505 L570,505 L570,585 L596,585" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#eeTipG)" />
            <path d="M325,531 L325,509" fill="none" stroke={C.blue} strokeWidth={3} strokeDasharray="7 6" markerEnd="url(#eeTipB)" />
            <text x={334} y={520} fill={C.blue} fontSize={14} fontFamily={sans}>selects</text>
          </g>
        ) : null}

        {chapter >= 5 ? (
          <g opacity={prog(c.f, 0, 22) * Math.min(regionOn('s0'), 1)}>
            <path d="M870,495 L870,686" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#eeTipG)" />
            <text x={880} y={600} fill={C.green} fontSize={17} fontFamily={sans}>role call</text>
            <path d="M870,655 L870,686" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#eeTipG)" />
            <path d="M335,800 L335,926" fill="none" stroke={C.cyan} strokeWidth={4} markerEnd="url(#eeTipC)" />
            <text x={345} y={868} fill={C.cyan} fontSize={17} fontFamily={sans}>CSI call</text>
          </g>
        ) : null}

        {chapter >= 5 ? (
          <g opacity={prog(c.f, 0, 22) * Math.min(regionOn('a'), regionOn('b'))}>
            <path d="M560,1005 L606,1005" fill="none" stroke={C.orange} strokeWidth={4} markerEnd="url(#eeTipO)" />
            <text x={564} y={988} fill={C.orange} fontSize={14} fontFamily={sans}>applies to</text>
            <path d="M335,1080 L335,1116" fill="none" stroke={C.orange} strokeWidth={4} markerEnd="url(#eeTipO)" />
            <path d="M860,1080 L860,1116" fill="none" stroke={C.orange} strokeWidth={4} markerEnd="url(#eeTipO)" />
            <path d="M1110,1210 L1266,1210" fill="none" stroke={C.orange} strokeWidth={4} strokeDasharray="10 8" markerEnd="url(#eeTipO)" />
            <text x={1136} y={1192} fill={C.orange} fontSize={17} fontFamily={sans}>first copy</text>
          </g>
        ) : null}

        {chapter >= 6 ? (
          <g opacity={prog(c.f, 0, 22) * Math.min(regionOn('hub'), regionOn('s0'))}>
            <path d="M870,351 L870,315 L1175,315 L1175,249" fill="none" stroke={C.purple} strokeWidth={3} strokeDasharray="7 6" markerEnd="url(#eeTipP)" />
            <text x={900} y={340} fill={C.purple} fontSize={16} fontFamily={sans}>status climbs</text>
          </g>
        ) : null}
      </svg>
    </div>
  );
};
