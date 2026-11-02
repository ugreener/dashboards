import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string};
export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'hammerdb-drpc', role: 'the control sheet for one protected application', scope: 'hub · openshift-dr-ops', box: [120, 100, 500, 185], color: C.orange},
  policy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'two sites and a 15-minute data-loss budget', scope: 'hub · cluster scope', box: [700, 100, 500, 185], color: C.orange},
  mcv: {kind: 'ManagedClusterView', name: 'target VRG view', role: 'how the hub reads the target cluster', scope: 'hub · openshift-dr-ops', box: [1280, 100, 500, 185], color: C.purple},
  s3: {kind: 'S3 bucket', name: 'ramen-metadata', role: 'disk records and object backups', scope: 'MinIO on hub · bucket', box: [1860, 100, 500, 185], color: C.s3},
  vrg0: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'target site manager, one readiness answer', scope: 'spoke-0 · openshift-dr-ops', box: [120, 490, 500, 185], color: C.spoke0},
  vr0: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'one disk, promoted on the target', scope: 'spoke-0 · hammerdb', box: [700, 490, 500, 185], color: C.amber},
  vrg1: {kind: 'VolumeReplicationGroup', name: 'hammerdb-drpc', role: 'source site manager, now unreachable', scope: 'spoke-1 · openshift-dr-ops', box: [1280, 490, 500, 185], color: C.spoke1},
  vr1: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'one disk, source side, now silent', scope: 'spoke-1 · hammerdb', box: [1860, 490, 500, 185], color: C.amber},
  pvc0: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk', role: 'the request, bound to a promoted disk', scope: 'spoke-0 · hammerdb', box: [120, 750, 500, 185], color: C.dim},
  driver: {kind: 'Controller', name: 'csi-powerstore', role: 'translates resync and reprotect to the array', scope: 'spoke-0 · openshift-storage', box: [700, 750, 500, 185], color: C.purple},
  nodes1: {kind: 'ManagedCluster', name: 'spoke-1', role: 'the site the hub can no longer hear', scope: 'hub · cluster scope', box: [1280, 750, 500, 185], color: C.spoke1},
  vm0: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'the blueprint that never arrived', scope: 'spoke-0 · hammerdb', box: [120, 1010, 500, 185], color: C.green},
  velero0: {kind: 'Velero (OADP)', name: 'velero', role: 'restores workload definitions from S3', scope: 'spoke-0 · openshift-adp', box: [700, 1010, 500, 185], color: C.s3},
  array0: {kind: 'PowerStore array', name: 'VSA-A', role: 'target array, promoted every disk locally', scope: 'recovery site · PS3b37452a6e0f', box: [120, 1370, 1080, 185], color: C.array},
  array1: {kind: 'PowerStore array', name: 'VSA-B', role: 'source array, powered off at 11:46:58', scope: 'lost site · PSff392f423bd6', box: [1280, 1370, 1080, 185], color: C.array},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const FOCUS: Record<string, string[]> = {
  '2.1': ['nodes1','array1'],
  '2.2': ['nodes1','array1'],
  '2.3': ['drpc','policy','mcv','s3'],
  '2.4': ['array0'],
  '2.5': ['drpc','vrg0'],
  '3.1': ['array0','array1'],
  '3.2': ['array0','array1'],
  '3.3': ['vr0'],
  '3.4': ['pvc0','vr0'],
  '3.5': ['vrg0','pvc0'],
  '3.6': ['vrg0','vm0'],
  '4.1': ['array0','array1'],
  '4.2': ['driver','vr0','array0'],
  '4.3': ['array0','array1','driver'],
  '4.4': ['vr0','driver'],
  '4.5': ['vr0','pvc0'],
  '4.6': ['vr0','driver','vrg0'],
  '4.7': ['vr0','vrg0','vm0'],
  '5.1': ['vrg0','vr0'],
  '5.2': ['vrg0'],
  '5.3': ['vrg0'],
  '5.4': ['vrg0'],
  '5.5': ['vm0','velero0','pvc0'],
  '5.6': ['drpc','vrg0'],
  '5.7': ['drpc','vrg0'],
  '5.8': ['vr0','vrg0','vm0'],
  '6.1': ['driver'],
  '6.2': ['vrg0'],
  '6.3': ['array0','array1'],
  '6.4': ['array0','array1'],
  '6.5': ['drpc','mcv'],
  '6.6': ['vrg0'],
  '6.7': ['vm0'],
  '6.8': ['drpc','vrg0'],
};
export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number); const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};
export const CH: [string, number, string, string][] = [
  ['2.2', 0.25, 'nodes1', '6 node VMs suspended'],
  ['2.2', 0.45, 'array1', 'both nodes force-powered off'],
  ['3.2', 0.3, 'array0', 'peer connection lost · still promotes'],
  ['3.3', 0.35, 'vr0', 'source / failed over'],
  ['3.3', 0.55, 'vr1', 'source / failed over'],
  ['3.4', 0.4, 'pvc0', 'bound to promoted handle'],
  ['3.5', 0.45, 'vrg0', 'cluster data ready'],
  ['4.2', 0.3, 'driver', 'resync requested'],
  ['4.3', 0.35, 'array1', 'cannot answer'],
  ['4.4', 0.3, 'vr0', 'completed false / failed to resync'],
  ['4.5', 0.35, 'vr0', 'destination info pending'],
  ['5.2', 0.3, 'vrg0', 'data ready false'],
  ['5.4', 0.35, 'velero0', 'object restore skipped'],
  ['5.6', 0.3, 'drpc', 'wait for readiness'],
  ['6.3', 0.3, 'array0', 'reprotect blocked'],
];
const DARK = (id: string) => reached(id, '2.2');

const REGION_KEYS: Record<string,string[]> = {
  hub:['drpc','policy','mcv','s3'],
  spoke0:['vrg0','vr0','pvc0','driver','vm0','velero0'],
  spoke1:['vrg1','vr1','nodes1'],
  array0:['array0'],
  array1:['array1'],
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
  const dark = DARK(c.id);
  const appear = chapter === 2 ? prog(c.f, -15, 35) : 1;
  const regOn = (id: string) => {
    const on = (REGION_KEYS[id] ?? []).some(k => keys.includes(k));
    if (on) return 1;
    return panel ? 0 : 0.22;
  };
  const cardOn = (key: string) => (panel && !keys.includes(key) ? 0 : 1);
  const tip = 'tip-pag';
  const arrow = (x1: number, y1: number, x2: number, y2: number, midY: number, label: string, color: string, opacity: number) => (
    <g opacity={opacity}>
      <path d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`} fill="none" stroke={color} strokeWidth={4} markerEnd={`url(#${tip})`} />
      <rect x={(x1 + x2) / 2 - 190} y={midY - 17} width={380} height={32} rx={10} fill={C.bg} />
      <text x={(x1 + x2) / 2} y={midY + 5} textAnchor="middle" fill={color} fontSize={20} fontFamily={sans}>{label}</text>
    </g>
  );
  return <div style={{position:'absolute', width:2480, height:1660}}>
    {regOn('hub') > 0 ? <Region b={{x:70, y:45, w:2340, h:300}} title="HUB · edge36" sub="recovery coordinator and metadata store" color={C.blue} opacity={regOn('hub')} hideTitle={panel}/> : null}
    {regOn('spoke0') > 0 ? <Region b={{x:70, y:425, w:1170, h:830}} title="SPOKE-0 · edge95 · RECOVERY TARGET" sub="where the applications were sent" color={C.spoke0} opacity={regOn('spoke0')} hideTitle={panel}/> : null}
    {regOn('spoke1') > 0 ? <Region b={{x:1235, y:425, w:1175, h:830}} title="SPOKE-1 · edge97 · SOURCE" sub={dark ? 'compute and storage both gone' : 'the site that serves the workload'} color={dark ? C.red : C.spoke1} opacity={regOn('spoke1')} hideTitle={panel}/> : null}
    {regOn('array0') > 0 ? <Region b={{x:70, y:1310, w:1170, h:310}} title="VSA-A · TARGET ARRAY" color={C.array} opacity={regOn('array0')} hideTitle={panel}/> : null}
    {regOn('array1') > 0 ? <Region b={{x:1235, y:1310, w:1175, h:310}} title="VSA-B · SOURCE ARRAY" color={dark ? C.red : C.array} opacity={regOn('array1')} hideTitle={panel}/> : null}

    {Object.entries(NODES).map(([key, n]) => {
      const s = status(key);
      const isDead = dark && (key === 'vrg1' || key === 'vr1' || key === 'nodes1' || key === 'array1');
      if (cardOn(key) === 0) return null;
      return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role}
        lines={[n.scope, s || (isDead ? 'unreachable · no answer' : 'recorded configuration')]}
        appear={appear} focus={isDead ? 0.35 : focus(key)} hl={keys.includes(key) && !isDead ? 0.25 : 0}
        color={isDead ? C.faint : n.color} detail={Math.max(0, Math.min(1, (c.zoom - .65) / .2))} />;
    })}

    <svg width={2480} height={1660} style={{position:'absolute', left:0, top:0, pointerEvents:'none'}}>
      <defs><marker id={tip} markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.cyan}/></marker></defs>

      {c.id === '2.3' && regOn('hub') > 0 ? [
        ['11:47:36','hammerdb'],
        ['11:47:52','dell-win'],
        ['11:48:11','hammerdb-win'],
        ['11:48:26','dell-vm'],
      ].map(([t,app],i)=><g key={t} opacity={prog(c.f, c.dur*(.1+i*.12), c.dur*(.1+i*.12)+22)}>
        <rect x={150+i*540} y={300} width={500} height={44} rx={12} fill={C.panel} stroke={C.blue} strokeWidth={2}/>
        <text x={170+i*540} y={330} fill={C.blue} fontFamily={mono} fontSize={22}>{t}</text>
        <text x={330+i*540} y={330} fill={C.text} fontFamily={sans} fontSize={21}>{app}</text>
      </g>) : null}

      {/* source site dark overlay */}
      {dark && (keys.includes('array1') || keys.includes('nodes1')) ? <g>
        <rect x={1245} y={435} width={1155} height={810} rx={18} fill="#000" opacity={0.42}/>
        <rect x={1245} y={1320} width={1155} height={290} rx={18} fill="#000" opacity={0.55}/>
        <text x={1320} y={1170} fill={C.red} fontFamily={mono} fontSize={26}>SITE OFFLINE · 11:46:58 UTC</text>
        <text x={1320} y={1595} fill={C.red} fontFamily={mono} fontSize={26}>BOTH ARRAY NODES POWERED OFF</text>
      </g> : null}

      {/* node chips in the source cluster */}
      {dark && keys.includes('nodes1') ? [1330,1470,1610,1750,1890,2030].map((x,i)=>
        <g key={x}><rect x={x-52} y={925} width={104} height={34} rx={7} fill={`${C.red}33`} stroke={C.red} strokeWidth={2}/>
          <text x={x} y={948} textAnchor="middle" fill={C.dim} fontSize={16} fontFamily={sans}>{i<3?'master':'worker'}</text></g>) : null}

      {/* baseline copy before the loss, and the direction after promotion */}
      {chapter === 2 && !dark ? <g opacity={prog(c.f, c.dur * .3, c.dur * .3 + 25)}>
        <path d="M1820,1360 L1820,1290 L660,1290 L660,1360" fill="none" stroke={C.orange} strokeWidth={5} markerEnd={`url(#${tip})`}/>
      </g> : null}


      {/* reprotect attempt, blocked */}
      {chapter >= 4 && keys.includes('array0') && keys.includes('array1') ? <g opacity={reached(c.id, '4.3') ? 1 : 0.35}>
        <path d="M660,1360 L660,1250 L1820,1250 L1820,1360" fill="none" stroke={C.red} strokeWidth={5} strokeDasharray="16 12" markerEnd={`url(#${tip})`}/>
        <g transform="translate(1240,1250)">
          <circle r={26} fill={C.bg} stroke={C.red} strokeWidth={4}/>
          <path d="M-11,-11 L11,11 M11,-11 L-11,11" stroke={C.red} strokeWidth={6} strokeLinecap="round"/>
        </g>
        <rect x={830} y={1216} width={330} height={40} rx={12} fill={C.bg}/>
        <text x={995} y={1245} textAnchor="middle" fill={C.red} fontSize={24} fontFamily={sans}>Reprotect needs VSA-B</text>
        <rect x={1300} y={1216} width={560} height={40} rx={12} fill={C.bg}/>
        <text x={1580} y={1245} textAnchor="middle" fill={C.red} fontSize={24} fontFamily={sans}>no session state to answer with</text>
      </g> : null}

      {/* the gate, chapters 5 and 6 */}
      {chapter >= 5 && regOn('spoke0') > 0 ? <g opacity={prog(c.f, 0, 25)}>
        <path d="M950,675 L950,1010" fill="none" stroke={C.red} strokeWidth={5} strokeDasharray="14 12"/>
        <g transform="translate(950,860)">
          <rect x={-16} y={-56} width={32} height={112} rx={8} fill={`${C.red}22`} stroke={C.red} strokeWidth={4}/>
          <text x={38} y={-8} fill={C.red} fontSize={22} fontFamily={sans}>DataReady false</text>
          <text x={38} y={24} fill={C.dim} fontSize={20} fontFamily={sans}>restore waits here</text>
        </g>
      </g> : null}

      {(c.id === '5.6' || c.id === '6.5') && regOn('hub') > 0 && regOn('spoke0') > 0 ? arrow(370, 285, 370, 480, 380, 'hub reads the target VRG', C.cyan, prog(c.f, c.dur * .12, c.dur * .12 + 25)) : null}
    </svg>

    {c.id === '5.5' && regOn('spoke0') > 0 ? <div style={{position:'absolute', left:130, top:1206, width:520, fontFamily:mono, fontSize:22, color:C.red}}>no VM · no VMI · no DataVolumes</div> : null}
  </div>;
};
