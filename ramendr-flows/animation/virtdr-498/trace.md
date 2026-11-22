# VIRTDR-498 evidence and controller trace

## Recorded outcome and scope

A recorded, reachable-source failover of a discovered application whose two disks
are protected by Dell PowerStore volume-group replication. The workload is a RHEL 9
guest running PostgreSQL and a HammerDB TPC-C writer. Both sites stayed up for the
whole run: this is not a site-down test and not a Relocate.

- Application: `hammerdb/hammerdb-rhel9`
- DRPlacementControl: `openshift-dr-ops/hammerdb-drpc`
- DRPolicy: `dr-policy-15m`, 900-second recovery point objective
- VolumeReplicationGroup: `openshift-dr-ops/hammerdb-drpc` on each spoke
- VolumeGroupReplication: `hammerdb/vgr-4251c970ec7af885d6ec79c1d2c40661-hammerdb-drpc`
- VolumeGroupReplicationContent: `vgrcontent-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d`
- Companion VolumeReplication: `hammerdb/vr-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d`
- VolumeGroupReplicationClass: `powerstore-vgrc-15m`
- Companion VolumeReplicationClass: `powerstore-vrc-group-15m`
- StorageClass: `powerstore-sc-group`
- Claims: `hammerdb/hammerdb-rhel9-rootdisk-grp` and `hammerdb/hammerdb-rhel9-datadisk-grp`
- Source: spoke-1 on ocp-edge97, VSA-B (`PSff392f423bd6`)
- Target: spoke-0 on ocp-edge95, VSA-A (`PS3b37452a6e0f`)
- Application type: discovered, not an Argo CD ApplicationSet

The DRPC reached `FailedOver` / `Completed` with `PeerReady=True` after the
separately authorized source cleanup. The final postcheck passed 17 of 17 checks.

**Deployed-build provenance: UNVERIFIED.** The pinned upstream source below explains
mechanisms consistent with the observed objects and status. The run used private RHDR
and Ramen images whose exact source revisions are not labelled by the deployed
artifacts. The private Ramen image is recorded in DFBUGS-12906 as
`quay.io/sughosh/ramen-operator@sha256:d8acf053879405b7bf37fb5ec48fdad4fc22c4a8048bfb8a5b289d467958736b`.

## Run evidence

- Ticket: [VIRTDR-498](https://redhat.atlassian.net/browse/VIRTDR-498)
- Consolidated logs: attachment `VIRTDR-498-logs-633f8499.tar.gz`, id 1320113
- Screenshots: attachments 1320076 to 1320087, created 2026-11-22 07:46 UTC
- Run clips: attachments 1320119 to 1320122, created 2026-11-22 09:21 UTC
- Linked defect: [DFBUGS-12906](https://redhat.atlassian.net/browse/DFBUGS-12906), related link, open Major
- Defect evidence: must-gather archives for ocp-edge36, ocp-edge95 and ocp-edge97
  (ids 1320115 to 1320117) and `ramen-secondary-reclaim-evidence-20261122T0847Z.tar.gz`
  (id 1320118)

### Observed timeline

All times UTC on 2026-11-22.

| Time     | Observation                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------- |
| 06:55:27 | Writer found inactive and disabled; order total 10,270,731; newest history row 2026-11-21T21:43:56Z |
| 06:55:33 | Writer enabled and started                                                                          |
| 07:09:09 | Second scheduled group sync completed                                                               |
| 07:19:32 | Preflight `OVERALL: PASS`, 10 of 10 checks; Initiate deadline 07:23:10                              |
| 07:22:21 | Initiate clicked in the hub console, target spoke-0                                                 |
| 07:22:34 | DRPC `FailingOver`, progression `WaitingForResourceRestore`                                         |
| 07:22:48 | DRPC `FailedOver`, progression `Cleaning Up`                                                        |
| 07:22:57 | Target VGR and companion VR `Primary`, `Replicating=True`                                           |
| 07:23:07 | DRPC `ReplicationHealthy=True`                                                                      |
| 07:24:47 | Target guest writing again, order total 10,339,193                                                  |
| 07:27:56 | Group session last sync with VSA-A `Source` and VSA-B `Destination`                                 |
| 07:33    | Source VM deleted; VMI and pod gone                                                                 |
| 07:35    | Source DataVolumes and PVCs deleted; source VRG `Secondary`                                         |
| 07:35:04 | DRPC `PeerReady=True`                                                                               |
| 07:37    | DRPC `FailedOver` / `Completed`; PlacementDecision spoke-0                                          |

### Measurements

- Preflight syncs: 06:57:09 and 07:09:09; maximum gap 720 s; both intervals carried
  source history rows (4,287 and 31,075).
- At Initiate, the last completed group sync was 07:21:09, age 71 s.
- Last recovered source write: 07:19:26. First recovered target write: 07:19:26.
- Lost-write window: 07:19:26 to 07:22:21 = 175 s, inside the 900-second policy.
- The postcheck checked 25 complete source minutes before the last sync and found
  no missing rows.
- Target VMI Running: `hammerdb-rhel9=Running`.
- Guest services after recovery: PostgreSQL active, writer active and enabled, later
  stopped by the postcheck.
- Old-site PVs: `csivol-31136f5c90` (root) and `csivol-2a761d921f` (data), both
  `Released`, reclaim policy `Delete`, `VolumeFailedDelete` retries.

### Evidence limits

- The first postcheck at 07:46:20 reported `OVERALL: FAIL (15/17)`. The two failures
  compared each claim's promoted handle with the single group destination handle.
  The final postcheck at 07:53:37 reported 17/17. The archive does not contain the
  checker change, so why the result changed is not established by the attached
  evidence. The video uses the final verdict and keeps the first result visible in
  the record.
- Screenshot `07-failing-over.png` does not show an in-progress `FailingOver` state.
  It already shows `FailedOver`, while the cluster column still reads `spoke-1`.
  No captured frame shows the transient in-progress state.
- Screenshot `09-failedover-popover.png` is a near-duplicate of `08` and is not used.
- Screenshots `04` and `05` are 921x892 captures of the array tab, taken outside the
  1920x1080 emulated viewport. Column values are ellipsis-truncated. They are used
  only for the before-failover role, not for exact text. The pre-failover state
  cannot be recaptured.
- The target VGR object was read from the ocp-edge95 must-gather at 08:26 UTC, after
  the run. `spec.autoResync: false` and the `Replicating=True` conditions are that
  object's values, not a live 07:22 capture. The earliest reversed-session
  observation is the run index line at 07:27:56.
- The old-site VGR was gone by the 08:26 archive. Its pre-cleanup state is not
  recorded as an object capture.
- No source-cluster shutdown was involved. `Failed_Over`, `Reprotect required` and
  site-down behaviors belong to the site-down variant, not to this run.

## Objects on screen

- Hub: `DRPlacementControl hammerdb-drpc`, `Placement hammerdb-placement`,
  `PlacementDecision hammerdb-placement-decision-1`, `DRPolicy dr-policy-15m`,
  the VRG ManifestWork, and a ManagedClusterView read of the peer VRG.
- spoke-1 (old site): `VolumeReplicationGroup hammerdb-drpc`,
  `VolumeGroupReplication vgr-4251c970ec7af885d6ec79c1d2c40661-hammerdb-drpc`,
  `VolumeGroupReplicationContent vgrcontent-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d`,
  companion `VolumeReplication vr-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d`,
  the two classes, the two claims, the two PVs, `VirtualMachine hammerdb-rhel9`,
  its VMI, and the `cloudinit-hammerdb` Secret.
- spoke-0 (recovery site): the same set after restore, with the VRG, VGR and VR in
  Primary and the recreated claims bound to the promoted VSA-A handles.
- Arrays: one PowerStore volume group and one replication session per side. Roles are
  Source and Destination; the run's group is
  `vg-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d-VSA-A-Fifteen_Minutes` in the restored
  group content.

## Ordered controller trace

"Observed" is the run evidence. "Mechanism" is independently read upstream source at
the pinned SHAs below; it is not a captured execution trace and not deployed-build
provenance.

### 1. The console asks the hub for a failover

**Observed:** `spec.action: Failover`, `spec.failoverCluster: spoke-0`,
`preferredCluster: spoke-1`, `pvcSelector.matchLabels.appname: hammerdb-rhel9-grp`,
`protectedNamespaces: [hammerdb]`. The DRPC annotation
`drplacementcontrol.ramendr.openshift.io/dr-action-count` records one failover.
Initiate at 07:22:21; `FailingOver` at 07:22:34; `FailedOver` at 07:22:48.

**Mechanism:** `DRPCInstance.startProcessing` reaches `processPlacement` and
`executeAction`, whose `ActionFailover` branch calls `RunFailover`. `RunFailover`
rejects an empty target, validates the target as Secondary or already Primary with
`isValidFailoverTarget`, and calls `switchToFailoverCluster`. That function sets
`FailingOver`, progression `CheckingFailoverPrerequisites` then
`FailingOverToCluster`, retains the current cluster decision, and calls
`switchToCluster` for the target. `switchToCluster` sets
`WaitingForResourceRestore`, then `UpdatedPlacement`. The target VRG ManifestWork is
created as Primary by `createVRGManifestWorkAsPrimary`; the VRG's
`spec.replicationState` is set by `updateVRGState`, and `setVRGAction` adds
`spec.action: Failover`. The old VRG is moved to Secondary by the same
`updateVRGState` path during cleanup.

Sources (RamenDR/ramen at `dd0cd2575bc591f9091a64e1cc8cb02958c1d25c`):

- `internal/controller/drplacementcontrol.go:95` `startProcessing`
- `internal/controller/drplacementcontrol.go:127` `processPlacement`
- `internal/controller/drplacementcontrol.go:188` `executeAction`
- `internal/controller/drplacementcontrol.go:430` `RunFailover`
- `internal/controller/drplacementcontrol.go:566` `isValidFailoverTarget`
- `internal/controller/drplacementcontrol.go:621` `switchToFailoverCluster`
- `internal/controller/drplacementcontrol.go:1078` `ensureActionTransition`
- `internal/controller/drplacementcontrol.go:1473` `switchToCluster`
- `internal/controller/drplacementcontrol.go:1504` `createVRGManifestWorkAsPrimary`
- `internal/controller/drplacementcontrol.go:2092` `setVRGAction`
- `internal/controller/drplacementcontrol.go:2588` `updateVRGState`
- `internal/controller/util/mw_util.go:130` `CreateOrUpdateVRGManifestWork`

### 2. The target VRG chooses the group path

**Observed:** the target VRG is `openshift-dr-ops/hammerdb-drpc`, `state: Primary`.
Its `spec.async.peerClasses` entry for `powerstore-sc-group` carries
`grouping: true`, `groupreplicationID: 4251c970ec7af885d6ec79c1d2c40661`, and the
DRPC selector `appname: hammerdb-rhel9-grp`. The target VGR is
`vgr-4251c970ec7af885d6ec79c1d2c40661-hammerdb-drpc` in namespace `hammerdb`.

**Mechanism:** the VRG reads the PVC selector and the peer class. Ramen adds the
consistency-group label `ramendr.openshift.io/consistency-group` through
`addVolRepConsistencyGroupLabel`, and only when the DRPolicy peer class reports
`Grouping: true`. `getAsyncPeers` sets grouping for non-offloaded storage when both
the VolumeReplicationClass and the VolumeGroupReplicationClass match the StorageClass
group-replication label. `processPVCsAsPrimary` splits claims that carry the label
from the per-volume path. `isCGEnabled` confirms the group path. `vgrNamespacedName`
and `CreateVGRName` build `vgr-<groupReplicationID>-<VRG name>` in the PVC namespace;
`createVGR` sets the class names, the PVC selector, and the owner labels.

Sources (RamenDR/ramen at the same SHA):

- `internal/controller/volumereplicationgroup_controller.go:1028` `addVolRepConsistencyGroupLabel`
- `internal/controller/drpolicy_peerclass.go:356` `getAsyncPeers`
- `internal/controller/vrg_volrep.go:114` and `:124` `processPVCsAsPrimary`
- `internal/controller/vrg_volgrouprep.go:716` `isCGEnabled`
- `internal/controller/vrg_volgrouprep.go:725` `vgrNamespacedName`
- `internal/controller/util/misc.go:408` `CreateVGRName`
- `internal/controller/vrg_volgrouprep.go:893` `createVGR`

### 3. csi-addons creates the group content and the companion VolumeReplication

**Observed:** VGR created at 07:22:22; VGRC `vgrcontent-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d`;
companion VR `vr-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d`. The companion VR's
`spec.dataSource.kind` is `VolumeGroupReplication`, `spec.dataSource.name` is the VGR,
`spec.volumeReplicationClass: powerstore-vrc-group-15m`, `spec.autoResync: false`,
`spec.replicationState: primary`. The VGR status is the companion's status:
`state: Primary`, `Replicating=True`, `Completed=True`.

**Mechanism:** `VolumeGroupReplicationReconciler.Reconcile` derives
`vgrcontent-<VGR UID>` and `vr-<VGR UID>` and creates or updates both. The VGRC is
created first and the companion VR only after the group handle exists. The VGR status
is copied verbatim from the companion VR, so the VGR's `state`, `message`,
`Replicating` and `lastSyncTime` are the VR's values. `message: volume group is
promoted to primary and replicating to secondary` is the csi-addons `MessagePromoted`
constant.

Sources (csi-addons/kubernetes-csi-addons at `998a2ad6d88010991e36edc3b18d80d26fd85d0f`):

- `internal/controller/replication.storage/volumegroupreplication_controller.go:115` `Reconcile`
- `internal/controller/replication.storage/volumegroupreplication_controller.go:156` VGRC name
- `internal/controller/replication.storage/volumegroupreplication_controller.go:170` VR name
- `internal/controller/replication.storage/volumegroupreplication_controller.go:253` VGRC creation order
- `internal/controller/replication.storage/volumegroupreplication_controller.go:753` `createOrUpdateVolumeGroupReplicationContentCR`
- `internal/controller/replication.storage/volumegroupreplication_controller.go:831` `createOrUpdateVolumeReplicationCR`
- `internal/controller/replication.storage/volumegroupreplication_controller.go:349` status copy
- `api/replication.storage/v1alpha1/volumereplication_types.go:43` `MessagePromoted`

### 4. The companion VolumeReplication promotes the group once

**Observed:** the target VGR and companion VR became `Primary`; the array session
changed role. The target claims bound to the promoted VSA-A handles:
`hammerdb-rhel9-rootdisk-grp` to `f41919e2-b30a-4cd9-a1c2-c5746a0da712/PS3b37452a6e0f/scsi`,
`hammerdb-rhel9-datadisk-grp` to `6cefffe5-6890-4233-9625-2f09333f7b80/PS3b37452a6e0f/scsi`.
The VGRC `persistentVolumeMappingList` names the matching VSA-B copies as destinations.

**Mechanism:** the Primary branch of the VolumeReplication controller calls
`enableReplication` once (the CSI-Addons `EnableVolumeReplication` RPC) and
`markVolumeAsPrimary`. `markVolumeAsPrimary` calls the CSI-Addons `Promote` RPC; a
known gRPC error is retried with `force=true`. The Dell driver's `PromoteVolume` sees
a volume group ID and calls `promoteVolumeForVolumeGroup`, which finds the group and
its replication session and executes one `Failover` action with
`IsPlanned: false, Reverse: false`. It does not promote individual disks. The action
is a REST `POST replication_session/<id>/action` with
`{"is_planned": false, "reverse": false}`.

`autoResync` is not a target-side promotion flag. Ramen computes it only for a VRG in
state Secondary whose action is Failover, writes it onto the VGR, and csi-addons
copies it to the companion VR, where it becomes the `force` field of the Resync RPC.
A Primary VGR has `autoResync: false` as a consequence of its state, not as a statement
that no reverse copy exists.

Sources:

- csi-addons `internal/controller/replication.storage/volumereplication_controller.go:332` Primary branch
- csi-addons `internal/controller/replication.storage/volumereplication_controller.go:609` `markVolumeAsPrimary`
- csi-addons `internal/controller/replication.storage/volumereplication_controller.go:720` `enableReplication`
- csi-addons `internal/controller/replication.storage/replication/replication.go:95` `Promote`
- csi-addons `internal/controller/replication.storage/replication/replication.go:133` `Resync`
- Ramen `internal/controller/vrg_volrep.go:1499` `autoResync` computation
- Ramen `internal/controller/vrg_volgrouprep.go:846` VGR `autoResync` write
- dell/csi-powerstore at `cf21f44f70933e8540b039b02e3e50d49d1c9739`
  - `pkg/controller/csiaddons_replication.go:1034` `promoteVolumeForVolumeGroup`
  - `pkg/controller/csiaddons_replication.go:1152` `FailoverParams` and `RsActionFailover`
  - `pkg/controller/replication.go:560` `ExecuteAction`
  - `pkg/controller/csiaddons_volumegroup_helpers.go:306` `ExecuteActionOnReplicationSession`

### 5. Restore rewrites the group map and the claims

**Observed:** target VGRC `spec.volumeGroupReplicationHandle` is
`5f195dc9-650e-4051-81fd-9f99f7dcc86d`; `spec.source.volumeHandles` are the two
promoted VSA-A handles; `status.destinationVolumeGroupID` is
`4e4b4d3b-371b-42e7-a86b-3d904330d7eb`; `status.persistentVolumeMappingList` maps
each promoted handle to its VSA-B copy. The target PVs are `csivol-31136f5c90`
(root) and `csivol-2a761d921f` (data), both Bound and Retain.

**Mechanism:** the target VRG Primary path reaches `shouldRestoreClusterData` and
`clusterDataRestore`, then `restorePVsAndPVCsForVolRep`. `cleanupPVForRestore`
replaces each PV's `spec.csi.volumeHandle` from its
`ramendr.openshift.io/destination-volume-handle` annotation, clears the old claim UID,
sets the target cluster ID and node affinity. `restoreVGRsAndVGRCsFromS3` reaches
`cleanupVGRCForRestore`, which replaces the archived group handle with
`ramendr.openshift.io/destination-volume-group-handle`, and
`updateVGRCVolumeHandlesForRestore` replaces each `spec.source.volumeHandles` entry
with the matching `status.persistentVolumeMappingList[].destinationVolumeHandle`.
The VM and its Secret come back through Velero, not through the PV restore code.

Sources:

- Ramen `internal/controller/volumereplicationgroup_controller.go:1460` `shouldRestoreClusterData`
- Ramen `internal/controller/volumereplicationgroup_controller.go:744` `clusterDataRestore`
- Ramen `internal/controller/vrg_volrep.go:2627` `restorePVsAndPVCsForVolRep`
- Ramen `internal/controller/vrg_volrep.go:3253` `cleanupPVForRestore`
- Ramen `internal/controller/vrg_volgrouprep.go:1205` `restoreVGRsAndVGRCsFromS3`
- Ramen `internal/controller/vrg_volgrouprep.go:1354` `cleanupVGRCForRestore`
- Ramen `internal/controller/vrg_volgrouprep.go:1386` `updateVGRCVolumeHandlesForRestore`
- Ramen `internal/controller/vrg_kubeobjects.go:811` `kubeObjectsRecover`
- Ramen `internal/controller/kubeobjects/velero/requests.go:353` `backupRestore`

### 6. The group session reverses and reports healthy

**Observed:** target VGR `Replicating=True` at 07:22:57 with the promotion message;
`lastSyncTime` later advanced. The run index records the group session at 07:27:56
with VSA-A `Source` and VSA-B `Destination`. The post-failover array screenshots
(11 and 12) show VSA-A `Source` and VSA-B `Destination`, session status
`Operating Normally`, with fresh last-sync times. The source VRG reports
`ReplicationHealthy=True` at 07:22:39 and `state: Secondary` at 07:35:06. The target
VGR `spec.autoResync` was `false`.

**Mechanism and limit:** the observed session was already reversed and healthy before
the source cleanup. The driver's `PromoteVolume` runs only the group failover. A
separate reverse copy is started by the demoted site: the DRPC moves the old site to
Secondary, the source VRG sets its VGR and companion VR to Secondary with
`autoResync`, the VR Secondary branch calls `Demote` and then `Resync` with
`force=true`, and the driver's `ResyncVolume` executes `Reprotect` only when the
session is `Failed_Over` and the local role is Source. When the local role is
Destination it returns `OutOfRange` and waits for the other side. The only caller of
`RsActionReprotect` is `resyncVolumeForVolumeGroup`; Ramen never sets the VR's manual
`Resync` state.

Which side issued a Reprotect in this run is **UNVERIFIED**. The captured array state
is `Operating Normally`, not `Failed_Over`, and the VGR is `Replicating=True` at
07:22:57; that is consistent with a failover that left the session reversed and
copying, and it does not prove a separate Reprotect call. The video reports the
observed array role flip and the VGR `Replicating=True`, and does not claim which
controller issued a separate reprotect. The private build and the absence of a live
session trace leave the exact trigger unverified.

The promoted side's status sequence is `Completed=True` with reason `Promoted`,
`Degraded=False`, `Resyncing=False`. The demoted side would move through
`Completed=True` with reason `Demoted`, `Degraded=True`, then `Resyncing`, then
healthy. The target VGR in this run shows the promoted sequence.

Sources:

- Ramen `internal/controller/drplacementcontrol.go:1106` `ensureCleanupAndSecondaryReplicationSetup`
- Ramen `internal/controller/drplacementcontrol.go:2326` `EnsureCleanup`
- Ramen `internal/controller/drplacementcontrol.go:2392` `cleanupSecondary`
- Ramen `internal/controller/vrg_volgrouprep.go:111` `reconcileVolGroupRepsAsSecondary`
- Ramen `internal/controller/vrg_volgrouprep.go:839` `updateVGR`
- csi-addons `internal/controller/replication.storage/volumereplication_controller.go:358` Secondary branch
- csi-addons `internal/controller/replication.storage/volumereplication_controller.go:662` `resyncVolume`
- dell/csi-powerstore `pkg/controller/csiaddons_replication.go:1034` group promotion
- dell/csi-powerstore `pkg/controller/csiaddons_replication.go:1649` `resyncVolumeForVolumeGroup`
- dell/csi-powerstore `pkg/controller/csiaddons_replication.go:1735` `RsActionReprotect`
- dell/csi-powerstore `pkg/controller/csiaddons_replication.go:1745` `OutOfRange` when destination
- csi-addons `internal/controller/replication.storage/status.go:40` promoted conditions
- csi-addons `internal/controller/replication.storage/status.go:151` demoted conditions

### 7. Peer readiness is a separate milestone

**Observed:** `ReplicationHealthy=True` at 07:23:07, but `PeerReady=True` only at
07:35:04, after the source VM, DataVolumes and claims were removed and the source VRG
became `Secondary`. `Completed` came with the peer state at 07:37. The source VRG's
`DestinationInfoAvailable` was `False` with reason `Progressing` at 07:35:04.

**Mechanism:** the hub gates completion on the target VRG being Primary and
`checkReadiness` passing, then `ensureActionTransition` sets `Cleaning Up` and
`Completed`. The source VRG's move to Secondary is driven by
`ensureCleanupAndSecondaryReplicationSetup` and `cleanupSecondary`, which calls
`updateVRGState(clusterName, Secondary)`. The video treats storage health and peer
readiness as two different questions.

Sources:

- Ramen `internal/controller/drplacementcontrol.go:1078` `ensureActionTransition`
- Ramen `internal/controller/drplacementcontrol.go:1106` `ensureCleanupAndSecondaryReplicationSetup`
- Ramen `internal/controller/drplacementcontrol.go:2392` `cleanupSecondary`
- Ramen `internal/controller/drplacementcontrol.go:2588` `updateVRGState`
- Observed DRPC conditions and source VRG status

### 8. Source cleanup and the stuck PVs

**Observed:** after the source VM and claims were deleted, both old-site PVs changed
from `Retain` to `Delete`, lost the
`volumereplicationgroups.ramendr.openshift.io/vr-retained` annotation, and entered a
`VolumeFailedDelete` loop. The array refused the driver's member removal with
`HTTP 422: Volumes cannot be removed from the replication destination volume group`.
Both PVs stayed `Released` with the external-provisioner finalizer. The lab patched
them back to `Retain` to stop the loop. This is DFBUGS-12906, open Major. No data was
lost and the target stayed healthy.

**Mechanism:** the group path `pvcsUnprotectVolGroupRep` calls `ensurePVCUnprotected`,
which calls `preparePVCForVRDeletion`. That function treats an async VRG as if it were
Primary (`v.instance.Spec.Async != nil || v.instance.Spec.ReplicationState == Primary`)
and calls `undoPVRetention`, which sets `persistentVolumeReclaimPolicy: Delete` and
removes `vr-retained`. It does this while the old site is still the live replication
destination. The PV controller then calls the CSI driver. Dell's `deleteISCSIVolume`
lists the volume groups, calls `RemoveMembersFromVolumeGroup`, and returns
`failed to remove volume <id> from volume group: <array error>` when the array rejects
the member removal. The only tolerated 422 on that path is the
`VolumeAlreadyRemovedFromVolumeGroup()` idempotency case, which matches a different
message ("not part"). A volume with no group membership skips the group branch and has
no explicit replication check on that path.

The driver already knows this array behavior: `disableVolumeReplicationForVolumeGroup`
contains a comment that PowerStore forbids `RemoveMembersFromVolumeGroup` on
destination volume groups even after the session and protection policy are gone, and
it deletes the volume group instead. That workaround is not used by
`deleteISCSIVolume`. The exact array message is not emitted by the driver; it is the
array's response text, so the message is recorded but not source-cited.

Sources:

- Ramen `internal/controller/vrg_volgrouprep.go:565` `pvcsUnprotectVolGroupRep`
- Ramen `internal/controller/vrg_volgrouprep.go:530` `ensurePVCUnprotected`
- Ramen `internal/controller/vrg_volrep.go:594` `preparePVCForVRDeletion`
- Ramen `internal/controller/vrg_volrep.go:615` async/Primary condition
- Ramen `internal/controller/vrg_volrep.go:616` `undoPVRetention`
- Ramen `internal/controller/vrg_volrep.go:737` `undoPVRetention` body
- dell/csi-powerstore `pkg/controller/controller.go:1080` `DeleteVolume`
- dell/csi-powerstore `pkg/controller/controller.go:1303` `deleteISCSIVolume`
- dell/csi-powerstore `pkg/controller/controller.go:1315` `RemoveMembersFromVolumeGroup`
- dell/csi-powerstore `pkg/controller/controller.go:1320` error wrapping
- dell/csi-powerstore `pkg/controller/csiaddons_replication.go:721` destination-VG comment and `DeleteVolumeGroup` workaround

## Linked merged PRs

None linked. The ticket has no remote links. The related DFBUGS-12906 link is a defect,
not a pull request. No PR or MR was read for this video, and no merged change is treated
as provenance for the running build.

Repository history read only as source context, not as ticket provenance: Ramen #2693
and #2701 added the VGRC restore and destination-handle rewrite on current main,
csi-addons #1190 preserves destination handles when the group is Secondary, and
csi-powerstore #585 carries the group failover, demote and reprotect handlers. These
PRs are not linked to VIRTDR-498 and are not evidence that the run build contained
them.

## Corrections and limits for the video

- The console dialog says the old application must be cleaned up manually "to begin
  replication". The array session was already reversed and healthy at 07:23, and the
  target VGR reported `Replicating=True` at 07:22:57. The video explains the difference
  between the storage copy and the peer/application lifecycle instead of repeating the
  dialog as the storage rule.
- `autoResync: false` on the target VGR does not prove the array was not copying.
  Ramen computes `autoResync` on the demoted side, writes it onto that VGR, and
  csi-addons copies it to the companion VR, where it becomes the Resync `force` field.
  A Primary VGR is false as a consequence of its state. The observed VGR status and
  array roles are the evidence for the reverse copy; the exact trigger remains
  unverified.
- The first postcheck's two handle failures are kept in the record. The final 17/17 is
  the verdict used for the data claims.
- No screenshot shows a failover in progress. The video does not claim one.
- The run used `Failover`, not `Relocate`. The source stayed reachable. Do not animate
  a node suspension, a lost heartbeat, or a site-down gate.
- The `VolumeGroupReplication` object on the old site was gone by the 08:26 archive.
  Its deletion is observed only through the cleanup sequence, not through a captured
  VGR object.
