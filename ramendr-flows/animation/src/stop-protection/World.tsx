import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string};

export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'the application DRPC', role: 'records the request for one application', scope: 'hub · DR namespace', box: [110, 95, 540, 160], color: C.orange},
  stop: {kind: 'Operation', name: 'stop protection', role: 'remove DR, keep the workload', scope: 'console · CLI · YAML', box: [700, 95, 430, 160], color: C.purple},
  vrg0: {kind: 'VolumeReplicationGroup', name: 'the primary site manager', role: 'creates work orders from the claims', scope: 'spoke-0 · DR namespace', box: [110, 370, 470, 160], color: C.orange},
  vgr0: {kind: 'VolumeGroupReplication', name: 'the group switch', role: 'one request for the whole group', scope: 'spoke-0 · owns the children', box: [620, 370, 470, 150], color: C.amber},
  vr0: {kind: 'VolumeReplication', name: 'the child work order', role: 'carries role calls for the group', scope: 'spoke-0 · child of the group', box: [110, 545, 470, 140], color: C.amber},
  vgrc0: {kind: 'VolumeGroupReplicationContent', name: 'the handle holder', role: 'stores the group handle', scope: 'spoke-0 · owned by the group', box: [620, 545, 470, 140], color: C.amber},
  vrg1: {kind: 'VolumeReplicationGroup', name: 'the secondary site manager', role: 'has replicas, but no claims', scope: 'spoke-1 · DR namespace', box: [1270, 370, 470, 160], color: C.orange},
  disA: {kind: 'CSI call', name: 'DisableVolumeReplication', role: 'ends the copy on the session', scope: 'driver · primary side', box: [110, 810, 470, 140], color: C.cyan},
  delA: {kind: 'CSI call', name: 'DeleteVolumeGroup', role: 'deletes the group by handle', scope: 'driver · primary side', box: [620, 810, 470, 140], color: C.cyan},
  groupA: {kind: 'Array object', name: 'source volume group', role: 'created when protection was enabled', scope: 'VSA-A · source', box: [110, 985, 470, 170], color: C.orange},
  volA: {kind: 'Array volume', name: 'workload volume', role: 'the disk the virtual machine uses', scope: 'VSA-A · stays', box: [620, 985, 470, 170], color: C.green},
  groupB: {kind: 'Array object', name: 'destination volume group', role: 'created when the first copy started', scope: 'VSA-B · destination', box: [1270, 985, 470, 170], color: C.orange},
  repB: {kind: 'Array volume', name: 'replica volumes', role: 'the standby copies on this array', scope: 'VSA-B · standby', box: [1820, 985, 470, 170], color: C.dim},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const REGIONS: {key: string; b: {x: number; y: number; w: number; h: number}; title: string; sub?: string; color: string}[] = [
  {key: 'hub', b: {x: 60, y: 30, w: 2280, h: 240}, title: 'HUB · edge36', color: C.blue},
  {key: 's0', b: {x: 60, y: 305, w: 1120, h: 400}, title: 'SPOKE-0 · edge95', color: C.spoke0},
  {key: 's1', b: {x: 1220, y: 305, w: 1120, h: 400}, title: 'SPOKE-1 · edge97', color: C.spoke1},
  {key: 'a', b: {x: 60, y: 745, w: 1120, h: 735}, title: 'VSA-A', sub: 'PS3b37452a6e0f', color: C.array},
  {key: 'b', b: {x: 1220, y: 745, w: 1120, h: 735}, title: 'VSA-B', sub: 'PSff392f423bd6', color: C.array},
];
export const REGION_OF: Record<string, string> = {
  drpc: 'hub',
  stop: 'hub',
  vrg0: 's0',
  vgr0: 's0',
  vr0: 's0',
  vgrc0: 's0',
  vrg1: 's1',
  disA: 'a',
  delA: 'a',
  groupA: 'a',
  volA: 'a',
  groupB: 'b',
  repB: 'b',
};
export const TOPMOST: Record<string, string> = {hub: 'drpc', s0: 'vrg0', s1: 'vrg1', a: 'groupA', b: 'groupB'};

const GHOSTS: Record<string, {title: string; prop: string; sub: string; box: Box}> = {
  gvgr: {title: 'no group replication', prop: 'a group replication here', sub: 'nothing to reconcile', box: [1780, 375, 470, 140]},
  gvr: {title: 'no child work order', prop: 'a child work order here', sub: 'no role calls from this side', box: [1270, 545, 470, 140]},
  gvgrc: {title: 'no group content', prop: 'a group content with the handle', sub: 'nobody holds the handle', box: [1780, 545, 470, 140]},
  noCall: {title: 'no caller on this side', prop: 'no caller on this side', sub: 'no replication call for this group', box: [1270, 810, 970, 140]},
};

export const FOCUS: Record<string, string[]> = {
  '1.3': ['drpc', 'stop'],
  '1.4': ['drpc', 'vrg0'],
  '1.5': ['vrg0', 'vr0'],
  '1.6': ['vgr0', 'vrg0'],
  '1.7': ['vgrc0', 'vgr0'],
  '1.8': ['vgrc0', 'delA', 'groupA'],
  '1.9': ['vr0', 'disA'],
  '1.10': ['stop', 'volA', 'groupA'],
  '1.11': ['drpc', 'vrg0', 'vgr0', 'vgrc0', 'vr0'],
  '2.1': ['groupA', 'groupB'],
  '2.2': ['groupA', 'groupB', 'vgrc0'],
  '2.3': ['volA', 'groupA', 'stop'],
  '2.4': ['groupA', 'groupB', 'disA', 'delA'],
  '2.5': ['groupA', 'groupB'],
  '2.6': ['groupA', 'groupB', 'vgrc0'],
  '3.1': ['drpc', 'vrg0', 'vgr0', 'vgrc0', 'vr0', 'groupA'],
  '3.2': ['drpc', 'vrg0'],
  '3.3': ['vrg0', 'vgr0', 'vgrc0'],
  '3.4': ['vgr0', 'vgrc0', 'vr0', 'disA', 'delA'],
  '3.5': ['groupA', 'volA', 'disA', 'delA'],
  '3.6': ['vgrc0', 'delA'],
  '3.7': ['vr0', 'disA'],
  '3.8': ['drpc', 'vrg0', 'groupA', 'volA'],
  '4.1': ['vrg1'],
  '4.2': ['vrg1', 'vrg0'],
  '4.3': ['vrg1', 'gvgr', 'gvgrc', 'gvr'],
  '4.4': ['vrg1', 'gvgr', 'gvgrc', 'gvr'],
  '4.5': ['groupB'],
  '4.6': ['groupB', 'noCall'],
  '4.7': ['groupB', 'vrg1'],
  '5.1': ['groupB'],
  '5.2': ['groupB'],
  '5.3': ['groupB', 'groupA'],
  '5.4': ['groupB', 'groupA'],
  '5.5': ['groupA', 'volA', 'groupB', 'repB'],
  '5.6': ['vrg1', 'groupB'],
  '5.7': ['groupB', 'repB'],
  '5.8': ['groupB'],
  '6.1': ['vrg1', 'gvgr', 'gvgrc', 'gvr'],
  '6.2': ['gvgrc', 'vrg1'],
  '6.3': ['gvgrc', 'groupB'],
  '6.4': ['gvgr', 'gvgrc', 'groupB'],
  '6.5': ['gvgr', 'gvgrc'],
  '6.6': ['gvgr', 'gvgrc'],
  '6.7': ['groupB'],
  '7.1': ['groupB', 'groupA'],
  '7.2': ['groupA', 'groupB'],
  '7.3': ['groupB'],
  '7.4': ['groupB', 'repB'],
  '7.5': ['groupA', 'groupB'],
  '7.6': ['groupA', 'groupB', 'volA'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};

const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

/** [beat, fraction, key, value] */
export const CH: [string, number, string, string][] = [
  ['3.2', 0.25, 'drpc', 'deleting · request withdrawn'],
  ['3.2', 0.6, 'vrg0', 'deleting · children first'],
  ['3.3', 0.3, 'vgr0', 'deleting'],
  ['3.3', 0.55, 'vrg0', 'deleting · group content next'],
  ['3.4', 0.2, 'vr0', 'deleting · DisableVolumeReplication'],
  ['3.4', 0.35, 'vgrc0', 'deleting · DeleteVolumeGroup'],
  ['3.5', 0.3, 'disA', 'completed · session gone'],
  ['3.5', 0.45, 'delA', 'completed · group gone'],
  ['4.2', 0.3, 'vrg1', 'no claims to protect · replicas only'],
  ['4.4', 0.35, 'vrg1', 'deleting · no children'],
  ['4.5', 0.2, 'groupB', 'still here · no owner'],
  ['5.2', 0.2, 'groupB', 'orphan after atomic stop'],
  ['5.3', 0.3, 'groupB', 'orphan after failover'],
  ['5.4', 0.3, 'groupB', 'orphan after relocate'],
  ['5.5', 0.2, 'groupB', 'orphan · whichever side is destination'],
  ['6.2', 0.3, 'gvgrc', 'unsafe today · rewrites volume list'],
  ['6.3', 0.3, 'gvgrc', 'empty list can wipe the handles'],
  ['6.4', 0.2, 'gvgrc', 'so Ramen does not create it'],
  ['6.6', 0.2, 'gvgr', 'proposed · not shipped'],
  ['7.4', 0.2, 'groupB', 'orphan only if nothing refers to it'],
  ['7.6', 0.2, 'groupB', 'no owner · stays'],
];

const EXITS: [string, string][] = [
  ['3.5', 'vrg0'],
  ['3.5', 'vgr0'],
  ['3.5', 'vgrc0'],
  ['3.5', 'vr0'],
  ['4.5', 'vrg1'],
  ['3.5', 'groupA'],
];

const base = (key: string) => {
  const map: Record<string, string> = {
    drpc: 'Protected=true · Available=true',
    stop: 'application stays',
    vrg0: 'Primary · two protected claims',
    vgr0: 'Primary · one group handle',
    vr0: 'role calls · Primary',
    vgrc0: 'holds the destination handle',
    vrg1: 'Secondary · replicas only',
    disA: 'idle',
    delA: 'idle',
    groupA: 'source · replicating',
    volA: 'bound · stays',
    groupB: 'destination · replicating',
    repB: 'two standby copies',
  };
  return map[key] ?? '';
};

const tone = (status: string, fallback: string) => {
  if (/deleted|gone|no caller/.test(status)) return C.red;
  if (/deleting|no claims|unsafe|empty list|orphan|still here|no owner/.test(status)) return C.amber;
  if (/completed/.test(status)) return C.dim;
  if (/proposed/.test(status)) return C.purple;
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
  const exit = (key: string) => {
    const hit = EXITS.find(([beat, k]) => k === key && reached(c.id, beat));
    if (!hit) return 0;
    return prog(c.f, 0, 20);
  };
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : 0.1);
  const chapter = phase(c.id);
  const showGhosts = (reached(c.id, '4.3') && !reached(c.id, '5.1')) || (reached(c.id, '6.1') && !reached(c.id, '7.1'));
  const ghostsProposed = reached(c.id, '6.1');
  const sessionGone = reached(c.id, '3.5');
  const sessionColor = sessionGone ? C.faint : C.orange;
  const orphans = reached(c.id, '4.5');
  const appearWorld = prog(c.f, -18, 26);

  return (
    <div style={{position: 'absolute', width: 2400, height: 1520, opacity: appearWorld}}>
      <Region b={{x: 60, y: 30, w: 2280, h: 240}} title="HUB · edge36" color={C.blue} />
      <Region b={{x: 60, y: 305, w: 1120, h: 400}} title="SPOKE-0 · edge95" color={C.spoke0} />
      <Region b={{x: 1220, y: 305, w: 1120, h: 400}} title="SPOKE-1 · edge97" color={C.spoke1} />
      <Region b={{x: 60, y: 745, w: 1120, h: 735}} title="VSA-A" sub="PS3b37452a6e0f" color={C.array} glow={orphans ? 0 : 0.15} />
      <Region b={{x: 1220, y: 745, w: 1120, h: 735}} title="VSA-B" sub="PSff392f423bd6" color={C.array} glow={orphans ? 0.5 : 0.15} />

      {['1.2', '2.1', '2.2', '2.3', '2.4'].includes(c.id) ? (
        <div style={{position: 'absolute', left: 1180, top: 118, width: 1080, fontFamily: sans, fontSize: 21, color: C.dim, lineHeight: 1.35}}>
          <span style={{color: C.text, fontWeight: 700}}>One application, two sites.</span> The hub asks each site to clean its part. The arrays hold the copies.
        </div>
      ) : null}

      {Object.entries(NODES).map(([key, n]) => {
        const st = status(key);
        const col = tone(st, n.color);
        const show = chapter >= 1;
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
            exit={exit(key)}
            focus={focus(key)}
            hl={keys.includes(key) ? 0.3 : 0}
            color={col}
            detail={Math.max(0, Math.min(1, (c.zoom - 0.62) / 0.25))}
            nameSize={key === 'drpc' || key === 'vrg0' || key === 'vrg1' ? 24 : 21}
          />
        );
      })}

      {Object.entries(GHOSTS).map(([key, g]) => {
        const visible = key === 'noCall' ? phase(c.id) === 4 && reached(c.id, '4.6') : showGhosts;
        if (!visible) return null;
        const st = status(key);
        const prop = ghostsProposed && key !== 'noCall';
        const b = g.box;
        const op = prog(c.f, -10, 26) * (0.35 + 0.65 * focus(key));
        return (
          <div
            key={key}
            style={{
              position: 'absolute',
              left: b[0],
              top: b[1],
              width: b[2],
              height: b[3],
              opacity: op,
              borderRadius: 14,
              border: `2px dashed ${prop ? C.purple : C.faint}`,
              background: `${prop ? C.purple : C.faint}0a`,
              padding: '14px 18px',
              fontFamily: sans,
            }}
          >
            <div style={{fontSize: 16, letterSpacing: 1.2, textTransform: 'uppercase', color: prop ? C.purple : C.faint, fontWeight: 700}}>{prop ? 'proposed object' : 'absent'}</div>
            <div style={{fontFamily: mono, fontSize: 20, color: prop ? C.text : C.dim, marginTop: 6, overflowWrap: 'break-word'}}>{prop ? g.prop : g.title}</div>
            <div style={{fontSize: 17, color: C.faint, marginTop: 6}}>{prop && key === 'gvgrc' ? st : g.sub}</div>
          </div>
        );
      })}

      <svg width={2400} height={1520} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        <defs>
          <marker id="spTip" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill={C.green} />
          </marker>
          <marker id="spTipC" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill={C.cyan} />
          </marker>
          <marker id="spTipO" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill={sessionColor} />
          </marker>
        </defs>

        {chapter >= 3 ? (
          <g opacity={prog(c.f, 0, 22)}>
            <path d="M380,255 L380,368" fill="none" stroke={C.green} strokeWidth={4} strokeDasharray="9 7" markerEnd="url(#spTip)" />
            <path d="M1520,255 L1520,368" fill="none" stroke={C.faint} strokeWidth={4} strokeDasharray="9 7" markerEnd="url(#spTipO)" opacity={reached(c.id, '4.2') ? 0.8 : 0.35} />
            <text x={400} y={318} fill={C.green} fontSize={20} fontFamily={sans}>delete the VRG</text>
            <text x={1540} y={318} fill={C.dim} fontSize={20} fontFamily={sans}>delete the VRG</text>
          </g>
        ) : null}

        {chapter >= 3 && !reached(c.id, '3.5') ? (
          <g opacity={prog(c.f, 0, 20)}>
            <path d="M580,470 L608,470" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#spTip)" />
            <path d="M345,530 L345,543" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#spTip)" />
            <path d="M855,530 L855,543" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#spTip)" />
            <text x={584} y={450} fill={C.green} fontSize={17} fontFamily={sans}>owns</text>
          </g>
        ) : null}

        {chapter >= 3 && !reached(c.id, '3.5') ? (
          <g opacity={prog(c.f, 0, 22)}>
            <path d="M1000,690 L1000,807" fill="none" stroke={C.cyan} strokeWidth={4} markerEnd="url(#spTipC)" />
            <path d="M480,690 L480,807" fill="none" stroke={C.cyan} strokeWidth={4} markerEnd="url(#spTipC)" />
            <text x={1015} y={760} fill={C.cyan} fontSize={19} fontFamily={sans}>group handle</text>
            <text x={495} y={760} fill={C.cyan} fontSize={19} fontFamily={sans}>on delete</text>
          </g>
        ) : null}

        {chapter >= 2 && chapter <= 3 ? (
          <g opacity={prog(c.f, 0, 26) * (sessionGone ? 0.45 : 1)}>
            <path d="M345,1160 L345,1330 L1505,1330 L1505,1160" fill="none" stroke={sessionColor} strokeWidth={5} strokeDasharray={sessionGone ? '10 10' : undefined} markerEnd="url(#spTipO)" />
            <rect x={790} y={1303} width={430} height={44} rx={12} fill={C.bg} />
            <text x={1005} y={1333} textAnchor="middle" fill={sessionColor} fontSize={23} fontFamily={sans}>{sessionGone ? 'session gone' : 'replication session'}</text>
          </g>
        ) : null}


      </svg>
    </div>
  );
};
