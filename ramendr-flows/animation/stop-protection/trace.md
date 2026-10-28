# stop-protection evidence and controller trace

## What this video is

A conceptual mechanism explainer. It teaches why removing DR protection cleans the primary
site and leaves the destination array volume group behind. It is not a recording of a single
run, and it has no screenshots.

## Provenance

**Observed outcome, own lab, no artifacts.** Three stop protection scenarios were run on the
edge lab and written up in the ticket comment. The comment names the clusters and arrays
(`ocp-edge36` hub, `ocp-edge95` and `ocp-edge97` spokes, `VSA-A` and `VSA-B`) and reports the
destination volume group left behind in all three. It attaches no run log, no postcheck, no
array dump and no screenshot. No workload or instance names are recorded for those scenarios.

**Documented mechanism.** Two upstream design issues describe the cause. Ramen issue 2910 gives
the root cause and the three scenarios. csi-addons issue 1180 gives the step table, the
controller behavior that makes a secondary group object unsafe, and the maintainer agreement.

**Source trace.** Read from upstream `RamenDR/ramen@main`,
`csi-addons/kubernetes-csi-addons@main` and `dell/csi-powerstore@v2.18.0` (lines identical on
`main`). Controller and function citations are below.

## Primary side, ordered

1. `VolumeReplicationGroupReconciler.Reconcile` detects deletion
   (`internal/controller/volumereplicationgroup_controller.go:468`, `:685`) and calls
   `processForDeletion()` (`:1328`).
2. `pvcsDeselectedUnprotect()` (`:1668`) runs only for `spec.replicationState == Primary`.
3. `deleteVRGHandleMode()` (`:1407`) calls `reconcileVRsForDeletion()`
   (`vrg_volrep.go:1008`). A PVC carrying `volumereplicationgroups.ramendr.openshift.io/pvc-vr-protection`
   is routed to `addPVCToGroupPVCs` (`vrg_volrep.go:268`) when its consistency group is enabled,
   keyed by `vgrNamespacedName()` (`vrg_volgrouprep.go:725`).
4. `pvcsUnprotectVolGroupRep()` (`vrg_volrep.go:1128`, function `vrg_volgrouprep.go:565`) runs.
   An empty map makes the whole step a no-op.
5. `reconcileVGRForDeletion` (`vrg_volgrouprep.go:591`) reaches `deleteVGR` (`:994`), which calls
   `v.reconciler.Delete` on the `VolumeGroupReplication`. The VGR carries a controller owner
   reference to the VRG (`:977`).
6. The csi-addons `VolumeGroupReplicationReconciler` deletion branch
   (`volumegroupreplication_controller.go:299`) calls `cleanupVR` (`:843`) and then
   `cleanupVGRContent` (`:795`), requeueing every 15 s until the owner annotations clear.
7. Child `VolumeReplication` deletion calls `disableVolumeReplication`
   (`volumereplication_controller.go:698`) to `Replication.Disable()`
   (`replication/replication.go:79`), sending `ReplicationSource_VolumeGroup` with the group ID.
8. `VolumeGroupReplicationContentReconciler` deletion (`volumegroupreplicationcontent_controller.go:139`)
   gates on the owner VGR being deleted (`:141`) and the VR finalizer being gone (`:144`), then
   calls `volumeGroupClient.DeleteVolumeGroup(groupID)` (`:158`) with
   `instance.Spec.VolumeGroupReplicationHandle` (`:124`).
9. The PowerStore driver `DeleteVolumeGroup` (`pkg/controller/csiaddons_replication.go:2786`)
   runs `deleteArrayVolumeGroup` (`:2899`), which pauses the session, removes members, clears the
   protection policy and deletes the group.

## Secondary side, what does not exist

- `processPVCsAsPrimary` (`vrg_volrep.go:118`) and `reconcileVolRepsAsSecondary` (`:203`) build
  `groupPVCs` only from `v.volRepPVCs`. `reconcileVolGroupRepsAsPrimary`
  (`vrg_volgrouprep.go:38`) and its secondary counterpart (`:111`) loop over that map, so zero
  PVCs means zero iterations and `createVGR` (`:893`) is never reached.
- `VolumeGroupReplicationContent` and the child `VolumeReplication` are created only by the
  csi-addons VGR reconciler (`volumegroupreplication_controller.go:250`, `:273`), which runs only
  for an existing VGR. No VGR means no children.
- Caveat: a former secondary can gain VGR and VGRContent during failover, through
  `clusterDataRestore()` and `restoreVGRsAndVGRCsForVolRep()` (`:766`, `vrg_volgrouprep.go:1176`),
  which run from `processAsPrimary()` when cluster data is restored. That does not apply to the
  steady state or to the atomic stop scenario.

## Correction recorded during this trace

The csi-addons issue says the destination group is cleaned by `DeleteVolumeGroup` when a
secondary group object is deleted. The driver source disagrees for a group that is a
replication destination:

- csi-addons calls `DeleteVolumeGroup` with no role check, so the call would be made.
- The PowerStore driver returns early for a destination group
  (`csiaddons_replication.go:2802-2804`, `if vg.IsReplicationDestination` then no-op).
- The destination group is actually removed inside `disableVolumeReplicationForVolumeGroup`
  (`:651`), destination branch (`:722-735`), which also carries the guard
  `destination VG ... still has active replication session ... retry after source-side cleanup`
  (`:703`).

The video therefore teaches the object-level truth (no group object on the destination means no
replication call for that group) and names the destination side of `DisableVolumeReplication`
as the cleanup path in the driver we read, rather than claiming `DeleteVolumeGroup` deletes a
destination group.

## Unverified

- That the lab driver build behaves like the tagged source read here. The driver image in the
  tickets is a dated build, not the tag.
- That the PowerStore API rejects `RemoveMembersFromVolumeGroup` on a destination group. Only the
  driver comment states it.
- The exact workload, claim and volume names used in the three stop protection scenarios. The
  ticket names the clusters and arrays only.
- The fate of a pre-existing VGR on a cluster with zero local PVCs during VRG deletion. The
  Ramen loop never sees it and only owner reference garbage collection would act.

## Naming

All cluster and array names come from the ticket records and the existing animations: hub
`edge36`, `spoke-0` on `edge95` with `VSA-A`, `spoke-1` on `edge97` with `VSA-B`. Object cards
show the kind and a descriptive role, not an invented instance name, because the stop protection
scenarios record no instance names. The arrays keep their serials `PS3b37452a6e0f` and
`PSff392f423bd6`.
