# Trace: a volume-grouped DRPC and failover

Conceptual explainer about RamenDR volume-group replication on Dell PowerStore:
the objects, the forward copy, what a DRPC failover does with the group, and the
two conditions that can stop the group becoming a standby again.

This is not a recorded run. There is no run log, no preflight and no postcheck.
Every screen is an architectural example. The lab's group-protected application
appears as the live object chain, not as a recorded failover with screenshots.

## Linked merged PRs

None linked. No Jira ticket owns this video, and no ticket remote links are used.
The code below is read at the pinned default-branch tips; no PR or MR is treated
as provenance for the lab build.

## Pinned sources

| Repository                         | Branch | SHA                                        | Retrieval                                                    |
| ---------------------------------- | ------ | ------------------------------------------ | ------------------------------------------------------------ |
| `RamenDR/ramen`                    | `main` | `b1d412e589b9098a57a707e59fca58607e69b81b` | shallow clone plus `gh api repos/RamenDR/ramen/commits/main` |
| `csi-addons/kubernetes-csi-addons` | `main` | `f72e2489c332107f41c947917971d27927a4b81e` | shallow clone plus `gh api` commit check                     |
| `dell/csi-powerstore`              | `main` | `4f04b4d67d8abf75fbe03995bba230817e757232` | shallow clone plus `gh api` commit check                     |

The lab runs RHDR and fork images whose exact source revision is not labelled by
the deployed artifacts, so the build provenance is UNVERIFIED. The video teaches
the upstream mechanism above and separates the lab observations that follow.

## Live object chain (read-only, 2026-11-19)

Read from the hub (`ocp-edge36`), spoke-0 (`ocp-edge95`), spoke-1
(`ocp-edge97`) and both arrays.

- DRPC `openshift-dr-ops/test-478-vgr-resync-drpc`: `preferredCluster: spoke-0`,
  `failoverCluster: spoke-1`, `drPolicyRef.name: dr-policy-5m`,
  `placementRef.name: test-478-vgr-resync-placement`,
  `protectedNamespaces: [test-478-vgr-resync]`,
  `pvcSelector.matchLabels.appname: test-478-vgr-resync`.
- DRPC status at read time: `phase: Relocated`, `progression: Completed`,
  `actionDuration: 2m3.105960258s`, `actionStartTime: 2026-11-19T08:53:49Z`,
  `Protected=True(Protected)`, `PeerReady=True(Ready)`,
  `lastGroupSyncTime: 2026-11-19T10:52:36Z`.
- Placement `openshift-dr-ops/test-478-vgr-resync-placement` carries
  `cluster.open-cluster-management.io/experimental-scheduling-disable: "true"`.
  PlacementDecision `test-478-vgr-resync-placement-decision-1` exists.
- VRG `openshift-dr-ops/test-478-vgr-resync-drpc` on spoke-0: `state: Primary`,
  `DataReady=True`, `ClusterDataProtected=True`, `DataProtected=False`
  (reason `Replicating` at read time).
- VGR `test-478-vgr-resync/vgr-4251c970ec7af885d6ec79c1d2c40661-test-478-vgr-resync-drpc`:
  `spec.autoResync: false`, `spec.replicationState: primary`,
  `spec.volumeGroupReplicationClassName: powerstore-vgrc-5m`,
  `spec.volumeReplicationClassName: powerstore-vrc-group-5m`,
  `spec.volumeReplicationName: vr-87f1d6c5-3b5c-4c35-9c25-8b5dee56b03a`;
  `status.state: Primary`, `Replicating=True` with message
  `volume group is replicating: replication is synchronized and healthy`,
  `lastSyncTime: 2026-11-19T10:52:36Z`.
- Companion VR `test-478-vgr-resync/vr-87f1d6c5-3b5c-4c35-9c25-8b5dee56b03a`:
  `sourceKind: VolumeGroupReplication`, class `powerstore-vrc-group-5m`,
  `desiredState: primary`, `currentState: Primary`.
- VGRC `vgrcontent-87f1d6c5-3b5c-4c35-9c25-8b5dee56b03a` (cluster scope):
  `spec.volumeGroupReplicationHandle: 6e63ea85-6b78-4d25-be58-4b21f5a9f821`,
  `spec.source.volumeHandles: [ec517385-c8e1-4210-b719-1c00bf85331c/PS3b37452a6e0f/scsi]`,
  `status.destinationVolumeGroupID: 3058dacd-695f-468a-8eb2-8ef9180abed7`,
  `status.persistentVolumeMappingList[0].destinationVolumeHandle: bc0b6b86-c349-4ab0-8536-4607987f40d4/PSff392f423bd6/scsi`.
  `spec.volumeGroupAttributes.volumeGroupName: vg-87f1d6c5-3b5c-4c35-9c25-8b5dee56b03a-VSA-B-Five_Minutes`.
- Classes: `powerstore-vgrc-5m` (labels `storageid: f39e2726cdc836af86b6ec4ef8a67349`,
  `groupreplicationid: 4251c970ec7af885d6ec79c1d2c40661`; parameters
  `sourceArray: PS3b37452a6e0f`, `targetArray: PSff392f423bd6`,
  `remoteSystem: VSA-B`, `rpo: Five_Minutes`, `schedulingInterval: 5m`);
  `powerstore-vrc-group-5m` (label `replicationid: a906f2ca7dcc4f6f804b9628ae5c71fd`).
- StorageClass `powerstore-sc-group` labels: `storageid: f39e2726cdc836af86b6ec4ef8a67349`,
  `replicationid: a906f2ca7dcc4f6f804b9628ae5c71fd`,
  `groupreplicationid: 4251c970ec7af885d6ec79c1d2c40661`.
- DRPolicy `dr-policy-5m` status includes the peer class
  `storageClassName: powerstore-sc-group`, `grouping: true`,
  `groupreplicationID: 4251c970ec7af885d6ec79c1d2c40661`,
  `replicationID: a906f2ca..., storageID: [f39e2726cdc836af86b6ec4ef8a67349, 35047803194d7cd42ec66933e39f0b43]`.
- Arrays: VSA-A holds volume group `vg-87f1d6c5-3b5c-4c35-9c25-8b5dee56b03a-VSA-B-Five_Minutes`
  with ID `6e63ea85-6b78-4d25-be58-4b21f5a9f821` and a session in role `Source`
  (`state: OK`, `last_sync_timestamp: 2026-11-19T10:56:36Z`). VSA-B holds the
  same group name with ID `3058dacd-695f-468a-8eb2-8ef9180abed7` and the session
  in role `Destination` (`state: OK`, same timestamps).

## Ordered mechanism (verified against the pinned source)

1. **The hub asks for the move.** On failover the DRPC sets the target VRG to
   `spec.replicationState: primary` and gives it `spec.action: Failover`
   (`internal/controller/drplacementcontrol.go`, `createVRGManifestWorkAsPrimary`
   and `updateVRGState`).
2. **The VRG chooses the group path.** The VRG splits PVCs that carry
   `ramendr.openshift.io/consistency-group` into one group and leaves the rest on
   per-volume replication (`vrg_volrep.go`, `processPVCsAsPrimary`;
   `vrg_volgrouprep.go`, `isCGEnabled`). The label is written by Ramen from the
   StorageClass `ramendr.openshift.io/groupreplicationid` when the DRPolicy peer
   class reports `grouping: true`
   (`volumereplicationgroup_controller.go`, `separatePVCUsingPeerClassAndSC`;
   `drpolicy_peerclass.go`, `getAsyncPeers`).
3. **Ramen creates one VGR per consistency group.** Name
   `vgr-<groupReplicationID>-<vrgName>`, in the PVC namespace, with the
   `created-by-ramen` label and owner labels
   (`vrg_volgrouprep.go`, `createVGR`, `vgrNamespacedName`;
   `util/misc.go`, `CreateVGRName`).
4. **csi-addons creates the content and a companion VolumeReplication.**
   The VGRC is cluster-scoped, named `vgrcontent-<VGR UID>`, and holds the group
   handle and disk handles (`volumegroupreplication_controller.go`). csi-addons
   also creates `vr-<VGR UID>` (or `spec.volumeReplicationName`) whose
   `dataSource.kind` is `VolumeGroupReplication`; that VolumeReplication runs the
   Primary/Secondary state machine (`volumereplication_controller.go`).
5. **The state machine makes the CSI calls.** Primary: `EnableVolumeReplication`
   then `PromoteVolume`. Secondary: `DemoteVolume` then `ResyncVolume` with
   `force = spec.autoResync`.
6. **The driver acts on the group, not per disk.** `PromoteVolume` on a group
   executes a PowerStore `failover` on the group session, `DemoteVolume` a
   planned reverse failover, and `ResyncVolume` either `reprotect`, `resume` or
   `sync` depending on the session state (`pkg/controller/csiaddons_replication.go`,
   `promoteVolumeForVolumeGroup`, `demoteVolumeForVolumeGroup`,
   `resyncVolumeForVolumeGroup`). The driver refuses to create a group unless
   both `sourceArray` and `targetArray` are in `powerstore-config`
   (`CreateVolumeGroup`).
7. **Restore rewrites the content to the destination side.** The archived VGRC
   carries `ramendr.openshift.io/destination-volume-group-handle`; on restore
   Ramen replaces `spec.volumeGroupReplicationHandle` with that value and each
   `spec.source.volumeHandles[i]` with the matching
   `status.persistentVolumeMappingList[].destinationVolumeHandle`
   (`vrg_volgrouprep.go`, `cleanupVGRCForRestore`,
   `updateVGRCVolumeHandlesForRestore`).
8. **The VGR status is the companion's status.** csi-addons copies
   `vrObj.Status` into the VGR status (`volumegroupreplication_controller.go`),
   so `state`, `message`, `Replicating` and `lastSyncTime` are the same values.

## Lab observations used in the video

- **A planned group failover completed in this lab** on the group workload: the
  group promoted on the target local array, the PVC bound to the promoted volume,
  and a pod could read and write. The move needed a manual correction of the
  restored PVC `volume-group-replication-name` annotation, and the group stayed
  `Failed_Over` with no automatic reverse copy because `autoResync` was false.
  This is recorded as prose in the Dell DR notes, not as a run log with
  screenshots.
- **The live relocate** of `test-478-vgr-resync-drpc` completed in
  `2m3.105960258s`, and the group session carried a newer sync afterwards
  (`actionDuration` and `last_sync_timestamp` above).
- **The group example protects one claim.** The mechanism is the same for many;
  the video never claims the example has several disks.

## Corrections to common assumptions (checked against source)

- The VGR Primary/Secondary branches are NOT in
  `volumegroupreplication_controller.go` at this SHA. They are in
  `volumereplication_controller.go`, driven through the companion VR.
- `replication has failed over, reprotect required` is a Dell driver status
  string (`csiaddons_volumegroup_helpers.go`), copied through
  `VolumeReplication.status.message` into `VGR.status.message`.
- `spec.autoResync` does not gate a separate `Reprotect` call. It sets the
  `force` flag on `ResyncVolume`; the driver chooses Reprotect, Resume or Sync
  from the PowerStore session state. The video therefore reports the observed
  lab outcome (group stayed `Failed_Over`, no reverse copy) and does not claim
  the call was skipped.
- `VolumeGroupReplicationClass` has exactly `provisioner` and `parameters`
  fields. There is no `reclaimPolicy` field.
- Ramen prunes `replication.storage.openshift.io*` annotations when it restores
  PVCs, and csi-addons re-adds the group owner annotation. The stale annotation
  seen in the lab is therefore reported as an observation, not as a proven code
  path.

## What this video does not claim

- It does not claim a recorded run, screenshots, preflight or postcheck.
- It does not claim the lab build matches the pinned upstream SHAs.
- It does not claim an automatic reverse copy is safe or unsafe in general; it
  reports what the lab group did with `autoResync: false`.
- It does not initiate or require a failover.
