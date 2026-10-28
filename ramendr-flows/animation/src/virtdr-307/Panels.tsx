import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string; mono?: boolean}> = {
  '0.1': {title: '21:51 UTC · the console and the target disagree', rows: ['Console title: Failover complete', 'Console steps: 2 of 4', 'DRPC progression: WaitForReadiness', 'Target virtual machines: 0', 'Target claims: 6 Lost, 2 Pending'], color: C.red},
  '0.3': {title: 'What this recording is', rows: ['Environment: ODF 4.22.4-rhodf, AWS, ocp-primary to ocp-secondary', 'Result: FailedOver / WaitForReadiness, 0 virtual machines on the target', 'Storage copy: healthy', 'Failure: restored records and claim binding', 'Inference is labelled. The deployed build is unverified.'], color: C.amber},
  '0.2': {title: "The hub object's own record", rows: ['phase: FailedOver', 'progression: WaitForReadiness', 'Available: False · waiting for App resources to be restored', 'PeerReady: False · NotStarted', 'actionStartTime: 2026-09-26T20:10:43Z'], color: C.amber, mono: true},
  '2.3': {title: 'Four virtual machines on the primary', rows: ['rhel9-node-001 · Running', 'rhel9-node-pvc-001 · Running', 'windows2k22-server-001 · Running', 'windows2k25-server-001 · Running', 'ocp-secondary: no virtual machines'], color: C.green, mono: true},
  '2.4': {title: 'Eight claims, one consistency group', rows: ['rhel9-node-001', 'rhel9-node-001-data', 'rhel9-node-pvc-001', 'rhel9-node-pvc-001-data', 'windows2k22-server-001', 'windows2k22-server-001-data', 'windows2k25-server-001', 'windows2k25-server-001-data', 'label: ramendr.openshift.io/consistency-group'], color: C.cyan, mono: true},
  '2.7': {title: 'Protection before the click', rows: ['DRPC Protected: True', 'VRG ClusterDataProtected: True · Uploaded', 'lastGroupSyncTime: 2026-09-26T20:08:00Z', 'lastGroupSyncBytes: 161038336', 'lastKubeObjectProtectionTime: 2026-09-26T20:11:00Z'], color: C.green, mono: true},
  '2.8': {title: 'So far', rows: ['4 virtual machines on ocp-primary', '8 claims in one consistency group', 'VGR + VGRC + one group VolumeReplication', 'Protected=True, last group sync 20:08', 'next: one field on the hub']},
  '2.5': {title: 'Peer class is a result, not an input', rows: ['DRPolicy: 2m-vm · schedulingInterval 2m', 'selector: replication.storage.openshift.io/flatten-mode=force', 'storageClassName: ocs-storagecluster-ceph-rbd-virtualization', 'grouping: true', 'groupreplicationID: b7e3115af7a9714fe9c0857d760dc769', 'replicationID: f5bdeb1430a1b303139c53a7fc4429d8'], color: C.orange, mono: true},
  '2.6': {title: 'The three group objects', rows: ['VolumeGroupReplication', 'vgr-b7e3115af7a9714fe9c0857d760dc769-gitops-vm-protection', 'VolumeGroupReplicationContent', 'vgrcontent-93d5f65a-e0ed-4b6b-8509-070f0e5f2802', 'VolumeReplication', 'vr-93d5f65a-e0ed-4b6b-8509-070f0e5f2802'], color: C.amber, mono: true},
  '3.5': {title: 'Three gates, all at the current generation', rows: ['DataReady = True', 'ClusterDataReady = True', 'status.state = Primary', 'observedGeneration = metadata.generation'], color: C.blue, mono: true},
  '3.7': {title: 'So far', rows: ['one click at 20:10:43 UTC', 'target VRG set to Primary by ManifestWork', 'three gates: DataReady, ClusterDataReady, state Primary', 'the hub waits']},
  '4.8': {title: 'So far', rows: ['PVs and PVCs restored from S3', 'the handle kept the primary image', 'that is not why the claims are Lost', 'binding is the next layer']},
  '5.7': {title: 'So far', rows: ['8 claims in the list, 1 counted as restored', '6 Lost, 2 Pending', '2 PVs missing from the archive', 'the count never reaches eight']},
  '6.9': {title: 'So far', rows: ['6 Lost = ownership mismatch', '2 Pending = missing volumes', 'the wrong handle = attach-time problem', 'the replicated data is not the failure']},
  '7.8': {title: 'So far', rows: ['ClusterDataReady False', 'DataReady False', 'state Unknown', 'DRPC waits in WaitForReadiness']},
  '4.2': {title: 'Restore order in clusterDataRestore', rows: ['1. restorePVsAndPVCsForVolSync', '2. restorePVsAndPVCsForVolRep', '3. restoreVGRsAndVGRCsForVolRep', '4. setVRGClusterDataReadyCondition', 'A failure in step 2 returns before step 3.'], color: C.purple, mono: true},
  '4.5': {title: 'Primary PV annotations', rows: ['volumereplicationgroups.ramendr.openshift.io/vr-archived: archiveV1-0', 'volumereplicationgroups.ramendr.openshift.io/vr-retained: retained', 'ramendr.openshift.io/destination-volume-handle: absent'], color: C.amber, mono: true},
  '4.6': {title: 'Same handle on both sides', rows: ['PV: pvc-47291817-f92a-40a0-bf59-123465a72aae', 'primary volumeHandle:', '0001-0011-openshift-storage-0000000000000002-e6d8e968-523d-4ab4-8d4d-287e4ded75b1', 'target volumeHandle: same', 'claimRef UID: primary 715ebbf8-9d51-4d1c-bce1-bdf0f2876b00', 'claimRef UID: target none'], color: C.red, mono: true},
  '4.7': {title: 'Why the annotation can be absent', rows: ['VGR condition DestinationInfoAvailable must be True', "it comes from the driver's GetReplicationDestinationInfo", 'if the driver does not advertise it, the annotation is never written', 'Ramen then writes the archived handle unchanged'], color: C.purple},
  '5.3': {title: 'Validation and skip', rows: ['PVC exists and is not bound (phase: Pending)', 'Object exists. Ignoring and moving to next object', 'the object is not counted as restored'], color: C.amber, mono: true},
  '5.4': {title: 'Three different counts', rows: ['restore log: Total/Restored 8/1', 'restore log: Mismatch in PV/PVC count 6/1', 'DRPC status: Total/Restored 8/0', 'the outcome does not change'], color: C.red, mono: true},
  '5.5': {title: 'Claim state on the target', rows: ['rhel9-node-001 · Lost', 'rhel9-node-001-data · Pending', 'rhel9-node-pvc-001 · Lost', 'rhel9-node-pvc-001-data · Lost', 'windows2k22-server-001 · Lost', 'windows2k22-server-001-data · Pending', 'windows2k25-server-001 · Lost', 'windows2k25-server-001-data · Lost'], color: C.red, mono: true},
  '5.6': {title: 'The two volumes that are absent', rows: ['pvc-49334288-9ea3-4a69-b022-7bd1c2d31f0c', 'for rhel9-node-001-data', 'pvc-e19629b1-571c-4f2f-a485-a64e5abdc6b2', 'for windows2k22-server-001-data', 'eight claims, six volumes'], color: C.red, mono: true},
  '6.2': {title: 'Ramen prunes pv.kubernetes.io annotations', rows: ['pv.kubernetes.io/bind-completed is removed', 'the restored claim enters syncUnboundClaim', 'binding is Kubernetes work, not CSI work'], color: C.blue},
  '6.3': {title: 'The unbound path', rows: ['claim.spec.volumeName names the PV', 'PV claimRef name and namespace match', 'PV claimRef UID is empty, which acts as a wildcard', 'bind completes'], color: C.green},
  '6.4': {title: 'Six claims took the bound path', rows: ['syncBoundClaim expects pv.kubernetes.io/bind-completed', 'Ramen removes that annotation on restore', 'something re-added it earlier', 'UNVERIFIED: who and when'], color: C.amber},
  '6.5': {title: 'ClaimMisbound arithmetic', rows: ['PV claimRef UID: empty', 'PVC UID: a6617c4c-3bed-46dd-b960-0ddf97f1ca60', 'empty is not equal to the real UID', 'result: Lost + ClaimMisbound'], color: C.red, mono: true},
  '6.7': {title: 'Pending is the missing-volume branch', rows: ['claim.spec.volumeName names the PV', 'the PV does not exist', 'result: Pending, retry later', 'no retry can create it'], color: C.amber},
  '7.2': {title: 'ClusterDataReady', rows: ['status: False', 'reason: Error', 'message: Failed to restore PVs/PVCs', 'detail: Total/Restored 8/1'], color: C.red, mono: true},
  '7.3': {title: 'One aggregate, one state', rows: ['per-PVC DataReady becomes aggregate DataReady', 'DataReady False sets status.state Unknown', 'Unknown is a symptom, not a finding'], color: C.amber},
  '7.4': {title: 'The hub gate', rows: ['DataReady True: no', 'ClusterDataReady True: no', 'state Primary: no', 'progression: WaitForReadiness'], color: C.red, mono: true},
  '7.6': {title: 'Three console defects, none the cause', rows: ['VIRTDR-316: title says complete before cleanup ends', 'last-synced is a driver report, not a measurement', 'the popover is a renderer, not a measurement'], color: C.amber},
  '8.2': {title: 'The archive count', rows: ['PVCs in S3: 8', 'PVs in S3: 6', 'missing: pvc-49334288-9ea3-4a69-b022-7bd1c2d31f0c', 'missing: pvc-e19629b1-571c-4f2f-a485-a64e5abdc6b2', 'six is not eight, so the restore never converges'], color: C.red, mono: true},
  '8.3': {title: 'The 4.22 VGRC path', rows: ['cleanupVGRCForRestore does not rewrite the group handle', 'the restored VGRC keeps the source group ID', 'csi-addons calls ModifyVolumeGroupMembership', 'with the source volume handles', 'source-proven for release-4.22 at the ref read'], color: C.orange},
  '8.4': {title: 'What upstream main adds', rows: ['ramendr.openshift.io/destination-volume-group-handle', 'updateVGRCVolumeHandlesForRestore', 'updateVGRCClusterIDForRestore', 'absent from 4.22 at the ref read'], color: C.green, mono: true},
  '8.6': {title: 'Checklist before trusting a group failover', rows: ['every protected claim has a PV in S3', 'every PV has a destination handle', 'the VGRC is rewritten with the target group handle', 'every claim binds on the target', 'ClusterDataReady is True at the current generation'], color: C.green},
  '8.7': {title: 'The chain in order', rows: ['hub sets the target VRG to Primary', 'target restores PVs, then PVCs', 'two PVs are missing, the rest keep the primary handle', 'claims fail to bind', 'ClusterDataReady stays False', 'DRPC waits in WaitForReadiness']},
  '8.8': {title: 'Proves and does not prove', rows: ['PROVES: group failover can report Protected true and restore nothing usable', 'DOES NOT PROVE: the missing PVs are the only cause', 'DOES NOT PROVE: the build is the 4.22 ref we read', 'DOES NOT PROVE: the fix works'], color: C.amber},
};
export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = PANEL_DATA[id]; if (!d) return null;
  const a = prog(f, 0, 24); const cold = id === '0.1' || id === '0.3';
  return <div style={{position: 'absolute', left: cold ? 170 : 900, top: cold ? 290 : 220, width: cold ? 1580 : 950, padding: 32, border: `2px solid ${d.color ?? C.blue}`, borderRadius: 20, background: `${C.bg}f5`, opacity: a, fontFamily: sans, boxShadow: '0 20px 70px #000c'}}>
    <div style={{fontSize: cold ? 48 : 29, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 24}}>{d.title}</div>
    {d.rows.map((r, i) => <div key={r} style={{marginTop: 18, fontSize: cold ? 34 : d.mono ? 22 : 25, lineHeight: 1.35, color: C.text, opacity: prog(f, dur * (.03 + i * .055), dur * (.03 + i * .055) + 22), transform: `translateX(${(1 - prog(f, dur * (.03 + i * .055), dur * (.03 + i * .055) + 22)) * 22}px)`, fontFamily: d.mono || /^[a-f0-9]{8}-/.test(r) ? mono : sans, overflowWrap: 'break-word'}}>{r}</div>)}
  </div>;
};

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.12') return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 160, fontSize: 40, color: C.text, fontWeight: 700}}>Five jobs, one restore chain</div>
    {[['Ramen', 'Decides and records the recovery'], ['csi-addons', 'Translates objects into CSI calls'], ['CSI driver', 'Moves and promotes the storage'], ['PV controller', 'Binds claims to volumes by UID'], ['Kubernetes', 'Starts the workload only after all agree']].map(([name, role], i) => <div key={name} style={{position: 'absolute', left: 110 + (i % 3) * 585, top: 290 + Math.floor(i / 3) * 280, width: 540, minHeight: 210, padding: 28, border: `2px solid ${C.cyan}`, borderRadius: 18, background: C.panel, opacity: prog(f, dur * (.03 + i * .09), dur * (.03 + i * .09) + 24)}}><div style={{fontSize: 31, color: C.cyan, fontWeight: 700}}>{name}</div><div style={{fontSize: 25, color: C.text, lineHeight: 1.4, marginTop: 20}}>{role}</div></div>)}
  </div>;
  if (!card || !def) return <div style={{position: 'absolute', left: 180, top: 350, right: 180, color: C.text, fontFamily: sans, fontSize: 44, textAlign: 'center'}}>Every piece has one job. Follow the handoffs, not just the names.</div>;
  return <div style={{position: 'absolute', inset: 0, opacity: prog(f, -20, 24)}}>
    <div style={{position: 'absolute', left: 100, top: 170, color: C.purple, fontFamily: mono, fontSize: 21}}>CAST OF CHARACTERS · {id.split('.')[1]}</div>
    <Card x={100} y={300} w={660} kind={card.kind} name={card.name} role={card.role} nameSize={card.kind === 'VolumeGroupReplication' || card.kind === 'VolumeGroupReplicationContent' ? 21 : 29} appear={prog(f, -10, 24)} color={C.cyan}/>
    <GlossaryPanel d={def} p={prog(f, dur * .03, dur * .75)} x={850} y={230} w={990}/>
  </div>;
};
