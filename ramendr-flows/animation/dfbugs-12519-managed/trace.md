# DFBUGS-12519 managed-app site-down animation trace

## What each part asserts

Part one is the normal managed-app flow, illustrated with the 2026-10-07 recorded run (VIRTDR-292). The ordered controller trace below is that run's trace and still describes the mechanism part one shows.

Part two is the 2026-11-25 site-down run that produced DFBUGS-12519. It asserts only what the run recorded.

## Part two: configuration and evidence

- Run record: `DFBUGS-12519-run-log-20261125T132841Z.md`, `postcheck-20261125T132841Z.json`, `preflight-20261125T125822Z.json`, phase A snapshot `phase-a-state-20261125T1314Z.txt`, all under `~/Pictures/Screenshots/dell-dr-failover-2026-11-25/` and in the posted archive `DFBUGS-12519-flow-logs-20261125T1632Z.zip`.
- Label: `ramendr.openshift.io/resync-on-primary: "true"` on `VolumeGroupReplicationClass/powerstore-vgrc-15m` on both spokes. The DRPC annotation was not used.
- Grouping: `grouping: true` in the VRG peer class entry, disks on `StorageClass/powerstore-sc-group`, one `VolumeGroupReplication` per app, one group session per array.
- Workload: `gitops-vms/hammerdb-rhel9`, DRPC `openshift-gitops/dell-vm-placement-drpc`, claims `hammerdb-rhel9-rootdisk-mgd-grp` and `hammerdb-rhel9-datadisk-mgd-grp`.
- Builds: Ramen `quay.io/sughosh/ramen-operator:resync-via-vgr-class` digest `sha256:8bce11858fa137357098cbb1eb285c93365799014d196b515614c9fc880834cc`; csi-addons controller `quay.io/sughosh/k8s-controller:upstream-main` digest `sha256:737e45c6600a881437464d78c8449822b10722851a3de249864b345705ccb3f6`; Dell driver `quay.io/martjack/csi-powerstore:v26.11.17` digest `sha256:d922a937e7430d356a40806ea6ab0697ff2149a482673d0b8e93b307a06c7716`.

Observed phase A (13:14Z, peer array off):
- VGR `vgr-4251c970...-dell-vm-placement-drpc`: state Primary, Completed False(FailedToResync), Degraded True(Error), Resyncing False(FailedToResync), Replicating False(NotReplicating).
- VRG `gitops-vms/dell-vm-placement-drpc`: DataReady True(Ready), DataProtected False(Error), ClusterDataReady True(Restored), KubeObjectsReady True(KubeObjectsRestored).
- DRPC: FailedOver/Cleaning Up, Available True, PeerReady False, Protected False, ReplicationHealthy False.
- VMI `gitops-vms/hammerdb-rhel9`: Running.
- VSA-B: 7 sessions, 2 Failed_Over Source, 5 OK Destination.

Observed phase A postcheck (13:28:41Z): PASS 14/14; last sync 12:55:47; Initiate 13:01:52; data loss 365 s; recovered gap 12:55:47 to 13:06:04; 57 complete source minutes, missing none. The DRPC started the run in Relocated/Completed.

Observed phase B (14:22Z): source VRG Secondary; target VGR Completed True(Promoted), Degraded False(Healthy), Replicating True; DRPC FailedOver/Completed with Protected, PeerReady and ReplicationHealthy True.

## Part two: source status

The build under test is a personal Ramen image whose branch is not published, so the class-label code path is not source-verified. The public related design is RamenDR/ramen PR #2982 (`resync-on-primary-candidate`), which implements the same resync-from-primary behaviour for a DRPC annotation: a primary VR or VGR that reports `Replicating=False` is moved to `Resync`, then back to Primary when the resync completes, and `DataReady` progresses while resyncing. csi-addons issue #1200 is the referenced gap. `autoResync` is a separate VRG peer-class setting: `vrg_volgrouprep.go` writes `volRep.Spec.AutoResync = v.autoResync(state)`.

INFERRED (shown on screen in 16.5): that the class label makes Ramen request the resync from the primary side. OBSERVED: DataReady stayed True(Ready), the VGR stayed FailedToResync, and the VMI ran. The video separates the inference from the observation.

INFERRED (16.7): that Argo CD deployed the workload on spoke-1. The phase A snapshot records the VMI Running, not the Application status. The deployment path itself is the managed mechanism shown in part one and described in VIRTDR-499.

## Part one: ordered upstream source trace


Research was delegated as required by flow-animation. Links are immutable. These upstream SHAs are explanatory evidence, not established deployed-build provenance.

1. **Validate target.** Ramen `RunFailover` and `isValidFailoverTarget` check target VRG state and observed generation. Regional checks distinguish storage maintenance from Metro fencing. [Functions](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/drplacementcontrol.go#L430-L592), [Regional prerequisites](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/drplacementcontrol.go#L762-L785).
2. **Retain source before promotion.** `switchToFailoverCluster` preserves the decision with `reason: RetainedForFailover`, then requests target Primary through VRG ManifestWork. [Switch](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/drplacementcontrol.go#L621-L658), [retention](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/drplacementcontrol_controller.go#L2278-L2316).
3. **Restore storage identity.** `processAsPrimary` restores cluster data first. `restorePVsAndPVCsFromS3` recreates storage definitions. `cleanupPVForRestore` substitutes the destination handle when the saved annotation exists. ClusterDataReady alone does not prove all PVCs Bound. [Primary](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/volumereplicationgroup_controller.go#L1497-L1535), [restore](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/vrg_volrep.go#L2481-L2599), [handle substitution](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/vrg_volrep.go#L2944-L2970).
4. **Enable and promote.** csi-addons enables replication before promotion. `markVolumeAsPrimary` retries with Force only after FailedPrecondition. [Reconcile](https://github.com/csi-addons/kubernetes-csi-addons/blob/e755c40fd8dd2364db86a0dba53aff11ae4c7e40/internal/controller/replication.storage/volumereplication_controller.go#L331-L356), [promotion](https://github.com/csi-addons/kubernetes-csi-addons/blob/e755c40fd8dd2364db86a0dba53aff11ae4c7e40/internal/controller/replication.storage/volumereplication_controller.go#L609-L638). **UNVERIFIED:** actual force variant in this run.
5. **Promotion is distinct from reprotection.** PowerStore forced destination promotion invokes unplanned failover with `Reverse:false` at the inspected SHA. A demotion branch leaves reversal to resync/reprotect. [Promotion](https://github.com/dell/csi-powerstore/blob/c35ca28883044f240bab36d47e43da3f96f080cd/pkg/controller/csiaddons_replication.go#L979-L1022), [demotion](https://github.com/dell/csi-powerstore/blob/c35ca28883044f240bab36d47e43da3f96f080cd/pkg/controller/csiaddons_replication.go#L1310-L1332). Do not draw reversed replication as an immediate proven consequence of promotion.
6. **Placement follows readiness.** `switchToCluster` gates placement on target readiness. `createOrUpdatePlacementDecision` carries retained decisions forward and appends the target. [Switch](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/drplacementcontrol.go#L1473-L1502), [decision update](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/drplacementcontrol_controller.go#L2074-L2119).
7. **ApplicationSet polls.** `GetRequeueAfter` honors requeue. `GenerateParams` reads the ConfigMap and decisions in the configured Argo CD namespace, matching registered clusters without excluding RetainedForFailover. [Requeue](https://github.com/argoproj/argo-cd/blob/ce87b97c897c7e8644dee3b785d62bc8f0386bdf/applicationset/generators/duck_type.go#L27-L54), [namespace reads](https://github.com/argoproj/argo-cd/blob/ce87b97c897c7e8644dee3b785d62bc8f0386bdf/applicationset/generators/duck_type.go#L80-L123), [matching](https://github.com/argoproj/argo-cd/blob/ce87b97c897c7e8644dee3b785d62bc8f0386bdf/applicationset/generators/duck_type.go#L146-L177). **UNVERIFIED:** exact generation time and attribution to polling.
8. **Pull-model delivery.** OCM `ApplicationReconciler.Reconcile` creates ManifestWork in the cluster namespace. `prepareApplicationForWorkPayload` rewrites destination for the spoke and drops hub-only routing/skip-reconcile annotations. Work agent applies the Application, then spoke Argo CD syncs. [Reconcile](https://github.com/open-cluster-management-io/multicloud-integrations/blob/2ee9daa42c23e00f50cdd0424f0b602730421a87/propagation-controller/application/application_controller.go#L139-L247), [payload](https://github.com/open-cluster-management-io/multicloud-integrations/blob/2ee9daa42c23e00f50cdd0424f0b602730421a87/propagation-controller/application/helper.go#L78-L237). A shared branch is not proof of identical resolved commits.
9. **Source decision removal follows spec acknowledgement.** `cleanupSecondary` requests Secondary and removes retained placement after observing the Secondary spec at matching generation. Completed Secondary status is a later gate. Application deletion triggers ManifestWork deletion. [Cleanup](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/drplacementcontrol.go#L2387-L2450), [Application deletion](https://github.com/open-cluster-management-io/multicloud-integrations/blob/2ee9daa42c23e00f50cdd0424f0b602730421a87/propagation-controller/application/application_controller.go#L166-L205).
10. **Disuse, demotion and release.** `isPVCInUse` checks pods and attachments. csi-addons Demote/Resync span reconciliations. Ramen accepts the required Resyncing/Degraded combination for Secondary, then releases protection. [Disuse](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/vrg_volrep.go#L297-L362), [Demote/Resync](https://github.com/csi-addons/kubernetes-csi-addons/blob/e755c40fd8dd2364db86a0dba53aff11ae4c7e40/internal/controller/replication.storage/volumereplication_controller.go#L358-L382), [validation](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/vrg_volrep.go#L1965-L2010), [release](https://github.com/RamenDR/ramen/blob/bfc260a61560929b63cbeb2ad7c523913a31cf3c/internal/controller/vrg_volrep.go#L1167-L1186).

## Last-sync reporting

PowerStore `getVolumeReplicationInfoForVolume` assigns `timestamppb.Now()` for OK/Failed_Over at this SHA. csi-addons copies it into VR status. This is not proof of a completed array sync. [Assignment](https://github.com/dell/csi-powerstore/blob/c35ca28883044f240bab36d47e43da3f96f080cd/pkg/controller/csiaddons_replication.go#L1861-L1884), [status copy](https://github.com/csi-addons/kubernetes-csi-addons/blob/e755c40fd8dd2364db86a0dba53aff11ae4c7e40/internal/controller/replication.storage/volumereplication_controller.go#L447-L464). Deployed-driver provenance and console readiness calculation remain unverified by this trace.

## Automatic production

Revised beats supersede existing drafts where corrected. The user requests autonomous script review, implementation, rendering and publishing without an explicit approval checkpoint. The complete video must include all revised beats with matching generated narration and visuals. The existing draft is not the corrected final video.

## Newcomer rewrite: screenshots and live names

The beat sheet was rewritten from scratch for the newcomer rules (glossary chapter, phase framing, recaps, screenshots).

- All ten run-date screenshots (attachments 1237288 to 1237299, `tools/evidence.py virtdr-292 --date 2026-10-07`) were inspected. None shows credentials. Console times are browser-local (UTC+3), so captions convert to UTC.
- Known open bugs visible in the captures are labeled on screen, not presented as correct: VIRTDR-308 (stale "Last available" in the confirmation dialog, shot 23) and VIRTDR-316 (popover title "Failover complete" at 3 of 4 steps, shot 25).
- Shot 24 is named "initiated ... failingover" but already shows the FailedOver row and banner, so it is used at the Cleaning Up beat.
- Exact names confirmed by a read-only hub listing on 2026-10-10 (objects created before the run): PlacementDecision `dell-vm-placement-decision-1`, ManifestWork `dell-vm-drpc-gitops-vms-vrg-mw` (and `dell-vm-drpc-gitops-vms-ns-mw`, the Ramen namespace parcel) in `spoke-0`/`spoke-1`, ManagedClusterView `dell-vm-drpc-gitops-vms-vrg-mcv`. The pull-model Application ManifestWork carries a generated suffix and is not named on screen.
- The root-disk DataVolume at e6237ef clones `sourceRef` DataSource `rhel9`; replica reuse instead of a fresh clone is recorded via volume handles and recovered rows, while the CDI adoption mechanics stay unverified.
