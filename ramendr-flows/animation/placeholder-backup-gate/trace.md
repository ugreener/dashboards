# placeholder-backup-gate: evidence and controller trace

## What this video is

A recorded defect explainer. It follows one discovered application moved back to its
preferred site, where the storage half completed and the workload half never did: Ramen
created a placeholder Velero Backup whose name already existed in object storage, Velero
failed that Backup, and the newer Velero refuses to restore from a failed Backup.

## Recorded outcome and scope

- Application: discovered, DRPC `openshift-dr-ops/hammerdb-drpc`, namespace `hammerdb`,
  VM `hammerdb-rhel9`.
- Operation: Relocate, source `spoke-0` on `ocp-edge95` (array `VSA-A`), target `spoke-1`
  on `ocp-edge97` (array `VSA-B`). Hub `ocp-edge36`.
- Policy: `dr-policy-15m`, async, 15-minute interval.
- Result: storage promoted and bound; both target PVCs `Bound`; no VirtualMachine and no
  DataVolume in the target namespace; DRPC reported `Relocated/Completed` with
  `PeerReady=True` and `Protected=False`.
- Same failure on 2026-10-29 (first record) and 2026-11-05 (reproduced on the current
  build). One recorded success of the same restore path on 2026-10-19, before the Velero
  image change, in VIRTDR-342.

**Deployed-build provenance: UNVERIFIED.** The upstream source below explains the
mechanism and is consistent with every recorded message. The attachments do not establish
that these exact commits built the running controllers or the running Velero image.

## Run evidence

- [Ticket](https://redhat.atlassian.net/browse/DFBUGS-12505)
- Failure-time supplement (7 KB): `DFBUGS-12505-failure-evidence-supplement.md`, attachment 1294760
- Log excerpt (3 KB): `bug-placeholder-backup-failedvalidation.txt`, attachment 1275835
- Console captures: `12-hammerdb-drpc-relocated-protected-false.png` (1294726),
  `13-hammerdb-drpc-failure-popover.png` (1294727), `bug-placeholder-backup-failedvalidation.png` (1275834)
- Must-gathers: hub 1294723, spoke-0 1294724, spoke-1 1294725
- Post-recovery object dump (24 KB): `post-recovery-objects.yaml`, attachment 1294761

Display crops are used for the three screenshots; the console masthead and the signed-in
account label are outside every displayed focus box. No attachment is copied into the
repository; the display copies live under the git-ignored `public/evidence/` tree.

## Observed timeline (UTC)

| Time (2026-11-05)     | Observation                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 07:49                 | Console popover's "Kubernetes resources" sync line reads 07:49, before the move                                                                             |
| 07:54:07              | Relocate clicked for `openshift-dr-ops/hammerdb-drpc`, target `spoke-1`                                                                                     |
| 08:01:13              | Source VM deleted, documented discovered-application cleanup                                                                                                |
| 08:03:20              | Source PVCs gone                                                                                                                                            |
| 08:03                 | Target VRG `Primary`, both PVCs `Bound`, no VM, no DataVolumes                                                                                              |
| 08:03:40              | Live DRPC status captured: `Relocated/Completed`, `Available=True`, `PeerReady=True`, `Protected=False (Progressing: Kube objects capture has not started)` |
| 08:03:52              | Velero Backup `Failed`, Restore `FailedValidation`                                                                                                          |
| 08:05:57 and 08:05:59 | Ramen operator logs the `FailedValidation` restore result twice                                                                                             |
| 08:06:10 to 08:06:12  | Velero repeats `backup failed ... backup already exists in object storage`                                                                                  |
| 08:10                 | Console popover's "Application volumes (PVCs)" sync line reads 08:10                                                                                        |

First record, 2026-10-29: same application, same target, same messages. That record's
selected capture group was `0`, window `07:40:10Z` to `07:40:15Z`. The 2026-11-05
reproduction also selected group `0`, and its own capture window is not recorded in the
supplement, so the video does not state a window for it.

Control, 2026-10-19: VIRTDR-342, same discovered application, same object-restore path,
restored the VM and started the guest. That run is a *failover*, not a relocate, and it
used the older Velero image (deployed 2026-08-26). It is corroboration, not a same-operation
control.

## Conditions recorded at failure

DRPC:

```
phase/progression : Relocated/Completed
Available          : True (Relocated: Completed)
PeerReady          : True (Success: Ready)
Protected          : False (Progressing: Kube objects capture has not started)
```

Target VRG `openshift-dr-ops/hammerdb-drpc` on spoke-1:

```
DataReady            : True  (Ready)
DataProtected        : False (Replicating)
ClusterDataReady     : True  (Restored: 4 volrep PVs/PVCs)
KubeObjectsReady     : False (Error: Failed to restore kube objects: kube objects restore error, will retry)
ClusterDataProtected : False (KubeObjectsCaptureNotStarted)
```

Target namespace `hammerdb`: PVC `hammerdb-rhel9-rootdisk` Bound to `csivol-841ca78019`
(35Gi), PVC `hammerdb-rhel9-datadisk` Bound to `csivol-3471d7938c` (20Gi), Secret
`cloudinit-hammerdb` present, no VirtualMachine, no DataVolume.

## Source trace, in the order it acts

Upstream refs: Ramen `RamenDR/ramen` `f023ed9e63230249c7f88bf2f4d7aa02c77083a1`
(the ticket's reference), downstream build `837657e`; Velero `pkg/controller/restore_controller.go`
on `main`; OADP 1.6 branch via `openshift/velero` `oadp-1.6`.

1. **Hub requests the move.** The DRPC controller sets the requested action to Relocate and
   drives the target VRG to `Primary`. The DRPC reaches `Relocated/Completed` when the
   storage-side contract is met; it does not require `KubeObjectsReady`. Observed status is
   the evidence for this step, not a source citation.
2. **Target VRG starts the object recover.**
   `internal/controller/vrg_kubeobjects.go:725` calls
   `v.reconciler.kubeObjects.RecoverRequestCreate(...)`.
3. **Name construction.** `kubeObjectsCaptureName(prefix, groupName, s3ProfileName)` at
   `internal/controller/vrg_kubeobjects.go:54` returns `prefix + "--" + groupName + "--" +
   s3ProfileName`. That is the shape of the observed name
   `openshift-dr-ops--hammerdb-drpc--0----minio-on-hub`.
4. **No local Backup record.** `restoreRealCreate` at
   `internal/controller/kubeobjects/velero/requests.go:226` takes the
   `captureRequest.(BackupRequest)` type assertion. When it fails, there is no Backup object
   in the cluster, and it calls `backupRequestCreate(...)` with the same `backupName`.
5. **A real Backup is created.** `backupRequestCreate` at `requests.go:514` creates or
   updates the BackupStorageLocation named `requestName`, checks that it is available, then
   calls `w.Create(w.ctx, backupRequest)` on a Velero Backup. This is a real Create, not a
   read of the archive.
6. **Velero fails the duplicate.** Velero's backup controller processes any `New` Backup,
   finds an object with that name already in the bucket, and sets phase `Failed` with
   `backup already exists in object storage` (`pkg/controller/backup_controller.go:779` in
   the log line). This is independent of `backupSyncPeriod`.
7. **Ramen treats Failed as usable, deliberately.** `backupDummyStatusProcessAndRestore` at
   `requests.go:268` switches on the phase and sends `Completed`, `PartiallyFailed` **and
   `Failed`** to `backupRestore(...)`. The intent is that the placeholder CR is only a
   handle, and the bytes come from the archive in object storage.
8. **Ramen creates the Restore.** `backupRestore` at `requests.go:302` creates a Velero
   Restore that references the Backup by name.
9. **Velero refuses.** `validateAndComplete` at `pkg/controller/restore_controller.go:319`
   accepts only `api.BackupPhaseCompleted` and `api.BackupPhasePartiallyFailed`; every other
   phase appends `backup %q is in phase %q and cannot be used as a restore source`
   (`:422` to `:426`). The Restore ends `FailedValidation`.
10. **Ramen retries.** The recover request returns an error and the VRG keeps
    `KubeObjectsReady=False (Error)` with the message "will retry". The loop repeats.

What the trace does not establish: which commit built the running Ramen or Velero, and
whether any other change in the same window also matters.

## Why `backupSyncPeriod=0s` is not the cause

The ticket notes the BackupStorageLocation has `backupSyncPeriod=0s`, and an early fix
attempt treated that as the cause. It is not. Velero's backup controller fails a `New`
Backup whose name already exists in object storage whether or not metadata sync is enabled.
Enabling sync also cannot repair the placeholder: sync imports only archives whose names are
not already present as Backup objects, and Ramen has already created one with that name.
That is the maintainers' own conclusion in the revert below, and it matches the recorded
phase, which is `Failed` and not `New`.

## Linked merged PRs

Explanatory evidence, not deployed-build provenance.

| Link                                                                                     | Base       | Merged     | Landed                                     | Files read                                                       | Containment in the run                                                                                             | Revert        | Supports                                                        |
| ---------------------------------------------------------------------------------------- | ---------- | ---------- | ------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------- | --------------------------------------------------------------- |
| https://github.com/openshift/velero/pull/600                                             | `oadp-1.6` | 2026-10-23 | `6ec33ac9e956d7b0c40d31e8b0f488e3d8f195ed` | `pkg/controller/restore_controller.go`, tests, restore reference | **UNVERIFIED**: the run's Velero image digest is recorded, the digest is not resolved to a commit in a local clone | none found    | Steps 9                                                         |
| https://github.com/RamenDR/ramen/pull/2947 (upstream revert, not linked from the ticket) | `main`     | 2026-11-04 | `cf4f31257fc4de6ede0a7ab0d58b0f31e0071e63` | merge description only                                           | Not in the run: merged after both reproductions                                                                    | reverts #2940 | The cause statement, and why enabling backup sync cannot fix it |

Excluded: no other PR or MR link exists on the ticket (`GET /rest/api/2/issue/DFBUGS-12505/remotelink`
returned an empty array). `RamenDR/ramen#2940` is excluded as a fix because #2947 reverted it;
it is mentioned only as the fix that did not work.

## Corrections to earlier claims

- The displacement of the object half is not invisible in the console. The 2026-11-05 capture
  shows the `hammerdb-drpc` row with DR Status `critical`, and its popover separates
  "Application volumes (PVCs)" from "Kubernetes resources". The claim this video makes is
  narrower: the DRPC completion fields report `Completed`, while the object half is reported
  in a different place and had stopped advancing before the move.
- The 2026-10-19 success is a failover on the older image, not a relocate. It cannot be used
  as a same-operation control.
