import React from 'react';
import {C, KIND, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {Flow, Envelope, P} from '../components/flows';
import {prog} from '../lib/anim';

export type Ctx = {order: string[]; id: string; f: number; dur: number; g: number; zoom: number};

const WORLD: [number, number, number, number] = [0, 20, 2600, 1700];

type CardDef = {
  x: number;
  y: number;
  w: number;
  kind: string;
  name: string;
  role?: string;
  lines?: string[];
  enter?: [string, number];
  color?: string;
  nameSize?: number;
};

export const CARDS: Record<string, CardDef> = {
  // ---- OpenShift site ----
  vm: {x: 100, y: 200, w: 320, kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'desired state: this VM should exist', enter: ['2.1', 0.1]},
  vmi: {x: 460, y: 200, w: 320, kind: 'VirtualMachineInstance', name: 'hammerdb-rhel9', role: 'the running instance on a node', enter: ['2.1', 0.45]},
  vctl: {x: 820, y: 200, w: 340, kind: 'Controller', name: 'virt-controller', role: 'turns a VM into a VMI and a pod', enter: ['2.1', 0.2]},
  vhandler: {x: 100, y: 340, w: 320, kind: 'Controller', name: 'virt-handler', role: 'drives libvirt on its own node', enter: ['2.1', 0.3]},
  launcher: {x: 110, y: 545, w: 340, kind: 'Pod', name: 'virt-launcher-hammerdb-rhel9-q66lw', role: 'runs libvirt and QEMU', enter: ['2.1', 0.55]},
  qemu: {x: 490, y: 545, w: 300, kind: 'Controller', name: 'QEMU + libvirt', role: 'emulates the virtual hardware', enter: ['2.1', 0.65]},
  guest: {x: 830, y: 545, w: 350, kind: 'Guest', name: 'RHEL 9 guest', role: 'the operating system inside the VM', enter: ['2.1', 0.75]},
  dv: {x: 110, y: 730, w: 340, kind: 'DataVolume', name: 'hammerdb-rhel9-rootdisk', role: 'creates and owns the PVC', enter: ['2.1', 0.5]},
  disk: {x: 490, y: 730, w: 300, kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk', role: '35 GiB block device', enter: ['2.1', 0.6]},
  secret: {x: 830, y: 730, w: 350, kind: 'Secret', name: 'cloudinit-hammerdb', role: 'guest login and cloud-init', enter: ['2.1', 0.8]},
  svc: {x: 100, y: 900, w: 320, kind: 'Service', name: 'hammerdb-rhel9', role: 'stable SSH endpoint', enter: ['4.1', 0.25]},
  podnet: {x: 460, y: 900, w: 320, kind: 'Service', name: 'pod network', role: 'cluster-local IP, no L2 stretch', enter: ['4.1', 0.1], color: C.cyan},

  // ---- Storage and replication ----
  sc: {x: 1360, y: 200, w: 320, kind: 'StorageClass', name: 'powerstore-sc', role: 'block volumes from the array', enter: ['3.1', 0.1]},
  csi: {x: 1720, y: 200, w: 320, kind: 'CSIDriver', name: 'csi-powerstore.dellemc.com', role: 'talks to the PowerStore API', enter: ['3.1', 0.2]},
  pv: {x: 2080, y: 200, w: 400, kind: 'PersistentVolume', name: 'csivol-<id>', role: 'the array volume as a K8s object', enter: ['3.1', 0.3]},
  vsaa: {x: 1360, y: 400, w: 320, kind: 'ReplicationSession', name: 'VSA-A', role: 'array for the first site', enter: ['3.1', 0.4]},
  vr: {x: 1720, y: 400, w: 320, kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'replicate, promote, demote', enter: ['3.1', 0.55]},
  vrc: {x: 2080, y: 400, w: 400, kind: 'VolumeReplicationClass', name: 'powerstore-vrc-15m', role: 'async, every 15 minutes', enter: ['3.1', 0.65]},
  vsab: {x: 1360, y: 640, w: 320, kind: 'ReplicationSession', name: 'VSA-B', role: 'array serving the second site', enter: ['3.1', 0.75]},
  session: {x: 1720, y: 640, w: 320, kind: 'ReplicationSession', name: 'async A to B', role: 'array session, last sync time', enter: ['3.1', 0.85]},
  rpo: {x: 2080, y: 640, w: 400, kind: 'ReplicationSession', name: '15m RPO / ~12m syncs', role: 'the exposure window', enter: ['3.1', 0.9], color: C.amber},

  // ---- Hub ----
  acm: {x: 100, y: 1150, w: 280, kind: 'Controller', name: 'ACM hub', role: 'manages both spokes', enter: ['7.1', 0.1]},
  drpolicy: {x: 400, y: 1150, w: 280, kind: 'DRPolicy', name: 'dr-policy-15m', role: 'pairs the clusters, 15m', enter: ['7.1', 0.2]},
  drcluster0: {x: 700, y: 1150, w: 280, kind: 'DRCluster', name: 'spoke-0', role: 'validated storage and S3', enter: ['7.1', 0.3]},
  drcluster1: {x: 1000, y: 1150, w: 250, kind: 'DRCluster', name: 'spoke-1', role: 'validated storage and S3', enter: ['7.1', 0.35]},
  drpc: {x: 100, y: 1300, w: 280, kind: 'DRPlacementControl', name: 'dell-vm-drpc', role: 'policy + placement + action', enter: ['7.1', 0.4]},
  placement: {x: 400, y: 1300, w: 280, kind: 'Placement', name: 'dell-vm-placement', role: 'rule for choosing a cluster', enter: ['7.1', 0.5]},
  decision: {x: 700, y: 1300, w: 280, kind: 'PlacementDecision', name: 'dell-vm-placement-decision-1', role: 'the chosen cluster', enter: ['7.1', 0.6]},
  vrg: {x: 1000, y: 1300, w: 250, kind: 'VolumeReplicationGroup', name: 'dell-vm-drpc', role: 'all protected disks', enter: ['7.1', 0.7]},
  appset: {x: 100, y: 1470, w: 280, kind: 'ApplicationSet', name: 'dell-vm-workload', role: 'GitOps template, pull model', enter: ['7.1', 0.8]},
  app: {x: 400, y: 1470, w: 280, kind: 'Application', name: 'dell-vm-workload-spoke-0', role: 'what Argo CD syncs', enter: ['7.1', 0.85]},
  mw: {x: 700, y: 1470, w: 280, kind: 'ManifestWork', name: 'dell-vm-drpc-gitops-vms-vrg-mw', role: 'hub to spoke envelope', enter: ['7.1', 0.9]},

  // ---- Metadata and backup ----
  s3: {x: 1360, y: 1150, w: 320, kind: 'Bucket', name: 'ramen-metadata', role: 'PV and PVC definitions', enter: ['7.1', 0.95]},
  oadp: {x: 1720, y: 1150, w: 320, kind: 'Backup', name: 'OADP + Velero', role: 'VM, DataVolume, Secret', enter: ['7.1', 0.97]},
  archive: {x: 2080, y: 1150, w: 400, kind: 'Bucket', name: 'kube object archive', role: 'restore source on the target', enter: ['7.1', 0.99], color: C.s3},
};


export const RECT: Record<string, [number, number, number, number]> = Object.fromEntries(
  Object.entries(CARDS).map(([k, v]) => [k, [v.x, v.y, v.w, v.y + 170 > 1700 ? 170 : 160]]),
);

const SITE: [number, number, number, number] = [60, 120, 1200, 900];
const STORAGE: [number, number, number, number] = [1320, 120, 1200, 900];
const HUB: [number, number, number, number] = [60, 1080, 1200, 570];
const META: [number, number, number, number] = [1320, 1080, 1200, 570];

RECT.pod = [80, 480, 1140, 400];
RECT.site = SITE;
RECT.storage = STORAGE;
RECT.hub = HUB;
RECT.meta = META;

const SITE_KEYS = ['vm', 'vmi', 'vctl', 'vhandler', 'launcher', 'qemu', 'guest', 'dv', 'disk', 'secret', 'svc', 'podnet'];
const STORAGE_KEYS = ['sc', 'csi', 'pv', 'vsaa', 'vr', 'vrc', 'vsab', 'session', 'rpo'];
const HUB_KEYS = ['acm', 'drpolicy', 'drcluster0', 'drcluster1', 'drpc', 'placement', 'decision', 'vrg', 'appset', 'app', 'mw'];
const META_KEYS = ['s3', 'oadp', 'archive'];
const GROUP: Record<string, string[]> = {site: SITE_KEYS, storage: STORAGE_KEYS, hub: HUB_KEYS, meta: META_KEYS, pod: ['launcher', 'qemu', 'guest', 'dv', 'disk', 'secret']};

/** Per-beat focus sets. A region key includes every card in that region. */
export const FOCUS: Record<string, string[]> = {
  '2.1': ['vm', 'vmi', 'vctl', 'vhandler', 'launcher', 'qemu', 'guest'],
  '2.2': ['vm', 'vmi', 'vctl'],
  '2.3': ['vmi', 'launcher', 'vhandler'],
  '2.4': ['launcher', 'qemu', 'guest'],
  '2.5': ['qemu', 'disk'],
  '2.6': ['vm', 'vmi'],
  '2.7': ['vm', 'dv', 'disk'],
  '2.8': ['vm', 'vmi', 'launcher', 'guest'],
  '2.9': ['vm', 'vmi', 'launcher', 'disk'],
  '3.1': ['disk', 'vsaa', 'vsab'],
  '3.2': ['disk', 'pv'],
  '3.3': ['sc', 'csi', 'vsaa'],
  '3.4': ['dv', 'disk'],
  '3.5': ['vsaa', 'vsab', 'session'],
  '3.6': ['session', 'rpo'],
  '3.7': ['disk', 'pv', 'csi', 'vsaa'],
  '4.1': ['guest', 'podnet'],
  '4.2': ['launcher', 'podnet', 'guest'],
  '4.3': ['svc', 'guest'],
  '4.4': ['svc', 'vsab'],
  '4.5': ['svc', 'guest'],
  '5.1': ['site', 'storage', 'hub', 'meta'],
  '5.2': ['session', 'rpo', 'guest'],
  '5.3': ['disk', 's3', 'guest'],
  '5.4': ['vsaa', 's3', 'oadp'],
  '5.5': ['guest', 'disk'],
  '5.6': ['s3', 'vsab'],
  '5.7': ['guest', 'launcher'],
  '5.8': ['vsaa', 's3', 'guest'],
  '6.1': ['vsaa', 'session', 'vsab'],
  '6.2': ['vrg', 'vr'],
  '6.3': ['vrc'],
  '6.4': ['session', 'vsaa', 'vsab'],
  '6.5': ['session'],
  '6.6': ['vsaa', 'vsab', 'session'],
  '6.7': ['session', 'vsaa'],
  '6.8': ['vr', 'vrg', 'session'],
  '7.1': ['acm', 'drpc'],
  '7.2': ['acm', 'drcluster0', 'drcluster1'],
  '7.3': ['drpolicy', 'drcluster0', 'drcluster1'],
  '7.4': ['drpc', 'placement'],
  '7.5': ['placement', 'decision'],
  '7.6': ['mw', 'vrg'],
  '7.7': ['s3', 'archive'],
  '7.8': ['drpc'],
  '7.9': ['acm', 'mw', 'vrg', 's3'],
  '8.1': ['drpc', 'decision'],
  '8.2': ['drpc'],
  '8.3': ['drpc', 'placement', 'decision'],
  '8.4': ['vrg', 'vr', 'vsab'],
  '8.5': ['s3', 'archive', 'disk'],
  '8.6': ['decision', 'appset', 'app'],
  '8.7': ['vm', 'guest'],
  '8.8': ['drpc', 'vm'],
  '8.9': ['drpc'],
  '8.10': ['session', 'guest'],
  '8.11': ['drpc', 'vrg', 'vr', 'decision', 'app'],
  '9.1': ['appset', 'app'],
  '9.2': ['appset', 'decision', 'app'],
  '9.3': ['appset', 'app'],
  '9.4': ['drpc', 'placement', 'appset'],
  '9.5': ['drpc'],
  '9.6': ['app'],
  '9.7': ['decision', 'appset', 'app'],
  '12.1': ['site', 'storage', 'hub', 'meta'],
  '12.2': ['vsaa', 'drpc', 'appset', 'guest'],
  '12.3': ['drpc', 'session', 'appset'],
  '12.4': ['session', 'guest'],
  '12.5': ['site', 'storage', 'hub', 'meta'],
};

/** Beats where a specific card or group flashes. */
const HL: Record<string, string[]> = {
  '2.3': ['launcher'],
  '2.5': ['disk'],
  '3.4': ['dv'],
  '3.6': ['session', 'rpo'],
  '6.6': ['vsab'],
  '6.7': ['session'],
  '8.4': ['vrg', 'vsab'],
  '8.8': ['drpc'],
  '9.6': ['app'],
};

const ARROWS: {k: string; a: P; b: P; kind: 'ref' | 'delivery' | 'observe' | 'data' | 'reconcile'; bend?: 'v' | 'h' | 'straight'; label?: string; ch: number[]; labelAt?: number}[] = [
  {k: 'vm-vmi', a: [420, 275], b: [460, 275], kind: 'reconcile', bend: 'h', ch: [2]},
  {k: 'vmi-launcher', a: [640, 350], b: [300, 545], kind: 'reconcile', bend: 'v', label: 'creates pod', ch: [2], labelAt: 0.55},
  {k: 'launcher-disk', a: [300, 715], b: [640, 730], kind: 'data', bend: 'h', label: 'block device', ch: [2, 3], labelAt: 0.55},
  {k: 'dv-disk', a: [450, 810], b: [490, 810], kind: 'ref', bend: 'h', ch: [2, 3]},
  {k: 'sc-csi', a: [1680, 275], b: [1720, 275], kind: 'ref', bend: 'h', ch: [3]},
  {k: 'csi-vsaa', a: [1880, 370], b: [1680, 400], kind: 'reconcile', bend: 'v', label: 'create volume', ch: [3], labelAt: 0.55},
  {k: 'vsaa-vsab', a: [1520, 570], b: [1520, 640], kind: 'data', bend: 'straight', label: 'async copy', ch: [3, 6], labelAt: 0.5},
  {k: 'vr-vsaa', a: [1720, 470], b: [1680, 470], kind: 'ref', bend: 'h', ch: [3, 6]},
  {k: 'drpc-placement', a: [380, 1370], b: [400, 1370], kind: 'ref', bend: 'h', ch: [7, 8]},
  {k: 'placement-decision', a: [680, 1370], b: [700, 1370], kind: 'reconcile', bend: 'h', ch: [7, 8]},
  {k: 'drpc-vrg', a: [380, 1385], b: [1000, 1370], kind: 'delivery', bend: 'h', label: 'via ManifestWork', ch: [7, 8], labelAt: 0.5},
  {k: 'decision-appset', a: [840, 1300], b: [240, 1470], kind: 'observe', bend: 'v', label: 'generator reads', ch: [7, 8, 9], labelAt: 0.5},
  {k: 'appset-app', a: [380, 1540], b: [400, 1540], kind: 'reconcile', bend: 'h', ch: [7, 8, 9]},
  {k: 'app-vm', a: [540, 1470], b: [260, 350], kind: 'delivery', bend: 'v', label: 'syncs workload', ch: [8, 9], labelAt: 0.55},
  {k: 's3-pv', a: [1680, 1230], b: [2280, 360], kind: 'ref', bend: 'v', label: 'PV / PVC definitions', ch: [7, 8], labelAt: 0.5},
];

const inGroup = (key: string, focus: string[]) => {
  if (focus.includes(key)) return true;
  for (const g of focus) if (GROUP[g]?.includes(key)) return true;
  return false;
};

const beatIndex = (order: string[], id: string) => order.indexOf(id);

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const ch = Number(c.id.split('.')[0]);
  const focus = FOCUS[c.id] ?? [];
  const order = c.order;
  const idx = beatIndex(order, c.id);

  const vis = (enter?: [string, number]) => {
    if (!enter) return 1;
    const ei = beatIndex(order, enter[0]);
    if (ei < 0 || idx < ei) return 0;
    if (idx > ei) return 1;
    return prog(c.f, c.dur * enter[1], c.dur * enter[1] + 26);
  };

  const isFocus = (k: string) => (focus.length ? inGroup(k, focus) : true);
  const hlFor = (k: string) => (HL[c.id]?.includes(k) ? 0.55 + 0.45 * Math.sin(c.f / 9) : 0);

  const arrowDraw = (k: string) => (ARROWS.find((a) => a.k === k)?.ch.includes(ch) ? 1 : 0);

  return (
    <div style={{position: 'relative', width: WORLD[2], height: WORLD[3], fontFamily: sans}}>
      <Region b={{x: SITE[0], y: SITE[1], w: SITE[2], h: SITE[3]}} title="OpenShift cluster" sub="one spoke, drawn as an example" color={C.spoke0} />
      <Region b={{x: STORAGE[0], y: STORAGE[1], w: STORAGE[2], h: STORAGE[3]}} title="Storage and replication" sub="example array (PowerStore)" color={C.array} />
      <Region b={{x: HUB[0], y: HUB[1], w: HUB[2], h: HUB[3]}} title="Hub" sub="ACM + RamenDR" color={C.hub} />
      <Region b={{x: META[0], y: META[1], w: META[2], h: META[3]}} title="Metadata and backup" sub="S3 + OADP" color={C.s3} />

      <Region b={{x: 80, y: 480, w: 1140, h: 400}} title="virt-launcher pod" color={C.green} dashed small />

      {/* pod membership label */}
      <div style={{position: 'absolute', left: 120, top: 870, fontFamily: mono, fontSize: 17, color: C.faint}}>one pod per running VMI</div>

      {Object.entries(CARDS).map(([k, d]) => (
        <Card
          key={k}
          x={d.x}
          y={d.y}
          w={d.w}
          kind={d.kind}
          name={d.name}
          role={d.role}
          lines={d.lines}
          color={d.color}
          nameSize={d.nameSize ?? (d.name.length > 28 ? 19 : 22)}
          appear={vis(d.enter)}
          focus={isFocus(k) ? 1 : 0.3}
          hl={hlFor(k)}
        />
      ))}

      <svg width={WORLD[2]} height={WORLD[3]} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
        {ARROWS.map((a) =>
          a.ch.includes(ch) ? (
            <Flow
              key={a.k}
              a={a.a}
              b={a.b}
              kind={a.kind}
              bend={a.bend}
              draw={1}
              label={focus.length ? (isFocus(a.k.split('-')[0]) ? a.label : undefined) : a.label}
              labelAt={a.labelAt}
              opacity={focus.length && !isFocus(a.k.split('-')[0]) ? 0.3 : 0.85}
              flowT={a.kind === 'data' ? (c.f % 140) / 140 : undefined}
              packets={3}
            />
          ) : null,
        )}
        {ch === 7 && c.id === '7.6' ? (
          <Envelope a={[840, 1470]} b={[1120, 1440]} t={((c.f % 150) / 150)} label="ManifestWork" color={C.cyan} bend="h" />
        ) : null}
      </svg>

      <div style={{position: 'absolute', left: 90, top: 1660, fontFamily: sans, fontSize: 18, color: C.faint}}>
        Object names from one worked example. The drawing shows the model, not live placement.
      </div>
    </div>
  );
};

export {WORLD};
