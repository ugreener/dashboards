import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string};
export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'hammerdb-drpc', role: 'coordinates recovery and later source cleanup', scope: 'hub · openshift-dr-ops', box: [120, 100, 500, 185], color: C.orange},
  policy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'sets the two sites and 15-minute data-loss objective', scope: 'hub · cluster scope', box: [700, 100, 500, 185], color: C.orange},
  placement: {kind: 'Placement', name: 'hammerdb-placement', role: 'lets Ramen choose the recovery cluster', scope: 'hub · openshift-dr-ops', box: [1280, 100, 500, 185], color: C.blue},
  s3: {kind: 'S3 bucket', name: 'ramen-metadata', role: 'keeps disk metadata and workload object backups', scope: 'MinIO on hub · bucket', box: [1860, 100, 500, 185], color: C.s3},
  vrg0: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'coordinates the target disk copies', scope: 'spoke-0 · openshift-dr-ops', box: [120, 490, 500, 185], color: C.spoke0},
  vr0: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-datadisk', role: 'requests a writable target data disk', scope: 'spoke-0 · hammerdb', box: [700, 490, 500, 185], color: C.amber},
  vm0: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'RHEL guest running PostgreSQL and HammerDB', scope: 'spoke-0 (home) · hammerdb', box: [120, 750, 500, 185], color: C.green},
  restore: {kind: 'Velero (OADP)', name: 'velero', role: 'restores the VM and its related definitions', scope: 'spoke-0 · openshift-adp', box: [700, 750, 500, 185], color: C.s3},
  vrg1: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'keeps the old site protected, then steps down', scope: 'spoke-1 · openshift-dr-ops', box: [1280, 490, 500, 185], color: C.spoke1},
  vr1: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'requests replication of the root disk', scope: 'spoke-1 · hammerdb', box: [1860, 490, 500, 185], color: C.amber},
  site: {kind: 'ManagedCluster', name: 'spoke-1', role: 'reports whether the hub can hear from this site', scope: 'hub · cluster scope', box: [1280, 750, 500, 185], color: C.spoke1},
  dv: {kind: 'DataVolume', name: 'hammerdb-rhel9-rootdisk', role: 'owns its source disk claim during cleanup', scope: 'spoke-1 · hammerdb', box: [1860, 750, 500, 185], color: C.blue},
  array0: {kind: 'PowerStore array', name: 'VSA-A', role: 'holds the promoted copies in this recorded run', scope: 'target storage · PS3b37452a6e0f', box: [120, 1100, 1080, 185], color: C.array},
  array1: {kind: 'PowerStore array', name: 'VSA-B', role: 'keeps running while the source cluster is frozen', scope: 'source storage · PSff392f423bd6', box: [1280, 1100, 1080, 185], color: C.array},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const FOCUS: Record<string, string[]> = {
  '0.1': ['array0', 'array1', 'vm0', 'site'],
  '2.1': ['drpc', 'vm0', 'site', 'array0', 'array1'],
  '2.2': ['drpc', 'vrg0'], '2.3': ['vrg1', 'vr1', 'array1'], '2.4': ['s3', 'restore'], '2.5': ['array0', 'array1'],
  '3.1': ['drpc', 'policy'], '3.2': ['array1'], '3.3': ['array1'], '3.4': ['drpc'], '3.5': ['array0', 'array1'],
  '4.1': ['site', 'array1'], '4.2': ['site'], '4.3': ['drpc'], '4.4': ['drpc'], '4.5': ['site', 'array1'], '4.6': ['site'],
  '5.1': ['drpc', 'vrg0'], '5.2': ['vrg0'], '5.3': ['vr0', 'array0'], '5.4': ['s3', 'restore'], '5.5': ['vm0'], '5.6': ['drpc'],
  '6.1': ['vm0'], '6.2': ['array0'], '6.3': ['vm0'], '6.4': ['vm0'], '6.5': ['drpc'], '6.6': ['vm0'], '6.7': ['vm0'], '6.8': ['drpc', 'site'],
  '7.1': ['site'], '7.2': ['site'], '7.3': ['site'], '7.4': ['vrg0'], '7.5': ['vr0'], '7.6': ['dv'], '7.7': ['vrg1'],
  '8.1': ['drpc'], '8.2': ['drpc'], '8.3': ['vrg1'], '8.4': ['array0'], '8.5': ['array1'], '8.6': ['site'], '8.7': ['site'],
  '9.1': ['drpc', 'vm0', 'array0', 'array1'], '9.2': ['drpc'], '9.3': ['vm0'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number); const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};
export const CH: [string, number, string, string][] = [
  ['4.2', 0.2, 'site', 'all six node VMs suspended'],
  ['4.4', 0.25, 'drpc', 'Failover requested'],
  ['5.2', 0.35, 'vrg0', 'Primary'],
  ['5.3', 0.4, 'array0', 'promoted copies writable'],
  ['5.5', 0.3, 'vm0', 'Running · guest services active'],
  ['5.6', 0.3, 'drpc', 'FailedOver / Cleaning Up'],
  ['6.7', 0.25, 'vm0', 'writer inactive and disabled'],
  ['7.2', 0.25, 'site', 'nodes Ready · hub availability Unknown'],
  ['7.3', 0.3, 'drpc', 'WaitOnUserToCleanUp'],
  ['7.6', 0.35, 'dv', 'source DataVolumes and owned PVCs removed'],
  ['7.7', 0.3, 'vrg1', 'Secondary'],
  ['8.2', 0.25, 'drpc', 'FailedOver / Completed · PeerReady=True'],
  ['8.4', 0.3, 'array0', 'Source / OK · fresh reverse sync'],
  ['8.5', 0.3, 'array1', 'Destination / OK'],
];
export const World: React.FC<{c: Ctx}> = ({c}) => {
  const keys = FOCUS[c.id] ?? [];
  const status = (key: string) => {
    let v = '';
    for (const [beat, frac, k, value] of CH) if (k === key && reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac)) v = value;
    return v;
  };
  const frozen = reached(c.id, '4.2') && !reached(c.id, '7.2');
  const focus = (key: string) => keys.length === 0 || keys.includes(key) ? 1 : 0.08;
  const chapter = phase(c.id);
  const arrow = (from: string, to: string, label: string, color: string, n: number) => {
    const a = RECT[from]; const b = RECT[to];
    const x1 = a[0] + a[2] / 2, x2 = b[0] + b[2] / 2;
    const down = b[1] > a[1]; const y1 = down ? a[1] + a[3] + 14 : a[1] - 12; const y2 = down ? b[1] - 18 : b[1] + b[3] + 10;
    const a0 = prog(c.f, c.dur * (0.12 + n * 0.13), c.dur * (0.12 + n * 0.13) + 25);
    const midY = (y1 + y2) / 2;
    return <g key={label} opacity={a0}><path d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`} fill="none" stroke={color} strokeWidth={4} markerEnd="url(#tip342)"/><circle cx={x1 + (x2 - x1) * ((c.f % 150) / 150)} cy={midY} r={6} fill={color}/><rect x={(x1 + x2) / 2 - 190} y={midY - 16} width={380} height={30} rx={10} fill={C.bg}/><text x={(x1 + x2) / 2} y={midY + 5} textAnchor="middle" fill={color} fontSize={20} fontFamily={sans}>{label}</text></g>;
  };
  return <div style={{position:'absolute',width:2480,height:1380}}>
    <Region b={{x:70,y:45,w:2340,h:300}} title="HUB · edge36" sub="recovery coordinator and MinIO" color={C.blue}/>
    <Region b={{x:70,y:425,w:1170,h:565}} title="SPOKE-0 · edge95 · HOME" sub="recorded recovery target" color={C.spoke0}/>
    <Region b={{x:1235,y:425,w:1175,h:565}} title="SPOKE-1 · edge97" sub={frozen?'recorded source · suspended':'recorded source site'} color={frozen?C.red:C.spoke1}/>
    <Region b={{x:70,y:1040,w:1170,h:310}} title="VSA-A · TARGET ARRAY" color={C.array}/>
    <Region b={{x:1235,y:1040,w:1175,h:310}} title="VSA-B · SOURCE ARRAY" color={C.array}/>
    {Object.entries(NODES).map(([key,n])=>{
      const s=status(key);const appear=chapter===2?prog(c.f,-15,35):1;
      return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role} lines={[n.scope,s||'recorded configuration']} appear={appear} focus={focus(key)} hl={keys.includes(key)?0.25:0} color={n.color} detail={Math.max(0,Math.min(1,(c.zoom-.65)/.2))} />;
    })}
    <svg width={2480} height={1380} style={{position:'absolute',left:0,top:0,pointerEvents:'none'}}>
      <defs><marker id="tip342" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.cyan}/></marker></defs>
      {c.id==='2.2'?arrow('drpc','vrg0','ManifestWork delivers instructions',C.cyan,0):null}
      {c.id==='2.3'?<g opacity={prog(c.f,c.dur*.15,c.dur*.15+25)}>
        <path d="M1530,682 L1530,710 L2110,710 L2110,682" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#tip342)"/>
        <rect x={1630} y={694} width={400} height={32} rx={10} fill={C.bg}/><text x={1830} y={716} textAnchor="middle" fill={C.green} fontSize={20} fontFamily={sans}>VRG writes the per-disk request</text>
        <path d="M2368,585 L2440,585 L2440,1015 L1820,1015 L1820,1080" fill="none" stroke={C.orange} strokeWidth={4} markerEnd="url(#tip342)"/>
        <rect x={1840} y={995} width={575} height={34} rx={10} fill={C.bg}/><text x={2125} y={1018} textAnchor="middle" fill={C.orange} fontSize={20} fontFamily={sans}>csi-addons calls Dell CSI, then PowerStore</text>
      </g>:null}
      {c.id==='2.4'||c.id==='5.4'?<g opacity={prog(c.f,c.dur*.15,c.dur*.15+25)}>
        <path d="M2368,185 L2450,185 L2450,365 L1220,365 L1220,1010 L950,1010 L950,950" fill="none" stroke={C.s3} strokeWidth={4} markerEnd="url(#tip342)"/>
        <rect x={1450} y={347} width={650} height={34} rx={10} fill={C.bg}/><text x={1775} y={371} textAnchor="middle" fill={C.s3} fontSize={20} fontFamily={sans}>Velero reads saved object definitions, not disk blocks</text>
      </g>:null}
      {c.id==='5.1'?arrow('drpc','vrg0','deliver the target VRG request',C.cyan,0):null}
      {c.id==='5.3'?<g opacity={prog(c.f,c.dur*.15,c.dur*.15+25)}>
        <path d="M1208,585 L1220,585 L1220,1015 L660,1015 L660,1080" fill="none" stroke={C.orange} strokeWidth={4} markerEnd="url(#tip342)"/>
        <rect x={675} y={995} width={520} height={34} rx={10} fill={C.bg}/><text x={935} y={1018} textAnchor="middle" fill={C.orange} fontSize={20} fontFamily={sans}>csi-addons calls Dell CSI to promote</text>
      </g>:null}
    </svg>
    {frozen?<div style={{position:'absolute',left:1300,top:950,fontFamily:mono,fontSize:21,color:C.red}}>All 3 masters + all 3 workers frozen. Array still online.</div>:null}
  </div>;
};
