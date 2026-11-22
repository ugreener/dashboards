# VIRTDR-499 evidence and controller trace

## Recorded outcome and scope

A recorded, reachable-source failover of a **managed (ApplicationSet) application** whose two
disks are protected by Dell PowerStore **volume-group** replication. Workload: RHEL 9 guest
`gitops-vms/hammerdb-rhel9` running PostgreSQL and a HammerDB TPC-C writer. Both sites stayed up
for the whole run: this is not a site-down test and not a Relocate.

- ApplicationSet `openshift-gitops/dell-vm-workload` (pull model, `clusterDecisionResource`)
- Placement `openshift-gitops/dell-vm-placement`
- PlacementDecision `openshift-gitops/dell-vm-placement-decision-1`
- DRPlacementControl `openshift-gitops/dell-vm-placement-drpc`, no `protectedNamespaces`
- DRPolicy `dr-policy-15m`, 900 s RPO
- VolumeReplicationGroup `gitops-vms/dell-vm-placement-drpc` on each spoke
- Claims `hammerdb-rhel9-rootdisk-mgd-grp` (35Gi) and `hammerdb-rhel9-datadisk-mgd-grp` (20Gi)
- StorageClass `powerstore-sc-group`; classes `powerstore-vgrc-15m` and `powerstore-vrc-group-15m`
- Source spoke-1 on ocp-edge97, VSA-B (`10.46.48.30`)
- Target spoke-0 on ocp-edge95, VSA-A (`10.46.48.20`), the DRPC `preferredCluster`
- Workload repo `elsapassaro/ramendr-starter-kit`, branch `ocp-4.22-rhdr-dell`, commit
  `8a94cd637d224f022d9b587db69c464f25875768`, path `clusters/dell-s4/workloads`

The DRPC reached `FailedOver` / `Completed` at 11:01:03Z. The postcheck passed 17 of 17 checks and
reported no new product defect. **Deployed-build provenance: UNVERIFIED.** The run used private RHDR
and Ramen images whose source revisions are not labelled by the run artifacts. The upstream refs
below are explanatory evidence, not proof of the deployed build.

## Refs read for this trace

| Tag | Repo                                                | Ref            | Commit                                     |
| --- | --------------------------------------------------- | -------------- | ------------------------------------------ |
| R   | red-hat-storage/ramen (downstream of RamenDR/ramen) | `release-4.22` | `e1fff7a5b3d1f19e5ac3f2a934787918ceebccba` |
| A   | red-hat-storage/kubernetes-csi-addons (downstream)  | `release-4.22` | `1dc3e84b0db65ea4be964419e175b924b0d6e6aa` |
| P   | dell/csi-powerstore                                 | `v2.18.2`      | `cf21f44f70933e8540b039b02e3e50d49d1c9739` |
| C   | kubevirt/containerized-data-importer                | `v1.66.1`      | `c8129be0728afa1a2c49b69b1c0847a42730a732` |
| G   | argoproj/argo-cd                                    | `v3.6.2`       | `8e8268ef2f3df99ca95663f5080fa6056f156805` |
| U   | red-hat-storage/odf-console                         | `master`       | `7205479dc23dfc87b68ec1ae137ecd23d7254920` |

ODF 4.22 pins csi-addons 0.14.0, matching the downstream `release-4.22` branch. The Dell CSI
CSI-Addons replication server first appears at `v2.18.0`, so a run that produced a group promote is
on 2.18.x; the exact deployed patch level is not recorded.

## Run evidence

- Ticket: [VIRTDR-499](https://redhat.atlassian.net/browse/VIRTDR-499), Closed, Sub-task of VIRTDR-218
- Consolidated logs: attachment `VIRTDR-499-logs-77fa7523.tar.gz` (id 1320139), containing
  `manifest.txt`, `evidence-index.md`, `preflight-20261122T105337Z.json`,
  `postcheck-20261122T112406Z.json`, `postcheck-20261122T112406Z.log` and the run log
- Screenshots: attachments 1320140 to 1320154 (11:24 UTC) and 1320197 to 1320199 (12:04 UTC)
- Run clips: attachments 1320155 to 1320158
- Ticket comments: 19687473 (run report, PASS) and 19688168 (Fleet Search capture gap closed,
  3 later screenshots)
- Remote links: none

### Observed timeline

All times UTC on 2026-11-22.

| Time     | Observation                                                                                  |
| -------- | -------------------------------------------------------------------------------------------- |
| 10:25:50 | Older of the two completed group syncs used by the gate (10:37:50 and 10:49:50)              |
| 10:38:17 | Baseline console captures: dell-vm-workload healthy on spoke-1, one consistency group        |
| 10:52:26 | Spoke-side Argo Application dell-vm-workload-spoke-1 Healthy, Synced to 8a94cd6              |
| 10:53:30 | Preflight `OVERALL PASS`, 7 checks (10 of 10 rows), Initiate deadline 11:03:50               |
| 10:55:51 | Row action menu: Failover and Relocate both offered                                          |
| 10:55:55 | Initiate clicked in the hub DR console, target spoke-0; actionStartTime 10:55:55             |
| 10:56:14 | DRPC `FailedOver` / `WaitingForResourceRestore`                                              |
| 10:56:29 | DRPC `FailedOver` / `Cleaning Up`; Available=True reason FailedOver                          |
| 10:56:59 | Replication health entry True, reason Ready                                                  |
| 11:00:10 | First recovered target write (recovery gap 620 s from 10:49:50)                              |
| 11:00:55 | DRPC `PeerReady=True` reason Success                                                         |
| 11:01:03 | DRPC `FailedOver` / `Completed`; actionDuration 5m0.44s                                      |
| 11:09:17 | First reverse sync (`lastGroupSyncTime`)                                                     |
| 11:12:00 | DRPC `Protected=True` reason Protected                                                       |
| 11:15:45 | Target Argo Application dell-vm-workload-spoke-0 Healthy, Synced to 8a94cd6                  |
| 11:16:23 | VSA-A replication page: all seven sessions Local role Source, Remote VSA-B                   |
| 11:16:58 | VSA-B replication page: all seven sessions Local role Destination, Remote VSA-A              |
| 11:24:06 | Postcheck 17 of 17 PASS; writer stopped, database running                                    |

### Measured result

- Lost writes: last recovered source row 10:49:50 → Initiate 10:55:55 = **365 s**, inside 900 s
- Recovery gap: 10:49:50 → first target row 11:00:10 = **620 s**. It is the age of the recovered
  copy when the guest started writing, not measured downtime: the source kept writing until
  Initiate and those 365 s of writes are the lost window.
- 47 complete source minutes before the last sync checked, **none missing**
- Last pre-Initiate interval carried **41,243** rows (postcheck); the earlier preflight read 41,257
  for the same interval before the postcheck recomputed it
- Writer count at stop: 9,858,036 → 9,858,036
- The postcheck reports the sync age at Initiate as **364 s** (unrounded) and the lost-writes span
  as **365 s** (rounded to the minute). Both describe the same interval.
- Target handles: root `7ef2772a-9bd1-4985-bfa4-42585ea463ad/PS3b37452a6e0f/scsi`,
  data `201b3d01-7e13-42c2-a6e3-fb0a00c4252c/PS3b37452a6e0f/scsi`
- Source handles: root `591a4a7f-24bf-4fb8-a849-918e7befc40e`,
  data `c5b23e62-d36c-4129-8a20-9be7535f1135`
- Group session: `089e71f9-8539-4720-9de4-afde796ce695`, state `OK`, one session covering both
  claims (`group_session: true`)
- `actionDuration` 5m0.44s is dominated by the DRPC's 5-minute failover requeue
  (`failoverRequeueDelay`), not by the array operation: the phase was already `FailedOver` with
  Available=True at 10:56:29.

## Ordered chain

### 1. The console writes the DRPC fields

The console patches `spec.action: Failover` and `spec.failoverCluster: spoke-0`, and it also
rewrites `spec.preferredCluster` to the current primary. The ticket describes two fields; the
console source patches three. The video says "the action and the target cluster" and does not
count fields.

- `U:packages/mco/components/modals/app-failover-relocate/failover-relocate-modal.tsx:72`
  (`onClick`)
- `U:packages/mco/.../parser/argo-application-set-parser.tsx:158` readiness gate

### 2. Ramen validates the target through a ManagedClusterView

`RunFailover` reads the target VRG through a ManagedClusterView and requires `status.state:
Secondary` at the current generation. At steady state both clusters already have a VRG: the source
as Primary, the target as Secondary. Failover flips an existing object rather than creating the
target stack from nothing.

- `R:internal/controller/drplacementcontrol.go:708` `RunFailover`,
  `:844` `isValidFailoverTarget`
- `R:internal/controller/util/mcv_util.go:152` `GetVRGFromManagedCluster`

### 3. The decision is retained, then the target VRG is set Primary

`switchToFailoverCluster` sets phase `FailingOver`, marks the current site's placement decision
`reason: RetainedForFailover`, and rewrites the target VRG's ManifestWork to
`spec.replicationState: primary` with `spec.action: Failover`. The retained entry is removed only
after the source VRG reports Secondary.

- `R:internal/controller/drplacementcontrol.go:899` `switchToFailoverCluster`,
  `:1763` `switchToCluster`, `:2852` `updateVRGState`, `:2959` `updateManifestWork`
- `R:internal/controller/drplacementcontrol_controller.go:2199`
  `retainPlacementClusterDecisionAsFailover`

### 4. Ramen treats this as a managed app, not a discovered one

`isDiscoveredApp` is true only when `protectedNamespaces` is non-empty. For this DRPC it is empty,
so Ramen copies no kube-object protection into the VRG and runs no Velero backup or restore. The
VRG states the consequence in its own status: **"Automated Cleanup not applicable: GitOps manages
the application's resource lifecycle."**

- `R:internal/controller/drplacementcontrol.go:1372` `isDiscoveredApp`,
  `:2313` `setVRGSpecFields`
- `R:internal/controller/vrg_kubeobjects.go:988` `kubeObjectProtectionDisabled`
- `R:internal/controller/volumereplicationgroup_controller.go:2126`
  `updateVRGAutoCleanupCondition`

### 5. The target VRG restores cluster data before the app is allowed to deploy

`processAsPrimary` restores PV and PVC records from the S3 archive and only then sets
`ClusterDataReady`. `cleanupPVCForRestore` clears owner references and prunes every
`replication.storage.openshift.io/*` annotation. The DRPC's readiness check requires `DataReady`,
`ClusterDataReady` and `state: Primary` before it moves the placement decision, which is what makes
the later DataVolume meet an already-bound claim.

- `R:internal/controller/volumereplicationgroup_controller.go:1483` `processAsPrimary`,
  `:721` `clusterDataRestore`, `:2900` `PruneAnnotations`
- `R:internal/controller/vrg_volrep.go:2443` `restorePVsAndPVCsForVolRep`,
  `:2935` `cleanupPVCForRestore`
- `R:internal/controller/status.go:28` `VRGConditionTypeClusterDataReady` (the comment states the
  ordering requirement)
- `R:internal/controller/drplacementcontrol.go:1645` `checkReadiness`

### 6. One VolumeGroupReplication and one group content

The VRG reads its `pvcSelector` and the policy peer class. Because `powerstore-sc-group` reports
`grouping: true`, Ramen adds the consistency-group label and sends both claims down the group path.
`createVGR` builds one VolumeGroupReplication in the claim namespace, named
`vgr-<groupReplicationID>-<VRG name>` on both clusters. csi-addons derives the
VolumeGroupReplicationContent and exactly one companion VolumeReplication, and copies the
companion's status back onto the VGR.

- `R:internal/controller/volumereplicationgroup_controller.go:946` `addVolRepConsistencyGroupLabel`,
  `internal/controller/drpolicy_peerclass.go:356` `getAsyncPeers`
- `R:internal/controller/vrg_volgrouprep.go:867` `createVGR`,
  `internal/controller/util/misc.go:406` `CreateVGRName`
- `A:internal/controller/replication.storage/volumegroupreplication_controller.go:116`
  `Reconcile`, `:259` VGRC, `:283` companion VR, `:347` status copy
- `A:internal/controller/replication.storage/volumegroupreplicationcontent_controller.go:190`
  `CreateVolumeGroup`, `:198` handle

### 7. One promote operation for the group

The companion VolumeReplication asks for Primary. csi-addons calls the CSI-Addons `Promote` RPC
with a volume-group source. The first call may return `FailedPrecondition` while the peer is up;
csi-addons then retries once with `force=true`. That is one group operation and one array action,
not one RPC and not one disk at a time. The Dell driver's `promoteVolumeForVolumeGroup` looks up
the replication session by the volume-group ID and executes one `Failover` with
`IsPlanned: false, Reverse: false`.

- `A:internal/controller/replication.storage/volumereplication_controller.go:331` Primary branch,
  `:611` `markVolumeAsPrimary`
- `A:internal/controller/replication.storage/utils.go:121` group client selection
- `A:internal/client/group-replication.go:90` `PromoteVolume` request
- `P:pkg/controller/csiaddons_replication.go:1034` `promoteVolumeForVolumeGroup`, `:1152`
  `FailoverParams`
- `P:pkg/controller/replication.go:560` `ExecuteAction`

### 8. The placement moves and GitOps takes over

The DRPC rewrites the PlacementDecision to the target and keeps the source as a retained entry
until cleanup completes. The ApplicationSet's `clusterDecisionResource` generator re-renders on its
180-second requeue, produces one Application per registered decision, and deletes the Application
whose cluster is no longer selected. Argo CD's resources finalizer then deletes the VM and
DataVolumes that the old Application tracked. Ramen never deletes them for a managed app.

- `R:internal/controller/drplacementcontrol_controller.go:1995`
  `createOrUpdatePlacementDecision`, `:2096` `removeClusterDecisionForFailover`
- `G:applicationset/generators/duck_type.go:61` `GenerateParams`
- `G:applicationset/controllers/applicationset_controller.go:739` `createOrUpdateInCluster`,
  `:908` `deleteInCluster`
- `G:applicationset/utils/utils.go:295` resources finalizer
- `G:controller/appcontroller.go:1447` cascade delete
- Owner `2ee9daa42c23e00f50cdd0424f0b602730421a87`
  `propagation-controller/application/application_controller.go:139` ManifestWork delivery

Argo CD v3.6.2 contains no ApplicationSet "pull model" code. The pull-model annotations on the
Application (`apps.open-cluster-management.io/pull-to-ocm-managed-cluster`,
`argocd.argoproj.io/skip-reconcile`) are consumed by the OCM propagation controller and the Argo CD
agent, not by the ApplicationSet controller. The delivery mechanism is therefore OCM plus the
spoke's Argo CD, which is what the video says.

### 9. CDI adopts the restored claim

Each protected disk has a same-named DataVolume in Git. On the target, a bound claim with that name
already exists, created by Ramen and left without a controller owner. With
`DataVolumeClaimAdoption` enabled, the admission webhook accepts the DataVolume and the controller
adds an owner reference instead of importing or cloning; the DataVolume is marked `Succeeded`.

- `C:pkg/feature-gates/feature-gates.go:22` `DataVolumeClaimAdoption`, `:70`
  `ClaimAdoptionEnabled`
- `C:pkg/apiserver/webhooks/datavolume-validate.go:488` admission rule
- `C:pkg/controller/datavolume/controller-base.go:718` `validatePVC`, `:1101` `addOwnerRef`,
  `:1339` `pvcRequiresWork`
- `C:doc/datavolume-claim-adoption.md`

The recorded proof is the handle: both target claims bind to the promoted disks, not to fresh
clones.

### 10. Re-protection after the move

The old site's VRG becomes Secondary with action Failover, so Ramen sets `autoResync: true` on that
site's VGR; csi-addons copies it to the companion VR, and the driver's Resync issues the array
`Reprotect`. `Protected` cannot become true until the new primary's VRG reports a non-zero
`lastGroupSyncTime`, which is why it follows the first reverse sync.

- `R:internal/controller/vrg_volrep.go:1490` `autoResync`,
  `internal/controller/protected_condition.go:335` `updateMiscVRGStatus`
- `P:pkg/controller/csiaddons_replication.go:1455` demote no-op on `Failed_Over`/Source, `:1726`
  `Reprotect` on resync
- `A:internal/controller/replication.storage/volumereplication_controller.go:380` resync force

## Failure modes the source proves but this run did not exercise

- A VGR that has never been Primary and whose PVC carries a stale
  `replication.storage.openshift.io/volume-group-replication-name` annotation different from the
  requested owner fails `annotatePVCWithOwner` with
  `PVC (ns/name) not owned by correct VolumeReplication/VolumeGroupReplication "..."`, and the VGR
  shows state `Unknown` with that message
  (`A:internal/controller/replication.storage/pvc.go:70`,
  `volumegroupreplication_controller.go:687`). The strong form of the ticket's claim is not
  reachable through Ramen's own restore: `cleanupPVCForRestore` prunes that annotation family, and
  the VGR name is derived from class and VRG names that are identical on both clusters. Reachable
  triggers are a claim restored by a mechanism that preserves annotations (Velero/OADP kube-object
  restore), a claim carrying both a per-volume and a group owner annotation, or a VGR name change
  between clusters.
- A group left in `Failed_Over` with "reprotect required" can sit behind a DRPC that still reports
  Protected and PeerReady. This run instead reversed; the arrays show Source on VSA-A and
  Destination on VSA-B, and the first reverse sync is recorded.
- A managed claim created outside Git would survive the move and hold the source VRG in cleanup.
  The preflight required a Succeeded, Argo-tracked DataVolume per disk and found none missing, so
  the condition was not exercised.
- A hub Application that stays `Progressing` while the spoke Application is Healthy is tracked in
  ACM-47865, now Closed. No such state was recorded in this run, and the video does not claim it.

## Linked merged PRs

None linked. The ticket has zero remote links and its description and comments name no PR or MR.

## Provenance, gaps and caveats

- **Deployed build unverified.** Private RHDR/Ramen images without a labelled source revision.
  Upstream refs explain mechanisms consistent with the observed objects.
- **VGR and VGRC names for this run are not recorded.** They do not appear in the preflight,
  postcheck, run log or screenshots. The animation therefore does not print them; it names the
  arrays, the VRGs, the claims, the DataVolumes and the Application objects, all of which are
  recorded.
- **The array's volume-group name for this workload is not identified in the run record.** The
  PowerStore replication page shows seven sessions named by group UUID; no row is labelled with the
  workload, and several share the same last-sync minute. The array evidence is used for the role
  flip across all sessions, not as a named mapping to this workload.
- **Console time bases differ.** The ACM popovers print explicit UTC. PowerStore prints
  `UTC +02:00`, so 01:09 PM is 11:09 UTC. Argo CD prints unlabelled browser-local time; its
  `CREATED AT` stamps do not reconcile with the run window and are not used in narration.
- **Screenshots skipped.** `10-completion-drpc-completed.png` reads "healthy", not "Completed", so
  it is not used for completion. `12-completion-placementdecision.png` renders a YAML
  `creationTimestamp` of 2026-12-12, three weeks after the run, so it is not used. The baseline
  array pair duplicates the group story before the move and is not used.
  `04-baseline-drpolicy-row.png` is covered by narration and not used.
- **Known UI defect visible in the dialog.** `Last available` reads 2026-11-19, three days before
  the run. That is the symptom tracked as DFBUGS-12487 (moved from VIRTDR-308), open Major. It is
  labelled on screen and is not evidence about this run.
- **The success banner and the row use different names.** The banner names
  `dell-vm-placement-drpc`; the row names the ApplicationSet `dell-vm-workload`. Both refer to the
  same protection object and the ticket records the difference.
- **Fleet Search gap.** The run's Fleet Search query returned no PlacementDecision or VRG result
  because the search tab had not been opened; the later comment closes the gap with three
  screenshots. It was an interaction error, not a product bug.
