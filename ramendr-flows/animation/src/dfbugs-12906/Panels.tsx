import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES_DFBUGS = ['The promise', 'One second', 'The branch', 'The delete', 'Two beliefs', 'What it cost'];

const Chip: React.FC<{t: string; c: string; a?: number}> = ({t, c, a = 1}) => (
  <span style={{display: 'inline-block', opacity: a, padding: '3px 12px', borderRadius: 999, border: `1.5px solid ${c}`, background: `${c}1c`, color: c, fontFamily: mono, fontSize: 17, fontWeight: 600, whiteSpace: 'nowrap'}}>{t}</span>
);

const Head: React.FC<{kicker: string; title: string; color: string; f: number; dur: number}> = ({kicker, title, color, f, dur}) => <>
  <div style={{position: 'absolute', left: 110, top: 160, fontSize: 27, letterSpacing: 2, color, fontWeight: 700, opacity: prog(f, -10, 24)}}>{kicker}</div>
  <div style={{position: 'absolute', left: 110, top: 205, fontSize: 44, fontWeight: 800, color: C.text, opacity: prog(f, -10, 26)}}>{title}</div>
</>;

// ---------------------------------------------------------------- cold open

export const ColdOpen: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 185, textAlign: 'center', fontSize: 60, fontWeight: 800, color: C.text, opacity: prog(f, dur * 0.02, dur * 0.02 + 28)}}>
      The cleanup that would not end
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 268, textAlign: 'center', fontSize: 27, color: C.dim, opacity: prog(f, dur * 0.06, dur * 0.06 + 24)}}>
      A failover that worked, and two records left behind on the site it left.
    </div>
    {[
      ['NEW PRIMARY', 'spoke-0', 'the application is running here', C.green, 110],
      ['OLD SITE', 'spoke-1', 'the copies are still needed here', C.spoke1, 1130],
    ].map(([name, site, sub, col, x], i) => <div key={name} style={{position: 'absolute', left: x as number, top: 350, width: 680, padding: '30px 34px', border: `2px solid ${col}`, borderRadius: 22, background: `${col}10`, opacity: prog(f, dur * (0.12 + i * 0.1), dur * (0.12 + i * 0.1) + 28)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: col as string, letterSpacing: 1.5}}>{name}</div>
      <div style={{fontSize: 40, color: C.text, fontWeight: 700, marginTop: 10}}>{site}</div>
      <div style={{fontSize: 23, color: C.dim, marginTop: 10}}>{sub}</div>
    </div>)}
    <div style={{position: 'absolute', left: 810, top: 372, width: 300, padding: '22px 18px', border: `2px solid ${C.green}`, borderRadius: 18, background: C.bg, textAlign: 'center', opacity: prog(f, dur * 0.26, dur * 0.26 + 26)}}>
      <div style={{fontFamily: mono, fontSize: 16, color: C.green}}>postcheck</div>
      <div style={{fontSize: 30, color: C.text, fontWeight: 700, marginTop: 4}}>17/17</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 660, textAlign: 'center', fontSize: 30, color: C.text, opacity: prog(f, dur * 0.46, dur * 0.46 + 26)}}>
      Then the same delete failed twenty-seven times in seventy-two minutes.
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 725, textAlign: 'center', fontSize: 25, color: C.amber, opacity: prog(f, dur * 0.6, dur * 0.6 + 24)}}>
      No data was lost. The recovery site was healthy. Only the old site could never finish.
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 800, textAlign: 'center', fontSize: 23, color: C.faint, opacity: prog(f, dur * 0.72, dur * 0.72 + 24)}}>
      One second of that cleanup made the decision. This video follows it.
    </div>
  </div>
);

// ---------------------------------------------------------------- chapter 1

const TwoSites: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <Head kicker="THE PHYSICAL PICTURE" title="Two sites, two arrays, one guest." color={C.blue} f={f} dur={dur} />
    {([
      ['SPOKE-1 · ocp-edge97', 'OLD SITE', 'VSA-B', 'was running the guest', C.spoke1, 110],
      ['SPOKE-0 · ocp-edge95', 'NEW PRIMARY', 'VSA-A', 'runs the guest now', C.spoke0, 1000],
    ] as [string, string, string, string, string, number][]).map(([site, role, arr, tag, col, x], i) => <div key={site} style={{position: 'absolute', left: x, top: 320, width: 800, padding: '28px 32px', border: `2px solid ${col}`, borderRadius: 20, background: `${col}10`, opacity: prog(f, dur * (0.05 + i * 0.1), dur * (0.05 + i * 0.1) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 19, color: col, letterSpacing: 1}}>{site}</div>
      <div style={{fontSize: 46, fontWeight: 800, color: C.text, marginTop: 8}}>{role}</div>
      <div style={{fontSize: 24, color: C.dim, marginTop: 10}}>{arr} · {tag}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 600, width: 1690, padding: '20px 26px', border: `2px solid ${C.orange}`, borderRadius: 18, background: `${C.orange}0e`, opacity: prog(f, dur * 0.4, dur * 0.4 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.orange, letterSpacing: 1.4}}>THE HUB · ocp-edge36</div>
      <div style={{fontSize: 27, color: C.text, marginTop: 6}}>One record here says which site should run the application, and one says how fresh the copy must be.</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 760, width: 1690, fontSize: 27, color: C.text, lineHeight: 1.45, opacity: prog(f, dur * 0.56, dur * 0.56 + 24)}}>
      Each site has its own storage array. The array holds the real disks and the copy between them.
    </div>
    <div style={{position: 'absolute', left: 110, top: 855, width: 1690, fontSize: 26, color: C.amber, lineHeight: 1.45, opacity: prog(f, dur * 0.7, dur * 0.7 + 24)}}>
      Kubernetes does not copy anything. It records what should happen and asks the array to do it.
    </div>
  </div>
);

const TheDisks: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <Head kicker="THE WORKLOAD" title="One guest, two disks, one writing database." color={C.green} f={f} dur={dur} />
    <div style={{position: 'absolute', left: 110, top: 320, width: 760, padding: '26px 30px', border: `2px solid ${C.green}`, borderRadius: 18, background: `${C.green}0e`, opacity: prog(f, dur * 0.05, dur * 0.05 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.green}}>VirtualMachine · hammerdb</div>
      <div style={{fontFamily: mono, fontSize: 30, color: C.text, marginTop: 8}}>hammerdb-rhel9</div>
      <div style={{fontSize: 23, color: C.dim, marginTop: 10}}>RHEL 9 · PostgreSQL · HammerDB writer</div>
    </div>
    {[
      ['hammerdb-rhel9-rootdisk-grp', 'the root disk claim', 'csivol-31136f5c90', C.blue],
      ['hammerdb-rhel9-datadisk-grp', 'the database disk claim', 'csivol-2a761d921f', C.cyan],
    ].map(([claim, role, pv, col], i) => <div key={claim} style={{position: 'absolute', left: 110, top: 560 + i * 200, width: 760, padding: '20px 26px', border: `2px solid ${col}`, borderRadius: 16, background: `${col}0e`, opacity: prog(f, dur * (0.2 + i * 0.14), dur * (0.2 + i * 0.14) + 24)}}>
      <div style={{fontFamily: mono, fontSize: 15, color: col as string}}>PersistentVolumeClaim</div>
      <div style={{fontFamily: mono, fontSize: 23, color: C.text, marginTop: 6}}>{claim}</div>
      <div style={{fontSize: 21, color: C.dim, marginTop: 6}}>{role}</div>
      <div style={{marginTop: 14}}><Chip t={`record ${pv}`} c={C.green} /></div>
    </div>)}
    <div style={{position: 'absolute', left: 940, top: 340, width: 860, fontSize: 27, color: C.text, lineHeight: 1.5, opacity: prog(f, dur * 0.3, dur * 0.3 + 24)}}>
      A claim is a request for storage. Kubernetes answers it with a volume record: the PersistentVolume.
    </div>
    <div style={{position: 'absolute', left: 940, top: 545, width: 860, fontSize: 26, color: C.dim, lineHeight: 1.5, opacity: prog(f, dur * 0.46, dur * 0.46 + 24)}}>
      That record carries the real disk identifier, called the volume handle, and it carries a delete policy.
    </div>
    <div style={{position: 'absolute', left: 940, top: 745, width: 860, fontSize: 26, color: C.amber, lineHeight: 1.5, opacity: prog(f, dur * 0.62, dur * 0.62 + 24)}}>
      Two claims, two records, one application. That is the unit that has to move together.
    </div>
  </div>
);

const ReclaimPolicy: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <Head kicker="THE DELETE POLICY" title="Retain keeps it. Delete removes it." color={C.amber} f={f} dur={dur} />
    {[
      ['Retain', 'Keep the record, keep the disk.', 'Kubernetes never asks the storage to delete the volume.', C.green, 110],
      ['Delete', 'Release the record, then remove the disk.', 'Kubernetes asks the storage to delete the volume.', C.red, 1010],
    ].map(([name, line, effect, col, x], i) => <div key={name} style={{position: 'absolute', left: x as number, top: 320, width: 800, padding: '30px 34px', border: `2px solid ${col}`, borderRadius: 20, background: `${col}0e`, opacity: prog(f, dur * (0.06 + i * 0.12), dur * (0.06 + i * 0.12) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: col as string}}>persistentVolumeReclaimPolicy</div>
      <div style={{fontSize: 50, fontWeight: 800, color: C.text, marginTop: 10}}>{name}</div>
      <div style={{fontSize: 25, color: C.dim, marginTop: 12}}>{line}</div>
      <div style={{fontSize: 24, color: col as string, marginTop: 14, lineHeight: 1.4}}>{effect}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 690, width: 1690, padding: '22px 28px', border: `2px solid ${C.blue}`, borderRadius: 18, background: `${C.blue}0e`, opacity: prog(f, dur * 0.44, dur * 0.44 + 24)}}>
      <div style={{fontSize: 28, color: C.text}}>The policy lives on the volume record, on one cluster. It is a local switch, and it decides whether a delete call ever leaves that cluster.</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 820, width: 1690, fontSize: 26, color: C.amber, lineHeight: 1.45, opacity: prog(f, dur * 0.62, dur * 0.62 + 24)}}>
      So the policy is not paperwork. It is the only thing standing between a cleanup and a request to destroy a disk.
    </div>
  </div>
);

const TheMark: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <Head kicker="THE MARK" title="An annotation says Ramen is holding this one." color={C.purple} f={f} dur={dur} />
    <div style={{position: 'absolute', left: 110, top: 320, width: 1690, padding: '24px 30px', border: `2px solid ${C.purple}`, borderRadius: 18, background: `${C.purple}0e`, opacity: prog(f, dur * 0.05, dur * 0.05 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 20, color: C.purple}}>volumereplicationgroups.ramendr.openshift.io/vr-retained</div>
      <div style={{fontFamily: mono, fontSize: 24, color: C.text, marginTop: 8}}>value: retained</div>
    </div>
    {[
      ['Who adds it', 'Ramen, on a volume record it created with Delete and then switched to Retain.', C.green],
      ['Who reads it', 'Ramen, when the claim is being deleted. It decides whether to keep Retain or put Delete back.', C.blue],
      ['Who is skipped', 'A record that was already Retain before Ramen looked at it. Ramen returns early and never marks it.', C.amber],
    ].map(([k, v, col], i) => <div key={k} style={{position: 'absolute', left: 110, top: 500 + i * 140, width: 1690, padding: '18px 26px', border: `1.5px solid ${C.border}`, borderLeft: `6px solid ${col}`, borderRadius: 12, background: C.panel, opacity: prog(f, dur * (0.2 + i * 0.14), dur * (0.2 + i * 0.14) + 24)}}>
      <div style={{fontFamily: mono, fontSize: 16, color: col as string, letterSpacing: 1.2}}>{k.toUpperCase()}</div>
      <div style={{fontSize: 26, color: C.text, marginTop: 6}}>{v}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 930, width: 1690, fontSize: 25, color: C.dim, lineHeight: 1.45, opacity: prog(f, dur * 0.68, dur * 0.68 + 24)}}>
      The mark and the policy travel together. Lose the mark and the next pass treats the record as ordinary storage.
    </div>
  </div>
);

const TheSession: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <Head kicker="THE ARRAY SIDE" title="One group, one session, one schedule." color={C.array} f={f} dur={dur} />
    {[
      ['VSA-B', 'old array', 'Source', C.green, 110],
      ['VSA-A', 'new array', 'Destination', C.cyan, 1010],
    ].map(([name, sub, role, col, x], i) => <div key={name} style={{position: 'absolute', left: x as number, top: 320, width: 800, padding: '28px 32px', border: `2px solid ${C.array}`, borderRadius: 20, background: `${C.array}0e`, opacity: prog(f, dur * (0.06 + i * 0.1), dur * (0.06 + i * 0.1) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: C.array}}>{name} · {sub}</div>
      <div style={{fontSize: 46, fontWeight: 800, color: col as string, marginTop: 10}}>{role}</div>
      <div style={{fontSize: 23, color: C.dim, marginTop: 8}}>before the failover</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 600, width: 1690, padding: '20px 26px', border: `2px solid ${C.orange}`, borderRadius: 18, background: `${C.orange}0e`, opacity: prog(f, dur * 0.4, dur * 0.4 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.orange, letterSpacing: 1.4}}>POWERSTORE REPLICATION SESSION</div>
      <div style={{fontSize: 27, color: C.text, marginTop: 6}}>The Source array reads. The Destination array follows. The session has its own role and its own state.</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 760, width: 1690, fontSize: 27, color: C.text, lineHeight: 1.45, opacity: prog(f, dur * 0.56, dur * 0.56 + 24)}}>
      The two disks are one member of one group. The session belongs to the group, not to either disk.
    </div>
    <div style={{position: 'absolute', left: 110, top: 855, width: 1690, fontSize: 26, color: C.amber, lineHeight: 1.45, opacity: prog(f, dur * 0.7, dur * 0.7 + 24)}}>
      After a failover the roles swap. The old array becomes the Destination. Its disks are still needed.
    </div>
  </div>
);

const SoFar1: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <Head kicker="SO FAR" title="Five objects, two sides, one promise." color={C.blue} f={f} dur={dur} />
    {[
      ['The claim', 'asks for storage'],
      ['The volume record', 'names the real disk and carries the delete policy'],
      ['The mark', 'says Ramen is holding this record on purpose'],
      ['The group request', 'drives one array session for both disks'],
      ['The array session', 'knows which side is source and which side follows'],
    ].map(([k, v], i) => <div key={k} style={{position: 'absolute', left: 110, top: 330 + i * 125, width: 1690, padding: '18px 26px', border: `1.5px solid ${C.border}`, borderLeft: `6px solid ${C.blue}`, borderRadius: 12, background: C.panel, opacity: prog(f, dur * (0.06 + i * 0.12), dur * (0.06 + i * 0.12) + 24)}}>
      <div style={{fontSize: 30, color: C.text, fontWeight: 700}}>{k}</div>
      <div style={{fontSize: 24, color: C.dim, marginTop: 4}}>{v}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 990, width: 1690, fontSize: 26, color: C.amber, lineHeight: 1.45, opacity: prog(f, dur * 0.72, dur * 0.72 + 24)}}>
      The promise is simple: while the copy is still needed, the record must keep Retain and keep the mark.
    </div>
  </div>
);

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.1') return <TwoSites f={f} dur={dur} />;
  if (id === '1.2') return <TheDisks f={f} dur={dur} />;
  if (id === '1.5') return <ReclaimPolicy f={f} dur={dur} />;
  if (id === '1.6') return <TheMark f={f} dur={dur} />;
  if (id === '1.9') return <TheSession f={f} dur={dur} />;
  if (id === '1.10') return <SoFar1 f={f} dur={dur} />;
  if (!card || !def) return null;
  const long = card.name.length > 35;
  return <div style={{position: 'absolute', inset: 0, opacity: prog(f, -20, 24)}}>
    <div style={{position: 'absolute', left: 100, top: 170, color: C.purple, fontFamily: mono, fontSize: 21}}>THE PIECES · {id.split('.')[1]}</div>
    <Card x={100} y={300} w={730} kind={card.kind} name={card.name} role={card.role} nameSize={long ? 14 : 26} appear={prog(f, -10, 24)} color={C.cyan} />
    <GlossaryPanel d={def} p={prog(f, dur * 0.03, dur * 0.75)} x={870} y={220} w={970} />
  </div>;
};

// ---------------------------------------------------------------- text panels

type Panel = {title: string; rows: string[]; color?: string; notes?: string[]};

export const PANEL_DATA: Record<string, Panel> = {
  '0.1': {title: 'A cleanup that would not end', rows: ['DFBUGS-12906 · open Major', 'Recorded failover, 2026-11-22', 'spoke-1 to spoke-0, both sites up'], color: C.cyan},
  '0.2': {title: 'What the record shows', rows: ['The application came back. The copy was healthy.', '175 seconds of writes outside the recovery point', 'Two old-site records kept failing the same delete'], color: C.green},
  '0.3': {title: 'Observed, inferred, unproven', rows: ['Observed: the failover, the timestamps, the log lines, the array state.', 'Inferred: which code path the running build executed.', 'The running build carries no source revision label.'], color: C.amber},
  '2.1': {title: 'After the failover, the old site has a new job', rows: ['It is the Destination of the reversed session.', 'Its disks hold the standby copy.', 'Its application is supposed to disappear.'], color: C.blue},
  '2.2': {title: 'The promise the operator made', rows: ['Keep the old-site volume records.', 'Keep their policy at Retain.', 'Then nothing asks the array to remove a disk.'], color: C.green},
  '3.1': {title: 'The documented source cleanup', rows: ['Delete the guest.', 'Delete its DataVolumes.', 'Delete any remaining claims.', 'Ramen then releases its own protection of those claims.'], color: C.dim},
  '3.3': {title: 'The peer is declared ready', rows: ['The hub sets PeerReady true at 07:35:04, reason Success.', 'About twelve minutes after FailedOver at 07:22:37', 'The cleanup is recorded as complete.'], color: C.green},
  '3.4': {title: '07:35:04.207 · the group request is deleted', rows: ['The VRG removes its own VolumeGroupReplication object.', 'The claims are still there, waiting to be released.', 'The array session does not depend on that object.'], color: C.amber},
  '3.7': {title: 'Released, Delete, and the finalizer stays', rows: ['Both records moved to Released.', 'Their policy is now Delete, and the mark is gone.', 'The external-provisioner finalizer still holds them.'], color: C.amber},
  '4.1': {title: 'One condition, two outcomes', rows: ["Ramen's claim-preparation step asks one question.", 'Is this work order async, or is this site already Primary?', 'If yes, undo the retention. If no, keep Retain and mark the record as left behind.'], color: C.red},
  '4.2': {title: 'What the undo branch does', rows: ['Set persistentVolumeReclaimPolicy to Delete.', 'Remove the vr-retained annotation.', 'It only acts when the annotation is there.'], color: C.red},
  '4.3': {title: 'The Sync branch does the opposite', rows: ['It keeps Retain on purpose.', 'It labels the record ramendr.openshift.io/pv-left-behind-by-ramen.', 'Its own comment says a delete call must not be issued,', 'because both sites map to the same volume.'], color: C.green},
  '4.4': {title: 'Why the safe branch never runs here', rows: ['The test is: async is set, OR the site is Primary.', 'For an async pair the first half is always true.', 'So a secondary takes the Primary path.', 'The Retain branch only runs for synchronous replication.'], color: C.red},
  '4.5': {title: 'The group path uses the same step', rows: ['The group request is deleted first.', 'Then the same claim-preparation step runs for every claim.', 'So the decision does not depend on grouping.', 'Grouping only decides which storage call fails later.'], color: C.amber},
  '4.6': {title: 'So far', rows: ['The engine that keeps the copy alive is the same one that moves the policy.', 'An async secondary takes the Primary branch.', 'Nothing in that branch asks whether the array still needs the volume.'], color: C.amber},
  '5.1': {title: 'Released plus Delete means: delete it', rows: ['The claim is gone, so the record is unused.', 'The policy says Delete.', 'The external-provisioner asks the storage driver to remove the disk.'], color: C.red},
  '5.2': {title: 'The provisioner asks the driver to delete', rows: ['The external-provisioner calls the CSI driver delete call.', 'Driver: csi-powerstore.dellemc.com.', 'The request names the volume handle from the record.'], color: C.red},
  '5.4': {title: 'The driver knows the rule on another path', rows: ['A different call refuses when the disk is in a group', 'or carries a protection policy.', 'Its comment says the source side owns that operation.', 'The Kubernetes delete path carries no such check.'], color: C.amber},
  '5.5': {title: 'Twenty-seven attempts, no end', rows: ['The record stays Released with its finalizer.', 'Kubernetes retries the same call.', 'Nothing in the record stops it.'], color: C.red},
  '5.6': {title: 'So far', rows: ['A local policy switch became a storage delete call.', 'The array refused, so the call repeats.', 'No retry can ever succeed while the session is reversed.'], color: C.red},
  '6.2': {title: 'Two conditions disagree', rows: ['DataProtected=True, message: no claims need protection.', 'DestinationInfoAvailable=False, reason Progressing.', 'Different subjects, recorded by the same object at the same moment.'], color: C.amber},
  '6.4': {title: 'Same name, different policy', rows: ['spoke-0: Bound · Retain · vr-retained present', 'spoke-1: Released · Delete · mark removed', 'Both sites use the same two object names, over different backing volumes.'], color: C.amber},
  '6.6': {title: 'So far', rows: ['Kubernetes removed its own record of the relationship.', 'The array kept the relationship.', 'The volume record now follows the side that forgot.'], color: C.amber},
  '7.1': {title: 'What the record shows', rows: ['No array copy was destroyed.', 'Both array copies stayed intact.', 'The recovery site served the whole time.', 'The only damage was on the site left behind.'], color: C.green},
  '7.2': {title: 'What it cost', rows: ['The old site cannot be torn down cleanly.', 'Released records keep retrying a delete that cannot work.', 'Whatever needs those disks next inherits the loop.'], color: C.amber},
  '7.3': {title: 'The name is already taken', rows: ['Ramen restores target records under the source record names.', 'So the new site already holds both of those names.', 'A move back has to recreate them while the old ones still exist.', 'INFERENCE: the ticket reports this blocked a later reverse failover. The archived dumps do not cover it.'], color: C.amber},
  '7.4': {title: 'The per-volume case is untested', rows: ['A grouped disk fails inside the group removal.', 'A disk with no group skips that step entirely.', 'Whether the array refuses a direct delete was never tested here.'], color: C.amber},
  '7.5': {title: 'What a fix has to do', rows: ['Keep Retain while the volume is still a replication destination.', 'Return to Delete only after the relationship has ended.', 'So a deliberate teardown can still reclaim the old copies.'], color: C.green},
  '7.6': {title: 'What stays open', rows: ['The code path matches upstream main.', 'INFERENCE: the run build is a private image with no source revision label, so the deployed attribution is not proven.', 'No fix is merged, and the async half of the condition is unchanged.'], color: C.amber},
};

type Ev = {title: string; kicker: string; lines: string[]; gloss: string; color: string};
export const EVIDENCE: Record<string, Ev> = {
  '3.5': {
    title: 'The reconcile that undid the promise',
    kicker: 'RAMEN OPERATOR LOG · spoke-1 · excerpt',
    color: C.red,
    lines: [
      '07:35:04.207  vrg_volgrouprep.go:1073',
      '  Deleted VolumeGroupReplication resource',
      '  hammerdb/vgr-4251c970ec7af885d6ec79c1d2c40661-hammerdb-drpc',
      '',
      '07:35:05.291  vrg_volgrouprep.go:700',
      '  Unprotecting PVCs as VGR is missing',
      '',
      '07:35:05.310  vrg_volrep.go:636',
      '  Deleted ramen annotations from PersistentVolume',
      '  { "State": "secondary", "pv": "csivol-31136f5c90" }',
    ],
    gloss: 'The object it deleted one second earlier is the reason it gives for unprotecting. The state it reports is secondary.',
  },
  '3.6': {
    title: 'Who changed the policy',
    kicker: 'PV MANAGEDFIELDS · csivol-31136f5c90 · spoke-1 · excerpt',
    color: C.amber,
    lines: [
      'manager                    Update  07:35:05Z',
      '  f:persistentVolumeReclaimPolicy',
      '',
      'csi-provisioner            Update  07:35:05Z',
      '  other spec fields',
      '',
      'kube-controller-manager    Update  07:35:05Z',
      '  f:status.phase',
    ],
    gloss: 'Three controllers wrote to the same record in the same second. Only the one whose manager field reads "manager" touched the delete policy. The root-cause write-up identifies that binary as the Ramen operator.',
  },
  '5.3': {
    title: 'The array refuses, in its own words',
    kicker: 'KUBERNETES EVENT · persistentvolume/csivol-2a761d921f · verbatim',
    color: C.red,
    lines: [
      'Warning  VolumeFailedDelete  count 27',
      '',
      'failed to remove volume',
      '8d0cc7a5-b131-4559-b36e-002a9ef4337d',
      'from volume group: HTTP 422:',
      'Volumes cannot be removed from the',
      'replication destination volume group',
      'vg-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d-VSA-A-Fifteen_Minutes',
    ],
    gloss: 'The driver tried to take the disk out of the group. The array refused because that group is still the destination of a live session.',
  },
  '6.1': {
    title: 'The site that says its job is done',
    kicker: 'VRG STATUS · hammerdb-drpc · spoke-1 · verbatim',
    color: C.amber,
    lines: [
      'state: Secondary   VolRep PVCs: 0',
      '',
      'DataReady      True  Unused  07:35:06Z',
      '  "PVC protection as secondary is complete,',
      '   or no PVCs needed protection"',
      '',
      'DataProtected  True  Unused  07:35:04Z',
      '',
      'DestinationInfoAvailable  False  Progressing',
      '  "Destination info is not yet available',
      '   for one or more VolumeReplication resources"',
    ],
    gloss: 'The claims are gone, so the controller has nothing left to protect. The destination information it still needs is missing.',
  },
};

export const PANEL_BEATS = new Set([...Object.keys(PANEL_DATA), ...Object.keys(EVIDENCE)]);

const Row: React.FC<{text: string; i: number; f: number; dur: number; cold: boolean}> = ({text, i, f, dur, cold}) => {
  const a = prog(f, dur * (0.03 + i * 0.05), dur * (0.03 + i * 0.05) + 22);
  const inf = text.startsWith('INFERENCE');
  return <div style={{marginTop: cold ? 14 : 16, fontSize: cold ? 30 : 23, lineHeight: 1.35, color: inf ? C.amber : C.text, fontWeight: inf ? 700 : 400, opacity: a, transform: `translateX(${(1 - a) * 22}px)`, fontFamily: sans, overflowWrap: 'anywhere'}}>{text}</div>;
};

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  const cold = id === '0.1' || id === '0.2' || id === '0.3';
  return <div style={{position: 'absolute', left: cold ? 170 : 920, top: cold ? 380 : 220, width: cold ? 1580 : 920, padding: 32, border: `2px solid ${d.color ?? C.blue}`, borderRadius: 20, background: C.bg, opacity: a, fontFamily: sans, boxShadow: '0 20px 70px #000c'}}>
    <div style={{fontSize: cold ? 44 : 29, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 20, lineHeight: 1.25}}>{d.title}</div>
    {d.rows.map((r, i) => <Row key={r} text={r} i={i} f={f} dur={dur} cold={cold} />)}
  </div>;
};

export const EvidencePanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = EVIDENCE[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  return <div style={{position: 'absolute', left: 920, top: 205, width: 920, padding: '26px 30px', border: `2px solid ${d.color}`, borderRadius: 20, background: C.bg, opacity: a, fontFamily: sans, boxShadow: '0 20px 70px #000c'}}>
    <div style={{fontFamily: mono, fontSize: 15, letterSpacing: 1.3, color: d.color}}>{d.kicker}</div>
    <div style={{fontSize: 27, fontWeight: 700, color: C.text, marginTop: 8, marginBottom: 16, lineHeight: 1.25}}>{d.title}</div>
    {d.lines.map((l, i) => <div key={`${i}-${l}`} style={{fontFamily: mono, fontSize: 17, lineHeight: 1.45, color: l.startsWith('07:35') ? d.color : C.text, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', opacity: prog(f, dur * (0.02 + i * 0.035), dur * (0.02 + i * 0.035) + 18)}}>{l || '\u00a0'}</div>)}
    <div style={{marginTop: 18, paddingTop: 14, borderTop: `1.5px solid ${C.border}`, fontSize: 21, color: C.dim, lineHeight: 1.4}}>{d.gloss}</div>
  </div>;
};
