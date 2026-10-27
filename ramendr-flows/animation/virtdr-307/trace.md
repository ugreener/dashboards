# VIRTDR-307: controller trace for the stuck planned failover

Source trace only. No cluster access, no Jira attachments. Everything below is read
from upstream Git history, not from the running system.

## 0. Refs read (pinned)

| Label      | Repository                                  | Ref            | Commit                                     | Date               |
| ---------- | ------------------------------------------- | -------------- | ------------------------------------------ | ------------------ |
| RAMEN_MAIN | github.com/RamenDR/ramen                    | `main`         | `b2baa4069f7769be3e5627b74dec11c1fdf9099e` | 2026-10-25         |
| RAMEN_422  | github.com/red-hat-storage/ramen            | `release-4.22` | `dd1b6f531f7d6159d9dcc4405b18c771b878a284` | 2026-10-01         |
| CSIADDONS  | github.com/csi-addons/kubernetes-csi-addons | `main`         | `0beac9344b314818ddba13043c55535b010390ac` | 2026-10-26         |
| K8S        | github.com/kubernetes/kubernetes            | `v1.36.5`      | tag                                        | supplementary only |

`RAMEN_422` is included because the reported build is Ramen `v4.22.0-86.stable` from
ODF 4.22.4-rhodf, which is built downstream from `red-hat-storage/ramen`
`release-4.22`, not from `RamenDR/ramen` `main`. The two refs differ in ways that
matter here, so every step below gives the `main` location and, where it differs,
the 4.22 location. Sections that exist only in `main` are labelled MAIN-ONLY.

`K8S` is cited only for the PersistentVolume binding rules. No Ramen or csi-addons
code performs binding, so the outcome at the PVCs cannot be explained without it.

Terms used below:

- PV: PersistentVolume, the cluster-wide object that represents the storage.
- PVC: PersistentVolumeClaim, the namespaced request that a pod uses.
- VRG: VolumeReplicationGroup, Ramen's per-application object.
- VGR: VolumeGroupReplication, the csi-addons object that groups several volumes.
- VGRC: VolumeGroupReplicationContent, the csi-addons object that holds the group handle and the volume list.
- VR: VolumeReplication, the csi-addons object for one volume or one group.
- DRPC: DRPlacementControl, the hub object that drives failover.
- claimRef: the field on a PV that says which PVC owns it.
- volumeHandle: the CSI identifier of the storage image behind a PV.

## 1. What the hub DRPC does on Failover

### 1.1 Entry

1. `internal/controller/drplacementcontrol.go:executeAction` (RAMEN_MAIN 188-198,
   RAMEN_422 equivalent) switches on `spec.action`. `Failover` goes to `RunFailover`.
2. `internal/controller/drplacementcontrol.go:RunFailover` (RAMEN_MAIN 430-510,
   RAMEN_422 708). Two branches matter:
   - `vrgExistsAndPrimary(failoverCluster)` at MAIN 456 (4.22 734, same structure):
     the VRG on the target is already Primary, so the DRPC only waits.
   - otherwise `switchToFailoverCluster()` at MAIN 509.
3. `internal/controller/drplacementcontrol.go:switchToFailoverCluster` (MAIN 621-677,
   4.22 899). It sets `DRState(FailingOver)`, sets `Available` using
   `getConditionStatusForTypeAvailable()`, sets `PeerReady=False` with reason
   `NotStarted` and message `Started failover to cluster "<name>"` (MAIN 627-629),
   then calls `retainClusterDecisionAsFailover` and `switchToCluster` (MAIN 654-657).
4. `internal/controller/drplacementcontrol.go:getConditionStatusForTypeAvailable`
   (MAIN 2936-2948) returns `False` while the DRPC phase is one of `Initiating`,
   `Deploying`, `FailingOver`, `Relocating` (`isInProgressingPhase`, MAIN 2963-2975),
   True for `Deployed`, `FailedOver`, `Relocated` (`isInFinalPhase`,
   MAIN 2949-2960), and `Unknown` otherwise. So the `Available=False` write at
   MAIN 660-661 happens only while the phase is `FailingOver`.

### 1.2 The DRPC tells the target cluster to become Primary

5. `internal/controller/drplacementcontrol.go:switchToCluster` (MAIN 1473-1502,
   4.22 1763) calls `createVRGManifestWorkAsPrimary(targetCluster)`.
6. `internal/controller/drplacementcontrol.go:createVRGManifestWorkAsPrimary`
   (MAIN 1504-1537) either updates the existing VRG manifest work to
   `replicationState: Primary` (MAIN 1521, via `updateVRGState`) or creates it
   (MAIN 1531). This is the single instruction that turns the secondary VRG into a
   restoring Primary. Everything in part 2 is a consequence of this one field change.
7. If the manifest work was created or updated, `switchToCluster` sets progression
   `ProgressionWaitingForResourceRestore` and returns
   `ErrWaitForAppResourceRestoreToComplete` (MAIN 1481-1486). That error is the
   literal string `waiting for App resources to be restored`, defined at MAIN 61.

### 1.3 The gate that keeps it in WaitForReadiness

8. On later reconciles the VRG on the target is already Primary, so `RunFailover`
   takes the first branch (MAIN 456). It calls `checkReadiness(failoverCluster)` at
   MAIN 468. If that returns false it sets progression `ProgressionWaitForReadiness`
   (MAIN 471) and returns without touching `Available` (MAIN 473).
9. `internal/controller/drplacementcontrol.go:checkReadiness` (MAIN 1355-1364,
   4.22 1645) is the exact gate. It requires all three of:
   - `DataReady` condition is `True` and its `observedGeneration` equals the VRG
     generation (`isVRGConditionMet`, MAIN 1366-1390),
   - `ClusterDataReady` condition is `True` with the same generation check,
   - `vrg.Status.State == PrimaryState`.
10. `isVRGConditionMet` (MAIN 1366-1390, 4.22 1656) shows the precise comparison:
    `condition.Status == True && condition.ObservedGeneration == vrg.Generation`.
    A condition that is `Unknown`, or `True` but stale, fails the gate.

This explains the observed combination exactly. `phase=FailedOver` comes from
MAIN 458 (`setDRState(rmn.FailedOver)` in the already-primary branch) and
`progression=WaitForReadiness` comes from MAIN 471. `Available=False` with the
"waiting for App resources to be restored" text is left over from an earlier
reconcile that took MAIN 659-665, where `switchToFailoverCluster` recorded the error
returned by `switchToCluster`. That earlier reconcile ran while the phase was
`FailingOver`, which is the only phase in which that write produces `False`. Once
the VRG exists as Primary, the branch at MAIN 456 to 474 only writes `Available` on
success (MAIN 476), so the older `False` and its message persist unchanged even
though `FailedOver` is now a final phase. `PeerReady=False` comes from MAIN 627-629
and is likewise never updated while the wait continues.

MAIN-ONLY note: RAMEN_MAIN has `hasGlobalVGRLabel` and group-consensus waits
(MAIN 505-507). Nothing in the source indicates those matter for a plain
two-cluster planned failover.

## 2. What the secondary VRG does after it is told to become Primary

### 2.1 Restore order in the source (this differs from the premise)

The task statement assumed the order "VGRs/VGRCs from S3, then PVs/PVCs, then
binding". The source order is the reverse for the objects, and there is no Ramen
"binding" step at all.

`internal/controller/volumereplicationgroup_controller.go:clusterDataRestore`
(RAMEN_MAIN 741-776, RAMEN_422 718-753) runs, in this order:

| Order | Call                              | RAMEN_MAIN | RAMEN_422 |
| ----- | --------------------------------- | ---------- | --------- |
| 1     | `restorePVsAndPVCsForVolSync`     | 744        | 721       |
| 2     | `restorePVsAndPVCsForVolRep`      | 751        | 728       |
| 3     | `restoreVGRsAndVGRCsForVolRep`    | 766        | 743       |
| 4     | `setVRGClusterDataReadyCondition` | 773        | 750       |

Inside step 2, PVs are restored before PVCs
(`restorePVsAndPVCsFromS3`, MAIN 2582-2640, 4.22 2413: `restorePVsFromObjectStore`
at MAIN 2608 then `restorePVCsFromObjectStore` at MAIN 2620).
Inside step 3, VGRCs are restored before VGRs
(`restoreVGRsAndVGRCsFromS3`, MAIN 1205-1256, 4.22 1116-1167: VGRC restore at
MAIN 1231 / 4.22 1142, VGR restore at MAIN 1236 / 4.22 1147, and the two counts must
match at MAIN 1237 / 4.22 1148).

So a restored PV cannot depend on the group being restored first. The group objects
are restored last, and a failure at step 2 means step 3 never runs in that reconcile
because `clusterDataRestore` returns at MAIN 755.

Binding is not performed by Ramen. After Ramen has both the PV and the PVC objects
in place, the Kubernetes persistent volume controller binds them. Section 3 covers
what that controller does with what Ramen wrote.

### 2.2 Preconditions inside the VRG

1. `internal/controller/volumereplicationgroup_controller.go` reconcile switch
   (MAIN 697-703) sends a VRG with `spec.replicationState: Primary` to
   `processAsPrimary`.
2. `internal/controller/volumereplicationgroup_controller.go:processAsPrimary`
   (MAIN 1500-1581, 4.22 1474): at MAIN 1513 it asks
   `shouldRestoreClusterData()` and at MAIN 1516 calls `clusterDataRestore`. If that
   returns an error, MAIN 1518 calls `clusterDataError(err, "Failed to restore PVs/PVCs", ...)`
   and returns immediately. Nothing later in `processAsPrimary` runs, so the VRG
   never reaches the workloads, the kube objects, or the ready-state code.
3. `internal/controller/volumereplicationgroup_controller.go:shouldRestoreClusterData`
   (MAIN 1582-1628, 4.22 1556). It returns true whenever `ClusterDataReady` is
   missing, or is not `True`, or is `True` with an older generation and a reason
   other than `ClusterDataRestored`. Because the previous life of the VRG was
   Secondary, its condition reason was `ClusterDataUnused`
   (`setVRGClusterDataReadyConditionUnused`, MAIN 349-357, set from
   `resetInitialStatusAsSecondary`, MAIN 1838-1874), so the first Primary reconcile
   always attempts a full restore. A VRG stuck with `ClusterDataReady=False` retries
   the restore on every reconcile, forever.
4. Each retry re-runs the same failure. That is the loop that pins the DRPC.

### 2.3 Restoring PVs

`internal/controller/vrg_volrep.go:restorePVsFromObjectStore` (MAIN 2642-2661,
4.22 2473): downloads the PV list with `downloadPVs` (`s3utils.go:521`), runs
`checkPVClusterData` (MAIN 2704-2726, 4.22 2525) to reject two PVs that claim the
same PVC name, then calls `restoreClusterDataObjects` with `v.cleanupPVForRestore`
and `v.validateExistingPV`.

`restoreClusterDataObjects` (MAIN 2758-2810, 4.22 2579-2631) is the generic loop:

- MAIN 2777 `cleanupForRestore(objectCopy)` mutates the object downloaded from S3.
- MAIN 2784 `addRestoreAnnotation` writes the annotation
  `volumereplicationgroups.ramendr.openshift.io/ramen-restore: "True"`
  (`RestoreAnnotation` and `RestoredByRamen`, `volumereplicationgroup_controller.go`
  MAIN 607-608, written by `addRestoreAnnotation` at MAIN 2968-2974).
- MAIN 2786 `Create`. If the object already exists, MAIN 2788 calls
  `handleExistingObject`.
- MAIN 2795-2797: any other create error is logged as `Failed to restore` and the
  loop continues with the next object. A failure on one PV does not stop the others.
- MAIN 2803-2805: if `numRestored != len(objList)` it returns
  `failed to restore all %T. Total/Restored %d/%d`. This is the exact format of the
  reported `Total/Restored 8/1`.

`internal/controller/vrg_volrep.go:cleanupPVForRestore` (MAIN 3031-3062,
4.22 2857-2877) is where the two decisive field rewrites happen:

- MAIN 3032 clears `ResourceVersion`.
- MAIN 3033-3037: if `spec.claimRef` exists, it clears `claimRef.uid`,
  `claimRef.resourceVersion` and `claimRef.apiVersion`, and keeps name and namespace.
  A PV with a name-only claimRef is what Kubernetes calls pre-bound.
- MAIN 3042-3048: it replaces `spec.csi.volumeHandle` **only** if the PV carries the
  annotation `ramendr.openshift.io/destination-volume-handle`
  (`destinationVolumeHandleAnnotation`, MAIN 45, 4.22 45) and the value is non-empty.
  If the annotation is absent, the archived handle is written back unchanged.
- MAIN 3055 calls `updatePVClusterIDForRestore` (MAIN 3063-3084), which rewrites
  `volumeAttributes.clusterID` from the target StorageClass. This call is MAIN-ONLY
  and has no equivalent in the 4.22 version of the function (2857-2877), so a
  4.22-restored PV keeps the source cluster's `clusterID` attribute as well as the
  source `volumeHandle`.

`internal/controller/vrg_volrep.go:validateExistingPV` (MAIN 2833-2891, 4.22 2654)
decides what happens when the PV already exists:

- If the existing PV is `Bound` (MAIN 2841) it validates that the claim exists and
  that `pvMatches` and returns, without updating anything (MAIN 2856-2862).
- If the existing PV is not Bound, in async mode it is accepted as long as it carries
  the restore annotation (MAIN 2877-2884), again with no update.
- Therefore, in async mode, Ramen never re-runs `cleanupPVForRestore` on a PV that
  already exists. An existing PV keeps whatever claimRef UID it already had. (Sync
  mode is the exception, at MAIN 2869-2872, and it is not the mode in this report.)

### 2.4 Restoring PVCs, and where an unbound PVC is tolerated

`internal/controller/vrg_volrep.go:restorePVCsFromObjectStore` (MAIN 2663-2703,
4.22 2494) downloads the PVC list, appends it to `v.volRepPVCs`, and calls
`restoreClusterDataObjects` with `cleanupPVCForRestore` and `v.validateExistingPVC`.

- `cleanupPVCForRestore` (MAIN 3086-3102, 4.22 2879-2887) clears annotations via
  `PruneAnnotations`, clears finalizers, resourceVersion, ownerReferences and the
  PVC `uid`. It keeps `spec.volumeName`, which is the pre-binding to the PV.
- `PruneAnnotations` (`volumereplicationgroup_controller.go`, MAIN 2932-2962,
  4.22 2887) drops every annotation whose key starts with `pv.kubernetes.io`,
  `volume.kubernetes.io`, `replication.storage.openshift.io`,
  `volumereplicationgroups.ramendr.openshift.io` or `volsync.backube`. This includes
  `pv.kubernetes.io/bind-completed`. The removal matters in section 3.

The tolerance point named in the task:

- `internal/controller/vrg_volrep.go:validateExistingPVC` (MAIN 2892-2922,
  4.22 2713). MAIN 2901-2903: if the existing PVC is not `Bound`, it returns
  `PVC <ns/name> exists and is not bound (phase: <phase>)`.
- `internal/controller/vrg_volrep.go:handleExistingObject` (MAIN 2728-2756,
  4.22 2549). MAIN 2739-2743 logs
  `Object exists. Ignoring and moving to next object` with the validation error and
  returns false, so the object is not counted as restored. The reconcile is not
  aborted and no error is raised for that object.
- Back in `restoreClusterDataObjects`, the object is skipped and the count stays
  short, so MAIN 2803-2805 produces the `Total/Restored` error for the whole list.

This is the deadlock in one place: a PVC that exists but is not yet bound is not
counted as restored, the VRG reports `ClusterDataReady=False`, and the next reconcile
tries again and hits the same state. A PVC can only become bound if the PV controller
binds it, which is section 3.

The other tolerance point is `restorePVsAndPVCsFromS3` MAIN 2620-2626 (4.22 2451-2457):
when the PV count and PVC count differ it logs
`Warning: Mismatch in PV/PVC count %d/%d` and moves on to the next S3 profile. That
warning is expected whenever one side restores a different number of objects, which
is exactly this failure.

### 2.5 Restoring VGRC and VGR

`internal/controller/vrg_volgrouprep.go:restoreVGRsAndVGRCsForVolRep`
(MAIN 1176-1203, 4.22 1087). MAIN 1177-1179 returns immediately unless
`rmnutil.IsCGEnabledForVolRep` reports that the peer class asks for grouping. With
`replication.storage.openshift.io/flatten-mode: force` and a peer class reporting
`grouping: true`, this path is active, per the DRPolicy/peer class described in the
report. That last step is a configured-input fact, not a source fact.

- `restoreVGRCsFromObjectStore` (MAIN 1258-1277, 4.22 1169) downloads with
  `downloadVGRCs` (`s3utils.go:499`), runs `checkVGRCClusterData`, and calls
  `restoreClusterDataObjects` with `v.cleanupVGRCForRestore` and
  `v.validateExistingVGRC`.
- `restoreVGRsFromObjectStore` (MAIN 1279-1290, 4.22 1190) is the same for VGRs with
  `downloadVGRs` (`s3utils.go:510`), `v.cleanupVGRForRestore`, `v.validateExistingVGR`.
- `validateExistingVGRC` (MAIN 1316-1327, 4.22 1227-1238) only rejects an object that
  is being deleted. `validateExistingVGR` (MAIN 1329-1352, 4.22 1240-1263) also
  requires the existing VGR to point at the same VGRC name.

`internal/controller/vrg_volgrouprep.go:cleanupVGRCForRestore` is where the two refs
diverge sharply:

- RAMEN_422 1265-1270: clears `ResourceVersion`, sets
  `spec.volumeGroupReplicationRef = nil`, then only applies secrets. It does **not**
  touch `spec.volumeGroupReplicationHandle` and does **not** touch
  `spec.volumeGroupAttributes`.
- RAMEN_MAIN 1354-1385: also rewrites `spec.volumeGroupReplicationHandle` from the
  annotation `ramendr.openshift.io/destination-volume-group-handle`
  (`destinationVolumeGroupHandleAnnotation`, MAIN 31) at MAIN 1361-1368, rewrites
  each entry of `spec.source.volumeHandles` from `status.persistentVolumeMappingList`
  at MAIN 1370-1372 (`updateVGRCVolumeHandlesForRestore`, MAIN 1386-1411), and
  rewrites `volumeGroupAttributes.clusterID` at MAIN 1374-1376
  (`updateVGRCClusterIDForRestore`, MAIN 1412-1434).

Consequence, source-level: in the 4.22 build the VGRC is recreated on the target with
the **source cluster's** group handle, the source volume handles and the source
clusterID. In `main` that is repaired from the annotation and the mapping list, but
only if those values were captured on the source before archiving.

`cleanupVGRForRestore` (MAIN 1436-1450, 4.22 1272-1286) prunes annotations, clears
finalizers, resourceVersion and ownerReferences and sets the controller reference to
the restoring VRG. It does not change `spec.replicationState`.

### 2.6 The three functions that rewrite destination handles

All three run on the **source (primary)** cluster, before the objects are uploaded to
S3. They are how the target is supposed to learn the target-side identifiers.

1. `internal/controller/vrg_volgrouprep.go:annotateWithDestinationVolumeHandleForVolGroupRep`
   (MAIN 1022-1064, 4.22 995-1034). Called from
   `reconcileVolGroupRepsAsPrimary` at MAIN 69 (4.22 61) for every PVC in the group,
   immediately before `uploadPVandPVCtoS3Stores` at MAIN 78. It fetches the VGR,
   calls `destinationInfoAvailableOrSkip` (MAIN 1043), gets the VGRC
   (`getVGRCFromVGR`, MAIN 1053) and then calls `findAndApplyPVMapping` (MAIN 1060).
2. `internal/controller/vrg_volgrouprep.go:findAndApplyPVMapping`
   (MAIN 1135-1152, 4.22 1042-1059). Walks
   `vgrc.Status.PersistentVolumeMappingList` looking for an entry whose `Name` equals
   the PV name. If no entry exists it returns
   `no persistent volume mapping for PV <name> in VolumeGroupReplicationContent <name>`
   (MAIN 1150-1151). If the entry exists but `DestinationVolumeHandle` is empty it
   returns `destination volume ID is empty for VGR <name>` (MAIN 1143-1145).
   Otherwise it calls `applyDestinationVolumeHandleToPV`.
3. `internal/controller/vrg_volrep.go:applyDestinationVolumeHandleToPV`
   (MAIN 819-842, 4.22 815-838). Writes
   `ramendr.openshift.io/destination-volume-handle` on the PV (MAIN 830) and deletes
   `vr-archived` from the PV (MAIN 831) so that the same reconcile re-uploads it.

MAIN-ONLY companion: `annotateWithDestinationVolumeGroupHandle` (MAIN 1065-1103) and
`findAndApplyVolumeGroupHandle` (MAIN 1104-1134) do the same for the group handle on
the VGRC. Neither function, and neither annotation key
(`destinationVolumeGroupHandleAnnotation`), exists in RAMEN_422. A trace that cites
`findAndApplyVolumeGroupHandle` describes `main`, not the build in this incident.

The gate inside all of these is
`internal/controller/vrg_volrep.go:destinationInfoAvailableOrSkip` (MAIN 791-818,
4.22 790-812):

- condition `DestinationInfoAvailable` missing: it logs and returns `(false, nil)`, so
  the caller silently skips and no annotation is written.
- condition present but not `True`: it returns an error, the caller logs, requeues,
  and no annotation is written.
- only `True` lets the annotation happen.

On the csi-addons side that condition is produced from the driver:

- `internal/controller/replication.storage/volumegroupreplicationcontent_controller.go:updateReplicationDestinationInfo`
  (CSIADDONS 279-309) fills `status.destinationVolumeGroupID` and each
  `status.persistentVolumeMappingList[i].destinationVolumeHandle` from the driver's
  `GetReplicationDestinationInfo` response. It returns false if the response has no
  group destination, no group ID, or a source handle with no destination mapping.
- `internal/controller/replication.storage/volumegroupreplication_controller.go:updateReplicationDestinationCondition`
  (CSIADDONS 864-892) sets `DestinationInfoAvailable=True` only when every PV in the
  group has a mapping with a non-empty destination handle. Otherwise it sets the
  pending condition.
- `supportsGetReplicationDestinationInfo` (CSIADDONS 894-915) requires the driver to
  advertise the `GET_REPLICATION_DESTINATION_INFO` capability. If it does not, the
  condition is never created at all, and Ramen takes the silent-skip path above.

`uploadPVandPVCtoS3Stores` (MAIN 721-777, 4.22 720-776) is the upload step. Note MAIN 728
`isArchivedAlready(pvc, log)` (MAIN 693-711): if the PV and PVC already carry a
matching `vr-archived` value, the upload is skipped. The only code that clears that
annotation to force a re-upload is `applyDestinationVolumeHandleToPV` (MAIN 831) and
`findAndApplyVolumeGroupHandle` (MAIN 1121). So an archive that was written while
destination info was unavailable stays without handles until something explicitly
re-annotates the PV. There is no periodic re-archive of an unchanged PV.

### 2.7 What the target-side group objects then do

The restored VGR keeps `spec.replicationState: primary`, because Ramen archived it
while it was Primary (`createOrUpdateVGR` is called with `volrep.Primary` at
`vrg_volgrouprep.go:739`, and sets `volRep.Spec.ReplicationState = state` at MAIN 852).

On the target, csi-addons acts on that:

- `internal/controller/replication.storage/volumegroupreplicationcontent_controller.go:Reconcile`
  reads `groupID := instance.Spec.VolumeGroupReplicationHandle` (CSIADDONS 124). If
  `groupID` is empty it calls `CreateVolumeGroup` and writes the returned group id
  back into the spec (CSIADDONS 188-203). If `groupID` is **not** empty it calls
  `ModifyVolumeGroupMembership(groupID, instance.Spec.Source.VolumeHandles, ...)`
  (CSIADDONS 204-210) instead. A restored 4.22 VGRC has a non-empty group id taken
  from the source cluster (section 2.5), so this branch is the one that runs on the
  target.
- `internal/controller/replication.storage/volumegroupreplication_controller.go:createOrUpdateVolumeReplicationCR`
  (CSIADDONS 816-841) copies `vgr.Spec.ReplicationState` into the group VR at
  CSIADDONS 835, then at CSIADDONS 340
  (`instance.Status.VolumeReplicationStatus = vrObj.Status`) the VGR simply mirrors
  the VR's status, including its state and its conditions.
- `internal/controller/replication.storage/utils.go:GetCurrentReplicationState`
  (CSIADDONS 49-55) maps an empty status state to `UnknownState`. So a group VR that
  never completed promotion reports `state: Unknown`, and the VGR copies that
  `Unknown` verbatim.

This is why `VGR status.state=Unknown` carries no independent information. It is the
group VR's state, echoed.

The `Replicating` condition on the group VR is set from the driver error string:

- `volumereplication_controller.go` CSIADDONS 447-481: for a Primary VR it calls
  `getVolumeReplicationInfo`. On a non-unimplemented error it calls
  `setReplicationCondition(..., err.Error(), UNKNOWN)` at CSIADDONS 475 and returns
  the error.
- `internal/controller/replication.storage/status.go:setUnknownReplicationCondition`
  (CSIADDONS 255-266) composes the message as
  `<source> replication status is unknown: <statusMessage>`.

So the reported text `failed to get last sync info: no snapshot details: last sync
time not found` is the `statusMessage` tail, that is, the driver's gRPC error string.
Neither pinned repo contains that string. See section 5.

## 3. Why the restored PVs keep the primary handle and a null claimRef UID, and why that ends in Lost and ClaimMisbound

### 3.1 The null claimRef UID is intentional

`cleanupPVForRestore` MAIN 3033-3037 (4.22 2859-2863) clears `claimRef.uid` on every
PV it writes. That is deliberate: the PVC on the target will have a new UID, and a PV
whose claimRef carries the old UID would be permanently unusable. Kubernetes has a
name for the resulting state. In `syncVolume` (K8S `pv_controller.go` 586-598), a PV
with a non-nil claimRef and an empty `claimRef.UID` is logged as
`volume is pre-bound to claim` and kept in phase `Available` (K8S 588-596). That
matches the observed six PVs exactly: phase `Available`, `claimRef.uid` null.

### 3.2 The primary handle survives for one reason: the annotation was absent

`cleanupPVForRestore` only substitutes the handle when
`ramendr.openshift.io/destination-volume-handle` is present (MAIN 3042-3048,
4.22 2868-2874). The annotation is only written by `applyDestinationVolumeHandleToPV`
(MAIN 830), which is only reached through `findAndApplyPVMapping` (MAIN 1147), which
is only reached when the VGR reports `DestinationInfoAvailable=True`
(MAIN 1043-1051). With the annotation absent, the PV is created on the target with
the archived `spec.csi.volumeHandle` unchanged, which is the primary cluster's image
id. That is exactly the observed `same_handle=true`.

For 4.22 there is a second surviving source value: `volumeAttributes.clusterID`. The
rewrite of that attribute exists only in `main` (`updatePVClusterIDForRestore`,
MAIN 3063-3084) and is absent from `cleanupPVForRestore` at 4.22 2857-2877.

Source-provable statement: given a PV archived without the destination-handle
annotation, this code will restore it with the source handle. It is not possible for
this code to do otherwise.

### 3.3 Why binding does not simply complete

After Ramen has written both objects, the Kubernetes PV controller decides. The
decision tree in K8S `pkg/controller/volume/persistentvolume/pv_controller.go` is:

- `syncClaim` (K8S 238-257) sends a PVC to `syncBoundClaim` only if it carries
  `pv.kubernetes.io/bind-completed`, otherwise to `syncUnboundClaim`.
- `PruneAnnotations` (RAMEN_MAIN 2941-2942) removes every `pv.kubernetes.io/*`
  annotation from the PVC that Ramen restores, so a freshly restored PVC goes to
  `syncUnboundClaim`.
- In `syncUnboundClaim`, the `claim.Spec.VolumeName != ""` branch (K8S 411-488) looks
  up the PV. If the PV is missing it sets the PVC to `Pending` and retries later
  (K8S 419-427, log text `volume requested and not found, will try again next time`).
  If the PV is found, the test is
  `IsVolumeBoundToClaim` (`component-helpers/storage/volume/pv_helpers.go` 159-170),
  which returns true when name and namespace match and **either** the PV claimRef UID
  is empty **or** it equals the PVC UID (K8S `pv_helpers.go` 166). An empty UID
  therefore counts as a match, and `bind()` completes. This is the intended Ramen
  restore path and it works when both objects are present.
- The `Lost` plus `ClaimMisbound` outcome comes from the **other** branch.
  `syncBoundClaim` (K8S 493-557): if `claim.Spec.VolumeName` is empty it sets `Lost`
  with `ClaimLost`. If the named PV does not exist it sets `Lost` with `ClaimLost`
  (K8S 512-517). If the PV exists but `volume.Spec.ClaimRef.UID != claim.UID`
  (K8S 536-555) it sets the claim to `Lost` and emits exactly
  `ClaimMisbound` with `Two claims are bound to the same volume, this one is bound
  incorrectly` (K8S 551).

`Lost` plus `ClaimMisbound` is therefore only reachable for a PVC that the controller
treats as already bound, that is one carrying `pv.kubernetes.io/bind-completed`, whose
named PV exists, and whose PV claimRef UID is empty or different. The six observed
PVCs fit that shape. The two `Pending` PVCs fit the missing-PV branch at K8S 419-427,
which also matches the two PVs that are absent entirely.

### 3.4 What this means, and what it does not mean

The handle and the claimRef are two separate defects and they fail at two different
layers:

- The null claimRef UID plus a bind-completed PVC produces `ClaimMisbound` and `Lost`.
  This is a pure Kubernetes object-state problem. The CSI driver is not consulted.
- The retained primary `volumeHandle` (and, on 4.22, the retained source `clusterID`)
  does not by itself cause `ClaimMisbound`. It matters one layer lower: once a pod is
  scheduled, the CSI driver is asked to attach a volume by that handle on the target
  cluster, where the handle either does not exist or refers to a different image
  state. It also matters for csi-addons, whose group operations take those handles as
  input.

Direction of causality that the source supports: missing destination-handle
annotation leads to an unchanged source handle on the restored PV. It does **not** support the
claim that the handle caused the `Lost`/`ClaimMisbound` events. Those come from the
claimRef UID mismatch described above.

## 4. Why ClusterDataReady stays False and the DRPC never leaves WaitForReadiness

1. `processAsPrimary` calls `clusterDataRestore` (MAIN 1516). On error it calls
   `clusterDataError` (MAIN 1518), which is
   `errorConditionLogAndSet(err, msg, setVRGClusterDataErrorCondition)` at
   `volumereplicationgroup_controller.go:1889-1893`.
2. `setVRGClusterDataErrorCondition` (`status.go` MAIN 360-370, 4.22 393-401) writes
   `ClusterDataReady` with `Status=ConditionFalse`, `Reason=Error` and message
   `"Failed to restore PVs/PVCs: " + err`. The reported text
   `failed to restore PV/PVC for VolRep ... Total/Restored 8/1` is the `err` part of
   that message.
3. `setVRGClusterDataReadyCondition` (the success writer, MAIN 338-348, 4.22 371-379)
   is only reached at MAIN 773, after all three restore steps succeed. It cannot be
   reached on the failing path because MAIN 755 and MAIN 770 return first.
4. `updateStatusState` (`volumereplicationgroup_controller.go` MAIN 1986-2006,
   4.22 1955) then sets `status.state = Unknown` whenever `DataReady` is not `True`
   at the current generation (MAIN 1988-1992). So the VRG's `Unknown` state is a
   downstream symptom of `DataReady` being false, not an independent finding.
5. `DataReady` itself aggregates the per-PVC conditions.
   `aggregateVolRepDataReadyCondition` (`vrg_volrep.go` MAIN 3163-3246, 4.22 2932)
   returns ready only when every non-VolSync protected PVC has a `DataReady`
   condition that is not `Progressing` and not `Error`. With PVCs that cannot bind,
   that aggregate cannot be `True`.
6. On the hub, `checkReadiness` (MAIN 1355-1364) needs `DataReady=True`,
   `ClusterDataReady=True` and `state=Primary`, all with the generation check in
   `isVRGConditionMet` (MAIN 1366-1390). Two of the three are false, so the DRPC sets
   progression `WaitForReadiness` (MAIN 471) and never reaches the `Available=True`
   write at MAIN 476 or `ensureActionTransition` at MAIN 492.

Summary of the loop, in order:

1. A PVC exists on the target but is not Bound.
2. `validateExistingPVC` rejects it, and `handleExistingObject` logs
   `Object exists. Ignoring and moving to next object`.
3. The restored count stays at 1 of 8, so the list returns `Total/Restored 8/1`.
4. `ClusterDataRestored` is never set, so `ClusterDataReady` stays `False` with reason
   `Error`.
5. `DataReady` aggregates to false, so `updateStatusState` sets `state=Unknown`.
6. `checkReadiness` fails, so progression stays `WaitForReadiness`.
7. The reconcile requeues and the sequence repeats from step 1.

## 5. What the source does NOT prove about this run

| #   | Claim                                                                               | Status                  | Why                                                                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The build is exactly `release-4.22` at `dd1b6f5`                                    | UNVERIFIED              | `v4.22.0-86.stable` is a downstream build tag. The branch head read here is 2026-10-01, after the 2026-09-26 event, so the build may sit on an earlier commit on that branch. No tag to commit mapping was read.                                                                                                                           |
| 2   | Which object list produced `Total/Restored 8/1`                                     | UNVERIFIED              | `restoreClusterDataObjects` prints the same format for PVs and PVCs (MAIN 2804), and both lists have 8 entries here. The `%T` type in the log distinguishes them, and that log line was not read. For the message to be the PVC list, the PV pass must have returned no error in the same iteration (MAIN 2608-2611).                      |
| 3   | The six PVCs carried `pv.kubernetes.io/bind-completed`                              | UNVERIFIED but required | `Lost` plus `ClaimMisbound` is only reachable through `syncBoundClaim` K8S 536-555, which requires that annotation. Ramen itself prunes it (MAIN 2941-2942), so something else must have re-added it, that is the PVCs were bound at some earlier point.                                                                                   |
| 4   | Why the PVs are `Available` with a null claimRef while the PVCs are `Lost`          | UNVERIFIED              | The source proves Ramen clears claimRef UID on write (MAIN 3033-3037) and never re-cleans an existing PV (MAIN 2841-2862). The event ordering that left bound PVCs pointing at unbound PVs is not in the source and needs the object timelines.                                                                                            |
| 5   | The seven unbound PVCs were created by ArgoCD or KubeVirt rather than by Ramen      | UNVERIFIED              | Ramen restored one PVC of eight (per the reported count). Who created the other seven, and when, is a runtime fact.                                                                                                                                                                                                                        |
| 6   | The two missing PVs were deleted after the failing reconcile                        | UNVERIFIED inference    | `Total/Restored 8/1` for the PVC list requires the PV pass to have succeeded, which requires all 8 PVs to have validated at that moment. Their later absence is a subsequent event.                                                                                                                                                        |
| 7   | `DestinationInfoAvailable` was `False` versus absent on the primary VGR             | UNVERIFIED              | The two produce different code paths (error and requeue at MAIN 804-809 versus silent skip at MAIN 797-801) but the same outcome, no annotation. Which one occurred needs the primary VGR status.                                                                                                                                          |
| 8   | The annotation was ever written and later lost                                      | UNVERIFIED              | `PruneAnnotations` does not strip `ramendr.openshift.io/*` (MAIN 2939-2951), so a written annotation should survive to S3. The reported PVs have no such annotation, which is consistent with "never written" but does not prove it.                                                                                                       |
| 9   | The target csi-addons called `ModifyVolumeGroupMembership` with the source group id | UNVERIFIED              | The code path is proven (CSIADDONS 124 and 204-210 with a non-empty restored handle, RAMEN_422 1265-1270 not rewriting it). Whether it ran and what the driver answered needs the target csi-addons logs.                                                                                                                                  |
| 10  | Origin of `no snapshot details: last sync time not found`                           | UNVERIFIED              | Neither RAMEN_MAIN, RAMEN_422 nor CSIADDONS contains that string. Per CSIADDONS 475 and 255-266 the message is the driver's gRPC error, so it belongs to the CSI driver build (ceph-csi via ODF 4.22.4-rhodf), which was not read.                                                                                                         |
| 11  | The `PeerReady=False` reason                                                        | UNVERIFIED              | MAIN 627-629 sets `NotStarted` with `Started failover to cluster ...`. No later code in the waiting branch rewrites it (MAIN 456-474). The reported status does not name the reason.                                                                                                                                                       |
| 12  | `Lost` on exactly the six PVCs whose PVs exist                                      | UNVERIFIED              | The count split (6 Lost with PVs present, 2 Pending with PVs absent) is consistent with K8S 536-555 and K8S 419-427, but per-PVC attribution needs the object list.                                                                                                                                                                        |
| 13  | Volume group restore even ran on the target                                         | UNVERIFIED              | `restoreVGRsAndVGRCsForVolRep` is gated on `IsCGEnabledForVolRep` (MAIN 1177) and is only reached after the PV and PVC steps succeed (MAIN 751-770). If the PVC step kept failing, the group restore never ran in that pass. The reported VGR exists on the target, so it ran at least once, but not necessarily in the failing reconcile. |

## 6. Cite map, main versus 4.22

| Function                                                          | RAMEN_MAIN                                     | RAMEN_422 |
| ----------------------------------------------------------------- | ---------------------------------------------- | --------- |
| `DRPCInstance.RunFailover`                                        | drplacementcontrol.go 430-510                  | 708-788   |
| `DRPCInstance.switchToFailoverCluster`                            | 621-677                                        | 899-955   |
| `DRPCInstance.switchToCluster`                                    | 1473-1502                                      | 1763-1792 |
| `DRPCInstance.createVRGManifestWorkAsPrimary`                     | 1504-1537                                      | 1794-1827 |
| `DRPCInstance.checkReadiness`                                     | 1355-1364                                      | 1645-1654 |
| `DRPCInstance.isVRGConditionMet`                                  | 1366-1390                                      | 1656-1680 |
| `DRPCInstance.getConditionStatusForTypeAvailable`                 | 2936-2948                                      | 3182-3192 |
| `VRGInstance.processAsPrimary`                                    | volumereplicationgroup_controller.go 1500-1581 | 1474-1555 |
| `VRGInstance.shouldRestoreClusterData`                            | 1582-1628                                      | 1556-1602 |
| `VRGInstance.clusterDataRestore`                                  | 741-776                                        | 718-753   |
| `VRGInstance.updateStatusState`                                   | 1986-2006                                      | 1955-1975 |
| `VRGInstance.resetInitialStatusAsSecondary`                       | 1838-1874                                      | 1809-1840 |
| `PruneAnnotations`                                                | 2932-2962                                      | 2887-2912 |
| `VRGInstance.restorePVsAndPVCsForVolRep`                          | vrg_volrep.go 2558-2580                        | 2389-2411 |
| `VRGInstance.restorePVsAndPVCsFromS3`                             | 2582-2640                                      | 2413-2471 |
| `VRGInstance.restorePVsFromObjectStore`                           | 2642-2661                                      | 2473-2492 |
| `VRGInstance.restorePVCsFromObjectStore`                          | 2663-2703                                      | 2494-2524 |
| `VRGInstance.checkPVClusterData`                                  | 2704-2726                                      | 2525-2547 |
| `handleExistingObject`                                            | 2728-2756                                      | 2549-2577 |
| `restoreClusterDataObjects`                                       | 2758-2810                                      | 2579-2631 |
| `VRGInstance.validateExistingPV`                                  | 2833-2891                                      | 2654-2712 |
| `VRGInstance.validateExistingPVC`                                 | 2892-2922                                      | 2713-2743 |
| `VRGInstance.cleanupPVForRestore`                                 | 3031-3062                                      | 2857-2877 |
| `VRGInstance.updatePVClusterIDForRestore`                         | 3063-3084                                      | absent    |
| `VRGInstance.cleanupPVCForRestore`                                | 3086-3102                                      | 2879-2887 |
| `VRGInstance.uploadPVandPVCtoS3Stores`                            | 721-777                                        | 720-776   |
| `VRGInstance.isArchivedAlready`                                   | 693-711                                        | 692-710   |
| `VRGInstance.destinationInfoAvailableOrSkip`                      | 791-818                                        | 790-812   |
| `VRGInstance.applyDestinationVolumeHandleToPV`                    | 819-842                                        | 815-838   |
| `VRGInstance.annotateWithDestinationVolumeHandleForVolGroupRep`   | vrg_volgrouprep.go 1022-1064                   | 995-1034  |
| `VRGInstance.findAndApplyPVMapping`                               | 1135-1152                                      | 1042-1059 |
| `VRGInstance.annotateWithDestinationVolumeGroupHandle`            | 1065-1103                                      | absent    |
| `VRGInstance.findAndApplyVolumeGroupHandle`                       | 1104-1134                                      | absent    |
| `VRGInstance.restoreVGRsAndVGRCsForVolRep`                        | 1176-1203                                      | 1087-1114 |
| `VRGInstance.restoreVGRsAndVGRCsFromS3`                           | 1205-1256                                      | 1116-1167 |
| `VRGInstance.restoreVGRCsFromObjectStore`                         | 1258-1277                                      | 1169-1188 |
| `VRGInstance.restoreVGRsFromObjectStore`                          | 1279-1290                                      | 1190-1201 |
| `VRGInstance.cleanupVGRCForRestore`                               | 1354-1385                                      | 1265-1270 |
| `VRGInstance.updateVGRCVolumeHandlesForRestore`                   | 1386-1411                                      | absent    |
| `VRGInstance.updateVGRCClusterIDForRestore`                       | 1412-1434                                      | absent    |
| `VRGInstance.cleanupVGRForRestore`                                | 1436-1450                                      | 1272-1286 |
| `setVRGClusterDataReadyCondition`                                 | status.go 338-348                              | 371-379   |
| `setVRGClusterDataErrorCondition`                                 | 360-370                                        | 393-401   |
| `aggregateVolRepDataReadyCondition`                               | vrg_volrep.go 3163-3246                        | 2932-3015 |
| `downloadVGRCs` / `downloadVGRs` / `downloadPVs` / `downloadPVCs` | s3utils.go 499 / 510 / 521 / 532               | same file |

csi-addons cite map (CSIADDONS `main` at `0beac93`):

| Function                                            | File:lines                                         |
| --------------------------------------------------- | -------------------------------------------------- |
| `VolumeGroupReplicationReconciler.Reconcile`        | volumegroupreplication_controller.go 116-366       |
| VGR status copied from VR                           | 340                                                |
| `createOrUpdateVolumeReplicationCR`                 | 816-841                                            |
| `updateReplicationDestinationCondition`             | 864-892                                            |
| `supportsGetReplicationDestinationInfo`             | 894-915                                            |
| `VolumeGroupReplicationContentReconciler.Reconcile` | volumegroupreplicationcontent_controller.go 76-278 |
| group id read from spec                             | 124                                                |
| `CreateVolumeGroup` / `ModifyVolumeGroupMembership` | 188-210                                            |
| mapping list build                                  | 220-244                                            |
| `updateReplicationDestinationInfo`                  | 279-309                                            |
| VR info fetch and Unknown condition                 | volumereplication_controller.go 447-481            |
| `setUnknownReplicationCondition`                    | status.go 255-266                                  |
| `GetCurrentReplicationState`                        | utils.go 49-55                                     |
