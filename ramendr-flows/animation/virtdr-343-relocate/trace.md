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

**Observed:** the console wrote `spec.action: Relocate` and `spec.preferredCluster: spoke-1`. `spec.failoverCluster: spoke-0` remained from the previous failover. `status.actionStartTime` is 13:46:32.

### 2. Quiesce and final sync

**Observed:** at 13:47:02 the DRPC reported `Relocating/RunningFinalSync`. The source Application was stopped and the final copy was taken.

**Mechanism:** upstream `internal/controller/drplacementcontrol.go` calls `quiesceAndRunFinalSync`, which runs `prepareForFinalSync`, sets phase `Relocating`, clears the placement (managed applications) or sets a wait-on-user cleanup progression (discovered applications), runs the final sync, and sets `FinalSyncComplete`.

### 3. Both sides secondary

**Observed:** at 13:48:42 the progression was `EnsuringVolumesAreSecondary`. Argo CD pruned `dell-vm-workload-spoke-0`.

**Mechanism:** `setupRelocation` requires both clusters up and both VRGs secondary before it proceeds, then calls `ensureDataProtected`.

### 4. Promote and restore

**Observed:** at 13:50:10 the DRPC was `Relocated/Completed`. Target PVCs bound to the PVs `csivol-ec5862ac71` (root) and `csivol-f756724d1d` (data). The array sessions used `1282bca9-29aa-416f-b890-2a29a44e3fac` (root) and `e5ecb946-25b6-4f1a-afe0-8173392f2b7d` (data), the same handles the disks had before the failover. Target VRG Primary, both VolumeReplications Primary. Application `dell-vm-workload-spoke-1` Synced/Healthy. VM Running on worker-0.

### 5. Reverse replication

**Observed:** VSA-B became Source and VSA-A Destination for both workload sessions. All eight sessions reported Operating Normally. The two workload sessions had `next_sync_timestamp: null` until the manual sync at 13:55.

**Mechanism (UNVERIFIED for the null value):** the relocate log records the null value and the manual repair. The upstream code and the attachments do not establish why the schedule was not armed. This is not a documented Dell defect.

## Unverified or corrected details

- The console dialog says the relocate "syncs its most recent snapshot". The run log records a final sync, not a snapshot. The video says final sync and notes the console wording.
- The DRPC condition timestamp is 13:50:10. The run log records the completed state at 13:51:00, when the operator observed it.
- The exact cause of `next_sync_timestamp: null` after the relocate is unverified. The video states the observed value and the repair, not a cause.
- The deployed controller and driver commits are not established by the attachments.
- The guest order count is an order-sequence total, not an exact transaction count.
