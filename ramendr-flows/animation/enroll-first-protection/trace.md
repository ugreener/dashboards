# enroll-first-protection: evidence and source trace

## What this video is

A mechanism explainer for the first lifecycle step: how a running OpenShift
Virtualization application becomes a RamenDR-protected application on the Dell
PowerStore path. It follows the object chain from the DRPolicy, through the
console enrollment and the hub DRPC and Placement, to the spoke VRG and
per-claim VolumeReplication, then the PowerStore rule and replication session,
and ends at the first Protected condition.

This is a conceptual explainer. No enrollment session was recorded with form
screenshots, timestamps and a first-copy timeline. The object chain and the
resulting conditions are recorded in the lab setup document; the console form
steps are documented behavior, not a recording.

## Recorded outcome and scope

- The setup document records an enrollment on the Dell edge lab: hub edge36,
  spoke-0 on edge95 with VSA-A, spoke-1 on edge97 with VSA-B, policy
  `dr-policy-15m` (900 seconds), DRPC `hammerdb-drpc`, application
  `hammerdb/hammerdb-rhel9` with PVCs `hammerdb-rhel9-rootdisk` and
  `hammerdb-rhel9-datadisk` labeled `drprotection=true`.
- The recorded enrollment applied the Placement and the DRPC directly with
  `oc apply`. Both were in the application namespace `hammerdb`. The setup
  document marks this layout as historical and states that current UI
  enrollment for a discovered application creates the DRPC and Placement in
  `openshift-dr-ops` with `protectedNamespaces` set to the application
  namespace.
- Recorded result, within about two minutes: DRPC `Available=True` reason
  `Initial deployment completed` (phase `Deployed`), `PeerReady=True` reason
  `Ready`, `Protected=True` reason `VRG on cluster spoke-0 is protecting
  required resources and data`. Spoke-0 VRG `state=Primary`, `DataReady=True`,
  `DataProtected=True`, `ClusterDataProtected=True`. The VRG auto-created two
  VolumeReplications using `powerstore-vrc-15m`. VSA-A showed four replication
  sessions in `state=OK`, `role=Source`, `type=Asynchronous` (two workload
  sessions plus earlier test volumes). VSA-B held the two replica volumes.
- The kit records the naming and roles but not the exact console form, the
  exact first-copy progress, or the moment the first Protected condition
  appeared.

## Evidence read

- Dell PowerStore VSA environment setup document (Google Doc, current runbook
  and historical setup sections): enrollment namespace rule, `drPolicyRef`
  requirement, `protectedNamespaces`, `pvcSelector`, `kubeObjectProtection`,
  recorded conditions, VRG and VolumeReplication results, array sessions.
- VIRTDR-361 (Dell PowerStore DR GA Feature): MVP requirement to protect
  discovered VM workloads, and console, CLI and YAML support.
- VIRTDR-430 to VIRTDR-433 (Draft GA test cases): DRPolicy creation, managed
  and discovered enrollment through the console.
- VIRTDR-291, VIRTDR-292, VIRTDR-342: recorded protected steady state, DRPC and
  Placement namespace behavior, ManifestWork and ManagedClusterView roles,
  policy validation caveat.
- VIRTDR-343: VolumeReplicationClass definition and per-claim work orders.
- VIRTDR-334: DRPolicy 900-second field, array rule name, console last-sync
  caveat.
- VIRTDR-307: group replication object chain and condition composition.
- Knowledge base: discovered-app enrollment rule, VGR object chain, Relocate
  semantics, PowerStore alert threshold and 80 percent scheduling note.
- Dell documentation: RPO range 5 minutes to 24 hours, asynchronous cycles
  scheduled at 80 percent of the RPO in PowerStoreOS 4.0 and later, alert
  threshold as a grace delay.

## Boundaries and corrections

- **Console form steps: UNVERIFIED.** No screenshot or recording of the
  enrollment form exists. The video teaches the objects the console writes and
  the documented namespace and reference rules, and says so on screen.
- **First-copy ordering: UNVERIFIED.** The source path is traced, but no
  recorded enrollment captured the first full copy, its duration, or whether a
  readiness condition can flip before that copy completes.
- **Recorded namespace differs from current UI behavior.** The recorded
  enrollment used the application namespace. The video shows the current
  `openshift-dr-ops` pattern and calls out the difference.
- **Managed applications** use the `openshift-gitops` layout and an
  ApplicationSet. That is a contrast, not a second tutorial.

## Linked merged PRs

None linked. This is a conceptual explainer with no owning ticket and no linked
pull request or merge request.

## Deployed-build provenance

UNVERIFIED. The source trace below explains the pinned upstream implementations.
It does not establish which commits built the running hub or spoke controllers
in the lab.

## Source trace

Pinned upstream read. The exact image tags that built the lab are not
established, so the deployed-build provenance stays UNVERIFIED.

| Label      | Repository                                  | Ref            | Commit                                     |
| ---------- | ------------------------------------------- | -------------- | ------------------------------------------ |
| RAMEN_MAIN | github.com/RamenDR/ramen                    | `main`         | `3ad9190a4b9425ad8cd0b8ba84adddf0a3e36e4a` |
| RAMEN_422  | github.com/red-hat-storage/ramen            | `release-4.22` | `181c5ca831a4db63b0e39d83f204163a6b709b50` |
| CSIADDONS  | github.com/csi-addons/kubernetes-csi-addons | `main`         | `b3aec6c825da4add6ea81dee7c2b21b670f773da` |
| POWERSTORE | github.com/dell/csi-powerstore              | `main`         | `4f04b4d67d8abf75fbe03995bba230817e757232` |
| CONSOLE    | github.com/red-hat-storage/odf-console      | `master`       | `2358a346d731b7560f027950467df8ded7541486` |

`odf-console` has no `main` branch, and `dell/csi-powerstore` has no
`release-4.22` branch. The DR UI lives in `packages/mco` of `odf-console`.

**Console enrollment.** `packages/mco/components/discovered-application-wizard/enroll-discovered-application.tsx`
calls `createPromise` in `.../utils/k8s-utils.ts`. It creates a dummy Placement
named `<name>-placement-1` in `openshift-dr-ops`, annotated
`cluster.open-cluster-management.io/experimental-scheduling-disable: "true"`,
with empty predicates, and a DRPC with `protectedNamespaces`,
`pvcSelector`, `kubeObjectProtection`, a full `drPolicyRef` (name, apiVersion,
kind) and `placementRef`. It never sets `spec.action`, so Ramen runs the
initial deployment.

**Validation and class matching.** `DRPolicyReconciler.validateDRPolicy`
(`internal/controller/drpolicy_controller.go`) sets `Validated=True` when the
DRClusters exist and are validated and no policy conflict is found. It does
not test whether a VolumeReplicationClass matches. `updatePeerClasses`
(`drpolicy_peerclass.go`, `getAsyncPeers`, `getVRID`) matches a class by
`schedulingInterval` parameter, `storageid` label, provisioner and the same
`replicationid` on both peers. `status.peerClasses[].grouping` is computed, not
set in the manifest.

**DRPC reconcile.** `getPlacementOrPlacementRule`
(`drplacementcontrol_controller.go`) adopts the Placement and sets the DRPC as
its owner. An empty action calls `RunInitialDeployment`, which calls
`createVRGManifestWork(homeCluster, Primary)`. The VRG travels in a ManifestWork
named `<drpc>-<vrgNamespace>-vrg-mw`.

**One VRG, not two.** At enrollment Ramen creates exactly one VRG, on the
preferred cluster, with `replicationState: Primary`. A Secondary VRG appears
only in the VolSync mover path used during relocate or failover. The peer has
the array-side replica target, not a VRG. This corrects an earlier draft of
this video.

**Protected condition.** `updateDRPCProtectedCondition`
(`internal/controller/protected_condition.go`) checks, in order, hooks,
`ClusterDataReady`, `DataReady`, `DataProtected`, `DestinationInfoAvailable`,
`NoClusterDataConflict`, generation and Primary state, a non-zero
`LastGroupSyncTime`, and `ClusterDataProtected`. `LastGroupSyncTime` is the
minimum per-PVC `LastSyncTime`, which csi-powerstore sets only when the session
state is `RsStateOk` or `FailedOver`. For the PowerStore path the first full
copy must therefore complete before `Protected=True`. Exceptions: a VRG labeled
`ramendr.openshift.io/global-vgr` skips the last-sync gate, and a driver that
does not implement `GetVolumeReplicationInfo` leaves the condition at
`Progressing`. The wall-clock order between `ClusterDataProtected` upload and
the first sync completion is UNVERIFIED.

**Storage path.** `createOrUpdateVR` (`vrg_volrep.go`) creates one
`VolumeReplication` per PVC, named after the PVC, and selects the class by the
same schedule, storageid, replicationid and provisioner filters. csi-addons
`enableReplication` issues the CSI-Addons `EnableVolumeReplication` RPC.
csi-powerstore `EnableVolumeReplication` calls `configureBlockReplication`,
which ensures the replication rule and protection policy, then assigns the
policy to the volume with `ModifyVolume`. The array creates the session. The
driver never issues the copy. It observes `RsStateInitializing`,
`RsStateSynchronizing` and `RsStateOk` through
`GetVolumeReplicationInfo`.

**No storage-vendor branch.** Ramen, csi-addons and the console contain no
PowerStore-specific branch. Selection is by StorageClass and class labels.
The managed path patches an existing Placement with `schedulerName: ramen` and
creates the DRPC in the application namespace without `protectedNamespaces`.
