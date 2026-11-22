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
found no product defect. **Deployed-build provenance: UNVERIFIED.** The run used private RHDR and
Ramen images whose source revisions are not labelled by the run artifacts; the upstream SHAs below
are explanatory evidence, not proof of the deployed build.

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
| 10:56:59 | DRPC `ReplicationHealthy=True` reason Ready                                                  |
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
- Recovery gap: 10:49:50 → first target row 11:00:10 = **620 s**
- 47 complete source minutes before the last sync checked, **none missing**
- Last pre-Initiate interval carried **41,243** rows (postcheck); the earlier preflight read 41,257
  for the same interval before the postcheck recomputed it
- Writer count at stop: 9,858,036 → 9,858,036 (stopped)
- Target handles: root `7ef2772a-9bd1-4985-bfa4-42585ea463ad/PS3b37452a6e0f/scsi`,
  data `201b3d01-7e13-42c2-a6e3-fb0a00c4252c/PS3b37452a6e0f/scsi`
- Source handles: root `591a4a7f-24bf-4fb8-a849-918e7befc40e`,
  data `c5b23e62-d36c-4129-8a20-9be7535f1135`
- Group session: `089e71f9-8539-4720-9de4-afde796ce695`, state `OK`, one session covering both
  claims (`group_session: true`)

## Ordered chain

The controller trace below reconciles this ticket's recorded objects with the repository's
verified upstream traces for the same components: `virtdr-292/trace.md` for the managed
(ApplicationSet) path and `virtdr-498/trace.md` for the volume-group path. Upstream links are
immutable and are explanatory evidence, not deployed-build provenance.

### 1. The console writes two fields on the hub record

The Failover dialog writes `spec.action: Failover` and `spec.failoverCluster: spoke-0` on
`dell-vm-placement-drpc`. Ramen's DRPC controller validates the target VRG state, then
`switchToFailoverCluster` keeps the existing decision (`reason: RetainedForFailover`) and requests
the target VRG as Primary through a ManifestWork. `setVRGAction` adds `spec.action: Failover` to
the target VRG.

Sources (RamenDR/ramen at `dd0cd2575bc591f9091a64e1cc8cb02958c1d25c`):
`internal/controller/drplacementcontrol.go:430` `RunFailover`, `:566` `isValidFailoverTarget`,
`:621` `switchToFailoverCluster`, `:1473` `switchToCluster`, `:2092` `setVRGAction`; retention
`internal/controller/drplacementcontrol_controller.go:2278`.

### 2. The target VRG takes the group path

The VRG reads its `pvcSelector` (`appname in (hammerdb-rhel9-mgd-grp)`) and the DRPolicy peer
class. Because `powerstore-sc-group` reports `grouping: true`, Ramen adds the consistency-group
label and splits the claims into the group path. `createVGR` builds the VolumeGroupReplication in
the claim namespace; csi-addons derives the VolumeGroupReplicationContent and the companion
VolumeReplication from it.

Sources: Ramen `internal/controller/volumereplicationgroup_controller.go:1028`
`addVolRepConsistencyGroupLabel`, `internal/controller/drpolicy_peerclass.go:356` `getAsyncPeers`,
`internal/controller/vrg_volgrouprep.go:893` `createVGR`; csi-addons at
`998a2ad6d88010991e36edc3b18d80d26fd85d0f`
`internal/controller/replication.storage/volumegroupreplication_controller.go:115` `Reconcile`,
`:753` `createOrUpdateVolumeGroupReplicationContentCR`, `:831`
`createOrUpdateVolumeReplicationCR`.

### 3. Restore rewrites the storage records and the group map

The target VRG Primary path restores the PV and PVC records from the S3 archive.
`cleanupPVForRestore` replaces each PV's `spec.csi.volumeHandle` with the recorded destination
handle. `restoreVGRsAndVGRCsFromS3` → `cleanupVGRCForRestore` replaces the archived group handle,
and `updateVGRCVolumeHandlesForRestore` replaces each source disk handle from
`status.persistentVolumeMappingList`.

Sources: Ramen `internal/controller/vrg_volrep.go:2627` `restorePVsAndPVCsForVolRep`, `:3253`
`cleanupPVForRestore`, `internal/controller/vrg_volgrouprep.go:1205` `restoreVGRsAndVGRCsFromS3`,
`:1354` `cleanupVGRCForRestore`, `:1386` `updateVGRCVolumeHandlesForRestore`.

### 4. One promotion for the group

The companion VolumeReplication asks for Primary. csi-addons calls the CSI-Addons `Promote` RPC;
the Dell driver's `PromoteVolume` sees a volume-group ID and calls
`promoteVolumeForVolumeGroup`, which executes one `Failover` action for the group with
`IsPlanned: false, Reverse: false`. There is no per-disk promote step. The VGR status is copied
from the companion VolumeReplication.

Sources: csi-addons `replication.storage/volumereplication_controller.go:332` Primary branch, `:609`
`markVolumeAsPrimary`; Dell csi-powerstore at `cf21f44f70933e8540b039b02e3e50d49d1c9739`
`pkg/controller/csiaddons_replication.go:1034` `promoteVolumeForVolumeGroup`, `:1152`
`FailoverParams`; `pkg/controller/csiaddons_volumegroup_helpers.go:306`
`ExecuteActionOnReplicationSession`.

### 5. The placement decision moves and GitOps takes over

`switchToCluster` gates placement on target readiness and
`createOrUpdatePlacementDecision` records spoke-0. The ApplicationSet's
`clusterDecisionResource` generator reads PlacementDecisions in `openshift-gitops` and regenerates
one Application per selected cluster (`requeueAfterSeconds: 180`). The pull-model controller
creates a ManifestWork in the spoke's cluster namespace, and the spoke's Argo CD syncs the
Application from the same Git revision.

Sources: Ramen `internal/controller/drplacementcontrol.go:1473` `switchToCluster`,
`drplacementcontrol_controller.go:2074` `createOrUpdatePlacementDecision`; Argo CD at
`ce87b97c897c7e8644dee3b785d62bc8f0386bdf` `applicationset/generators/duck_type.go:27` requeue,
`:80` namespace reads, `:146` matching; OCM multicloud-integrations at
`2ee9daa42c23e00f50cdd0424f0b602730421a87`
`propagation-controller/application/application_controller.go:139` `Reconcile`, `helper.go:78`
`prepareApplicationForWorkPayload`.

The ApplicationSet template carries `syncPolicy.automated` with `prune: true` and `selfHeal: true`,
and `syncOptions: CreateNamespace, PruneLast`. Argo deletes resources the old Application owned
(the VM and its DataVolumes) once the old generated Application is removed; nothing is deleted by
hand. The postcheck confirms no VM, VMI, DataVolume or PVC remains on spoke-1.

### 6. CDI adopts the restored claims instead of importing

Each protected disk has a same-named DataVolume in the Git path. On the target, a bound claim with
that name already exists because Ramen restored it. With the `DataVolumeClaimAdoption` feature gate
enabled (both spokes list it in `CDIConfig.spec.featureGates`), CDI adopts the existing claim: the
DataVolume is marked `Succeeded` and an owner reference is added to the claim, and no import or
clone runs. The recorded proof is the handle: both target claims bind to the promoted disks, not to
a fresh clone of the `rhel9` DataSource.

Sources: CDI `doc/datavolume-claim-adoption.md` ("instantly marked Succeeded and an
OwnershipReference is added"), `pkg/feature-gates/feature-gates.go:20` `DataVolumeClaimAdoption`;
VIRTDR-499 preflight checks 6 and 7; postcheck "uses promoted replica" for both claims.

### 7. Re-protection after the move

The target array became Source and the old array Destination; the first reverse sync was 11:09:17
and the DRPC reported `Protected=True` at 11:12:00. A Primary VGR reports `autoResync: false` as a
consequence of its state, so that field is not evidence about the reverse copy. The recorded
evidence is the array session role and the DRPC condition.

Sources: Dell `pkg/controller/csiaddons_replication.go:1310` demotion branch; Ramen
`internal/controller/vrg_volrep.go:1499` `autoResync` computation, `vrg_volgrouprep.go:846` VGR
`autoResync` write.

## Failure modes the source proves but this run did not exercise

- A restored PVC carrying a stale `replication.storage.openshift.io/volume-group-replication-name`
  annotation parks the target VGR in `Unknown` with
  `PVC (ns/name) not owned by correct VolumeReplication/VolumeGroupReplication`. csi-addons will not
  rewrite an existing owner annotation. The target VGR in this run was Primary, so this did not
  occur.
- With the old site's VRG left in `Secondary` while `autoResync` is false, the group can stay
  `Failed_Over` with "reprotect required" even while the DRPC reports Protected and PeerReady. This
  run instead reversed; the record shows Primary and a running reverse copy.
- A managed workload claim created outside Git would survive the move and hold the source VRG in
  cleanup. This run's preflight required a Succeeded, Argo-tracked DataVolume per disk and found
  none missing, so the condition was not exercised.
- A hub Application that stays `Progressing` while the spoke Application is Healthy is tracked in
  ACM-47865, now Closed. No such state was recorded in this run's evidence, and the animation does
  not claim it.

## Linked merged PRs

None linked. The ticket has zero remote links and its description and comments name no PR or MR.

## Provenance, gaps and caveats

- **Deployed build unverified.** Private RHDR/Ramen images without a labelled source revision.
  Upstream citations explain mechanisms consistent with the observed objects.
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
  `creationTimestamp` of 2026-12-12, three weeks after the run, so it is not used.
  `06-baseline-vsa-*-replication.png` duplicate the array story before the move and are not used.
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
