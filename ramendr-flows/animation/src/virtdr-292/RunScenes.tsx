import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {C, mono, sans} from '../theme';
import {prog} from '../lib/anim';

type Node = {kind: string; name: string; scope: string; rows: string[]; color?: string};
type Scene = {title: string; nodes: Node[]; links: string[]; note: string; inferred?: boolean};
const hub = 'hub / openshift-gitops';
const target = 'spoke-0 / gitops-vms (historical target)';
const source = 'spoke-1 / gitops-vms (historical source)';
const drpc = (rows: string[]): Node => ({kind: 'DRPlacementControl', name: 'dell-vm-drpc', scope: hub, rows, color: C.orange});
const vrg = (scope: string, rows: string[]): Node => ({kind: 'VolumeReplicationGroup', name: 'dell-vm-drpc', scope, rows, color: C.orange});
const pd = (rows: string[]): Node => ({kind: 'PlacementDecision', name: 'Selected clusters', scope: hub, rows: ['For dell-vm-placement', ...rows], color: C.purple});
const app = (s: number, rows: string[]): Node => ({kind: 'Application', name: `dell-vm-workload-spoke-${s}`, scope: hub, rows, color: C.pink});
const vm = (scope: string, rows: string[]): Node => ({kind: 'VirtualMachine / VirtualMachineInstance', name: 'hammerdb-rhel9', scope, rows, color: C.green});
const controller = (name: string, scope: string, rows: string[]): Node => ({kind: 'Controller handoff', name, scope, rows, color: C.cyan});
const disks = (scope: string, rows: string[]): Node => ({kind: 'VolumeReplication (both disks)', name: 'hammerdb-rhel9-rootdisk / hammerdb-rhel9-datadisk', scope, rows, color: C.amber});
const store = (name: string, rows: string[]): Node => ({kind: 'PowerStore array', name, scope: 'Array-native block replication', rows, color: C.array});
const objects = (scope: string, rows: string[]): Node => ({kind: 'PersistentVolumeClaim / DataVolume', name: 'hammerdb-rhel9-rootdisk / hammerdb-rhel9-datadisk', scope, rows, color: C.blue});
const restoredClaims = (scope: string, rows: string[]): Node => ({...objects(scope, rows), kind: 'PersistentVolumeClaim'});
const bucket: Node = {kind: 'S3 storage metadata', name: 'ramen-metadata', scope: 'hub / minio', rows: ['Saved PV and PVC definitions', 'Destination CSI volume handles'], color: C.s3};
const set: Node = {kind: 'ApplicationSet', name: 'dell-vm-workload', scope: hub, rows: ['clusterDecisionResource', 'requeueAfterSeconds: 180'], color: C.pink};

// Resource identities and run observations come from virtdr-292/trace.md.
// Controller interiors illustrate pinned upstream source, not a captured RPC trace.
export const SCENES: Record<string, Scene> = {
  '3.1': {
    title: 'The previous run: a green badge hid stale data',
    nodes: [store('VSA-A', ['Previous run, October 6', 'Initial data-disk sync only']), disks('spoke-0 / gitops-vms (previous run)', ['Root disk synced on schedule', 'Data disk missed the next sync']), controller('DR console', 'hub / Data Services (previous run)', ['Failover readiness: Ready', 'Reported sync time looked recent']), controller('Recovered database', 'Previous run target guest', ['Previous run: RPO FAIL', 'Recent source writes were absent'])],
    links: ['Compare each disk', 'Reported status is insufficient', 'Recovery reveals the loss'],
    note: 'Driver source reports the current time as LastSyncTime. Actual array job history is the independent evidence.',
  },
  '3.2': {
    title: 'Recorded preflight: PASS, but outside the required window',
    nodes: [controller('dell_dr_check.py', 'Local read-only preflight', ['Finished 13:15:58 UTC', '24 of 24 checks passed']), store('VSA-B', ['87 scheduled syncs per disk', 'No failed jobs, gaps within 900s']), controller('PostgreSQL history', source, ['57,767 rows in one sync interval', '59,673 rows in the next']), controller('Initiate timing', 'hub / Data Services', ['Click at 13:26:40 UTC', '10m42s after preflight finished'])],
    links: ['Read array job history', 'Verify syncs carried writes', 'Two-minute window exceeded'],
    note: 'The attached evidence does not establish a fresh scripted PASS within two minutes before Initiate.',
  },
  '4.1': {
    title: 'The last completed sync becomes the recovery point',
    nodes: [disks(source, ['Both VM disks protected', '15-minute RPO objective']), store('VSA-B', ['Sync replication session', 'COMPLETED at 13:22:27 UTC']), store('VSA-A', ['Replicated copies available', 'Recovery point: 13:22:27 UTC']), controller('Recovered history', 'Historical data boundary', ['Last recovered source row 13:22:27', 'Later source writes are not captured'])],
    links: ['Array copies changed blocks', 'Last completed storage sync', 'Defines recovered source data'],
    note: 'An unplanned failover uses the replicated state. Do not assume a final source sync.',
  },
  '4.2': {
    title: 'One UI action becomes a DRPC request',
    nodes: [controller('Protected applications', 'hub / Data Services', ['Disaster recovery', 'Failover action']), controller('Failover confirmation', 'hub / Data Services', ['Target: spoke-0', 'Initiate at 13:26:40 UTC']), drpc(['action: Failover', 'failoverCluster: spoke-0']), controller('Ramen hub operator', 'hub', ['Reads the changed DRPC', 'Begins the failover control flow'])],
    links: ['Open confirmation', 'Submit authorized action', 'Controller observes request'],
    note: 'Historical UI initiation. This video does not change any live cluster resource.',
  },
  '5.1': {
    title: 'Validate the recovery target before moving placement',
    nodes: [drpc(['Target: spoke-0', 'Placement: dell-vm-placement']), vrg(target, ['Secondary before failover', 'Observed generation must match']), controller('Ramen hub operator', 'hub', ['Check target VRG readiness', 'Reject an invalid target']), drpc(['phase: FailingOver', 'PeerReady: False'])],
    links: ['Read target VRG status', 'Validate settled Secondary', 'CheckingFailoverPrerequisites'],
    note: 'Source-traced controller sequence. Individual prerequisite transition timestamps were not recorded.',
    inferred: true,
  },
  '5.2': {
    title: 'Regional DR checks storage prerequisites',
    nodes: [drpc(['Regional DR policy', 'dr-policy-15m']), controller('Ramen hub operator', 'hub', ['Check storage maintenance needs', 'Regional prerequisite path']), store('VSA-A', ['No maintenance gate needed here', 'Array-native recovery path']), drpc(['Ready to request target Primary', 'FailingOverToCluster'])],
    links: ['Select Regional DR path', 'Evaluate storage prerequisites', 'Continue target recovery'],
    note: 'No Metro fencing step in this path. This is not proof that a reachable source has been fenced.',
    inferred: true,
  },
  '5.3': {
    title: 'Keep the source decision while preparing the target',
    nodes: [controller('Ramen hub operator', 'hub', ['Preserve existing source entry', 'Do not move the app too early']), pd(['clusterName: spoke-1', 'reason: RetainedForFailover']), set, app(1, ['Source deployment still retained', 'Source cleanup has not started'])],
    links: ['Write retention reason', 'Generator reads decision', 'Source Application stays'],
    note: 'RetainedForFailover is a reason on the decision, not an ApplicationSet exclusion filter.',
  },
  '5.4': {
    title: 'Request Primary on the target through ManifestWork',
    nodes: [drpc(['Target: spoke-0', 'WaitingForResourceRestore']), controller('Ramen hub operator', 'hub', ['Update target VRG payload', 'replicationState: primary']), controller('ManifestWork / work agent', 'hub delivery to spoke-0', ['Deliver desired VRG spec', 'Apply on the managed cluster']), vrg(target, ['replicationState: primary', 'action: Failover'])],
    links: ['Construct target request', 'Deliver through ACM', 'Apply VRG locally'],
    note: 'ManifestWork delivery and observed VRG readiness are separate handoffs.',
  },
  '6.1': {
    title: 'Restore disk identity before deploying the application',
    nodes: [controller('Ramen VRG controller', target, ['processAsPrimary', 'Restore cluster storage metadata']), bucket, restoredClaims(target, ['Restore original claim names', 'Restore PV-to-PVC association']), store('VSA-A', ['Destination handles in saved metadata', 'Use the replicated copies'])],
    links: ['Read S3 metadata', 'Recreate PV and PVC definitions', 'Select destination handles'],
    note: 'Handle substitution depends on the saved destination-handle metadata. The run separately verified replica reuse.',
  },
  '6.2': {
    title: 'ClusterDataReady means restored identity, not guest recovery',
    nodes: [bucket, vrg(target, ['ClusterDataReady: True', 'Storage definitions restored']), restoredClaims(target, ['Check binding separately', 'Same root and data claim names']), controller('Replica reuse evidence', 'Historical target verification', ['Promoted VSA-A handles in use', 'Recovered source database rows'])],
    links: ['Restore definitions', 'Check actual claims and PVs', 'Verify data and handles'],
    note: 'Do not treat ClusterDataReady alone as proof that all PVCs are Bound or that database recovery succeeded.',
  },
  '6.3': {
    title: 'VolumeReplication drives the CSI promotion call',
    nodes: [vrg(target, ['Request both disks Primary', 'powerstore-vrc-15m']), disks(target, ['replicationState: primary', 'Reconciled by csi-addons']), controller('csi-addons / PowerStore CSI', 'spoke-0', ['Enable replication, then Promote', 'Retry Force only on FailedPrecondition']), store('VSA-A', ['Recover the replica volumes', 'Make the target copies usable'])],
    links: ['Create or update both VRs', 'Translate resource state to gRPC', 'Driver calls the array'],
    note: 'Which promote variant was used in this run is not recorded. The RPC path shown is pinned upstream behavior.',
    inferred: true,
  },
  '6.4': {
    title: 'Promotion and reverse replication are distinct',
    nodes: [store('VSA-A', ['Recovery copies become writable', 'Target application can use the disks']), controller('Promotion', 'PowerStore controller handoff', ['Unplanned failover path', 'Not proof of reverse sync completion']), controller('Reprotection', 'Later recovery handoff', ['Establish reverse-direction replication', 'Observe session health separately']), store('VSA-B', ['Will become reverse replica destination', 'Fresh sync must be verified'])],
    links: ['Make recovery copy writable', 'Separate later handoff', 'Re-establish protection'],
    note: 'Exact deployed-driver RPC sequence is unverified. This separation follows the upstream source trace.',
    inferred: true,
  },
  '6.5': {
    title: 'Both target disks report Primary five seconds after Initiate',
    nodes: [store('VSA-A', ['Promoted target storage', 'Historical target: spoke-0']), disks(target, ['Primary / Completed', 'Recorded at 13:26:45 UTC']), vrg(target, ['Observe target data readiness', 'Read status back to the hub']), drpc(['Storage promotion evidence available', 'Application handoff still follows'])],
    links: ['Return driver result', 'Aggregate disk readiness', 'Observe target status'],
    note: 'Recorded target VolumeReplication state. The VM is not yet deployed or recovered at this milestone.',
  },
  '7.1': {
    title: 'The reachable source pauses after an I/O error',
    nodes: [vm(source, ['Guest is still attempting writes', 'Historical source: spoke-1']), store('VSA-B', ['Source writes rejected', 'Attempted Write to Read Only Range']), controller('libvirt / KubeVirt', source, ['Disk error policy pauses execution', 'PausedIOError']), vm(source, ['VMI phase: Running', 'Paused: True at 13:26:44 UTC'])],
    links: ['Guest issues disk write', 'Storage reports write error', 'Pause guest execution'],
    note: 'A Running VMI phase is not proof of running guest execution. This observed pause is not source fencing.',
  },
  '8.1': {
    title: 'Target readiness is observed before placement changes',
    nodes: [vrg(target, ['state: Primary', 'DataReady / ClusterDataReady']), controller('ManagedClusterView', 'spoke observation to hub', ['Return target VRG status', 'Hub does not infer success from delivery']), controller('Ramen hub operator', 'hub', ['Check readiness conditions', 'Open the placement gate']), pd(['Source still retained', 'Target can now be added'])],
    links: ['Observe the target instance', 'Evaluate returned status', 'Authorize decision update'],
    note: 'The animation explains the source-traced gate. Exact readiness-check timestamps were not captured.',
  },
  '8.2': {
    title: 'For a moment, the decision contains both clusters',
    nodes: [controller('Ramen hub operator', 'hub', ['Append target to the decision', 'Preserve retained source']), pd(['spoke-1: RetainedForFailover', 'spoke-0: target added']), set, controller('Generated Applications', hub, ['Source kept while target is added', 'Not a request for two independent writers'])],
    links: ['Write the PlacementDecision', 'Poll selected cluster entries', 'Update generated Applications'],
    note: 'Placement selection, storage roles and guest execution are different layers.',
  },
  '8.3': {
    title: 'FailedOver / Cleaning Up is an intermediate state',
    nodes: [vrg(target, ['Target storage promoted', 'Historical target: spoke-0']), pd(['Target decision added', 'Source retained temporarily']), drpc(['phase: FailedOver', 'progression: Cleaning Up']), controller('Remaining work', 'Managed application recovery', ['Generate target deployment', 'Automatically remove source resources'])],
    links: ['Readiness permits placement', 'UpdatedPlacement', 'Wait for application cleanup'],
    note: 'Recorded at 13:26:49 UTC. FailedOver is not the same as FailedOver / Completed.',
  },
  '9.1': {
    title: 'The generator discovers the new decision on a later poll',
    nodes: [pd(['spoke-0 now selected', 'Source may still be retained']), set, controller('ApplicationSet controller', hub, ['Poll through acm-placement', 'Resolve registered target cluster']), app(0, ['New target Application', 'Generated around 13:29 UTC'])],
    links: ['Read decision entries', 'Use the registered destination', 'Generate the target Application'],
    note: 'The exact generation time is not recorded. A 180-second requeue is not a guaranteed delivery delay.',
    inferred: true,
  },
  '9.2': {
    title: 'ACM delivers an Application, then spoke Argo CD syncs it',
    nodes: [app(0, ['Hub copy: skip-reconcile', 'Pull-model routing annotations']), controller('Propagation controller', 'hub', ['Wrap the Application in ManifestWork', 'Rewrite destination to local API']), controller('ManifestWork / work agent', 'hub delivery to spoke-0', ['Apply the spoke Application', 'Drop hub-only annotations']), controller('Argo CD', 'spoke-0 / openshift-gitops', ['Pull clusters/dell-s4/workloads', 'Apply VM, DataVolumes and Service'])],
    links: ['Observe hub Application', 'Deliver payload to spoke', 'Reconcile desired Git state'],
    note: 'Recorded workload revision: e6237efd8cba2c68908cf351c7b779d53be654f9. Branch equality alone does not prove commit equality.',
  },
  '9.3': {
    title: 'The recovered VM uses the promoted replicas',
    nodes: [controller('Argo CD', 'spoke-0 / openshift-gitops', ['Sync DataVolume and VM manifests', 'Existing restored PVCs are present']), objects(target, ['Claims use replicated disks', 'Exact CDI adoption sequence unrecorded']), store('VSA-A', ['Root: 9e3b6608-30f4-42e8-aaca-4f774fe7662a', 'Data: 41b0880b-916d-42a1-b4b6-a55f9c853c91']), vm(target, ['Boot on the recovered disks', 'Recovered database confirms reuse'])],
    links: ['Apply workload definitions', 'Verify destination handles', 'Use recovered contents'],
    note: 'Replica reuse is recorded. The internal CDI adoption sequence is explanatory inference.',
    inferred: true,
  },
  '10.1': {
    title: 'KubeVirt creates the target VMI and attaches its disks',
    nodes: [vm(target, ['Target VMI created 13:29:40 UTC', 'Historical worker: worker-2']), controller('KubeVirt / CSI', 'spoke-0', ['Schedule the launcher', 'Publish the promoted storage']), store('VSA-A', ['NVMe/TCP storage access', 'Recovered root and data disks']), vm(target, ['Ready at 13:29:46 UTC', 'Six seconds after VMI creation'])],
    links: ['Schedule recovered workload', 'Attach target storage', 'Guest execution becomes ready'],
    note: 'The interval lines up with generator polling. It does not prove the poll caused the entire delay.',
  },
  '10.2': {
    title: 'PostgreSQL and HammerDB start automatically in the guest',
    nodes: [vm(target, ['Crash-consistent disk recovery', 'Guest boot on the target']), controller('systemd', 'Recovered RHEL guest', ['ramendr-postgresql.service', 'Enabled for automatic startup']), controller('PostgreSQL / HammerDB', 'Recovered RHEL guest', ['ramendr-dr-hammerdb.service', 'Writer auto-start confirmed']), controller('history table', 'Recovered tpcc database', ['First target row: 13:31:37 UTC', 'New writes are distinct from recovered rows'])],
    links: ['Start database service', 'Start enabled load service', 'Observe resumed database writes'],
    note: 'Guest auto-start was recorded. Crash recovery is distinct from preserving all writes after the last sync.',
  },
  '11.1': {
    title: 'Source Secondary spec acknowledgement releases placement',
    nodes: [controller('Ramen hub operator', 'hub', ['Request source Secondary', 'Update source VRG ManifestWork']), vrg(source, ['replicationState: secondary', 'Observed generation matches spec']), controller('ManagedClusterView', 'Source observation to hub', ['Observe accepted Secondary spec', 'Not yet completed disk demotion']), pd(['Remove retained spoke-1 entry', 'Keep target spoke-0'])],
    links: ['Deliver desired source state', 'Observe spec acknowledgement', 'Remove retained source decision'],
    note: 'Ramen removes retained placement after spec acknowledgement, then waits for completed Secondary status.',
  },
  '11.2': {
    title: 'Removing the source decision removes its Application',
    nodes: [pd(['spoke-0 remains', 'spoke-1 no longer selected']), set, app(1, ['Removed by the generator', 'Historical source Application']), controller('Propagation controller', 'hub to spoke-1', ['Delete source ManifestWork', 'Remove spoke Application'])],
    links: ['Next generator reconciliation', 'Delete unneeded Application', 'Remove delivered payload'],
    note: 'Source Application removal is recorded approximately around 13:29 to 13:31. The exact timestamp is unverified.',
    inferred: true,
  },
  '11.3': {
    title: 'Argo CD removes the source workload, but leaves its namespace',
    nodes: [controller('Argo CD', 'spoke-1 / openshift-gitops', ['Automatic source cleanup', 'No manual source deletion']), vm(source, ['Source VM and VMI removed', 'Historical cleanup around 13:31']), objects(source, ['DataVolumes and PVCs removed', 'No source workload disks remain']), vrg(source, ['gitops-vms namespace retained', 'VRG can complete demotion'])],
    links: ['Prune owned workload', 'Release disks through ownership', 'Keep namespace and VRG'],
    note: 'No Namespace manifest in the workload Git path. CreateNamespace=true does not make this namespace a tracked manifest.',
  },
  '11.4': {
    title: 'The source VRG waits until disks are no longer in use',
    nodes: [vrg(source, ['Secondary requested', 'Check isPVCInUse']), vm(source, ['Source launcher is gone', 'No pod still using the claims']), controller('VolumeAttachment check', 'spoke-1 / cluster-scoped', ['Check remaining attachment use', 'Do not demote an in-use disk']), disks(source, ['Disuse gate can now open', 'Proceed toward Secondary'])],
    links: ['Check referencing pods', 'Check node attachment state', 'Allow demotion'],
    note: 'Controller checks shown from pinned upstream source. Individual attachment identities were not recorded.',
  },
  '11.5': {
    title: 'Demotion and resync let the source finish cleanup',
    nodes: [disks(source, ['replicationState: secondary', 'autoResync: true']), controller('csi-addons / PowerStore CSI', 'spoke-1', ['Demote, then Resync', 'Operations span reconciliations']), vrg(source, ['Accept required Secondary conditions', 'Release protected storage resources']), objects(source, ['Protection finalizer released', 'Terminating claims finish deletion'])],
    links: ['Drive secondary RPC path', 'Observe demotion/resync conditions', 'Complete PVC protection release'],
    note: 'Source-traced cleanup. Resyncing during demotion is not proof of a fresh completed reverse-direction data sync.',
  },
  '12.1': {
    title: 'The completed DRPC marks the end of application recovery',
    nodes: [vrg(source, ['Source reports Secondary', 'Source workload resources gone']), controller('ManagedClusterView', 'Source observation to hub', ['Return completed source state', 'Ramen checks peer readiness']), drpc(['FailedOver / Completed', 'PeerReady: True at 13:32:21']), controller('Recorded duration', 'Historical failover result', ['5 minutes 41 seconds', 'Target guest and services recovered'])],
    links: ['Observe final peer state', 'Confirm cleanup completion', 'Record action completion'],
    note: 'Protected=True is recorded. Reverse-direction sync freshness still requires its own array-job check.',
  },
  '12.2': {
    title: 'The arrays report reversed protection after recovery',
    nodes: [store('VSA-A', ['New replication source', 'Historical target disks now writable']), controller('Reprotection', 'PowerStore array handoff', ['Reverse session direction', 'Observe array session state']), store('VSA-B', ['New replication destination', 'Reversed sessions report OK']), controller('Next test gate', 'Read actual array job history', ['Require two fresh scheduled syncs', 'Each must carry source writes'])],
    links: ['Establish reverse protection', 'Observe peer session state', 'Check fresh completed syncs'],
    note: 'Session OK and DRPC completion do not substitute for actual sync timestamps and job history.',
  },
  '13.1': {
    title: 'Recovered history separates source data from new target writes',
    nodes: [controller('Recovered source rows', 'PostgreSQL history', ['13:20: 3,632 rows', '13:21: 4,501 rows']), controller('Last recovered minute', 'PostgreSQL history', ['13:22: 2,100 rows', 'Ends at 13:22:27 UTC']), controller('Recovery gap', 'PostgreSQL history', ['13:23 through 13:30: no rows', 'No source rows after the last sync']), controller('New target writes', 'PostgreSQL history', ['First row at 13:31:37 UTC', '13:31: 222 rows'])],
    links: ['Group rows by minute', 'Identify recovered boundary', 'Identify first resumed write'],
    note: 'Recovered-data gap: 550 seconds (9m10s). Aggregate count growth alone would mix recovered and new writes.',
  },
  '13.2': {
    title: 'RPO PASS: 253 seconds, with nonzero data loss',
    nodes: [controller('Source continuity', 'Recovered database comparison', ['277,433 rows recovered', '59 full minutes before final sync']), controller('Recovery point', 'Historical array evidence', ['Last sync: 13:22:27 UTC', 'Initiate: 13:26:40 UTC']), controller('Lost-write interval', 'Historical source data boundary', ['Source pause: 13:26:44 UTC', '257s from sync to source pause']), controller('Recorded RPO verdict', 'RPO limit: 900 seconds', ['Recovery point lag: 253s', 'Within policy, not zero loss'])],
    links: ['Compare pre-sync rows', 'Measure recovery point lag', 'Compare with the 900s objective'],
    note: 'Asynchronous replication does not guarantee zero loss. This run recovered all compared rows before the last sync.',
  },
  '14.1': {
    title: 'A healthy-looking reversal still needs fresh sync evidence',
    nodes: [store('VSA-A', ['Historical reverse replication source', 'Sessions report OK']), disks(target, ['Root disk synced at 13:36:57', 'Data disk not yet synced at 13:42']), controller('Array job history', 'Independent synchronization evidence', ['First post-reversal data sync delayed', 'Not proven permanently skipped']), controller('Before another move', 'Fresh test readiness', ['Repeat the two-sync preflight', 'Never rely only on console Ready'])],
    links: ['Inspect each backing disk', 'Read actual completed jobs', 'Revalidate before another action'],
    note: 'This is a historical observation, not a statement of the current replication state.',
  },
  '14.2': {
    title: 'Finish the test by stopping the writer, not the database',
    nodes: [controller('ramendr-dr-hammerdb.service', 'Recovered RHEL guest', ['Writer stopped and disabled', 'Separate verification after SSH error']), controller('ramendr-postgresql.service', 'Recovered RHEL guest', ['Database remained active', 'Recovered data stays queryable']), controller('Order-sequence sum', 'Historical guest verification', ['Stable at 1,443,612', 'Not an exact transaction count']), controller('Completed test', 'Historical acceptance evidence', ['Recovery and RPO checks complete', 'Continuous load no longer running'])],
    links: ['Leave the database running', 'Verify the metric stops advancing', 'Record final guest state'],
    note: 'The run log records a scripted SSH error after disabling. Final writer shutdown was verified separately.',
  },
  '14.3': {
    title: 'One request, many independent controller handoffs',
    nodes: [drpc(['UI request and DR coordination', 'Placement and storage readiness']), controller('ManifestWork / VRG / CSI', 'Hub and spokes', ['Deliver desired storage state', 'Promote and reprotect array volumes']), controller('Placement / ApplicationSet / Argo CD', 'Hub and spokes', ['Deliver target workload from Git', 'Automatically remove source workload']), controller('KubeVirt / PostgreSQL', 'Recovered RHEL guest', ['Boot from promoted replicated disks', 'Verify data continuity and RPO'])],
    links: ['Storage control handoffs', 'Placement and GitOps handoffs', 'Guest and data verification'],
    note: 'Recorded direction: spoke-1 to home cluster spoke-0. Evidence distinguishes observed results from source-traced internals.',
  },
};

const positions = [{x: 110, y: 280}, {x: 1100, y: 280}, {x: 110, y: 620}, {x: 1100, y: 620}];
const order = [0, 1, 3, 2];

export const RunScene: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const s = SCENES[id];
  if (!s) throw new Error(`Missing scene for ${id}`);
  const nodes = order.map((i) => s.nodes[i]);
  const p = Math.max(0, f / dur);
  const enter = prog(f, -15, 30);
  const active = Math.min(3, Math.floor(p * 4));
  return (
    <AbsoluteFill style={{fontFamily: sans, opacity: enter}}>
      <div style={{position: 'absolute', left: 110, top: 115, width: 1660}}>
        <div style={{fontFamily: mono, color: C.blue, fontSize: 18, letterSpacing: 2}}>RECORDED RUN · 2026-10-07 · SPOKE-1 TO SPOKE-0</div>
        <div style={{fontSize: 40, fontWeight: 750, lineHeight: 1.2, color: C.text, marginTop: 14}}>{s.title}</div>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {[[[870, 395], [1100, 395]], [[1455, 490], [1455, 620]], [[1100, 735], [870, 735]]].map(([a, b], i) => {
          const t = prog(f, dur * (0.18 + i * 0.22), dur * (0.23 + i * 0.22));
          const col = [C.cyan, C.green, C.purple][i];
          const dx = b[0] - a[0], dy = b[1] - a[1];
          const x = a[0] + dx * t, y = a[1] + dy * t;
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return <g key={i} opacity={t}>
            <line x1={a[0]} y1={a[1]} x2={x} y2={y} stroke={col} strokeWidth={4} strokeDasharray={i === 2 ? '9 7' : undefined} />
            <path d="M-14 -8 L0 0 L-14 8" fill="none" stroke={col} strokeWidth={4} transform={`translate(${x},${y}) rotate(${angle})`} />
            <circle cx={a[0] + dx * ((p * 3) % 1)} cy={a[1] + dy * ((p * 3) % 1)} r={6} fill={col} />
            <text x={i === 1 ? 1428 : 985} y={i === 0 ? 355 : i === 1 ? 555 : 800} textAnchor={i === 1 ? 'end' : 'middle'} fill={col} fontFamily={sans} fontSize={19}>
              {i + 1}
            </text>
          </g>;
        })}
      </svg>
      {nodes.map((n, i) => {
        const pos = positions[i];
        const reveal = prog(f, dur * (i * 0.07), dur * (i * 0.07) + 30);
        const ease = Easing.out(Easing.back(1.2))(reveal);
        const on = active === order.indexOf(i);
        const color = n.color ?? C.blue;
        return <div key={`${id}-${i}`} style={{position: 'absolute', left: pos.x, top: pos.y, width: 760, height: 212, boxSizing: 'border-box', padding: '18px 24px', background: `linear-gradient(150deg, ${C.panel2}, ${C.panel})`, border: `2px solid ${on ? color : C.border}`, borderLeft: `7px solid ${color}`, borderRadius: 16, transform: `translateY(${(1 - ease) * 22}px) scale(${.96 + .04 * ease})`, opacity: reveal, boxShadow: on ? `0 0 32px ${color}33` : '0 12px 30px #0008'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 16, color, fontWeight: 700}}><span>{n.kind}</span><span style={{fontFamily: mono, color: C.dim}}>{order.indexOf(i) + 1}</span></div>
          <div style={{fontSize: 24, fontFamily: mono, lineHeight: 1.25, color: C.text, marginTop: 9, overflowWrap: 'break-word'}}>{n.name}</div>
          <div style={{fontSize: 16, color: C.faint, marginTop: 8}}>{n.scope}</div>
          {n.rows.map((r, j) => <div key={j} style={{fontFamily: mono, fontSize: r.length > 62 ? 16 : 19, color: j === 0 ? C.text : C.dim, marginTop: 9, overflowWrap: 'anywhere'}}>{r}</div>)}
        </div>;
      })}
      <div style={{position: 'absolute', left: 110, right: 110, top: 510, display: 'flex', gap: 30, color: C.dim, fontSize: 18}}>
        {s.links.map((l, i) => <div key={l} style={{flex: 1, opacity: prog(f, dur * (.16 + i * .2), dur * (.16 + i * .2) + 25)}}><span style={{fontFamily: mono, color: [C.cyan, C.green, C.purple][i]}}>{i + 1}. </span>{l}</div>)}
      </div>
      <div style={{position: 'absolute', left: 110, right: 110, top: 870, minHeight: 58, fontSize: 20, lineHeight: 1.4, padding: '10px 20px', borderLeft: `4px solid ${s.inferred ? C.amber : C.blue}`, color: C.dim, background: `${C.bg}cc`}}>
        {s.inferred ? <span style={{color: C.amber, fontWeight: 600}}>Inference / source trace: </span> : null}{s.note}
      </div>
    </AbsoluteFill>
  );
};
