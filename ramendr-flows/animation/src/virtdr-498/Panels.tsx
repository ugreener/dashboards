import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES_498 = ['Protection', 'Request', 'Promotion', 'Data', 'Reverse copy', 'Cleanup', 'Recap'];

const Box: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', left: 980, top: 190, width: 905, padding: '24px 28px', border: `2px solid ${C.blue}`, borderRadius: 18, background: C.bg, fontFamily: sans, boxShadow: '0 20px 60px #000c', ...style}}>{children}</div>
);

const Row: React.FC<{text: React.ReactNode; i: number; f: number; dur: number; color?: string; mono?: boolean; size?: number}> = ({text, i, f, dur, color = C.text, mono: isMono, size = 24}) => {
  const a = prog(f, dur * (0.04 + i * 0.06), dur * (0.04 + i * 0.06) + 22);
  return <div style={{marginTop: 14, fontSize: size, lineHeight: 1.35, color, fontFamily: isMono ? mono : sans, opacity: a, transform: `translateX(${(1 - a) * 20}px)`, overflowWrap: 'anywhere'}}>{text}</div>;
};

const Chip: React.FC<{t: string; c: string; a?: number}> = ({t, c, a = 1}) => (
  <span style={{display: 'inline-block', opacity: a, padding: '3px 12px', borderRadius: 999, border: `1.5px solid ${c}`, background: `${c}1c`, color: c, fontFamily: mono, fontSize: 17, fontWeight: 600, whiteSpace: 'nowrap'}}>{t}</span>
);

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string}> = {
  '0.1': {title: 'A grouped handover, both sites up', rows: ['VIRTDR-498 · recorded failover', 'spoke-1 / VSA-B to spoke-0 / VSA-A', 'Both sites reachable. No site loss.'], color: C.cyan},
  '0.2': {title: 'What the run measured', rows: ['175 seconds outside the copy', '900-second recovery point objective', 'One cleanup defect on the old site'], color: C.green},
  '1.12': {title: 'Two questions after the group', rows: ['Is the copy fresh? Array job history and source writes.', 'Is the old site a ready peer? Source VRG Secondary and DRPC PeerReady.', 'The group answers neither by itself.']},
  '2.2': {title: 'Protection before the run', rows: ['DRPC Deployed / Completed', 'Protected=True · PeerReady=True', 'PlacementDecision: spoke-1', 'VSA-B group session: Source · OK'], color: C.green},
  '2.4': {title: 'The gate at 07:19:32', rows: ['10 of 10 preflight checks passed', 'Syncs 06:57:09 and 07:09:09', 'Max gap 720 s < 900 s', 'Rows 4,287 and 31,075', 'Initiate deadline 07:23:10'], color: C.green},
  '2.5': {title: 'Click before the deadline', rows: ['Last completed sync at preflight: 07:09:09', 'Initiate: 07:22:21', 'Deadline: 07:23:10', 'Margin: 49 s'], color: C.green},
  '3.2': {title: 'Two fields on the hub record', rows: ['spec.action: Failover', 'spec.failoverCluster: spoke-0', 'DRPC phase: FailingOver', 'Target VRG: Primary requested']},
  '3.3': {title: 'Observed phase changes', rows: ['07:22:34 FailingOver', 'progression WaitingForResourceRestore', '07:22:48 FailedOver', 'progression Cleaning Up']},
  '3.4': {title: 'Reachable-source scope', rows: ['No node suspension. No array power-off.', 'No lost-heartbeat wait.', 'Both sites can still write, so the test must not let them.', 'This is not the site-down variant.'], color: C.amber},
  '4.2': {title: 'The restored group map', rows: ['VGRC vgrcontent-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d', 'Promoted group 5f195dc9-650e-4051-81fd-9f99f7dcc86d', 'New destination group 4e4b4d3b-371b-42e7-a86b-3d904330d7eb', 'Root f41919e2-b30a-4cd9-a1c2-c5746a0da712', 'Data 6cefffe5-6890-4233-9625-2f09333f7b80'], color: C.cyan},
  '4.4': {title: 'One array action for the group', rows: ['PromoteVolume on the group ID', 'Failover: IsPlanned=false, Reverse=false', 'VGR status: Promoted', 'Message: promoted to primary and replicating to secondary', 'No per-disk promote step'], color: C.green},
  '4.5': {title: 'Both target claims bound', rows: ['csivol-31136f5c90 binds the root claim', 'f41919e2-b30a-4cd9-a1c2-c5746a0da712/PS3b37452a6e0f/scsi', 'csivol-2a761d921f binds the data claim', '6cefffe5-6890-4233-9625-2f09333f7b80/PS3b37452a6e0f/scsi', 'Old-site copies remain on VSA-B'], color: C.green},
  '4.8': {title: 'So far: the application is back', rows: ['Request moved the placement.', 'Restore rebuilt the objects.', 'One promote flipped the group.', 'Guest writing by 07:24:47.', 'Cleanup still pending.']},
  '5.1': {title: 'Two postcheck results', rows: ['07:46:20 → 15 of 17', 'Two handle checks failed', 'expected 5f195dc9, found f41919e2 / 6cefffe5', '07:53:37 → 17 of 17', 'The archive does not contain the checker change.'], color: C.amber},
  '5.2': {title: 'Job completion is not the snapshot', rows: ['Last completed sync: 07:21:09', 'Checker age: 71 s', 'Last recovered source row: 07:19:26', 'First recovered target row: 07:19:26', 'The recovered rows end at 07:19:26.'], color: C.amber},
  '5.3': {title: 'The measured loss window', rows: ['Last recovered write: 07:19:26', 'Initiate: 07:22:21', 'Lost writes: 175 s', 'Policy: 900 s', '25 complete source minutes checked, none missing'], color: C.green},
  '5.4': {title: 'Verdict', rows: ['No missing rows in the 25 minutes checked.', '175 s of writes after the last recovered row are lost.', '175 s < 900 s RPO.', 'Not zero loss.', 'Not a claim about all database history.'], color: C.green},
  '6.2': {title: 'The VGR records the promotion', rows: ['state: Primary', 'Replicating=True', 'Completed=True · reason Promoted', 'autoResync: false (Primary consequence)', 'INFERENCE: which side issued a separate Reprotect is not recorded.'], color: C.amber},
  '6.5': {title: 'Two questions, two answers', rows: ['ReplicationHealthy: is the array copy healthy?', 'PeerReady: has the old site finished its role change?', 'Healthy at 07:23:07. PeerReady at 07:35:04.', 'About twelve minutes apart.', 'One does not prove the other.']},
  '7.1': {title: 'The documented cleanup', rows: ['07:33 source VM deleted', '07:35 DataVolumes and claims deleted', '07:35 source VRG Secondary', 'This is the normal discovered-app path.', 'The defect appears here.']},
  '7.2': {title: 'The old-site PVs', rows: ['csivol-31136f5c90', 'csivol-2a761d921f', 'Expected: Retain + vr-retained annotation', 'Observed after cleanup: Released + Delete', 'The annotation is gone.'], color: C.amber},
  '7.3': {title: 'The retention branch', rows: ['pvcsUnprotectVolGroupRep reaches preparePVCForVRDeletion', 'Condition: an async VRG, or one already Primary', 'undoPVRetention sets the reclaim policy to Delete', 'undoPVRetention removes the vr-retained annotation', 'The old site is still the replication destination.', 'INFERENCE: the run build is not proven to match upstream.'], color: C.red},
  '7.4': {title: 'The array refuses the member removal', rows: ['csi-powerstore calls RemoveMembersFromVolumeGroup', 'HTTP 422: Volumes cannot be removed from the replication destination volume group', "Only a different 422 'not part' case is tolerated", 'PV stays Released with its finalizer', 'The provisioner retries.'], color: C.red},
  '7.5': {title: 'Defect and workaround', rows: ['DFBUGS-12906 · open Major', 'Lab workaround: patch both PVs to Retain', 'Defect record: retry loop stops, both copies remain', 'Impact: unclean decommission', 'Latent risk if the relationship is restructured first'], color: C.amber},
  '8.1': {title: 'The chain in order', rows: ['Prove the copy carried writes.', 'Request Failover with a target.', 'Restore the objects and rewrite the group map.', 'Promote the group once.', 'Bind both claims, start the guest.', 'Observe storage health, clean up, confirm peer.', 'Then the postcheck measures the gap.']},
  '8.2': {title: 'What the run established', rows: ['Recorded reachable-source failover', 'Volume-group replication, one promotion for both disks', '175 s loss inside 900 s', 'Cleanup defect on the old site', 'Not zero loss. Not a site-down test. No fix for DFBUGS-12906.'], color: C.green},
};
export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.1') return <TwoSites f={f} dur={dur} />;
  if (id === '1.2') return <ApplicationScene f={f} dur={dur} />;
  if (id === '1.3') return <ClaimsScene f={f} dur={dur} />;
  if (id === '1.10') return <SessionScene f={f} dur={dur} />;
  if (id === '1.11') return <ActionScene f={f} dur={dur} />;
  if (!card || !def) return null;
  const long = card.name.length > 35;
  return <div style={{position: 'absolute', inset: 0, opacity: prog(f, -20, 24)}}>
    <div style={{position: 'absolute', left: 100, top: 170, color: C.purple, fontFamily: mono, fontSize: 21}}>THE PIECES · {id.split('.')[1]}</div>
    <Card x={100} y={300} w={730} kind={card.kind} name={card.name} role={card.role} nameSize={long ? 15 : 26} appear={prog(f, -10, 24)} color={C.cyan} />
    <GlossaryPanel d={def} p={prog(f, dur * 0.03, dur * 0.75)} x={870} y={220} w={970} />
  </div>;
};

const TwoSites: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 160, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>THE PHYSICAL PICTURE</div>
    <div style={{position: 'absolute', left: 110, top: 210, fontSize: 46, color: C.text, fontWeight: 800}}>Two sites, two arrays, one guest.</div>
    {([
      ['SPOKE-1 · ocp-edge97', 'OLD SITE', 'VSA-B · Source before the move', 'the copy that is current at the start', C.spoke1, 110],
      ['SPOKE-0 · ocp-edge95', 'RECOVERY SITE', 'VSA-A · Destination before the move', 'the copy that becomes primary', C.spoke0, 1000],
    ] as [string, string, string, string, string, number][]).map(([site, role, sub, tag, col, x], i) => <div key={site} style={{position: 'absolute', left: x, top: 320, width: 800, padding: '30px 34px', border: `2px solid ${col}`, borderRadius: 20, background: `${col}10`, opacity: prog(f, dur * (0.05 + i * 0.1), dur * (0.05 + i * 0.1) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 20, color: col, letterSpacing: 1}}>{site}</div>
      <div style={{fontSize: 50, fontWeight: 800, color: C.text, marginTop: 10}}>{role}</div>
      <div style={{fontSize: 25, color: C.dim, marginTop: 12}}>{sub}</div>
      <div style={{marginTop: 22}}><Chip t={tag as string} c={col as string} /></div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 670, width: 1700, padding: '22px 28px', border: `2px solid ${C.orange}`, borderRadius: 18, background: `${C.orange}0e`, opacity: prog(f, dur * 0.45, dur * 0.45 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: C.orange, letterSpacing: 1.5}}>THE HUB · ocp-edge36</div>
      <div style={{fontSize: 28, color: C.text, marginTop: 8}}>The control records live one hop away: the DRPC, the policy, and the placement decision.</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 820, width: 1700, fontSize: 28, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.62, dur * 0.62 + 24)}}>
      The guest and its two disks live on the old site. The recovery site holds the other copy.
    </div>
  </div>
);

const ApplicationScene: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 160, fontSize: 30, letterSpacing: 2, color: C.green, fontWeight: 700}}>THE WORKLOAD</div>
    <div style={{position: 'absolute', left: 100, top: 205, fontSize: 42, fontWeight: 800, color: C.text}}>One guest, two disks, a writing database.</div>
    <div style={{position: 'absolute', left: 110, top: 330, width: 760, padding: '28px 32px', border: `2px solid ${C.green}`, borderRadius: 18, background: `${C.green}0e`, opacity: prog(f, dur * 0.05, dur * 0.05 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.green}}>VirtualMachine · hammerdb</div>
      <div style={{fontFamily: mono, fontSize: 32, color: C.text, marginTop: 8}}>hammerdb-rhel9</div>
      <div style={{fontSize: 24, color: C.dim, marginTop: 10}}>RHEL 9 · PostgreSQL · HammerDB TPC-C writer</div>
    </div>
    {[
      ['VirtualMachineInstance', 'the running instance', C.blue],
      ['DataVolume', 'prepares each disk', C.purple],
      ['Discovered', 'selected for protection, not an ApplicationSet', C.amber],
    ].map(([name, role, col], i) => <div key={name} style={{position: 'absolute', left: 930, top: 330 + i * 170, width: 800, padding: '22px 28px', border: `2px solid ${col}`, borderRadius: 16, background: `${col}0e`, opacity: prog(f, dur * (0.18 + i * 0.12), dur * (0.18 + i * 0.12) + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: col as string}}>{name}</div>
      <div style={{fontSize: 26, color: C.text, marginTop: 8}}>{role}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 640, width: 760, fontSize: 26, color: C.dim, lineHeight: 1.4, opacity: prog(f, dur * 0.55, dur * 0.55 + 24)}}>
      A VM is the definition. A VMI is the running instance. A DataVolume prepares the disk that the claim will bind.
    </div>
  </div>
);

const ClaimsScene: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 160, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>THE REQUESTS</div>
    <div style={{position: 'absolute', left: 100, top: 205, fontSize: 42, fontWeight: 800, color: C.text}}>Two claims, two bound records.</div>
    {[
      ['hammerdb-rhel9-rootdisk-grp', 'the root disk claim', 'csivol-31136f5c90', C.blue],
      ['hammerdb-rhel9-datadisk-grp', 'the database disk claim', 'csivol-2a761d921f', C.cyan],
    ].map(([claim, role, pv, col], i) => <div key={claim} style={{position: 'absolute', left: 110, top: 330 + i * 260, width: 760, padding: '24px 28px', border: `2px solid ${col}`, borderRadius: 16, background: `${col}0e`, opacity: prog(f, dur * (0.08 + i * 0.14), dur * (0.08 + i * 0.14) + 24)}}>
      <div style={{fontFamily: mono, fontSize: 16, color: col as string}}>PersistentVolumeClaim</div>
      <div style={{fontFamily: mono, fontSize: 24, color: C.text, marginTop: 8}}>{claim}</div>
      <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>{role}</div>
      <div style={{marginTop: 18}}><Chip t={`bound to ${pv}`} c={C.green} /></div>
    </div>)}
    <div style={{position: 'absolute', left: 930, top: 360, width: 830, fontSize: 28, color: C.text, lineHeight: 1.5, opacity: prog(f, dur * 0.3, dur * 0.3 + 24)}}>
      A claim asks for storage. Kubernetes binds it to a PersistentVolume. The PV names the real disk and carries its volume handle.
    </div>
    <div style={{position: 'absolute', left: 930, top: 650, width: 830, fontSize: 26, color: C.amber, lineHeight: 1.5, opacity: prog(f, dur * 0.55, dur * 0.55 + 24)}}>
      The two claims are about to become one group. That is why they must be promoted together.
    </div>
  </div>
);

const SessionScene: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 160, fontSize: 30, letterSpacing: 2, color: C.array, fontWeight: 700}}>THE ARRAY SESSION</div>
    <div style={{position: 'absolute', left: 100, top: 205, fontSize: 42, fontWeight: 800, color: C.text}}>One group, one session, one schedule.</div>
    {[
      ['VSA-B', 'OLD ARRAY', 'Source', C.green, 110],
      ['VSA-A', 'RECOVERY ARRAY', 'Destination', C.cyan, 1010],
    ].map(([name, sub, role, col, x], i) => <div key={name} style={{position: 'absolute', left: x as number, top: 330, width: 780, padding: '30px 34px', border: `2px solid ${C.array}`, borderRadius: 20, background: `${C.array}0e`, opacity: prog(f, dur * (0.06 + i * 0.1), dur * (0.06 + i * 0.1) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: C.array}}>{name} · {sub}</div>
      <div style={{fontSize: 48, fontWeight: 800, color: col as string, marginTop: 12}}>{role}</div>
      <div style={{fontSize: 24, color: C.dim, marginTop: 10}}>one session for the whole group</div>
    </div>)}
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <path d="M900,500 L1010,500" stroke={C.orange} strokeWidth={7} markerEnd="url(#tipS498)" />
      <defs><marker id="tipS498" markerWidth={12} markerHeight={12} refX={9} refY={4} orient="auto"><path d="M0,0 L0,8 L11,4 z" fill={C.orange} /></marker></defs>
    </svg>
    <div style={{position: 'absolute', left: 110, top: 640, width: 1700, padding: '22px 28px', border: `2px solid ${C.orange}`, borderRadius: 18, background: `${C.orange}0e`, opacity: prog(f, dur * 0.38, dur * 0.38 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.orange, letterSpacing: 1.4}}>POWERSTORE REPLICATION SESSION</div>
      <div style={{fontSize: 30, color: C.text, marginTop: 8}}>Role: Source or Destination. State: OK. Last sync: the newest recovery point.</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 800, width: 1700, fontSize: 28, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.58, dur * 0.58 + 24)}}>
      The policy asks for a fifteen-minute schedule. The completed jobs are the evidence, not the policy label.
    </div>
  </div>
);

const ActionScene: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 160, fontSize: 30, letterSpacing: 2, color: C.red, fontWeight: 700}}>TWO ACTIONS, TWO PROMISES</div>
    <div style={{position: 'absolute', left: 100, top: 205, fontSize: 42, fontWeight: 800, color: C.text}}>Failover stops. Relocate plans.</div>
    {[
      ['Failover', 'crash-consistent', 'Stops at the last completed copy. Writes after it are lost.', C.red, 110],
      ['Relocate', 'planned move', 'Designed to flush first and avoid that loss.', C.green, 1010],
    ].map(([name, tag, text, col, x], i) => <div key={name} style={{position: 'absolute', left: x as number, top: 330, width: 780, padding: '30px 34px', border: `2px solid ${col}`, borderRadius: 20, background: `${col}0e`, opacity: prog(f, dur * (0.06 + i * 0.1), dur * (0.06 + i * 0.1) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: col as string}}>{tag}</div>
      <div style={{fontSize: 50, fontWeight: 800, color: C.text, marginTop: 12}}>{name}</div>
      <div style={{fontSize: 26, color: C.dim, marginTop: 12, lineHeight: 1.35}}>{text}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 660, width: 1700, padding: '24px 30px', border: `2px solid ${C.amber}`, borderRadius: 18, background: `${C.amber}0e`, opacity: prog(f, dur * 0.45, dur * 0.45 + 24)}}>
      <div style={{fontSize: 30, color: C.text}}>This run used Failover, and both sites were reachable. No node was suspended, and no array was powered off.</div>
    </div>
  </div>
);

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  const cold = id === '0.1';
  return <div style={{position: 'absolute', left: cold ? 170 : 940, top: cold ? 290 : 220, width: cold ? 1580 : 900, padding: 32, border: `2px solid ${d.color ?? C.blue}`, borderRadius: 20, background: C.bg, opacity: a, fontFamily: sans, boxShadow: '0 20px 70px #000c'}}>
    <div style={{fontSize: cold ? 46 : 29, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 22}}>{d.title}</div>
    {d.rows.map((r, i) => <div key={r} style={{marginTop: 16, fontSize: cold ? 32 : 23, lineHeight: 1.35, color: r.startsWith('INFERENCE') ? C.amber : C.text, fontWeight: r.startsWith('INFERENCE') ? 700 : 400, opacity: prog(f, dur * (.03 + i * .05), dur * (.03 + i * .05) + 22), transform: `translateX(${(1 - prog(f, dur * (.03 + i * .05), dur * (.03 + i * .05) + 22)) * 22}px)`, fontFamily: /^[a-f0-9]{8}-/.test(r) || r.startsWith('VGRC ') || r.startsWith('Promoted ') || r.startsWith('New destination ') || r.startsWith('Root ') || r.startsWith('Data ') || r.startsWith('csivol-') || r.startsWith('f41919e2') || r.startsWith('6cefffe5') ? mono : sans, overflowWrap: 'anywhere'}}>{r}</div>)}
  </div>;
};
