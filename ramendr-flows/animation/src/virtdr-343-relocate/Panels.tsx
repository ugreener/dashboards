import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES_343 = ['Baseline', 'Planned move', 'Home', 'Old site', 'Schedule', 'Recap'];

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string}> = {
  '0.2': {title: 'Two different operations', rows: ['Failover: the source may be gone. Promote from the last copy.', 'Relocate: both sites up. Stop the application, run a final sync, then switch.', 'This run is a Relocate. The source site was healthy and reachable.', 'The console calls the Relocate action a failback.'], color: C.cyan},
  '0.3': {title: 'One recorded run', rows: ['VIRTDR-343 · 2026-10-26 · Dell PowerStore lab', 'Managed application dell-vm-workload', 'VM hammerdb-rhel9 · DRPC dell-vm-drpc', 'Arrays VSA-A and VSA-B · hub edge36', 'Every name and time in this video comes from the ticket.'], color: C.blue},
  '0.1': {title: 'Relocated, not protected', rows: ['VIRTDR-343 · recorded relocate on 2026-10-26', 'spoke-0 to spoke-1 · Initiate 13:46:32 UTC', 'DRPC Relocated at 13:50:10 · action duration 3m38s', 'After the move: next_sync_timestamp null on both sessions'], color: C.cyan},
  '2.1': {title: 'Starting state · 13:41:46 UTC', rows: ['DRPC dell-vm-drpc: FailedOver / Completed', 'preferredCluster: spoke-1', 'failoverCluster: spoke-0', 'PlacementDecision: spoke-0', 'PeerReady: True'], color: C.green},
  '2.3': {title: 'Array precheck · 13:42:16 UTC', rows: ['VSA-A: Source for both workload sessions', 'VSA-B: Destination for both workload sessions', 'Session state: OK', 'Root disk last sync: 13:34:18 UTC', 'Data disk last sync: 13:41:38 UTC'], color: C.green},
  '3.4': {title: 'DRPC spec after Initiate', rows: ['spec.action: Relocate', 'spec.preferredCluster: spoke-1 (set before the click)', 'spec.failoverCluster: spoke-0 (retained)', 'status.actionStartTime: 13:46:32 UTC', 'The target of a relocate is the preferred cluster.'], color: C.blue},
  '3.6': {title: 'The order that makes it planned', rows: ['1. Stop the application on spoke-0.', '2. Run the final sync.', '3. Both sites report volumes secondary.', '4. Argo CD prunes the source Application.', '5. Only then promote the target.'], color: C.amber},
  '4.2': {title: 'DRPC result · 13:50:10 UTC', rows: ['phase: Relocated', 'progression: Completed', 'Available: True / Relocated', 'PeerReady: True / Success', 'actionDuration: 3m38.455s'], color: C.green},
  '4.4': {title: 'Target claims · original PVs and handles', rows: ['hammerdb-rhel9-rootdisk', '  volumeName: csivol-ec5862ac71 · 35Gi · Bound', '  array handle: 1282bca9-29aa-416f-b890-2a29a44e3fac', 'hammerdb-rhel9-datadisk', '  volumeName: csivol-f756724d1d · 20Gi · Bound', '  array handle: e5ecb946-25b6-4f1a-afe0-8173392f2b7d'], color: C.green},
  '5.3': {title: 'Source remnants · spoke-0', rows: ['VRG gitops-vms/dell-vm-drpc: Secondary', 'No VirtualMachine, no VMI, no PVC, no VolumeReplication', 'Application dell-vm-workload-spoke-0: pruned', 'Namespace gitops-vms remains', 'No manual deletion in this run.'], color: C.amber},
  '6.2': {title: 'After the move · session state', rows: ['Root session 6116fde0: OK, Source on VSA-B', 'Data session 23dfdc6d: OK, Source on VSA-B', 'next_sync_timestamp: null for both', 'The rule is valid. The schedule is not armed.', 'last_sync stays at the relocate final sync.'], color: C.red},
  '6.5': {title: 'Manual sync result', rows: ['Root: triggered 13:55:32 · COMPLETED 13:55:36', '  next sync 14:13:25', 'Data: triggered 13:55:37 · COMPLETED 13:55:40', '  next sync 14:11:02', 'Array operation, not a Ramen action.'], color: C.green},
  '6.6': {title: 'Job history · VSA-B', rows: ['Completed syncs from 14:03 to 15:51', 'About every 12 minutes, both sessions', 'Last sync at 15:59 capture: 15:51:55', 'Next: 16:01:25 root · 15:59:02 data', 'The schedule stayed armed.'], color: C.green},
  '7.1': {title: 'Five checks for done', rows: ['DRPC: Relocated / Completed', 'PeerReady: True', 'PlacementDecision: spoke-1 only', 'Source VRG: Secondary', 'Both arrays: a scheduled next sync'], color: C.green},
  '7.3': {title: 'VIRTDR-361 acceptance criterion', rows: ['Returning workloads to the original site', 'must not leave stuck replication resources', 'or unexpectedly disable replication.', 'Validate after initial protection, failover/resync,', 'and relocation. This run repaired the schedule by hand.'], color: C.amber},
};

export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  const cold = id === '0.1' || id === '0.2' || id === '0.3';
  return <div style={{position: 'absolute', left: cold ? 170 : 900, top: cold ? 290 : 220, width: cold ? 1580 : 950, padding: 32, border: `2px solid ${d.color ?? C.blue}`, borderRadius: 20, background: `${C.bg}f5`, opacity: a, fontFamily: sans, boxShadow: '0 20px 70px #000c'}}>
    <div style={{fontSize: cold ? 48 : 29, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 24}}>{d.title}</div>
    {d.rows.map((r, i) => <div key={r} style={{marginTop: 18, fontSize: cold ? 34 : 25, lineHeight: 1.35, color: C.text, opacity: prog(f, dur * (.03 + i * .055), dur * (.03 + i * .055) + 22), transform: `translateX(${(1 - prog(f, dur * (.03 + i * .055), dur * (.03 + i * .055) + 22)) * 22}px)`, fontFamily: /^(csivol|[a-z-]+:|  volumeName|\d\.)/.test(r) ? mono : sans, overflowWrap: 'break-word'}}>{r}</div>)}
  </div>;
};

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.1') return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 160, fontSize: 40, color: C.text, fontWeight: 700}}>Three clusters, two arrays</div>
    {[
      ['HUB · edge36', 'DRPC · policy · placement decision · ApplicationSet', C.blue],
      ['SPOKE-0 · edge95', 'runs workloads · array VSA-A', C.spoke0],
      ['SPOKE-1 · edge97', 'runs workloads · array VSA-B', C.spoke1],
    ].map(([name, role, color], i) => <div key={name} style={{position: 'absolute', left: 110 + i * 570, top: 290, width: 520, minHeight: 180, padding: 28, border: `2px solid ${color}`, borderRadius: 18, background: C.panel, opacity: prog(f, dur * (.03 + i * .09), dur * (.03 + i * .09) + 24)}}><div style={{fontSize: 31, color, fontWeight: 700}}>{name}</div><div style={{fontSize: 25, color: C.text, lineHeight: 1.4, marginTop: 18}}>{role}</div></div>)}
    {[['VSA-A', 'spoke-0 storage'], ['VSA-B', 'spoke-1 storage']].map(([name, role], i) => <div key={name} style={{position: 'absolute', left: 300 + i * 780, top: 600, width: 620, minHeight: 150, padding: 28, border: `2px solid ${C.array}`, borderRadius: 18, background: C.panel, opacity: prog(f, dur * (.25 + i * .1), dur * (.25 + i * .1) + 24)}}><div style={{fontSize: 31, color: C.array, fontWeight: 700}}>{name}</div><div style={{fontSize: 25, color: C.text, marginTop: 16}}>{role} · asynchronous copy between sites</div></div>)}
  </div>;
  if (id === '1.13') return <div style={{position: 'absolute', inset: 0}}>
    <div style={{position: 'absolute', left: 300, top: 330, width: 1320, padding: 42, border: `2px solid ${C.purple}`, borderLeft: `8px solid ${C.purple}`, borderRadius: 18, background: `${C.bg}f5`, fontFamily: sans, opacity: prog(f, -10, 24)}}>
      <div style={{fontSize: 16, letterSpacing: 3, color: C.purple, fontWeight: 700}}>NEW TERM</div>
      <div style={{fontSize: 44, color: C.text, fontWeight: 700, marginTop: 8}}>Final sync</div>
      <div style={{fontSize: 30, color: C.dim, lineHeight: 1.4, marginTop: 18}}>A copy taken while the application is stopped, so the target starts from a known point instead of the last scheduled copy.</div>
      <div style={{fontSize: 26, color: C.amber, marginTop: 22}}>The console calls it a snapshot. The recorded run shows a final sync, then a promote.</div>
    </div>
  </div>;
  if (id === '1.14') return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 160, fontSize: 40, color: C.text, fontWeight: 700}}>Five groups, one return</div>
    {[
      ['Hub control', 'DRPC · DRPolicy · PlacementDecision'], ['GitOps delivery', 'ApplicationSet · Application'],
      ['Site storage', 'VRG · VolumeReplication · VolumeReplicationClass'], ['Workload', 'VirtualMachine · PVCs'],
      ['The switch', 'final sync · both sides secondary'],
    ].map(([name, role], i) => <div key={name} style={{position: 'absolute', left: 110 + (i % 3) * 585, top: 290 + Math.floor(i / 3) * 280, width: 540, minHeight: 210, padding: 28, border: `2px solid ${C.cyan}`, borderRadius: 18, background: C.panel, opacity: prog(f, dur * (.03 + i * .09), dur * (.03 + i * .09) + 24)}}><div style={{fontSize: 31, color: C.cyan, fontWeight: 700}}>{name}</div><div style={{fontSize: 25, color: C.text, lineHeight: 1.4, marginTop: 20}}>{role}</div></div>)}
  </div>;
  if (!card || !def) return <div style={{position: 'absolute', left: 180, top: 350, right: 180, color: C.text, fontFamily: sans, fontSize: 44, textAlign: 'center'}}>Every piece has one job. Follow the handoffs, not just the names.</div>;
  return <div style={{position: 'absolute', inset: 0, opacity: prog(f, -20, 24)}}>
    <div style={{position: 'absolute', left: 100, top: 170, color: C.purple, fontFamily: mono, fontSize: 21}}>CAST OF CHARACTERS · {id.split('.')[1]}</div>
    <Card x={100} y={300} w={660} kind={card.kind} name={card.name} role={card.role} nameSize={29} appear={prog(f, -10, 24)} color={C.cyan}/>
    <GlossaryPanel d={def} p={prog(f, dur * .03, dur * .75)} x={850} y={230} w={990}/>
  </div>;
};
