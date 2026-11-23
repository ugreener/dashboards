# dfbugs-12906: provenance and source trace

Record: DFBUGS-12906, "Failover source cleanup leaves old-site PVs stuck deleting against the live
replica". Bug, priority Major, status New, opened 2026-11-22. Component `odf-dr/ramen`, label
`firefish`. Composition name `dfbugs-12906`.

Related links on the ticket: VIRTDR-498 and VIRTDR-218. Neither is a pull request.

## What was recorded

| Item       | Value                                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| Run        | VIRTDR-498, Closed. The ticket names this run in `root-cause.md`: "Run: VIRTDR-498".                                        |
| Run date   | 2026-11-22, all times UTC                                                                                                   |
| Hub        | ocp-edge36, `openshift-dr-ops`                                                                                              |
| Old site   | spoke-1 on ocp-edge97, array VSA-B (`10.46.48.30`, `PSff392f423bd6`)                                                        |
| New site   | spoke-0 on ocp-edge95, array VSA-A (`10.46.48.20`, `PS3b37452a6e0f`)                                                        |
| Policy     | `dr-policy-15m`, async Regional-DR, 900 s, grouped peer class `powerstore-sc-group`                                         |
| Workload   | `hammerdb/hammerdb-rhel9`, discovered application, RHEL 9 + PostgreSQL + HammerDB TPC-C, two PVCs as one PowerStore group   |
| Failover   | console Initiate 07:22:21Z, target spoke-0, DRPC `FailedOver` / `Completed`, actionDuration 12m43.827004507s                |
| Postcheck  | `OVERALL: PASS (17/17)`, lost writes span 175 s against a 900 s objective                                                   |
| Both sites | reachable. This is the Failover action, not Relocate, and not a site-down test.                                             |

## Attachments and what each proves

| Attachment                                                     | Proves                                                                                                                                                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ramen-secondary-reclaim-evidence-20261122T0847Z.tar.gz`       | The PV managedFields, both sites' PV state, the `VolumeFailedDelete` events, both arrays' sessions and group lists, the DRPC, the old-site VRG, and the root-cause write-up. 5 members, sha256 per member in `manifest.txt`. |
| `must-gather-ocp-edge97-20261122T0826Z.tar.gz`                 | The raw Ramen operator log with the 07:35 sequence, the full old-site VRG status, and the absence of the `hammerdb` VolumeGroupReplication and of the `hammerdb` namespace contents at 08:26Z.                               |
| `must-gather-ocp-edge95-20261122T0826Z.tar.gz`                 | The new-site VRG status (Primary, `lastGroupSyncTime` 08:15:56Z) and the restored PV state on the new site.                                                                                                                  |
| `must-gather-ocp-edge36-20261122T0826Z.tar.gz`                 | Hub state. Not used for any claim in this video beyond confirming the DRPC.                                                                                                                                                  |
| VIRTDR-498 `preflight-20261122T071932Z.json`                   | The pre-failover gate, the session id `e16423f4-919e-452b-9651-7744ffb02f8f`, and the last completed sync at 07:09:10Z.                                                                                                      |
| VIRTDR-498 `postcheck-20261122T075337Z.json` and `.log`        | `OVERALL: PASS (17/17)`, 175 s of writes outside the recovery point, 25 complete source minutes checked.                                                                                                                     |
| VIRTDR-498 `VIRTDR-498-run-log-20261122T075337Z.md`            | The recorded DRPC condition times and the postcheck verdict.                                                                                                                                                                 |
| VIRTDR-498 12 screenshots and 4 mp4 clips                      | Hub console captures of the run. **None used in this video.** They show the console, not the old-site volume records, and no capture shows the defect.                                                                       |

The ticket itself carries no screenshots. The video therefore uses verbatim log, event and status
excerpts in text panels instead of screenshots, and says so.

## Observed sequence (all UTC, quoted from the edge97 log unless stated)

```
07:22:21  console Initiate, target spoke-0
07:22:22  restored PVs created on spoke-0, reclaim Retain, vr-retained present
07:22:37  DRPC Available=True reason FailedOver
07:23:07  DRPC ReplicationHealthy=True
07:30:38  DRPC Protected=True (spoke-0)
07:34:26  VRG secondary reconcile: "Secondary transition failed as PVC is potentially in use by a pod"
07:34:48  same reconcile, that line absent: the guest pod is gone
07:35:04  DRPC PeerReady=True reason Success
07:35:04.195  "VolumeGroupReplication and VolumeReplicationGroup state match"
07:35:04.207  "Deleted VolumeGroupReplication resource hammerdb/vgr-4251c970ec7af885d6ec79c1d2c40661-hammerdb-drpc"
07:35:04.276  "Found VolumeReplication resource pending delete"; DataProtected=True; DestinationInfoAvailable=False
07:35:04.698  "Requeuing due to processing a deleted VGR"
07:35:05.291  "Unprotecting PVCs as VGR is missing"
07:35:05.310  "Deleted ramen annotations from PersistentVolume" pv=csivol-31136f5c90 State=secondary
07:35:05.812  same line, pv=csivol-2a761d921f
07:35:05.874  "Deleted ramen annotations, labels, and finallizers from PersistentVolumeClaim"
07:35:06.184  "Reconciling VolRep as Secondary. 0 VolRepPVCs"
07:35:06.297  VRG status VolRep pvccount (0), DataReady True reason Unused
```

Event object on the old site, at collection: `Warning VolumeFailedDelete`, count 27, first seen 72 m
before the dump, message `failed to remove volume <id> from volume group: HTTP 422: Volumes cannot be
removed from the replication destination volume group vg-c20d5ca2-e01a-4a9a-aade-789ab83b5f2d-VSA-A-Fifteen_Minutes`.

Object state at 08:47Z:

| Object            | Cluster | Phase    | Reclaim policy | `vr-retained` | volume handle                                              |
| ----------------- | ------- | -------- | -------------- | ------------- | ---------------------------------------------------------- |
| csivol-31136f5c90 | spoke-1 | Released | Delete         | absent        | `4eedeedb-25c0-465f-97ab-41846f8cef44/PSff392f423bd6/scsi` |
| csivol-2a761d921f | spoke-1 | Released | Delete         | absent        | `8d0cc7a5-b131-4559-b36e-002a9ef4337d/PSff392f423bd6/scsi` |
| csivol-31136f5c90 | spoke-0 | Bound    | Retain         | `retained`    | `f41919e2-b30a-4cd9-a1c2-c5746a0da712/PS3b37452a6e0f/scsi` |
| csivol-2a761d921f | spoke-0 | Bound    | Retain         | `retained`    | `6cefffe5-6890-4233-9625-2f09333f7b80/PS3b37452a6e0f/scsi` |

The same two object names exist on both clusters. That is observed, not inferred.

`managedFields` on the old-site `csivol-31136f5c90` shows three writers in the same second
(`2026-11-22T07:35:05Z`). Only the writer whose `manager` field is `manager` writes
`f:persistentVolumeReclaimPolicy`. `root-cause.md` identifies `manager` as the Ramen cluster operator
binary, `ramen-dr-cluster-operator` in `openshift-dr-system`.

Array state at 08:47Z: session `e16423f4-919e-452b-9651-7744ffb02f8f`, role Source on VSA-A, role
Destination on VSA-B, `state: OK` on both, `last_sync_timestamp` 08:39:56, `next_sync_timestamp`
08:54:14. So the session survives the deletion of the Kubernetes group request.

## Source trace, upstream `main`

Repositories read at:

| Repo                | Ref                          | Commit                                     |
| ------------------- | ---------------------------- | ------------------------------------------ |
| RamenDR/ramen       | `main` HEAD                  | `dd0cd2575bc591f9091a64e1cc8cb02958c1d25c` |
| RamenDR/ramen       | nearest commit on 2026-11-19 | `b1d412e589b9098a57a707e59fca58607e69b81b` |
| dell/csi-powerstore | tag `v2.14.0`                | `829053a5412038e783c0486654bef8a808907b9b` |
| dell/csi-powerstore | `main` HEAD                  | `cf21f44f70933e8540b039b02e3e50d49d1c9739` |

`internal/controller/vrg_volrep.go` is byte-identical between `b1d412e` and `dd0cd25` (the only
intervening commit touches `docs/` and `test/`), so the line numbers below apply to both.

Ordered by the handoff:

1. `internal/controller/vrg_volgrouprep.go:565` `pvcsUnprotectVolGroupRep` is the group unprotect
   entry. It hands off to `reconcileVGRForDeletion` (`591-627`).
2. `vrg_volgrouprep.go:648` `deleteVGR` runs first. It is a plain CR delete
   (`vrg_volgrouprep.go:994-1018`, delete at `1017`) with no array-side precondition and no wait for
   the array session.
3. `vrg_volgrouprep.go:658` then calls `preparePVCForVRDeletion` for each claim, through
   `undoPVCFinalizersAndPVRetentionForVGR` (`629-667`).
4. The recorded run reached the sibling path instead: the next reconcile found the VGR already gone
   and logged `Unprotecting PVCs as VGR is missing` (`vrg_volgrouprep.go:700`) from
   `reconcileMissingVGR`, which calls `preparePVCForVRDeletion` at `705`. Same helper, same outcome.
5. `internal/controller/vrg_volrep.go:593-662` `preparePVCForVRDeletion`. The decisive condition,
   `615-616`:
   `if v.instance.Spec.Async != nil || v.instance.Spec.ReplicationState == ramendrv1alpha1.Primary {`
   then `undoPVRetention(&pv)`.
6. `vrg_volrep.go:736-744` `undoPVRetention`. It returns unless the annotation
   `volumereplicationgroups.ramendr.openshift.io/vr-retained` exists and equals `retained`, then sets
   `PersistentVolumeReclaimDelete` and deletes that annotation. It reads nothing else: no VRG state, no
   array role, no session.
7. `vrg_volrep.go:607-624` is the other branch. The comment says that in Sync mode both the primary
   and the secondary VRG map to the same volume, so a delete policy must not be set; the code keeps
   Retain and labels the PV with `ramendr.openshift.io/pv-left-behind-by-ramen`, whose value is the VRG
   UID (`volumereplicationgroup_controller.go:610-611`). `deleteLeftBehindPVs`
   (`vrg_volrep.go:697-734`) only removes such a PV once it is `Released` (`714-716`).
8. Because the test is `Spec.Async != nil ||`, the else branch is unreachable for an async driver. An
   async Secondary always takes the undo path.
9. `vrg_volrep.go:664-690` `retainPVForPVC` is where the mark comes from, called from `protectPVC`
   (`533`). It returns early at `680-683` when the PV is already `Retain`, so such a PV never gets the
   annotation and `undoPVRetention` later no-ops on its guard.
10. `volumereplicationgroup_controller.go:708-713` validates that `Spec.ReplicationState` is Primary or
    Secondary. The value is written by the hub, `drplacementcontrol.go:2604` inside `updateVRGState`
    (`2588-2622`), and reaches the cluster through the VRG ManifestWork (`2622`). The VRG never sets
    its own state, which is why the `"State": "secondary"` field in the log is the hub's decision.
11. `vrg_volrep.go:1188-1224` `reconcileVRForDeletion` and `1226-1246`
    `undoPVCFinalizersAndPVRetention` do the same for the per-disk path: delete the VR CR first
    (`1231`, `deleteVR` at `2574-2598`), then prepare the claim (`1238`).
12. Correctness of the secondary gate: `validateAdditionalVRStatusForSecondary`
    (`vrg_volrep.go:2056-2103`) gates only on `Resyncing` and `Degraded`. `DestinationInfoAvailable` is
    recorded at `vrg_volrep.go:2097-2098`, not enforced. Its only gate use is the PV-annotation helper
    `destinationInfoAvailableOrSkip` (`848-869`), where a false value just skips an annotation.
13. `vrg_volrep.go:3647-3668` `aggregateVolRepDestinationInfoAvailableCondition` produces the
    VRG-level `DestinationInfoAvailable=False` with reason `Progressing` and the message
    "Destination info is not yet available for one or more VolumeReplication resources". With zero
    volrep PVCs, `aggregateVolRepDataProtectedCondition` (`3471-3540`) returns the `Unused` complete
    condition, which is the pair of statements the old-site VRG reports at the same time.
14. dell/csi-powerstore **`v2.14.0`** `pkg/controller/controller.go` `Service.DeleteVolume`, SCSI branch
    (`601`): `GetVolumeGroupsByVolumeID` (`602`), `RemoveMembersFromVolumeGroup` (`613`) and
    `ModifyVolume{ProtectionPolicyID: ""}` (`623`), both inside `if len(vgs.VolumeGroup) != 0`
    (`609`), then `DeleteVolume` (`660`). There is no async replication check anywhere in that
    function; the only replication-aware code is the Metro session branch (`640-657`).
15. dell/csi-powerstore **`main`** refactors the same order into `deleteISCSIVolume`
    (`pkg/controller/controller.go:1303-1401`): groups `1304`, member removal `1315`, protection
    policy `1326` (inside the group branch at `1311`), delete `1401`.
16. The driver already refuses this class of delete on a different RPC. `v2.14.0`
    `pkg/controller/replication.go:585-593`, inside `DeleteLocalVolume`: "Do not proceed to DeleteVolume
    if there is a volume group or protection policy. DeleteVolume would remove those, and source-side
    deletion is the responsible party for that operation." Still present on `main` at
    `pkg/controller/replication.go:756-764`. It does not protect the CSI `DeleteVolume` path.
17. Ramen documents the undo without a state qualification:
    `docs/design/proposals/VRG-Reconciliation.md:235-239` lists "Undo PV retention, if it was retained,
    based on the annotation `vr-retained`" with no condition on the array relationship. That order in
    the document is also the reverse of the code, which deletes the VR/VGR first.

## Discrepancies recorded against the ticket's own wording

- The ticket names `deleteISCSIVolume` in "Additional info". That function exists only on current
  `main`. The chart in the ticket is `csi-powerstore-2.14.0`, where the SCSI delete path is inline in
  `Service.DeleteVolume`. The video describes the behaviour (list groups, remove member, clear policy,
  delete) and does not put the function name on screen.
- The ticket gives the retention condition at `vrg_volrep.go:613`. At both refs read it is `615-616`.
  The video uses 615.
- The ticket's description attributes the 07:35 change to `preparePVCForVRDeletion` being reached
  directly. The log shows the group request deleted at `07:35:04.207` and the helper reached one second
  later through `reconcileMissingVGR`. The video follows the log.

## What the record does not establish

- That the running Ramen build matches upstream `main`. The image
  `quay.io/sughosh/ramen-operator@sha256:d8acf053...` is a private build with no `vcs-ref` label, so the
  code-path attribution is inference. The log line number `vrg_volrep.go:636` does sit inside
  `preparePVCForVRDeletion` in upstream `main`, which is consistent but not proof.
- That the running csi-powerstore matches `v2.14.0`. Its image is also a private build
  (`quay.io/martjack/csi-powerstore@sha256:d922a937...`).
- Which driver call produced the 422. Source shows three candidates that surface the array error:
  member removal, protection policy clear, or the volume delete.
- Whether the array refuses a direct delete of a replication-destination volume with no group
  membership. That is array behaviour and was never tested here.
- Whether deleting the VR/VGR CR can end an array session in any other configuration. In this run the
  session was still `OK` 64 minutes later, but that is one observation.
- That the ticket comment's second consequence is reproducible from the archive. The comment reports
  four PVs on the peer, two on `Delete` and two already at `Retain`. The 08:47Z dump shows two hammerdb
  PVs at `Delete` and two unrelated `gitops-vms` PVs at `Retain`, so the count does not reconcile. The
  beat that mentions the later collision is marked `unverified` and carries an on-screen inference
  label.
- Zero loss. The postcheck measures 175 s of writes outside the recovery point, which is inside the
  policy, not zero.

## Linked merged PRs

**None linked.** The ticket has no remote links (`GET /rest/api/2/issue/DFBUGS-12906/remotelink`
returns `[]`), and neither the description nor the comment contains a GitHub or GitLab pull request or
merge request URL. No PR was read for this video, so the containment and revert checks do not apply
and no merged change is treated as provenance for the running build.

Repository history read only as source context, not as ticket provenance: PR #2934 added the Sync
`else` branch and `deleteLeftBehindPVs` without changing the `Spec.Async != nil` half of the condition.
PR #2916 and PR #1570 touch the same file for unrelated reasons. PR #2979 ("verify PV is retained
before skipping PVC re-protection") is open, not merged, and does not address this decision. No merged
or open change was found that fixes the async-Secondary retention decision.

## Notes for reuse

- The composition name is a ticket key in a project with no preset. The animation root was supplied
  explicitly for this build.
- `src/dfbugs-12906/` reuses the world geometry and camera helpers of `src/virtdr-498/`, which recorded
  the same run, and adds explicit PersistentVolume cards because the volume records are the subject
  here.
- The rail order for this defect: API server event, then operator log, then PV `managedFields`, then
  array session. Each one independently places the change at 07:35:05Z.
