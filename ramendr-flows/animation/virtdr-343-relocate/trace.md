# VIRTDR-343 relocate evidence and controller trace

## Recorded outcome and scope

A GitOps-managed application, `openshift-gitops/dell-vm-drpc`, was relocated back to its preferred site, spoke-1, after a failover earlier the same day. The relocate was initiated from the hub console at 13:46:32 UTC and reached `Relocated/Completed` at 13:50:10, an action duration of 3m38.455s. The target PVCs bound to the original PVs `csivol-ec5862ac71` and `csivol-f756724d1d`, the array sessions used the same handles as before the failover, the VM ran on spoke-1 worker-0, Argo CD pruned the source Application, and the guest order count was unchanged.

After the move, both reversed source sessions on VSA-B reported `next_sync_timestamp: null`. A manual `POST /api/rest/replication_session/<id>/sync` was issued for both sessions. Both jobs completed, the next automatic times were set, and the schedule ran about every twelve minutes afterwards.

- Application type: managed by ApplicationSet `dell-vm-workload`, not discovered
- Workload: `gitops-vms/hammerdb-rhel9` (RHEL 9, PostgreSQL, HammerDB)
- Repo: `elsapassaro/ramendr-starter-kit`, branch `ocp-4.22-rhdr-dell`, path `clusters/dell-s4/workloads`
- Policy: `dr-policy-15m`, RPO 900 seconds
- Failover earlier the same day: spoke-1 to spoke-0, Initiate 09:01:33
- Relocate: spoke-0 to spoke-1, Initiate 13:46:32
- Preferred cluster: spoke-1

**Deployed-build provenance: UNVERIFIED.** The upstream code below explains the progression names and the ordering. The attachments do not establish that these exact commits built the running controllers or the Dell driver.

## Run evidence

- [Ticket](https://redhat.atlassian.net/browse/VIRTDR-343)
- [Relocate timeline](https://redhat.atlassian.net/rest/api/2/attachment/content/1270148)
- [Array sessions and job history](https://redhat.atlassian.net/rest/api/2/attachment/content/1270146)
- [Guest check](https://redhat.atlassian.net/rest/api/2/attachment/content/1270147)
- [Hub DRPC, PlacementDecision and Application](https://redhat.atlassian.net/rest/api/2/attachment/content/1270151)
- [Spoke-0 remnants](https://redhat.atlassian.net/rest/api/2/attachment/content/1270152)
- [Spoke-1 workload](https://redhat.atlassian.net/rest/api/2/attachment/content/1270153)
- [Failover run log](https://redhat.atlassian.net/rest/api/2/attachment/content/1266950)
- Screenshots: `01-baseline-hub-dell-vm-workload.png` to `07-replication-vsa-a-destination.png`, ids 1270021 to 1270027

### Observed timeline (UTC)

| Time           | Observation                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 09:01:33       | Failover initiated, spoke-1 to spoke-0. Phase A postcheck 14/14 PASS, loss span 582s inside the 900s RPO                                              |
| 09:21:59       | Source spoke-1 resumed; phase B completed, source VRG Secondary                                                                                       |
| 13:41:46       | Relocate precheck: DRPC `FailedOver/Completed`, preferred spoke-1, failover spoke-0, PeerReady True, PlacementDecision spoke-0, spoke-1 VRG Secondary |
| 13:42:16       | Array precheck: promoted sessions Source on VSA-A, Destination on VSA-B, both OK. Root last sync 13:34:18, data 13:41:38                              |
| 13:45:36       | Baseline console capture: row on spoke-0, all volumes synced 13:39                                                                                    |
| 13:46:22       | Relocate dialog captured: target spoke-1, readiness Ready, volume last synced 13:39                                                                   |
| 13:46:32       | Relocate initiated from the hub console                                                                                                               |
| 13:47:02       | DRPC `Relocating/RunningFinalSync`, Available False/Relocating, PeerReady True                                                                        |
| 13:48:42       | DRPC `Relocating/EnsuringVolumesAreSecondary`; source Application pruned by Argo CD                                                                   |
| 13:50:10       | DRPC `Relocated/Completed`, Available True/Relocated, PeerReady True. PlacementDecision spoke-1                                                       |
| 13:51:05       | Application `dell-vm-workload-spoke-1` created                                                                                                        |
| 13:54:29       | VM and VMI `gitops-vms/hammerdb-rhel9` Running on spoke-1 worker-0                                                                                    |
| 13:54:49       | Guest check: PostgreSQL active, writer inactive and disabled, order count 2252463, last row 09:11:05                                                  |
| 13:55:32       | Root session manual sync triggered; job COMPLETED 13:55:36; next sync 14:13:25                                                                        |
| 13:55:37       | Data session manual sync triggered; job COMPLETED 13:55:40; next sync 14:11:02                                                                        |
| 13:56:53       | Relocated console row captured                                                                                                                        |
| 14:03 to 15:51 | Both sessions ran a completed sync about every twelve minutes                                                                                         |
| 15:58:51       | Guest recheck unchanged, order count 2252463                                                                                                          |
| 15:59:00       | State dumps captured: DRPC Relocated/Completed, placement spoke-1, source VRG Secondary, arrays reversed                                              |

## Ordered controller trace

### 1. Initiate

**Observed:** the operator initiated Relocate in the console. The resulting spec contains `spec.action: Relocate`, `spec.preferredCluster: spoke-1`, and the retained `spec.failoverCluster: spoke-0`. The precheck already recorded preferred cluster spoke-1, so do not claim that the click changed that field. `status.actionStartTime` is 13:46:32.

### 2. Quiesce and final sync

**Observed:** at 13:47:02 the DRPC reported `Relocating/RunningFinalSync`. That label does not establish the VM stop time or a final Dell copy. Neither event has a corresponding driver or array job captured at that moment.

**Mechanism:** upstream `quiesceAndRunFinalSync` prepares the VRG flags, clears placement to begin asynchronous workload removal, then requests `RunFinalSync` and waits for the status flag. The no-VolSync path sets the completion flags immediately. This application uses Dell VolumeReplication with VolSync disabled. Do not present the VolSync final-transfer flow as a measured Dell array-copy sequence.

### 3. Both sides secondary

**Observed:** at 13:48:42 the progression was `EnsuringVolumesAreSecondary`. Argo CD pruned `dell-vm-workload-spoke-0`.

**Mechanism:** VolumeReplication source readiness requires the claim marked for deletion, no pod using it, and no disk attachment before demotion. `setupRelocation` waits for the non-target VRG to report Secondary and `DataProtected=True` at the current generation. It deliberately skips re-demoting the target during retries. Placement clearing starts pruning before this gate, not afterward.

### 4. Promote and restore

**Observed:** the saved DRPC condition timestamp is 13:50:10, with `Relocated/Completed` and action duration 3m38.455s. The timeline observes completion by 13:51:00. Application `dell-vm-workload-spoke-1` was created at 13:51:05. Its Synced/Healthy state and the VM Running on worker-0 were observed at 13:54:29. These are separate events, not one timestamp.

The later state shows target claims bound to PVs `csivol-ec5862ac71` (root) and `csivol-f756724d1d` (data), target VRG Primary, and both VolumeReplications Primary. The array local resource ids are `1282bca9-29aa-416f-b890-2a29a44e3fac` and `e5ecb946-25b6-4f1a-afe0-8173392f2b7d`, matching the pre-failover source handles. PV names are not array volume handles.

**Mechanism:** the hub requests target VRG Primary. The spoke controller restores PV/PVC definitions from S3 before reconciling actual disk promotion. Hub disk-readiness checks and placement do not wait for the guest VM to boot.

### 5. Reverse replication

**Observed:** VSA-B became Source and VSA-A Destination for both workload sessions. The timeline reports missing `next_sync_timestamp` values and manual syncs at 13:55. The raw dump is from 15:59, after repair, and contains populated future timestamps and completed job history. The seven screenshots likewise show repaired-state array timestamps. Do not label them as captures of the earlier null values.

**Mechanism (UNVERIFIED for the null value):** the relocate log records the null value and the manual repair. The upstream code and the attachments do not establish why the schedule was not armed. This is not a documented Dell defect.

## Unverified or corrected details

- The console dialog says the relocate "syncs its most recent snapshot". The run log records a final sync, not a snapshot. The video says final sync and notes the console wording.
- The DRPC condition timestamp is 13:50:10. The run log records the completed state at 13:51:00, when the operator observed it.
- The exact cause of `next_sync_timestamp: null` after the relocate is unverified. The video states the observed value and the repair, not a cause.
- The deployed controller and driver commits are not established by the attachments.
- The guest order count is an order-sequence total, not an exact transaction count.

## Independently verified upstream references

Source trace pinned to Ramen `b2baa4069f7769be3e5627b74dec11c1fdf9099e`, not a claim about the deployed build:

- [Placement clearing and final-sync progress flags](https://github.com/RamenDR/ramen/blob/b2baa4069f7769be3e5627b74dec11c1fdf9099e/internal/controller/drplacementcontrol.go#L1144-L1266)
- [No-VolSync completion fast path](https://github.com/RamenDR/ramen/blob/b2baa4069f7769be3e5627b74dec11c1fdf9099e/internal/controller/vrg_volsync.go#L135-L145)
- [Claim deletion, pod-use, and attachment gates](https://github.com/RamenDR/ramen/blob/b2baa4069f7769be3e5627b74dec11c1fdf9099e/internal/controller/vrg_volrep.go#L291-L361)
- [Source Secondary and data-protection checks](https://github.com/RamenDR/ramen/blob/b2baa4069f7769be3e5627b74dec11c1fdf9099e/internal/controller/drplacementcontrol.go#L1431-L1491)
- [Target metadata restore before disk reconciliation](https://github.com/RamenDR/ramen/blob/b2baa4069f7769be3e5627b74dec11c1fdf9099e/internal/controller/volumereplicationgroup_controller.go#L1513-L1540)
- [Target readiness is storage readiness, not VM readiness](https://github.com/RamenDR/ramen/blob/b2baa4069f7769be3e5627b74dec11c1fdf9099e/internal/controller/drplacementcontrol.go#L1355-L1363)
- [ApplicationSet placement generator and pull-model configuration](https://github.com/elsapassaro/ramendr-starter-kit/blob/ocp-4.22-rhdr-dell/clusters/dell-s4/hub-dr/applicationset.yaml), mutable branch reference corroborated by the recorded Application state, not immutable deployment provenance.
