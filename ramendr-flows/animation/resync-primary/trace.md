# Trace: resync on the primary vs resync on the secondary

Conceptual explainer about which side of a replicated disk pair receives the
`ResyncVolume` call after a failover, why Dell PowerStore needs it on the
primary while Ceph uses the secondary, and what the upstream and downstream
changes do about it.

This is not a recorded failover run. There is no run log, no preflight and no
postcheck. Every screen is an architectural example. The two incident tickets
appear only as labelled failure modes.

## Linked merged PRs

None linked. VIRTDR-167, VIRTDR-477, VIRTDR-478, DFBUGS-12498 and
DFBUGS-12519 carry no merged pull request or merge request remote links. The
relevant code lives in fork and downstream branches, not in merged upstream
PRs, so no PR diff is read as provenance.

## Source trace

### 1. The upstream VolumeReplication reconciler

Repository: `csi-addons/kubernetes-csi-addons`, branch `main`.

File: `internal/controller/replication.storage/volumereplication_controller.go`.

`Reconcile` switches on `instance.Spec.ReplicationState`:

- `Primary`: when `status.State != PrimaryState`, call `enableReplication` and
  `markVolumeAsPrimary`. `markVolumeAsPrimary` calls the driver's
  `PromoteVolume`. There is no resync call in this branch.
- `Secondary`: when `status.State != SecondaryState`, call
  `markVolumeAsSecondary` and requeue after 30 seconds. On the steady-state
  path, call `markVolumeAsSecondary` (the driver's `DemoteVolume`) and then
  `resyncVolume` with `vr.force = spec.autoResync`.
- `Resync`: set `vr.force = true` and call `resyncVolume`.

`resyncVolume` calls the driver's `ResyncVolume`.

The API already defines `Primary = "primary"`, `Secondary = "secondary"` and
`Resync = "resync"` in
`api/replication.storage/v1alpha1/volumereplication_types.go`.

### 2. The downstream RHDR patch

Repository: `redhat-dr/kubernetes-csi-addons`, branch `devel`.

Commit `938e90c74` "rhdr: call resync on primary" adds, inside the
`status.State != PrimaryState` block and after a successful
`markVolumeAsPrimary`:

```
vr.force = vr.instance.Spec.AutoResync
requeueForResync, replicationErr = r.resyncVolume(vr)
```

It also makes `resyncVolume` return `(false, nil)` when
`util.IsOutOfRangeError(resp.Error)` is true. The helper `IsOutOfRangeError`
is added in `internal/util/error.go`.

Commit `97566910b` "rhdr: ignore OutOfRange error on DisableVolumeReplication"
is a separate teardown change and is not part of the resync path.

The lab controller image is `quay.io/nnevin/csi-addons/k8s-controller:v0.14.10`,
installed from `nicknevin/kubernetes-csi-addons` branch `rhdr`. The image
carries no source-revision label, so exact commit provenance from the image is
UNVERIFIED. The behaviour observed in DFBUGS-12519 (a Reprotect executed on the
new primary) is consistent with the patch.

### 3. The Dell PowerStore driver

Repository: `dell/csi-powerstore`, branch `main` (CSM 1.18.2, 2026-11-06).

File: `pkg/controller/csiaddons_replication.go`.

`ResyncVolume` calls `resyncVolumeForVolume`, which switches on the replication
session state:

- `RsStateOk`: return `Ready: true`.
- `RsStateSynchronizing`, `RsStateInitializing`, `RsStateResuming`,
  `RsStateReprotecting`: return `Ready: false`.
- Paused states: execute `Resume`, return `Ready: false`.
- `RsStateFailedOver` with local role `Source`: execute `RsActionReprotect`,
  return `Ready: false`.
- `RsStateFailedOver` with local role `Destination`: return gRPC `OutOfRange`,
  message "replication session ... is in Failed_Over state and local is
  Destination; waiting for Source-side Resync".
- `RsStateFailingOver`: return `Aborted`.

`DemoteVolume` on a `Failed_Over` session whose local role is `Source` is a
no-op: the code says the actual reversal is handled by `ResyncVolume`
(Reprotect). On `Destination` it is also a no-op.

### 4. The Ramen proposal and candidate implementation

GitHub issue: `csi-addons/kubernetes-csi-addons#1200`, "Resync from the
Primary", opened by `nicknevin` on 2026-11-05.

- Option 1: always call `ResyncVolume` on the primary and ignore `OutOfRange`.
- Option 2: use the existing `Resync` state, gated by an annotation.

Comment 2026-11-10 from `nicknevin`: the decision was option 2, gated by a DRPC
annotation to keep Ceph backward compatible, with the implementation in Ramen
and no csi-addons change required for that proposal.

Comment 2026-11-10 from `Madhu-1`: some storage providers need the resync on the
primary, the trigger timing and automation drawbacks need agreement, and the
change touches the spec, the drivers and csi-addons.

Branch `nicknevin/ramen` `resync-on-primary-candidate`, commit `2d67aadfc`
"vrg: resync primary VR/VGR when not replicating to secondary":

- Annotation constant in `internal/controller/util/misc.go`:
  `drplacementcontrol.ramendr.openshift.io/resync-on-primary`.
- The DRPC copies the annotation to the VRG in `setVRGAnnotations`.
- `primaryReplicationState` sets a primary VR or VGR to `resync` when the VR
  reports `Replicating=False`; keeps it in `resync` until `Degraded=False` and
  `Resyncing=False`; then returns it to `primary`.
- Conditions are only acted on when current for the VR generation. VGR decisions
  use the backing VR's status because csi-addons stamps VGR conditions with the
  VGR generation.
- Global VGRs shared with sibling VRGs are not resynced.
- While resyncing, `updatePVCsResyncingConditions` keeps `DataReady=True`, sets
  `DataProtected=Progressing` and `ReplicationHealthy=False`.
- Removing the annotation, or deleting the VRG, returns the VR or VGR to
  `primary`.

Branch `nicknevin/ramen` `resync-in-addons`, commit `764ffca40` (2026-11-12)
keeps only the annotation propagation: DRPC to VRG, then VRG to the
VolumeReplication as `replication.storage.openshift.io/resync-on-primary`.
The comment records that the VR key is defined locally until csi-addons defines
it. No csi-addons consumer for that key is published.

Candidate csi-addons branch `ramen-resync-on-primary-candidate-2` adds a
`Validated` condition refresh (`observedGeneration`) so Ramen's generation-gated
checks do not read stale conditions after a resync transition.

### 5. The two labelled failure modes

DFBUGS-12498: discovered-application failover, source cleanup runs while the
array sessions are still `Failed_Over`. The demoted source side calls
`ResyncVolume`, the driver returns `OutOfRange` because that side is the
Destination, and no primary-side call is made at that point. Source PVCs stay
Terminating behind `pvc-vr-protection` and `pvc-protection`, the source VRG
stays `secondary/Unknown`, and the DRPC parks at
`FailedOver/WaitOnUserCleanUp`. The exact reason the follow-up reconcile never
issued the primary-side call in that run is UNVERIFIED. The transition-timed
patch and the steady-state primary branch are consistent with the logs but do
not prove the stop point.

DFBUGS-12519: combined site and source-array loss. The target array promotes
locally. The primary-side `ResyncVolume` immediately executes Reprotect, which
fails while the peer array is powered off. csi-addons reports
`Completed=False(FailedToResync)`, Ramen sets `DataReady=False`, and the
kube-object restore never recreates the VM.

### 6. Status

- VIRTDR-167 "PowerStore resync on the primary": Closed. Proposed the
  OutOfRange-on-secondary plus resync-on-primary approach. Implemented in the
  PowerStore driver and the RHDR csi-addons build.
- VIRTDR-478 "Implement resync on primary in Ramen": In Progress, Suvro Ghosh
  picking it up while Nick Nevin is on vacation.
- VIRTDR-477 "Upstream resync on primary": New, depends on VIRTDR-478.
- DFBUGS-6801: product RFE for orchestrating resync on the primary.
- VIRTDR-306, csi-addons issue #1180 and PR #1190: adjacent work on dual-side
  VGR and secondary membership. Not the resync-side decision.

## What this video does not claim

- It does not claim the lab image contains a specific commit. Image provenance
  is unverified.
- It does not claim DFBUGS-12498's exact stop point. That is marked unverified.
- It does not present the Ramen branch as merged or shipped.
- It does not initiate or require a failover.
