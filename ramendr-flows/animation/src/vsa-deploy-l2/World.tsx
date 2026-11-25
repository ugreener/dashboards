import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';

export type Ctx = {order: string[]; id: string; f: number; dur: number; g: number; zoom: number};

const WORLD: [number, number, number, number] = [0, 0, 2600, 1500];

type CardDef = {
  x: number;
  y: number;
  w: number;
  kind: string;
  name: string;
  role?: string;
  color?: string;
  nameSize?: number;
};

export const CARDS: Record<string, CardDef> = {
  nodeA: {x: 120, y: 240, w: 340, kind: 'VirtualMachine', name: 'VSA2-A-A', role: 'the first half'},
  nodeB: {x: 560, y: 240, w: 340, kind: 'VirtualMachine', name: 'VSA2-A-B', role: 'the second half'},
  link: {x: 340, y: 430, w: 400, kind: 'Network', name: 'interconnect', role: 'their private back channel', color: C.cyan},
  mgmt: {x: 120, y: 640, w: 340, kind: 'Network', name: 'management network', role: 'the address you log in to', color: C.blue},
  storage: {x: 560, y: 640, w: 340, kind: 'Network', name: 'storage network', role: 'where servers send disk traffic', color: C.orange},
  cluster: {x: 330, y: 820, w: 400, kind: 'Array', name: 'cluster address', role: 'exists only after the two nodes agree', color: C.amber},

  vlan0: {x: 1120, y: 230, w: 620, kind: 'VLAN', name: 'untagged (no number)', role: 'one room for every appliance', color: C.red},
  p1: {x: 1120, y: 370, w: 620, kind: 'Port group', name: 'dell_vsa_ic0', role: 'VSA-A pair', color: C.faint},
  p2: {x: 1120, y: 490, w: 620, kind: 'Port group', name: 'dell_vsab_ic0', role: 'VSA-B pair', color: C.faint},
  p3: {x: 1120, y: 610, w: 620, kind: 'Port group', name: 'dell_vsa2_ic0', role: 'VSA2-A pair, failed twice', color: C.red},
  p4: {x: 1120, y: 730, w: 620, kind: 'Port group', name: 'dell_vsa2b_ic0', role: 'VSA2-B pair', color: C.faint},

  dvs: {x: 1120, y: 1110, w: 620, kind: 'Switch', name: 'vDSwitch_vsa2', role: 'a new switch, only the new pairs', color: C.green},
  segA: {x: 1120, y: 1230, w: 300, kind: 'VLAN', name: '1 and 2', role: 'VSA2-A only', color: C.cyan},
  segB: {x: 1440, y: 1230, w: 300, kind: 'VLAN', name: '3 and 4', role: 'VSA2-B only', color: C.purple},
};

export const RECT: Record<string, [number, number, number, number]> = Object.fromEntries(
  Object.entries(CARDS).map(([k, v]) => [k, [v.x, v.y, v.w, 150]]),
);

const APPLIANCE: [number, number, number, number] = [60, 110, 900, 880];
const SHARED: [number, number, number, number] = [1080, 110, 700, 880];
const DEDICATED: [number, number, number, number] = [1080, 1020, 700, 420];

RECT.appliance = APPLIANCE;
RECT.shared = SHARED;
RECT.dedicated = DEDICATED;

const GROUP: Record<string, string[]> = {
  appliance: ['nodeA', 'nodeB', 'link', 'mgmt', 'storage', 'cluster'],
  shared: ['vlan0', 'p1', 'p2', 'p3', 'p4'],
  dedicated: ['dvs', 'segA', 'segB'],
};

export const FOCUS: Record<string, string[]> = {
  '2.1': ['appliance', 'nodeA', 'nodeB', 'cluster'],
  '2.2': ['nodeA', 'nodeB', 'link'],
  '3.1': ['appliance', 'shared'],
  '3.2': ['nodeA', 'nodeB', 'cluster'],
  '3.3': ['mgmt', 'storage', 'link', 'nodeA', 'nodeB'],
  '4.1': ['shared', 'vlan0', 'p1', 'p2', 'p3', 'p4'],
  '4.2': ['shared', 'link'],
  '4.3': ['shared'],
  '4.4': ['appliance', 'shared'],
  '6.3': ['appliance', 'dedicated', 'dvs', 'segA', 'segB'],
  '7.1': ['shared', 'dedicated', 'vlan0', 'segA', 'segB'],
  '7.2': ['dedicated', 'dvs', 'segA', 'segB'],
  '7.3': ['appliance', 'dedicated'],
};

const inGroup = (key: string, focus: string[]) => {
  if (focus.includes(key)) return true;
  for (const g of focus) if (GROUP[g]?.includes(key)) return true;
  return false;
};

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const focus = FOCUS[c.id] ?? [];
  const isFocus = (k: string) => (focus.length ? inGroup(k, focus) : true);

  return (
    <div style={{position: 'relative', width: WORLD[2], height: WORLD[3], fontFamily: sans}}>
      <Region b={{x: APPLIANCE[0], y: APPLIANCE[1], w: APPLIANCE[2], h: APPLIANCE[3]}} title="One appliance" sub="two virtual machines" color={C.green} />
      <Region b={{x: SHARED[0], y: SHARED[1], w: SHARED[2], h: SHARED[3]}} title="The old shared switch" sub="every port group untagged" color={C.red} />
      <Region b={{x: DEDICATED[0], y: DEDICATED[1], w: DEDICATED[2], h: DEDICATED[3]}} title="The new dedicated switch" sub="a numbered room per pair" color={C.green} />

      {Object.entries(CARDS).map(([k, d]) => (
        <Card
          key={k}
          x={d.x}
          y={d.y}
          w={d.w}
          kind={d.kind}
          name={d.name}
          role={d.role}
          color={d.color}
          nameSize={d.nameSize ?? (d.name.length > 28 ? 19 : 22)}
          appear={1}
          focus={isFocus(k) ? 1 : 0.22}
        />
      ))}

      <svg width={WORLD[2]} height={WORLD[3]} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
        <line x1={290} y1={378} x2={420} y2={430} stroke={C.cyan} strokeWidth={4} strokeDasharray="9 7" opacity={isFocus('link') ? 0.95 : 0.25} />
        <line x1={730} y1={378} x2={650} y2={430} stroke={C.cyan} strokeWidth={4} strokeDasharray="9 7" opacity={isFocus('link') ? 0.95 : 0.25} />
        <line x1={290} y1={640} x2={290} y2={378} stroke={C.blue} strokeWidth={3} opacity={isFocus('mgmt') ? 0.75 : 0.2} />
        <line x1={730} y1={640} x2={730} y2={378} stroke={C.orange} strokeWidth={3} opacity={isFocus('storage') ? 0.75 : 0.2} />

        <line x1={1100} y1={300} x2={1100} y2={850} stroke={C.red} strokeWidth={6} opacity={isFocus('shared') ? 0.55 : 0.15} />
        <text x={1078} y={578} fill={C.red} fontFamily={mono} fontSize={20} textAnchor="middle" transform="rotate(-90 1078 578)" opacity={isFocus('shared') ? 0.9 : 0.2}>one segment</text>

        <line x1={1290} y1={1180} x2={1270} y2={1230} stroke={C.green} strokeWidth={4} opacity={isFocus('dvs') ? 0.9 : 0.2} />
        <line x1={1570} y1={1180} x2={1590} y2={1230} stroke={C.green} strokeWidth={4} opacity={isFocus('dvs') ? 0.9 : 0.2} />
      </svg>

      <div style={{position: 'absolute', left: 1120, top: 900, fontFamily: mono, fontSize: 19, color: C.red}}>
        all four pairs hear each other
      </div>
      <div style={{position: 'absolute', left: 1120, top: 1390, fontFamily: mono, fontSize: 19, color: C.green}}>
        one pair per room, nothing else inside
      </div>
    </div>
  );
};

export {WORLD};
