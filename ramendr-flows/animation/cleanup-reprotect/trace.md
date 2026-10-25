# VIRTDR-360 evidence and controller trace

## Recorded outcome and scope

A discovered application, `hammerdb-win`, was failed over from spoke-0 to spoke-1. The failover and the data checks succeeded. The console then instructed the operator to clean up the application on the old source, spoke-0. Cleanup cascaded to the two source PVCs. The reverse reprotection never ran. The PVCs stayed behind both finalizers, the source VRG stayed `Unknown`, the array sessions stayed `Failed_Over`, and the hub DRPC never reached `Completed`. The application kept running on spoke-1 with no standby copy.

This is one recorded occurrence. The control run, VIRTDR-342, used the same procedure and the same versions and converged because the automatic reverse resync finished before the cleanup reached the claims. The difference was ordering in time, not a different command.

**Deployed-build provenance: UNVERIFIED.** The pinned upstream implementations below were read independently and explain mechanisms consistent with the observations. The supplied evidence does not establish that their exact commits built the running controllers or driver.

## Run evidence

- [Ticket](https://redhat.atlassian.net/browse/VIRTDR-360)
- [Evidence timeline](https://redhat.atlassian.net/rest/api/2/attachment/content/1264708)
- [Hub DR Status popover, WaitOnUserToCleanUp](https://redhat.atlassian.net/rest/api/2/attachment/content/1264717)
- [Protected applications row, WaitOnUserToCleanUp](https://redhat.atlassian.net/rest/api/2/attachment/content/1264716)
- [Hub Ramen operator log](https://redhat.atlassian.net/rest/api/2/attachment/content/1264709)
- [Spoke-0 Ramen cluster operator log](https://redhat.atlassian.net/rest/api/2/attachment/content/1264710)
- [Spoke-0 PowerStore driver log](https://redhat.atlassian.net/rest/api/2/attachment/content/1264711)
- [Spoke-1 PowerStore driver log](https://redhat.atlassian.net/rest/api/2/attachment/content/1264712)
- [Source resources](https://redhat.atlassian.net/rest/api/2/attachment/content/1264713)
- [Target resources](https://redhat.atlassian.net/rest/api/2/attachment/content/1264714)
- [Array sessions and job history](https://redhat.atlassian.net/rest/api/2/attachment/content/1264715)

The phase A postcheck numbers come from VIRTDR-344: measured loss window 576 s of the 900 s objective, 56 complete source minutes recovered with no missing rows, and both disks' last two syncs carried writes.

## Observed timeline

All times UTC on 2026-10-22.

| Time              | Observation                                                                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10:19:33-37       | Site-down simulation: all six spoke-0 node VMs suspended with `virsh suspend`.                                                                                                                           |
| 10:20:17          | Failover initiated through the hub Data Services console, target spoke-1.                                                                                                                                |
| 10:20:24          | PowerStore `Failover replication session` job COMPLETED on VSA-B. Both sessions flip roles, VSA-B becomes Source, and both enter `Failed_Over`.                                                          |
| 10:22             | Target recovery complete: VM Running on spoke-1, target VRG Primary, both target VolumeReplications Primary, PVCs Bound to promoted replica handles. DRPC `phase=FailedOver`, `progression=Cleaning Up`. |
| 10:24             | Hub marks spoke-0 ManagedCluster `Available=Unknown`.                                                                                                                                                    |
| 10:40             | Phase A postcheck with the source down: all data verdicts PASS.                                                                                                                                          |
| 10:54:17-21       | Spoke-0 resumed, all six guests.                                                                                                                                                                         |
| About 11:01-11:05 | Node clocks stepped, ManagedCluster `Available=True` again.                                                                                                                                              |
| 11:07             | DRPC progression at `WaitOnUserToCleanUp`. Console shows "Action needed", "3 of 4 steps completed", and the cleanup instruction for `hammerdb-win-drpc` on spoke-0.                                      |
| 11:08             | Target-side checks verified: VRG Primary, VRs Primary, PVCs Bound, VM Running.                                                                                                                           |
| 11:33:01          | User-authorized source cleanup: source VM deleted, VMI terminates within 60 s.                                                                                                                           |
| 11:34:00          | DataVolumes deleted. The two source PVCs get `deletionTimestamp`. Both carry `volumereplicationgroups.ramendr.openshift.io/pvc-vr-protection` and `replication.storage.openshift.io/pvc-protection`.     |
| 11:35:15          | First `DemoteVolume` execution for these sessions on spoke-0 since the failover: "already secondary (role=Destination, state=Failed_Over)". It is a no-op.                                               |
| After 11:35:15    | No further controller activity on either cluster. No `ResyncVolume` calls in any log. The array job history contains only the 10:20:24 failover job.                                                     |

Stable wedge observed from 11:35 through at least 12:30:

- Source PVCs stuck Terminating behind both finalizers.
- Source VolumeReplications: `spec.replicationState=secondary`, `spec.autoResync=true`, `Completed=True (Demoted)`, `Degraded=True (VolumeDegraded)`, `Resyncing=False (NotResyncing)`.
- Source VRG: `status.state=Unknown`, `DataReady=False` reason `Error` message "All PVCs of the VolumeReplicationGroup are not ready", per-PVC "volume is degraded". Ramen spoke-0 log shows the secondary reconcile ending with `Requeue:false`.
- Hub DRPC: `phase=FailedOver`, `progression` oscillates between `Cleaning Up` and `WaitOnUserToCleanUp`. Hub log: "still waiting for peer to be ready" and "VRG on spoke-0 has not transitioned to secondary yet. Spec-State/Status-State secondary/Unknown".
- Array sessions: role flipped, VSA-B Source, state `Failed_Over`, no data movement, last sync 10:10:45 and 10:12:45.
- Target VolumeReplications: Primary with `autoResync=false`. Target driver polls about every 7.5 minutes, sees `Failed_Over` and reprotect required, takes no action.
- Source PVs: Retain with `vr-archived` and `vr-retained` annotations.

## Intended clean path (pinned upstream source)

Repositories and refs:

- RamenDR/ramen `4191ad115cd48701b2f2fb95b5f623db773bc702`
- csi-addons/kubernetes-csi-addons `eca6e16ba6a5f68a04a10591dc587e4b48132743`
- dell/csi-powerstore `c35ca28883044f240bab36d47e43da3f96f080cd` (CSM v1.18.0)

1. **Hub, failover done.** `RunFailover` sees the target VRG primary and sets `phase=FailedOver`. `ensureActionTransition` (`internal/controller/drplacementcontrol.go:1078`) sets `progression=Cleaning Up` (1081).
2. **Hub demotes the old source.** `ensureCleanupAndSecondaryReplicationSetup` (1106) calls `EnsureCleanup` (1128), which calls `cleanupSecondary` per peer (2387). It sets the source VRG spec to `Secondary` through the ManifestWork (2396) and returns immediately (2412).
3. **Hub waits for the source VRG to report Secondary.** `ensureVRGIsSecondaryOnCluster` (2474) requires `vrg.Status.State == rmn.SecondaryState` and a matching `ObservedGeneration` (2498). `PeerReady` is an output, not the gate.
4. **Source VRG secondary path.** `processPVCAsSecondary` (`internal/controller/vrg_volrep.go:239`) to `updateVR` (1480) sets the VR to `Secondary` with `autoResync=true` (1493). When the spec already matches but the status is not healthy, it returns `Requeue:false` (1486-1489).
5. **csi-addons demotes and resyncs.** Secondary branch (`internal/controller/replication.storage/volumereplication_controller.go:358`): the first pass calls `markVolumeAsSecondary` (363), writes `state=Secondary`, and requeues after 15 s (374). The steady pass calls demote, then `resyncVolume` (377-381) with `force=Spec.AutoResync` (380).
6. **Driver reprotects.** `ResyncVolume` on the side whose role is `Source` with state `Failed_Over` runs `RsActionReprotect` (`pkg/controller/csiaddons_replication.go:1612-1619`), an array job via `ExecuteActionOnReplicationSession` (`replication.go:571`). The next poll returns `Ready:false` while `Reprotecting` or `Synchronizing` (1590), then `Ready:true` at `OK` (1585).
7. **VR becomes healthy.** `setNotDegradedCondition`, VRG `DataReady=True`, VRG `status.state=Secondary`. The hub check at 2498 passes, `cleanupSecondaries` sets `PeerReady=True/Success/"Ready"` (2366), and `ensureActionTransition` sets `Completed` (1099).

## Where the recording diverged

- **D1. Hub progression alternates.** `WaitOnUserToCleanUp` is set at 3225/3230, called from 2443, when the VM auto-cleanup is not `AutoCleanupProgressing` (3123). Each pass re-enters at 1081 (`Cleaning Up`), so status alternates. `startProcessing` persists status even when the action errors (`drplacementcontrol.go:100-112`) and returns `Requeue:true` (689), hence the endless "still waiting for peer to be ready" (2363).
- **D2. Source VRG idles.** `checkResyncCompletionAsSecondary` sees `Degraded=True` and sets per-PVC `DataReady=False/Error/"volume is degraded"` (2040-2048). `updateVR` already found the spec matching, so it returns `(requeue=false, ready=false)` (1486). `reconcilePVCVRAsSecondary` then returns without `undoPVCFinalizersAndPVRetention` (286-289). `Requeue:false` propagates to the reconciler return (`volumereplicationgroup_controller.go:532`). There is no periodic requeue in `processAsSecondary`.
- **D3. The 11:35:15 demote is a no-op.** `markVolumeAsSecondary` hits `localIsSecondary` and returns success with no array action (`csiaddons_replication.go:1310-1313`).
- **D4. The source side cannot resync a Destination session.** On spoke-0 the session is `role=Destination`, `state=Failed_Over`, so `ResyncVolume` can only return `OutOfRange` "waiting for Source-side Resync" (1621-1624). Reprotect is only implementable where role is `Source` (1612), which is the new primary. This flow never puts the new primary into `Secondary` or `Resync`.
- **D5. Both finalizers stay.** Ramen removes `pvc-vr-protection` only in `preparePVCForVRDeletion` (625), reached from `undoPVCFinalizersAndPVRetention` (1167), reached only when the VR is ready. csi-addons removes `pvc-protection` only when the VR object is deleted (274), after `DisableVolumeReplication` succeeds (261).

## Hypothesis check

The bug's earlier hypothesis was that `autoResync` skips a claim that is already deleting. The pinned csi-addons code **does not contain that skip**. The only deletion check is `getPVCDataSource` (`internal/controller/replication.storage/pvc.go:44-47`): it skips only when the PVC has a deletion timestamp **and does not carry** the csi-addons `pvc-protection` finalizer. The recorded PVCs still carried the finalizer, so this check does not fire.

The pinned code also cannot fully produce the recording. The steady-state path always calls `ResyncVolume`, and a resync write would set `Resyncing=True`. The observed per-PVC text is `Degraded=True/VolumeDegraded/"volume is degraded"` with `Resyncing=False`, which only `setDemotedCondition` writes (`status.go:152-175`). So the last VR write was the demote, and the follow-up reconcile never ran.

The controller restart diagnostic (11 minutes, zero activity, not even `GetVolumeReplicationInfo` polling) argues against a lost queue. It does not identify the stop point.

**Status: the exact reason the follow-up reconcile never ran is UNVERIFIED from these refs.**

## What the animation must show

- `DRPC/openshift-dr-ops/hammerdb-win-drpc`: `phase=FailedOver`, `progression` Cleaning Up to WaitOnUserToCleanUp, `PeerReady=True/Success/"Ready"` only at the end.
- Source VRG: `status.state=Unknown` while `DataReady=False`, `AutoCleanup` reason `AutoCleanupProgressing` or `AutoCleanupNotFeasible`.
- ProtectedPVC: `DataReady=False`, `DataProtected=False`, reason `Error`, message `volume is degraded`.
- `VolumeReplication/<pvc>`: `spec.replicationState=Secondary`, `spec.autoResync=true`, `Degraded=True/VolumeDegraded`, `Resyncing=False/NotResyncing`, `Completed=True/Demoted`.
- PVC finalizers `volumereplicationgroups.ramendr.openshift.io/pvc-vr-protection` and `replication.storage.openshift.io/pvc-protection`; VR finalizer `replication.storage.openshift.io`.
- PowerStore session: `Failed_Over`, role Destination, action `Reprotect`, states `Reprotecting` to `OK`.
