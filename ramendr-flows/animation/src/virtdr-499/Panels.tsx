import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES_499 = ['Protection', 'Request', 'Promotion', 'Application', 'Data', 'Reverse copy', 'Recap'];

const Row: React.FC<{text: React.ReactNode; i: number; f: number; dur: number; color?: string; mono?: boolean; size?: number}> = ({text, i, f, dur, color = C.text, mono: isMono, size = 24}) => {
  const a = prog(f, dur * (0.04 + i * 0.06), dur * (0.04 + i * 0.06) + 22);
  return <div style={{marginTop: 14, fontSize: size, lineHeight: 1.35, color, fontFamily: isMono ? mono : sans, opacity: a, transform: `translateX(${(1 - a) * 20}px)`, overflowWrap: 'anywhere'}}>{text}</div>;
};

const Chip: React.FC<{t: string; c: string; a?: number; size?: number}> = ({t, c, a = 1, size = 17}) => (
  <span style={{display: 'inline-block', opacity: a, marginRight: 10, marginTop: 10, padding: '3px 12px', borderRadius: 999, border: `1.5px solid ${c}`, background: `${c}1c`, color: c, fontFamily: mono, fontSize: size, fontWeight: 600, whiteSpace: 'nowrap'}}>{t}</span>
);

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string}> = {
  '1.9': {title: 'Two planes have to move', rows: ['Two sites, one managed application.', 'Two claims protected as one group.', 'One array session for both disks.', 'Storage plane: disks and roles.', 'Application plane: the VM and its disks.']},
  '2.5': {title: 'The gate at 10:53:30', rows: ['Seven checks, ten of ten rows PASS', 'DRPC FailedOver / Completed', 'Protected=True · PeerReady=True', 'Decision: spoke-1', 'Syncs 10:37:50 and 10:49:50', 'Max gap 720 s < 900 s', 'Writer 9,799,003 → 9,800,328 rows', 'Every interval carried rows', 'Deadline 11:03:50'], color: C.green},
  '2.6': {title: 'Two checks exist only for a managed app', rows: ['A Succeeded DataVolume per protected disk', 'Argo tracks each disk in Git', 'No clone source in the workload namespace', 'DOCUMENTED LAB RULE: a claim outside Git survives the move and stalls the old site', 'This run meets the rule; it does not exercise the failure.'], color: C.amber},
  '3.3': {title: 'Two fields on the hub record', rows: ['spec.action: Failover', 'spec.failoverCluster: spoke-0', 'DRPC phase: FailingOver', 'Target VRG: Primary requested', 'Nothing changed on either array yet']},
  '3.5': {title: 'Reachable-source scope', rows: ['No node suspension', 'No array power-off', 'No lost-heartbeat wait', 'Both sites reachable throughout', 'Not the site-down variant (VIRTDR-368)'], color: C.amber},
  '4.2': {title: 'From request to driver call', rows: ['Companion VolumeReplication: carries the group state', 'csi-addons: Promote RPC for the group', 'Dell PromoteVolume: volume-group source', 'One array failover, not one per disk', 'MECHANISM FROM SOURCE · the run records the result'], color: C.amber},
  '4.4': {title: 'Both target claims bound', rows: ['Root claim → 7ef2772a-9bd1-4985-bfa4-42585ea463ad/PS3b37452a6e0f/scsi', 'Data claim → 201b3d01-7e13-42c2-a6e3-fb0a00c4252c/PS3b37452a6e0f/scsi', 'Both promoted copies on array PS3b37452a6e0f', 'Protocol: scsi', 'Old copies remain on VSA-B'], color: C.green},
  '4.5': {title: 'The two site records', rows: ['VRG spoke-0: Primary', 'VRG spoke-1: Secondary', 'Replication health at 10:56:59', 'First reverse sync 11:09:17', 'Protected=True at 11:12:00'], color: C.green},
  '6.1': {title: 'The loss window', rows: ['Last completed sync 10:49:50', 'Initiate 10:55:55', 'Not in the copy: 365 s', 'Policy: 900 s', 'Failover issues no final sync'], color: C.amber},
  '6.2': {title: 'Two different measurements', rows: ['Last source row 10:49:50', 'First target row 11:00:10', 'Recovery gap: 620 s', 'The loss window was 365 s', 'Neither number replaces the other'], color: C.amber},
  '6.3': {title: 'What the check walked', rows: ['47 complete source minutes before the last sync', 'Missing minutes: none', 'Last interval rows: 41,243', 'Writer stopped, database left running', 'Count 9,858,036 → 9,858,036'], color: C.green},
  '6.4': {title: 'Verdict', rows: ['Recovered data complete to the last sync', '365 s of later writes are lost', 'Inside the 900 s objective', 'Not zero loss', 'Not a claim about every transaction'], color: C.green},
  '7.4': {title: 'What stays on the old site', rows: ['csivol-5a803ae045', 'csivol-1bdcd8b387', 'Released, reclaim policy Retain', 'They point at live reverse-copy targets', 'Removal is a separate authorized cleanup'], color: C.amber},
  '7.5': {title: 'What this run does not prove', rows: ['Not zero loss', 'Not a source-site-down failover', 'Not a move back', 'Relocate needs the old site clean and protected first']},
  '8.1': {title: 'The chain in order', rows: ['Prove the copy carried writes.', 'Ask for Failover with a target.', 'Restore the storage records and the group map.', 'Promote the group once.', 'Move the placement decision.', 'GitOps prunes the old site and deploys the new one.', 'CDI adopts the promoted disks.', 'Start the guest, then measure the gap.']},
  '8.2': {title: 'What the run established', rows: ['Reachable-source failover of a managed RHEL app', 'One group promotion for both disks', 'GitOps cleanup with no manual deletion', '365 s lost inside a 900 s policy', '47 source minutes checked, none missing', '17 of 17 checks passed', 'No new product defect found'], color: C.green},
};
export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

export const ColdOpen: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 185, textAlign: 'center', fontSize: 64, fontWeight: 800, color: C.text, opacity: prog(f, dur * 0.02, dur * 0.02 + 28)}}>
      Two planes, one handover
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 272, textAlign: 'center', fontSize: 27, color: C.dim, opacity: prog(f, dur * 0.08, dur * 0.08 + 24)}}>
      One database, writing. Both sites still healthy.
    </div>
    {[
      ['STORAGE PLANE', 'the disks move', 'one group, one promotion, one recovery point', C.array, 130],
      ['APPLICATION PLANE', 'the definition moves', 'Git removes it here and creates it there', C.green, 1040],
    ].map(([name, role, sub, col, x], i) => <div key={name} style={{position: 'absolute', left: x as number, top: 370, width: 750, padding: '30px 34px', border: `2px solid ${col}`, borderRadius: 22, background: `${col}10`, opacity: prog(f, dur * (0.12 + i * 0.1), dur * (0.12 + i * 0.1) + 28)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: col as string, letterSpacing: 1.5}}>{name}</div>
      <div style={{fontSize: 38, color: C.text, fontWeight: 700, marginTop: 12}}>{role}</div>
      <div style={{fontSize: 24, color: C.dim, marginTop: 10}}>{sub}</div>
    </div>)}
    <div style={{position: 'absolute', left: 0, right: 0, top: 735, textAlign: 'center', fontSize: 30, color: C.text, opacity: prog(f, dur * 0.46, dur * 0.46 + 26)}}>
      A database that wakes with one disk from one moment and one disk from another is not recovered.
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 795, textAlign: 'center', fontSize: 25, color: C.amber, opacity: prog(f, dur * 0.6, dur * 0.6 + 24)}}>
      And a definition that stays on the old site is not recovered either.
    </div>
  </div>
);

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.1') return <TwoSites f={f} dur={dur} />;
  if (id === '1.2') return <ManagedLayout f={f} dur={dur} />;
  if (id === '1.3') return <Generator f={f} dur={dur} />;
  if (id === '1.4') return <WorkloadClaims f={f} dur={dur} />;
  if (id === '1.6') return <GroupScene f={f} dur={dur} />;
  if (id === '1.7') return <RecordsScene f={f} dur={dur} />;
  if (id === '1.8') return <Actions f={f} dur={dur} />;
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
    <div style={{position: 'absolute', left: 110, top: 205, fontSize: 44, color: C.text, fontWeight: 800}}>Two sites, two arrays, one guest.</div>
    {([
      ['SPOKE-1 · ocp-edge97', 'RUN SOURCE', 'VSA-B · 10.46.48.30', 'the copy that is current at the start', C.spoke1, 110],
      ['SPOKE-0 · ocp-edge95', 'RUN TARGET', 'VSA-A · 10.46.48.20', 'the preferred cluster, and the other copy', C.spoke0, 1000],
    ] as [string, string, string, string, string, number][]).map(([site, role, sub, tag, col, x], i) => <div key={site} style={{position: 'absolute', left: x, top: 300, width: 800, padding: '28px 32px', border: `2px solid ${col}`, borderRadius: 20, background: `${col}10`, opacity: prog(f, dur * (0.05 + i * 0.1), dur * (0.05 + i * 0.1) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 20, color: col, letterSpacing: 1}}>{site}</div>
      <div style={{fontSize: 46, fontWeight: 800, color: C.text, marginTop: 8}}>{role}</div>
      <div style={{fontSize: 24, color: C.dim, marginTop: 10}}>{sub}</div>
      <div style={{marginTop: 18}}><Chip t={tag as string} c={col as string} /></div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 640, width: 1700, padding: '20px 26px', border: `2px solid ${C.blue}`, borderRadius: 18, background: `${C.blue}0e`, opacity: prog(f, dur * 0.45, dur * 0.45 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: C.blue, letterSpacing: 1.5}}>THE HUB · ocp-edge36</div>
      <div style={{fontSize: 27, color: C.text, marginTop: 8}}>Holds the template, the placement and the disaster recovery record.</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 775, width: 1700, fontSize: 27, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.62, dur * 0.62 + 24)}}>
      The home cluster of this workload is spoke-0. At the start of this run the workload was running on spoke-1,
      so the run moved it back toward home.
    </div>
  </div>
);

const ManagedLayout: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 155, fontSize: 30, letterSpacing: 2, color: C.green, fontWeight: 700}}>A MANAGED APPLICATION</div>
    <div style={{position: 'absolute', left: 100, top: 200, fontSize: 42, fontWeight: 800, color: C.text}}>Two namespaces, two jobs.</div>
    <div style={{position: 'absolute', left: 110, top: 320, width: 800, padding: '26px 30px', border: `2px solid ${C.blue}`, borderRadius: 18, background: `${C.blue}0e`, opacity: prog(f, dur * 0.05, dur * 0.05 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: C.blue}}>HUB · openshift-gitops</div>
      <div style={{fontSize: 30, color: C.text, marginTop: 10}}>The control records</div>
      <div><Chip t="ApplicationSet dell-vm-workload" c={C.blue} /><Chip t="Placement dell-vm-placement" c={C.blue} /><Chip t="DRPC dell-vm-placement-drpc" c={C.orange} /></div>
    </div>
    <div style={{position: 'absolute', left: 1010, top: 320, width: 800, padding: '26px 30px', border: `2px solid ${C.green}`, borderRadius: 18, background: `${C.green}0e`, opacity: prog(f, dur * 0.16, dur * 0.16 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: C.green}}>SPOKES · gitops-vms</div>
      <div style={{fontSize: 30, color: C.text, marginTop: 10}}>The workload itself</div>
      <div><Chip t="VirtualMachine hammerdb-rhel9" c={C.green} /><Chip t="2 claims" c={C.dim} /><Chip t="2 DataVolumes" c={C.purple} /></div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 640, width: 1700, fontSize: 27, color: C.text, lineHeight: 1.45, opacity: prog(f, dur * 0.38, dur * 0.38 + 24)}}>
      The Argo CD generator reads decisions only in its own namespace, and Ramen requires the placement and its
      DR record to live together. So all three control objects share openshift-gitops.
    </div>
    <div style={{position: 'absolute', left: 110, top: 780, width: 1700, fontSize: 26, color: C.amber, lineHeight: 1.4, opacity: prog(f, dur * 0.56, dur * 0.56 + 24)}}>
      The DRPC and the Placement stay on the hub. The workload namespace holds the workload, and the VRGs Ramen delivers to it.
    </div>
  </div>
);

const Generator: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 155, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>THE GENERATOR</div>
    <div style={{position: 'absolute', left: 100, top: 200, fontSize: 42, fontWeight: 800, color: C.text}}>One template, one Application per cluster.</div>
    <div style={{position: 'absolute', left: 110, top: 330, width: 700, padding: '24px 28px', border: `2px solid ${C.blue}`, borderRadius: 16, background: `${C.blue}0e`, opacity: prog(f, dur * 0.05, dur * 0.05 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.blue}}>ApplicationSet</div>
      <div style={{fontFamily: mono, fontSize: 28, color: C.text, marginTop: 8}}>dell-vm-workload</div>
      <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>template name dell-vm-workload-{'{{name}}'}</div>
    </div>
    <div style={{position: 'absolute', left: 880, top: 330, width: 700, padding: '24px 28px', border: `2px solid ${C.blue}`, borderRadius: 16, background: `${C.blue}0e`, opacity: prog(f, dur * 0.18, dur * 0.18 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.blue}}>PlacementDecision</div>
      <div style={{fontFamily: mono, fontSize: 26, color: C.text, marginTop: 8}}>dell-vm-placement-decision-1</div>
      <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>status.decisions names one cluster</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 590, width: 1470, padding: '22px 28px', border: `2px solid ${C.green}`, borderRadius: 16, background: `${C.green}0e`, opacity: prog(f, dur * 0.36, dur * 0.36 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.green}}>GENERATED ON THE HUB, RUN ON THE SPOKE</div>
      <div style={{fontSize: 27, color: C.text, marginTop: 10}}>
        dell-vm-workload-spoke-1 on the source, dell-vm-workload-spoke-0 on the target
      </div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 760, width: 1700, fontSize: 26, color: C.text, lineHeight: 1.45, opacity: prog(f, dur * 0.56, dur * 0.56 + 24)}}>
      The hub does not run the workload. It hands the Application to the selected spoke through the management
      plane, and that spoke's Argo CD pulls the manifests from Git.
    </div>
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <path d="M810,420 L880,420" stroke={C.purple} strokeWidth={6} markerEnd="url(#tipG499)" />
      <defs><marker id="tipG499" markerWidth={12} markerHeight={12} refX={9} refY={4} orient="auto"><path d="M0,0 L0,8 L11,4 z" fill={C.purple} /></marker></defs>
    </svg>
  </div>
);

const WorkloadClaims: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 155, fontSize: 30, letterSpacing: 2, color: C.green, fontWeight: 700}}>THE WORKLOAD</div>
    <div style={{position: 'absolute', left: 100, top: 200, fontSize: 42, fontWeight: 800, color: C.text}}>One guest, two claims, two disks.</div>
    <div style={{position: 'absolute', left: 110, top: 320, width: 780, padding: '26px 30px', border: `2px solid ${C.green}`, borderRadius: 18, background: `${C.green}0e`, opacity: prog(f, dur * 0.05, dur * 0.05 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.green}}>VirtualMachine · gitops-vms</div>
      <div style={{fontFamily: mono, fontSize: 30, color: C.text, marginTop: 8}}>hammerdb-rhel9</div>
      <div style={{fontSize: 23, color: C.dim, marginTop: 10}}>RHEL 9 · PostgreSQL · HammerDB TPC-C writer</div>
    </div>
    {[
      ['PersistentVolumeClaim', 'hammerdb-rhel9-rootdisk-mgd-grp', 'the root disk', C.blue],
      ['PersistentVolumeClaim', 'hammerdb-rhel9-datadisk-mgd-grp', 'the database disk', C.cyan],
    ].map(([kind, name, role, col], i) => <div key={name} style={{position: 'absolute', left: 950, top: 320 + i * 170, width: 860, padding: '20px 26px', border: `2px solid ${col}`, borderRadius: 16, background: `${col}0e`, opacity: prog(f, dur * (0.16 + i * 0.12), dur * (0.16 + i * 0.12) + 24)}}>
      <div style={{fontFamily: mono, fontSize: 16, color: col as string}}>{kind}</div>
      <div style={{fontFamily: mono, fontSize: 23, color: C.text, marginTop: 6}}>{name}</div>
      <div style={{fontSize: 21, color: C.dim, marginTop: 6}}>{role}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 530, width: 780, fontSize: 25, color: C.text, lineHeight: 1.45, opacity: prog(f, dur * 0.5, dur * 0.5 + 24)}}>
      A claim is a request for storage. Kubernetes binds it to a PersistentVolume, the record that names the real
      disk on the array. That record is what makes a disk findable after a failover.
    </div>
    <div style={{position: 'absolute', left: 950, top: 690, width: 860, fontSize: 24, color: C.amber, lineHeight: 1.4, opacity: prog(f, dur * 0.66, dur * 0.66 + 24)}}>
      Both claims carry the label appname equals hammerdb-rhel9-mgd-grp. The DR record selects exactly those two.
    </div>
  </div>
);

const GroupScene: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 155, fontSize: 30, letterSpacing: 2, color: C.array, fontWeight: 700}}>THE GROUP</div>
    <div style={{position: 'absolute', left: 100, top: 200, fontSize: 42, fontWeight: 800, color: C.text}}>One session, one recovery point.</div>
    {[
      ['VSA-B', 'source array', 'Local role: Source', C.green, 110],
      ['VSA-A', 'peer array', 'Local role: Destination', C.cyan, 1010],
    ].map(([name, sub, role, col, x], i) => <div key={name} style={{position: 'absolute', left: x as number, top: 320, width: 770, padding: '28px 32px', border: `2px solid ${C.array}`, borderRadius: 20, background: `${C.array}0e`, opacity: prog(f, dur * (0.06 + i * 0.1), dur * (0.06 + i * 0.1) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: C.array}}>{name} · {sub}</div>
      <div style={{fontSize: 42, fontWeight: 800, color: col as string, marginTop: 10}}>{role}</div>
      <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>one session for both disks</div>
    </div>)}
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <path d="M890,450 L1010,450" stroke={C.orange} strokeWidth={7} markerEnd="url(#tipGS499)" />
      <defs><marker id="tipGS499" markerWidth={12} markerHeight={12} refX={9} refY={4} orient="auto"><path d="M0,0 L0,8 L11,4 z" fill={C.orange} /></marker></defs>
    </svg>
    <div style={{position: 'absolute', left: 110, top: 610, width: 1700, padding: '20px 26px', border: `2px solid ${C.purple}`, borderRadius: 18, background: `${C.purple}0e`, opacity: prog(f, dur * 0.36, dur * 0.36 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.purple, letterSpacing: 1.4}}>THE TWO CLASSES</div>
      <div style={{fontSize: 26, color: C.text, marginTop: 8}}>powerstore-vgrc-15m names source, peer and schedule. powerstore-vrc-group-15m drives the group state.</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 775, width: 1700, fontSize: 26, color: C.text, lineHeight: 1.45, opacity: prog(f, dur * 0.54, dur * 0.54 + 24)}}>
      The policy advertises powerstore-sc-group as a grouped peer class. A disk cannot be promoted on its own,
      so the database can never wake with one disk from an older moment than the other.
    </div>
  </div>
);

const RecordsScene: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 155, fontSize: 30, letterSpacing: 2, color: C.orange, fontWeight: 700}}>THE RECORDS</div>
    <div style={{position: 'absolute', left: 100, top: 200, fontSize: 42, fontWeight: 800, color: C.text}}>One record on the hub, one per site.</div>
    <div style={{position: 'absolute', left: 110, top: 320, width: 780, padding: '24px 28px', border: `2px solid ${C.orange}`, borderRadius: 16, background: `${C.orange}0e`, opacity: prog(f, dur * 0.05, dur * 0.05 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.orange}}>DRPlacementControl · openshift-gitops</div>
      <div style={{fontFamily: mono, fontSize: 27, color: C.text, marginTop: 8}}>dell-vm-placement-drpc</div>
      <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>selector: appname in (hammerdb-rhel9-mgd-grp)</div>
      <div style={{fontSize: 22, color: C.dim, marginTop: 4}}>no protectedNamespaces</div>
    </div>
    {[
      ['spoke-1', 'Primary', C.spoke1, 320],
      ['spoke-0', 'Secondary', C.spoke0, 500],
    ].map(([site, role, col, y], i) => <div key={site} style={{position: 'absolute', left: 950, top: y as number, width: 860, padding: '20px 26px', border: `2px solid ${col}`, borderRadius: 16, background: `${col}0e`, opacity: prog(f, dur * (0.16 + i * 0.1), dur * (0.16 + i * 0.1) + 24)}}>
      <div style={{fontFamily: mono, fontSize: 16, color: col as string}}>VolumeReplicationGroup · gitops-vms · {site}</div>
      <div style={{fontFamily: mono, fontSize: 24, color: C.text, marginTop: 6}}>dell-vm-placement-drpc</div>
      <div style={{fontSize: 22, color: C.dim, marginTop: 4}}>reports this site as {role}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 640, width: 1700, fontSize: 26, color: C.text, lineHeight: 1.45, opacity: prog(f, dur * 0.44, dur * 0.44 + 24)}}>
      protectedNamespaces belongs to the discovered path, where Ramen also copies Kubernetes objects with Velero.
      A managed application must leave it empty, because Git is the copy.
    </div>
    <div style={{position: 'absolute', left: 110, top: 790, width: 1700, fontSize: 26, color: C.amber, lineHeight: 1.4, opacity: prog(f, dur * 0.62, dur * 0.62 + 24)}}>
      Two records with the same name is not a mistake. The hub record asks for the move; each site record reports its own role.
    </div>
  </div>
);

const Actions: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 155, fontSize: 30, letterSpacing: 2, color: C.red, fontWeight: 700}}>TWO ACTIONS, TWO PROMISES</div>
    <div style={{position: 'absolute', left: 100, top: 200, fontSize: 42, fontWeight: 800, color: C.text}}>Failover stops. Relocate plans.</div>
    {[
      ['Failover', 'crash-consistent', 'Stops at the last completed copy. Writes after it are lost.', C.red, 110],
      ['Relocate', 'planned move', 'Designed to flush first and avoid that loss.', C.green, 1010],
    ].map(([name, tag, text, col, x], i) => <div key={name} style={{position: 'absolute', left: x as number, top: 310, width: 780, padding: '28px 32px', border: `2px solid ${col}`, borderRadius: 20, background: `${col}0e`, opacity: prog(f, dur * (0.06 + i * 0.1), dur * (0.06 + i * 0.1) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: col as string}}>{tag}</div>
      <div style={{fontSize: 46, fontWeight: 800, color: C.text, marginTop: 10}}>{name}</div>
      <div style={{fontSize: 24, color: C.dim, marginTop: 10, lineHeight: 1.35}}>{text}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 610, width: 1700, padding: '22px 28px', border: `2px solid ${C.amber}`, borderRadius: 18, background: `${C.amber}0e`, opacity: prog(f, dur * 0.42, dur * 0.42 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.amber, letterSpacing: 1.4}}>RECOVERY POINT OBJECTIVE</div>
      <div style={{fontSize: 30, color: C.text, marginTop: 8}}>dr-policy-15m asks for 900 seconds. That is the most data the business accepts losing.</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 770, width: 1700, fontSize: 26, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.58, dur * 0.58 + 24)}}>
      It is a limit, not a promise that the copy is fresh. The next chapter checks the copy itself.
    </div>
  </div>
);

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}|csivol-|9,8[0-9]{2},[0-9]{3}|10:[0-9]{2}:[0-9]{2}|11:[0-9]{2}:[0-9]{2}/;

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  const cold = id === '1.9' || id === '8.1' || id === '8.2';
  return <div style={{position: 'absolute', left: cold ? 170 : 940, top: cold ? 265 : 220, width: cold ? 1580 : 900, padding: 32, border: `2px solid ${d.color ?? C.blue}`, borderRadius: 20, background: C.bg, opacity: a, fontFamily: sans, boxShadow: '0 20px 70px #000c'}}>
    <div style={{fontSize: cold ? 44 : 29, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 20}}>{d.title}</div>
    {d.rows.map((r, i) => {
      const aa = prog(f, dur * (0.03 + i * 0.05), dur * (0.03 + i * 0.05) + 22);
      const warn = r.startsWith('DOCUMENTED') || r.startsWith('MECHANISM');
      return <div key={r} style={{marginTop: 15, fontSize: cold ? 30 : 23, lineHeight: 1.35, color: warn ? C.amber : C.text, fontWeight: warn ? 700 : 400, opacity: aa, transform: `translateX(${(1 - aa) * 22}px)`, fontFamily: UUID.test(r) ? mono : sans, overflowWrap: 'anywhere'}}>{r}</div>;
    })}
  </div>;
};
