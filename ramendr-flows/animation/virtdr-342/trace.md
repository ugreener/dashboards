# VIRTDR-342 evidence and controller trace

## Recorded outcome and scope

The RHEL VM recovered on spoke-0 while its original cluster, spoke-1, remained suspended. The recovered data passed the recorded 900-second permitted-loss-window checks. Restoring the source cluster and manually deleting its old application later completed cleanup and restored reverse replication.

This was **Failover**, not Relocate or failback. Returning to the preferred cluster does not change the action type.

- Application: `hammerdb/hammerdb-rhel9`
- DRPlacementControl (DRPC, the hub object coordinating recovery): `openshift-dr-ops/hammerdb-drpc`
- VolumeReplicationGroup (VRG, the spoke object grouping protected disks): `openshift-dr-ops/hammerdb-drpc`
- Source: spoke-1, edge97, VSA-B
- Target: spoke-0, edge95, VSA-A
- Policy: `dr-policy-15m`, recovery point objective (RPO) 900 seconds
- Application type: discovered, not managed by an Argo CD ApplicationSet
- Disk claims and DataVolumes: namespace `hammerdb`, not `openshift-dr-ops`

**Deployed-build provenance: UNVERIFIED.** The pinned upstream implementations below were independently fetched and read. They explain mechanisms consistent with the observations. The supplied evidence does not establish that their exact commits built the running controllers or driver.

## Run evidence

- [Ticket](https://redhat.atlassian.net/browse/VIRTDR-342)
- [Original generated run log](https://redhat.atlassian.net/rest/api/2/attachment/content/1252690)
- [Saved preflight](https://redhat.atlassian.net/rest/api/2/attachment/content/1252693)
- [Original postcheck output](https://redhat.atlassian.net/rest/api/2/attachment/content/1252692)
- [Writer-stop verification](https://redhat.atlassian.net/rest/api/2/attachment/content/1252696)
- [Source-recovery observations](https://redhat.atlassian.net/rest/api/2/attachment/content/1252810)
- [Baseline evidence notes](https://redhat.atlassian.net/rest/api/2/attachment/content/1252691)

### Observed timeline

All times are UTC on 2026-10-19. Approximate observations remain approximate.

| Time | Observation |
|---|---|
| 08:03:40 | Preflight completed with the writer advancing and both disks protected. |
| 08:07:38 | All six source-cluster node VMs suspended. Hub and both arrays remained running. |
| 08:10:02 | User initiated Failover to spoke-0 in the hub console, 2m24s after suspension. |
| About 08:10:46 | Recovered guest boot recorded by the writer-stop follow-up. |
| About 08:12:34 | Hub marked source unavailable, about 4m56s after suspension. |
| 08:21:59 | Original report recorded target recovery and data checks, with source cleanup pending. |
| 08:25:48 and 08:26:29 | Writer inactive and disabled. Database active. Sequence sum unchanged across 41 seconds. |
| 09:55:08 | Six source nodes resumed after 1h47m30s suspended. |
| About 09:57 | Source nodes Ready. Old application VM showed `PausedIOError`. DRPC showed `WaitOnUserToCleanUp`. |
| 10:09:25 | Separately authorized source VM deletion. Its running instance terminated within five seconds. |
| 10:12:29 | Source DataVolumes deleted. Their owned disk claims disappeared through cascading deletion. |
| About 10:13 | Source VRG became Secondary. |
| About 10:14 | DRPC reached `FailedOver/Completed`, `PeerReady=True`, placement selected spoke-0 only. |
| 10:14:27 and 10:15:47 | Fresh reverse syncs recorded. Both workload sessions on VSA-A reported Source/OK. |

The target recovered before the hub's unavailable indication. Do not animate the unavailable indication as a prerequisite for Initiate or guest recovery.

## Ordered controller trace

“Observed” refers to the run evidence. “Mechanism” refers to independently checked upstream source, not a captured execution trace.

### 1. Protect the active source before the outage

**Observed:** The writer advanced from sequence sum 8633679 to 8634676 in 20 seconds. Both disks' last two scheduled syncs carried source history rows.

The arrays copy disk contents. Separately, Ramen protects the Kubernetes descriptions needed to reconnect those copies and recreate the application.

**Mechanism:** `annotateWithDestinationVolumeHandleForVolRep` records the replica's disk identifier on the persistent-volume description. `UploadPVAndPVCtoS3` uploads persistent-volume and claim descriptions to S3-compatible object storage.

Sources:

- [Destination-handle annotation](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/vrg_volrep.go#L839-L875)
- [`UploadPVAndPVCtoS3`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/vrg_volrep.go#L878-L920)
- [`kubeObjectsProtectPrimary` and capture workflow](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/vrg_kubeobjects.go#L71-L189)

Do not depict S3 or Velero as transferring the PowerStore disk contents.

### 2. Suspend source execution, then request recovery on the hub

**Observed:** `virsh suspend` froze the six source nodes and the active writer. It did not shut down the arrays or disconnect their replication link.

**Mechanism:** `RunFailover` validates the requested target. `switchToFailoverCluster` marks failover in progress, clears peer readiness, retains the source placement decision and starts switching to the target.

Sources:

- [`RunFailover`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/drplacementcontrol.go#L430-L509)
- [`isValidFailoverTarget`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/drplacementcontrol.go#L566-L593)
- [`switchToFailoverCluster`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/drplacementcontrol.go#L621-L676)

### 3. Deliver a Primary VRG to the target through ManifestWork

ManifestWork is ACM's package for delivering Kubernetes objects from the hub to a spoke. ManagedClusterView provides the hub with a view of spoke resources.

**Mechanism:** `switchToCluster` calls `createVRGManifestWorkAsPrimary`. It waits for restored resources and target readiness. `CreateOrUpdateVRGManifestWork` packages the VRG into the work delivered to the spoke.

Sources:

- [`switchToCluster`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/drplacementcontrol.go#L1473-L1499)
- [`createVRGManifestWorkAsPrimary`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/drplacementcontrol.go#L1504-L1537)
- [`CreateOrUpdateVRGManifestWork`, `generateVRGManifestWork`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/util/mw_util.go#L130-L163)

No specific generated ManifestWork, ManagedClusterView or PlacementDecision object name is asserted here. This research did not query hub inventory or verify creation times for those names.

### 4. Restore disk descriptions, then request disk promotion

**Mechanism:** Target `processAsPrimary` first restores persistent-volume and claim descriptions. It then reconciles replication and waits for `DataReady` before recovering application objects.

`cleanupPVForRestore` substitutes the stored destination disk identifier into the restored persistent volume. `processVRAsPrimary` creates or updates each VolumeReplication request to Primary.

Sources:

- [`processAsPrimary`, ordering](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/volumereplicationgroup_controller.go#L1497-L1551)
- [`restorePVsAndPVCsForVolRep`, S3 restore](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/vrg_volrep.go#L2481-L2605)
- [`cleanupPVForRestore`, handle substitution](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/vrg_volrep.go#L2944-L2965)
- [`processVRAsPrimary`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/vrg_volrep.go#L1317-L1341)

### 5. csi-addons calls the Dell CSI driver through gRPC

VolumeReplication is the disk-role request. csi-addons translates it into driver calls. gRPC is the request connection between these components.

**Mechanism:** `markVolumeAsPrimary` calls Promote and retries with Force for recognized errors. The client sends `PromoteVolume`. The sidecar forwards it to the CSI driver's replication service.

The pinned PowerStore driver maps forced promotion of a secondary copy to unplanned array failover, `RsActionFailover` with `IsPlanned:false`.

Sources:

- [`markVolumeAsPrimary`](https://github.com/csi-addons/kubernetes-csi-addons/blob/eca6e16ba6a5f68a04a10591dc587e4b48132743/internal/controller/replication.storage/volumereplication_controller.go#L609-L639)
- [gRPC Promote, Demote and Resync client methods](https://github.com/csi-addons/kubernetes-csi-addons/blob/eca6e16ba6a5f68a04a10591dc587e4b48132743/internal/client/volume-replication.go#L90-L160)
- [Sidecar forwarding methods](https://github.com/csi-addons/kubernetes-csi-addons/blob/eca6e16ba6a5f68a04a10591dc587e4b48132743/internal/sidecar/service/volumereplication.go#L124-L225)
- [Dell `PromoteVolume`](https://github.com/dell/csi-powerstore/blob/c35ca28883044f240bab36d47e43da3f96f080cd/pkg/controller/csiaddons_replication.go#L867-L912)
- [Dell `promoteVolumeForVolume`, actual unplanned failover branch](https://github.com/dell/csi-powerstore/blob/c35ca28883044f240bab36d47e43da3f96f080cd/pkg/controller/csiaddons_replication.go#L984-L1020)

**Observed:** Target claims used the expected VSA-A replica identifiers. The exact gRPC attempts and Force retry were not captured in the supplied run evidence.

### 6. Recover application descriptions through OADP and Velero

OADP supplies the OpenShift backup and restore components. Velero performs the Kubernetes-object restore.

**Mechanism:** After disk readiness, `kubeObjectsRecover` selects saved capture information and starts recovery. Velero request creation uses the recovery specification and included namespaces.

Sources:

- [`kubeObjectsRecover`, recovery selection and start](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/vrg_kubeobjects.go#L736-L880)
- [`RecoverRequestCreate` and restore creation](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/kubeobjects/velero/requests.go#L191-L282)
- [Included namespaces in the object specification](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/kubeobjects/velero/requests.go#L430-L468)

**Observed:** The target VM was recreated and Running. PostgreSQL and the writer auto-started. Exact Velero restore names, recipe execution and DataVolume adoption details remain unverified.

### 7. Keep target recovery separate from source cleanup

**Observed:** While source nodes remained suspended, DRPC showed `FailedOver/Cleaning Up`. Placement temporarily included spoke-1 and spoke-0.

**Mechanism:** Ramen retains the source decision during failover. Cleanup requests Secondary on the source, then waits for the source VRG to acknowledge the current generation. Only then can it remove the retained decision. Peer readiness waits for secondary peers.

Sources:

- [Retain source decision](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/drplacementcontrol.go#L650-L676)
- [`cleanupSecondary`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/drplacementcontrol.go#L2387-L2445)
- [`cleanupSecondaries`, PeerReady](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/drplacementcontrol.go#L2349-L2370)
- [Placement update preserves retained decisions](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/drplacementcontrol_controller.go#L2074-L2110)

The source-down cleanup boundary did not prevent recovery on the target.

### 8. Preserve the original automated FAIL and explain its limits

**Observed:** Original result remained **FAIL, 11/14 checks passed**.

The follow-up documented three checker defects:

1. Rejected the expected temporary two-cluster placement.
2. Queried the target VRG in `hammerdb`, rather than `openshift-dr-ops`.
3. Misread the stopped writer's nonzero `systemctl` result as an unreachable host.

The follow-up verified writer shutdown separately. It did not produce a new clean end-to-end PASS report.

Recorded data verdicts:

- Loss-window result: **556 seconds**, below the **900-second** RPO.
- **55 complete source minutes** before the last data sync checked, none missing.
- Both disks' last completed syncs were within RPO at Initiate.
- This is not zero loss or an exact lost-transaction count.
- Target writes after recovery must not be mistaken for recovered source writes.

### 9. Resume the source and observe the old VM pause

**Observed:** After resume, source nodes became Ready. The old application VM reported `PausedIOError`. DRPC moved to `WaitOnUserToCleanUp`.

**Mechanism:** KubeVirt defaults disk error policy to `stop`. Its pause-condition mapping reports low-level disk I/O errors as `PausedIOError`. This explains the observed pause when the old source disks rejected writes.

Sources:

- [`setErrorPolicy`](https://github.com/kubevirt/kubevirt/blob/4717f10d96cfb0dab5898a1fd3996fbc61686f40/pkg/virt-launcher/virtwrap/converter/storage/disk.go#L74-L86)
- [`calculatePausedCondition`](https://github.com/kubevirt/kubevirt/blob/4717f10d96cfb0dab5898a1fd3996fbc61686f40/pkg/virt-handler/vm.go#L1089-L1126)
- [`setDiscoveredAppGCProgression`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/drplacementcontrol.go#L3209-L3232)

Do not describe this as Ramen powering off or permanently fencing the VM.

### 10. Manually remove the old discovered application

**Observed:** Source VM deletion was separately authorized, followed by deletion of both DataVolumes. Their owned claims disappeared automatically. The source namespace became empty and source VolumeReplication objects disappeared.

**Mechanism:** Before transitioning disk requests to Secondary, Ramen checks that no pod references the claim and no VolumeAttachment still connects it to a node.

Source:

- [`reconcileVRAsSecondary`, `isPVCReadyForSecondary`, `isPVCInUse`](https://github.com/RamenDR/ramen/blob/4191ad115cd48701b2f2fb95b5f623db773bc702/internal/controller/vrg_volrep.go#L292-L363)

The gate is disk disuse. Do not generalize this run into a rule that every failover always requires an explicit PVC deletion command.

### 11. Demote, resync and restore reverse protection

**Mechanism:** csi-addons calls Demote for Secondary, then Resync during subsequent reconciliation.

**Important correction to the older reference trace:** The pinned Dell implementation does **not** establish that Demote itself always performs Reprotect. Its executable code accepts some demotions as no-ops. `resyncVolumeForVolume` issues `RsActionReprotect` for a Failed_Over session when the local session role is Source. A Destination-side call waits for Source-side resync.

Sources:

- [csi-addons Secondary sequence](https://github.com/csi-addons/kubernetes-csi-addons/blob/eca6e16ba6a5f68a04a10591dc587e4b48132743/internal/controller/replication.storage/volumereplication_controller.go#L358-L387)
- [`markVolumeAsSecondary`, `resyncVolume`](https://github.com/csi-addons/kubernetes-csi-addons/blob/eca6e16ba6a5f68a04a10591dc587e4b48132743/internal/controller/replication.storage/volumereplication_controller.go#L641-L694)
- [Dell `demoteVolumeForVolume`, executable role/state handling](https://github.com/dell/csi-powerstore/blob/c35ca28883044f240bab36d47e43da3f96f080cd/pkg/controller/csiaddons_replication.go#L1294-L1336)
- [Dell `resyncVolumeForVolume`, Reprotect branch](https://github.com/dell/csi-powerstore/blob/c35ca28883044f240bab36d47e43da3f96f080cd/pkg/controller/csiaddons_replication.go#L1529-L1646)

**Observed:** Source VRG became Secondary. DRPC completed with PeerReady true and target-only placement. Fresh reverse syncs followed, with VSA-A Source/OK. Target claims retained their promoted handles.

Exact deployed RPC routing and array-action execution remain unverified. Reverse replication does not establish a new two-scheduled-syncs-under-load readiness gate for another failover.

### 12. Show the clock-skew issue as a separate unresolved aftermath

**Observed:** Source nodes were Ready, but hub ManagedCluster availability remained Unknown. A sampled node was about 6394 seconds behind real time. Agent logs explicitly refused status updates because of clock skew. Work delivery still functioned and DRPC completed.

**Mechanism:** ACM compares hub time with the spoke lease renewal time. Its spoke status controller refuses status reconciliation when `ManagedClusterConditionClockSynced` is false. Hub lease expiry separately produces `ManagedClusterLeaseUpdateStopped`.

Sources:

- [ACM clock comparison, `clockSyncController.sync`](https://github.com/open-cluster-management-io/ocm/blob/a1de065902843eaa82a1a4e318c33b67cadc75c5/pkg/registration/hub/lease/clocksynccontroller.go#L90-L125)
- [Clock condition update](https://github.com/open-cluster-management-io/ocm/blob/a1de065902843eaa82a1a4e318c33b67cadc75c5/pkg/registration/hub/lease/clocksynccontroller.go#L131-L164)
- [Spoke `managedClusterStatusController.sync`, explicit guard](https://github.com/open-cluster-management-io/ocm/blob/a1de065902843eaa82a1a4e318c33b67cadc75c5/pkg/registration/spoke/managedcluster/status_controller.go#L141-L170)
- [Hub lease-expiry status](https://github.com/open-cluster-management-io/ocm/blob/a1de065902843eaa82a1a4e318c33b67cadc75c5/pkg/registration/hub/lease/controller.go#L141-L160)

**No clock correction or restored ManagedCluster availability is recorded.** Do not animate either as completed. Node readiness, work delivery, DRPC completion and hub availability are separate signals.

## Dell starter-kit architecture reference

Authoritative requested branch: `elsapassaro/ramendr-starter-kit`, `ocp-4.22-rhdr-dell`, resolved to `ebfa8ac57a8972e0d02311718af3b5a05bb9c796`.

- [Partner CSI and S3 infrastructure values](https://github.com/elsapassaro/ramendr-starter-kit/blob/ebfa8ac57a8972e0d02311718af3b5a05bb9c796/variants/drpartner-s4/values-regional-dr.yaml#L1-L29)
- [Dell architecture and prerequisites](https://github.com/elsapassaro/ramendr-starter-kit/blob/ebfa8ac57a8972e0d02311718af3b5a05bb9c796/clusters/dell-s4/README.md#L1-L42)
- [Managed application DRPC example](https://github.com/elsapassaro/ramendr-starter-kit/blob/ebfa8ac57a8972e0d02311718af3b5a05bb9c796/clusters/dell-s4/hub-dr/drpc.yaml#L1-L27)

These are **architecture references only**. The managed example uses `openshift-gitops`, `dell-vm-drpc` and an ApplicationSet. Those objects are not evidence for this discovered run. Do not insert Argo CD deployment or pruning into its recovery story.
