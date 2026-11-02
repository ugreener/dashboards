# peer-array-gate: provenance and source trace

Record: DFBUGS-12519, "Regional-DR failover never completes when the source storage array is down:
csi-powerstore ResyncVolume issues Reprotect, VR stays Completed=False(FailedToResync),
DataReady=False blocks VM restore". Opened 2026-10-29. Composition name `peer-array-gate`.

## What was recorded

| Item         | Value                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Run date     | 2026-10-29                                                                                                                                     |
| Hub          | ocp-edge36, RHDR hub operator v4.22.0-86.stable                                                                                                |
| Target       | spoke-0 on ocp-edge95, array VSA-A                                                                                                             |
| Source       | spoke-1 on ocp-edge97, array VSA-B                                                                                                             |
| Policy       | dr-policy-15m, async Regional-DR, 15-minute interval                                                                                           |
| Applications | hammerdb-drpc, dell-win-drpc, hammerdb-win-drpc, dell-vm-drpc                                                                                  |
| Workloads    | RHEL 9 + PostgreSQL + HammerDB (discovered and GitOps-managed), Windows Server + SQL Server Express + HammerDB (discovered and GitOps-managed) |
| Disruption   | all six spoke-1 node VMs suspended, then both VSA-B node VMs force-powered off at 11:46:58 UTC                                                 |
| Initiates    | 11:47:36, 11:47:52, 11:48:11, 11:48:26 UTC                                                                                                     |

## Attachments and what each proves

| Attachment                                             | Proves                                                                                                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bug-failover-blocked-peer-array-down.png` (1920x1080) | The hub console Protected applications page, same run. Four rows, all reading FailedOver with a green check. It does **not** show a blocked or "action needed" state. See the caveat below. |
| `bug-failover-blocked-vr-conditions.txt` (54 lines)    | Exact UTC times, the eight volume handles, the DRPC, VRG and VolumeReplication conditions, the driver log excerpt, and the code references.                                                 |

No run log, no preflight or postcheck JSON, no array job dump and no control run were attached.
The four planned execution sub-tasks (VIRTDR-367 to -370) were still New when this video was made,
so this run exists only as a defect record.

### Screenshot caveat

The attached capture shows the console's DR Status column, which reads the DRPC **phase**
(`FailedOver`), not the **progression** (`WaitForReadiness`). All four rows therefore look healthy
while none of the four applications is running. The capture is used only for that contrast, and its
caption says so. It must not be used to illustrate a blocked or "action needed" console state.

## Observed condition chain (quoted from the attachment)

```
DRPC (all four):  phase=FailedOver progression=WaitForReadiness
                  Available=False(FailingOver) PeerReady=False(NotStarted) Protected=True

VRG  (example):   state=primary
                  DataReady=False(Error): All PVCs of the VolumeReplicationGroup are not ready
                  DataProtected=False(Error): All PVCs of the VolumeReplicationGroup are not ready
                  ClusterDataReady=True(Restored): Restored 0 volsync PVs/PVCs and 4 volrep PVs/PVCs
                  KubeObjectsReady=True(Unused): k8s resource restore skipped as Secondary
                  DestinationInfoAvailable=True(Ready)
                  ClusterDataProtected=False(AnnotationFailed)

VolumeReplication (all 8):
                  DestinationInfoAvailable=False(DestinationInfoPending): volume destination info is pending update
                  Completed=False(FailedToResync): failed to resync volume
                  Degraded=True(Error): ... Reprotect operation failed because the remote peer
                                         replication session is not in FAILED OVER state yet.
                  Resyncing=False(FailedToResync): volume is not resyncing
```

Array state on the target: remote system VSA-B reports `Complete_Data_Connection_Loss`, and all
eight sessions report `role=Source state=Failed_Over error_code=None`. All eight target claims are
Bound to promoted volume handles.

## Source trace, upstream `main`

Ordered by the handoff, with the decisive line. All paths were read from GitHub at `main`; the
deployed build is not recorded in the ticket.

1. `RamenDR/ramen` `internal/controller/drplacementcontrol.go:RunFailover` (L468-L474) calls
   `checkReadiness(failoverCluster)` and then `setProgression(ProgressionWaitForReadiness)`.
2. `drplacementcontrol.go:checkReadiness` (L1361-L1363) requires `DataReady` true,
   `ClusterDataReady` true, and `vrg.Status.State == Primary`.
3. `drplacementcontrol.go:isVRGConditionMet` (L1388-L1389) accepts a condition only when it is true
   **and** `ObservedGeneration == vrg.Generation`.
4. `drplacementcontrol.go:RunFailover` (L492) calls `ensureActionTransition` only after readiness
   passes; otherwise the progression stays at `WaitForReadiness`.
5. The hub reads one `VolumeReplicationGroup` per cluster through a `ManagedClusterView`:
   `internal/controller/drplacementcontrol_controller.go:getVRGsFromManagedClusters` and
   `internal/controller/util/mcv_util.go:GetVRGFromManagedCluster`.
6. `internal/controller/volumereplicationgroup_controller.go:updateVRGDataReadyCondition`
   (L2113-L2116) aggregates the VolRep sub-result.
7. `internal/controller/vrg_volrep.go:aggregateVolRepDataReadyCondition` (L3163-L3243) walks every
   protected PVC and requires a `DataReady` condition; an error in any of them makes the group error.
8. `vrg_volrep.go:validateVRStatus` (L1882-L1888) then `validateVRCompletedStatus` (L1935, L1958):
   when the VolumeReplication `Completed` condition is not true, every PVC gets
   `DataReady` = Error with the VolumeReplication message.
9. `internal/controller/volumereplicationgroup_controller.go:processAsPrimary` (L1486-L1528) is the
   ordering point: it restores PV/PVC records first (`shouldRestoreClusterData`), then computes
   readiness, then runs the kube-object restore. It returns before the kube-object step when
   `isConditionDataReady()` is false (L2099-L2100).
10. `internal/controller/vrg_kubeobjects.go:kubeObjectsRecover` (L796-L847) is the restore that
    recreates the VirtualMachine and DataVolumes. This is the step that never ran in this record.
11. `csi-addons/kubernetes-csi-addons`
    `internal/controller/replication.storage/volumereplication_controller.go:resyncVolume`
    (L662-L675) writes the failure condition on a driver error, through
    `status.go:setFailedResyncCondition` (L229-L251): `Completed=False`, reason `FailedToResync`,
    plus `Degraded=True/Error` and `Resyncing=False/FailedToResync`.
12. `dell/csi-powerstore` `pkg/controller/csiaddons_replication.go:resyncVolumeForVolume`
    (L1609-L1620), `case gopowerstore.RsStateFailedOver`, `if localIsPrimary`: executes
    `ExecuteAction(..., RsActionReprotect, nil)`, returns the raw error on failure, and returns
    `ResyncVolumeResponse{Ready: false}` on success.

Retry: csi-addons requeues a failed resync (15 s while Secondary, 30 s when not ready) and the hub
re-runs the readiness check every 5 minutes while the DRPC is `FailingOver`, so the reprotect call
was repeated while the peer array stayed off.

## What the record does not establish

- Whether the stall clears when VSA-B returns. No array recovery is recorded.
- Whether four concurrent failovers affected any of the observed conditions.
- That the deployed csi-powerstore and Ramen builds match upstream `main`.
- The exact trigger that drives a promoted (Primary) VolumeReplication into the resync path. The
  driver log shows `ResyncVolume ... local is Source`, so the call happened; the controller path
  that reaches it from this DRPC action was not traced.
- Zero data loss. The writer was not quiesced and no post-recovery row count is recorded.

## Comparison to earlier runs

Every earlier site-down run in this lab suspended only the source cluster's node VMs and left both
arrays running (`virtdr-342/trace.md` line 37). Those completed. This run is the first in the record
with the source array powered off, and the attachment states that explicitly.

## Notes for reuse

- `src/peer-array-gate/evidence.json` was written by hand because `tools/evidence.py` keys the
  output directory to a Jira ticket key. The two attachments were downloaded with the same REST
  endpoint the tool uses.
- The conditions dump is kept in `public/evidence/peer-array-gate/` (git-ignored) and is not
  committed. Only `evidence.json` and this file are committed.
