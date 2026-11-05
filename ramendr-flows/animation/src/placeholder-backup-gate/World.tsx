import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string};
export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'hammerdb-drpc', role: 'the instruction for one application', scope: 'hub · openshift-dr-ops', box: [120, 100, 500, 185], color: C.orange},
  policy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'two sites and a 15-minute data-loss budget', scope: 'hub · cluster scope', box: [700, 100, 500, 185], color: C.orange},
  mcv: {kind: 'ManagedClusterView', name: 'target VRG view', role: 'how the hub reads the target site', scope: 'hub · openshift-dr-ops', box: [1280, 100, 500, 185], color: C.purple},
  s3: {kind: 'S3 bucket', name: 'ramen-metadata', role: 'disk records and object archives', scope: 'MinIO on hub · bucket', box: [1860, 100, 500, 185], color: C.s3},
  vrg1: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'source site manager, now Secondary', scope: 'spoke-0 · openshift-dr-ops', box: [120, 470, 500, 185], color: C.spoke0},
  vm0: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'the running guest on the source', scope: 'spoke-0 · hammerdb', box: [700, 470, 500, 185], color: C.green},
  pvc0: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk', role: 'source claim, removed by the operator', scope: 'spoke-0 · hammerdb', box: [120, 730, 500, 185], color: C.dim},
  vrg0: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'target site manager, one readiness answer', scope: 'spoke-1 · openshift-dr-ops', box: [1290, 470, 500, 185], color: C.spoke1},
  velero: {kind: 'Controller', name: 'velero', role: 'restore engine, packaged as OADP', scope: 'spoke-1 · openshift-adp', box: [1870, 470, 500, 185], color: C.s3},
  pvc1: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk', role: 'bound to the promoted disk', scope: 'spoke-1 · hammerdb', box: [1290, 730, 500, 185], color: C.dim},
  pvc2: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-datadisk', role: 'bound to the promoted disk', scope: 'spoke-1 · hammerdb', box: [1870, 730, 500, 185], color: C.dim},
  backup: {kind: 'Backup', name: 'openshift-dr-ops--hammerdb-drpc--0----minio-on-hub', role: 'a record about one archive, with a phase', scope: 'spoke-1 · openshift-adp', box: [1290, 990, 500, 185], color: C.purple},
  restore: {kind: 'Restore', name: 'hammerdb-drpc', role: 'the request to read one Backup', scope: 'spoke-1 · openshift-adp', box: [1870, 990, 500, 185], color: C.purple},
  bsl: {kind: 'BackupStorageLocation', name: 'openshift-dr-ops--hammerdb-drpc--0----minio-on-hub', role: 'which bucket to read, and how often', scope: 'spoke-1 · openshift-adp', box: [1290, 1250, 500, 185], color: C.amber},
  vm1: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'the blueprint that never arrived', scope: 'spoke-1 · hammerdb', box: [1870, 1250, 500, 185], color: C.green},
  array0: {kind: 'PowerStore array', name: 'VSA-A', role: 'source array, disks promoted away', scope: 'source site · PS3b37452a6e0f', box: [120, 1600, 1080, 185], color: C.array},
  array1: {kind: 'PowerStore array', name: 'VSA-B', role: 'target array, serves the promoted copies', scope: 'target site · PSff392f423bd6', box: [1290, 1600, 1080, 185], color: C.array},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const FOCUS: Record<string, string[]> = {
  '0.1': [], '0.2': [], '0.3': [], '0.4': [],
  '1.1': [], '1.2': ['drpc'], '1.3': ['policy'], '1.4': ['vrg0'], '1.5': ['velero'],
  '1.6': ['backup'], '1.7': ['restore'], '1.8': ['bsl'], '1.9': ['s3'], '1.10': ['pvc1', 'pvc2'],
  '1.11': ['vm1'], '1.12': ['vrg0', 'pvc1', 'vm1'],
  '2.1': ['drpc', 'vrg0'], '2.2': ['drpc', 'vrg1', 'vrg0'], '2.3': ['vm0', 'pvc0'],
  '2.4': ['vrg0'], '2.5': ['vrg0', 'pvc1'], '2.6': ['pvc1', 'pvc2'], '2.7': ['vrg0'],
  '2.8': ['vm1', 'pvc1'], '2.9': ['drpc', 'vrg0'], '2.10': ['drpc', 'vrg0'],
  '2.11': ['pvc1', 'vm1'], '2.12': ['drpc', 'vrg0'],
  '3.1': ['s3', 'vrg0'], '3.2': ['s3'], '3.3': ['s3', 'backup'], '3.4': ['bsl'],
  '3.5': ['backup', 'bsl'], '3.6': ['vrg0'], '3.7': ['vrg0', 'backup'], '3.8': ['vrg0', 'backup'],
  '3.9': ['velero', 'backup'], '3.10': ['backup', 's3'], '3.11': ['backup'],
  '3.12': ['backup', 'restore'], '3.13': ['restore', 's3'], '3.14': ['restore', 'backup'],
  '3.15': ['s3', 'backup', 'restore'], '3.16': ['backup', 's3'],
  '4.1': ['restore', 'backup'], '4.2': ['restore'], '4.3': ['restore'],
  '4.4': ['restore', 'vrg0'], '4.5': ['vrg0'], '4.6': ['backup', 'restore'],
  '4.7': ['velero', 'backup'], '4.8': ['drpc'], '4.9': ['drpc'], '4.10': ['drpc', 'vrg0'],
  '4.11': ['drpc', 'vrg0'], '4.12': ['restore'], '4.13': ['velero'], '4.14': ['restore', 'backup'],
  '5.1': ['vm0', 'vm1'], '5.2': ['vm1'], '5.3': ['velero'], '5.4': ['velero'],
  '5.5': ['backup'], '5.6': ['s3', 'backup'], '5.7': ['drpc', 'vrg0'], '5.8': ['restore'],
  '5.9': ['s3', 'backup', 'restore'], '5.10': ['vrg0'], '5.11': ['vrg0'],
  '6.1': ['bsl'], '6.2': ['bsl'], '6.3': ['bsl'], '6.4': ['bsl', 's3'],
  '6.5': ['s3', 'backup'], '6.6': ['backup', 'bsl'], '6.7': ['backup'], '6.8': ['s3'],
  '6.9': ['backup', 's3'], '6.10': ['backup'], '6.11': ['backup'], '6.12': ['backup'],
  '7.1': ['drpc', 'vrg0'], '7.2': ['vrg0'], '7.3': ['vrg0', 'restore'], '7.4': ['vrg0'],
  '7.5': ['vm1', 'pvc1', 'pvc2'], '7.6': ['backup', 'restore'], '7.7': ['drpc'],
  '7.8': ['drpc'], '7.9': ['vrg0'], '7.10': ['backup', 's3'], '7.11': ['vrg0', 'vm1'], '7.12': ['vm1'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number); const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};
export const CH: [string, number, string, string][] = [
  ['2.2', 0.25, 'drpc', 'action: Relocate · target spoke-1'],
  ['2.3', 0.2, 'vm0', 'deleted 08:01:13'],
  ['2.3', 0.4, 'pvc0', 'removed 08:03:20'],
  ['2.4', 0.3, 'vrg0', 'Primary · data ready true'],
  ['2.5', 0.3, 'vrg0', 'cluster data restored · 4 records'],
  ['2.6', 0.3, 'pvc1', 'bound · csivol-841ca78019'],
  ['2.6', 0.45, 'pvc2', 'bound · csivol-3471d7938c'],
  ['2.7', 0.25, 'vrg0', 'kube objects ready false · Error'],
  ['2.8', 0.3, 'vm1', 'absent'],
  ['2.9', 0.3, 'drpc', 'completion fields say done'],
  ['3.1', 0.3, 's3', 'capture group 0 · archive Completed'],
  ['3.4', 0.3, 'bsl', 'refresh period 0s · import off'],
  ['3.5', 0.3, 'backup', 'no record exists'],
  ['3.8', 0.3, 'backup', 'created by Ramen · same name'],
  ['3.10', 0.3, 'backup', 'phase Failed · name already exists'],
  ['3.11', 0.3, 'backup', 'backup already exists in object storage'],
  ['3.12', 0.3, 'restore', 'created anyway'],
  ['3.14', 0.3, 'restore', 'references the failed record'],
  ['4.1', 0.3, 'restore', 'validating the source record'],
  ['4.4', 0.3, 'restore', 'phase FailedValidation'],
  ['4.5', 0.3, 'vrg0', 'kube objects ready false · will retry'],
  ['4.8', 0.3, 'drpc', 'Relocated · Completed · PeerReady true'],
  ['4.9', 0.45, 'drpc', 'Protected false · capture not started'],
  ['4.11', 0.4, 'drpc', 'console row marked critical'],
  ['5.5', 0.3, 'backup', 'first failure 2026-10-29'],
  ['6.1', 0.2, 'bsl', 'obvious fix: import the archive'],
  ['6.4', 0.3, 'bsl', 'import takes only the difference'],
  ['6.6', 0.3, 'backup', 'placeholder is skipped · stays Failed'],
  ['7.1', 0.3, 'drpc', '08:03:52 refused · 08:05:57 retried'],
  ['7.4', 0.4, 'vrg0', 'read this condition, not the badge'],
  ['7.11', 0.4, 'vm1', 'still absent'],
];

const REGION_KEYS: Record<string, string[]> = {
  hub: ['drpc', 'policy', 'mcv', 's3'],
  spoke0: ['vrg1', 'vm0', 'pvc0'],
  spoke1: ['vrg0', 'velero', 'pvc1', 'pvc2', 'backup', 'restore', 'bsl', 'vm1'],
  array0: ['array0'],
  array1: ['array1'],
};

export const World: React.FC<{c: Ctx; panel?: boolean}> = ({c, panel}) => {
  const keys = FOCUS[c.id] ?? [];
  const status = (key: string) => {
    let v = '';
    for (const [beat, frac, k, value] of CH) if (k === key && reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac)) v = value;
    return v;
  };
  const focus = (key: string) => keys.length === 0 || keys.includes(key) ? 1 : 0.08;
  const chapter = phase(c.id);
  const appear = chapter === 2 ? prog(c.f, -15, 35) : 1;
  const regOn = (id: string) => {
    const on = (REGION_KEYS[id] ?? []).some(k => keys.includes(k));
    if (on) return 1;
    return panel ? 0 : 0.22;
  };
  const cardOn = (key: string) => (panel && !keys.includes(key) ? 0 : 1);
  const tip = 'tip-pbg';
  return <div style={{position: 'absolute', width: 2480, height: 1900}}>
    {regOn('hub') > 0 ? <Region b={{x: 70, y: 45, w: 2340, h: 300}} title="HUB · edge36" sub="the instruction, the policy, and the object store" color={C.blue} opacity={regOn('hub')} hideTitle={panel}/> : null}
    {regOn('spoke0') > 0 ? <Region b={{x: 70, y: 410, w: 1165, h: 1060}} title="SPOKE-0 · edge95 · SOURCE" sub="the site that was serving before the move" color={C.spoke0} opacity={regOn('spoke0')} hideTitle={panel}/> : null}
    {regOn('spoke1') > 0 ? <Region b={{x: 1240, y: 410, w: 1170, h: 1060}} title="SPOKE-1 · edge97 · TARGET" sub="where the move was asked to land" color={C.spoke1} opacity={regOn('spoke1')} hideTitle={panel}/> : null}
    {regOn('array0') > 0 ? <Region b={{x: 70, y: 1540, w: 1165, h: 310}} title="VSA-A · SOURCE ARRAY" color={C.array} opacity={regOn('array0')} hideTitle={panel}/> : null}
    {regOn('array1') > 0 ? <Region b={{x: 1240, y: 1540, w: 1170, h: 310}} title="VSA-B · TARGET ARRAY" color={C.array} opacity={regOn('array1')} hideTitle={panel}/> : null}

    {Object.entries(NODES).map(([key, n]) => {
      const s = status(key);
      if (cardOn(key) === 0) return null;
      const tiny = key === 'backup' || key === 'bsl';
      return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role}
        lines={[n.scope, s || 'recorded configuration']}
        appear={appear} focus={focus(key)} hl={keys.includes(key) ? 0.25 : 0}
        color={n.color} nameSize={tiny ? 17 : 22}
        detail={Math.max(0, Math.min(1, (c.zoom - .65) / .2))} />;
    })}

    <svg width={2480} height={1900} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <defs>
        <marker id={tip} markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.cyan}/></marker>
        <marker id={`${tip}-red`} markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.red}/></marker>
      </defs>

      {/* hub instructs the target site, across the gap between the hub and the spokes */}
      {chapter >= 2 && chapter <= 3 && (keys.includes('vrg0') || keys.includes('drpc')) ? <g opacity={prog(c.f, c.dur * .1, c.dur * .1 + 25)}>
        <path d="M370,350 L370,380 L1540,380 L1540,405" fill="none" stroke={C.cyan} strokeWidth={4} markerEnd={`url(#${tip})`}/>
        <rect x={1050} y={356} width={430} height={34} rx={10} fill={C.bg}/>
        <text x={1265} y={381} textAnchor="middle" fill={C.cyan} fontSize={21} fontFamily={sans}>hub asks the target to take over</text>
      </g> : null}

      {/* the collision: the new record carries the archive's own name */}
      {chapter === 3 && keys.includes('s3') && keys.includes('backup') ? <g opacity={prog(c.f, c.dur * .2, c.dur * .2 + 25)}>
        <path d="M1900,290 L1900,360 L1600,360 L1600,985" fill="none" stroke={C.red} strokeWidth={4} strokeDasharray="14 10" markerEnd={`url(#${tip}-red)`}/>
        <rect x={1090} y={330} width={520} height={36} rx={10} fill={C.bg}/>
        <text x={1350} y={356} textAnchor="middle" fill={C.red} fontSize={21} fontFamily={sans}>same name as the archive in the bucket</text>
        <g transform="translate(1600,640)">
          <circle r={26} fill={C.bg} stroke={C.red} strokeWidth={4}/>
          <path d="M-11,-11 L11,11 M11,-11 L-11,11" stroke={C.red} strokeWidth={6} strokeLinecap="round"/>
        </g>
      </g> : null}

      {/* empty source-site space becomes the notes canvas */}
      {chapter === 3 && c.id >= '3.15' ? <g opacity={prog(c.f, 0, 24)}>
        {[['one good archive', C.green], ['one self-made duplicate', C.amber], ['one failed record', C.red], ['one Restore pointing at it', C.purple]].map(([t, col], i) =>
          <g key={t}><rect x={150} y={960 + i * 74} width={700} height={56} rx={12} fill={C.panel} stroke={col} strokeWidth={2}/>
            <text x={178} y={997 + i * 74} fill={col} fontFamily={sans} fontSize={24}>{i + 1}. {t}</text></g>)}
      </g> : null}

      {chapter === 4 && keys.includes('restore') ? <g opacity={prog(c.f, c.dur * .15, c.dur * .15 + 25)}>
        <rect x={150} y={960} width={700} height={150} rx={14} fill={C.panel} stroke={C.red} strokeWidth={2}/>
        <text x={180} y={1005} fill={C.red} fontFamily={mono} fontSize={22}>phase FailedValidation</text>
        <text x={180} y={1045} fill={C.text} fontFamily={sans} fontSize={22}>backup is in phase Failed and</text>
        <text x={180} y={1080} fill={C.text} fontFamily={sans} fontSize={22}>cannot be used as a restore source</text>
      </g> : null}

      {chapter === 6 && c.id >= '6.4' && c.id <= '6.6' ? <g opacity={prog(c.f, c.dur * .1, c.dur * .1 + 25)}>
        <rect x={150} y={960} width={1000} height={330} rx={16} fill={C.panel} stroke={C.border} strokeWidth={2}/>
        <text x={180} y={1005} fill={C.dim} fontFamily={sans} fontSize={22}>import takes only the difference</text>
        <rect x={180} y={1030} width={420} height={92} rx={12} fill={`${C.s3}22`} stroke={C.s3} strokeWidth={2}/>
        <text x={198} y={1062} fill={C.s3} fontFamily={mono} fontSize={19}>archives in the bucket</text>
        <text x={198} y={1096} fill={C.text} fontFamily={sans} fontSize={19}>includes group 0</text>
        <rect x={700} y={1030} width={420} height={92} rx={12} fill={`${C.purple}22`} stroke={C.purple} strokeWidth={2}/>
        <text x={718} y={1062} fill={C.purple} fontFamily={mono} fontSize={19}>records in the cluster</text>
        <text x={718} y={1096} fill={C.text} fontFamily={sans} fontSize={19}>already has that name</text>
        <path d="M600,1076 L695,1076" stroke={C.faint} strokeWidth={3} strokeDasharray="8 8"/>
        <text x={180} y={1170} fill={C.amber} fontFamily={sans} fontSize={23}>the difference is empty, so nothing is imported</text>
        <text x={180} y={1212} fill={C.red} fontFamily={sans} fontSize={23}>the placeholder stays Failed</text>
        <text x={180} y={1254} fill={C.faint} fontFamily={sans} fontSize={19}>records that already exist are skipped, in every Velero version</text>
      </g> : null}

      {chapter === 7 && (c.id === '7.4' || c.id === '7.5' || c.id === '7.6') ? <g opacity={prog(c.f, 0, 22)}>
        {[['KubeObjectsReady', 'and the message, not the completion fields', C.orange],
          ['target namespace', 'a bound claim, a secret, no VirtualMachine', C.green],
          ['Backup and Restore', 'phase Failed, then FailedValidation', C.purple]].map(([t, sub, col], i) =>
          <g key={t}><rect x={150} y={960 + i * 110} width={980} height={86} rx={12} fill={C.panel} stroke={col} strokeWidth={2}/>
            <text x={178} y={998 + i * 110} fill={col} fontFamily={mono} fontSize={22}>{t}</text>
            <text x={178} y={1028 + i * 110} fill={C.dim} fontFamily={sans} fontSize={19}>{sub}</text></g>)}
      </g> : null}
    </svg>

    {c.id === '7.12' ? <div style={{position: 'absolute', left: 130, top: 1470, width: 1050, fontFamily: mono, fontSize: 24, color: C.faint}}>the archive was never the problem</div> : null}
  </div>;
};
