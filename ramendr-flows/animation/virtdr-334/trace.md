# VIRTDR-334 evidence trace

## What this video covers

One recorded failover run on the Dell PowerStore lab, and the reprotection window that
followed it. The video measures the interval from reprotect completed to the first
scheduled copy job start for each of the two workload disks.

- Run date: 2026-10-07
- Direction: failover spoke-1 (edge97, VSA-B) to spoke-0 (edge95, VSA-A)
- Application: managed `dell-vm-workload`, VM `hammerdb-rhel9`, namespace `gitops-vms`
- Hub object: `dell-vm-drpc` in `openshift-gitops`, policy `dr-policy-15m`, RPO 900 s

The bug was filed from this run as VIRTDR-334. The run record is VIRTDR-292, whose
attachments include the run log, the preflight JSON and the console screenshots.

## Recorded timeline (array job history, VSA-A)

Start times, UTC. Source: `powerstore-replication-sessions-jobs-alerts-20261007.json`
and the VIRTDR-292 run log.

| Time                | Root session 6116fde0-2d07-4f2f-89b5-56b7682c712e | Data session 23dfdc6d-3feb-4281-83bb-69287b7b1a35 |
| ------------------- | ------------------------------------------------- | ------------------------------------------------- |
| 13:22:27 / 13:22:28 | scheduled sync COMPLETED                          | scheduled sync COMPLETED                          |
| 13:26:40            | failover initiated in the console                 | failover initiated                                |
| 13:26:41            |                                                   | Failover job COMPLETED (13:26:43)                 |
| 13:26:42            | Failover job COMPLETED (13:26:43)                 |                                                   |
| 13:26:43            | 2x Reprotect FAILED                               | 2x Reprotect FAILED                               |
| 13:26:44            | Reprotect FAILED, then COMPLETED 13:26:45         | Reprotect FAILED, then COMPLETED 13:26:45         |
| 13:36:57            | first Sync job, COMPLETED 13:37:01                | none                                              |
| 13:41:45            | RPO deadline (13:26:45 + 900 s)                   | RPO deadline                                      |
| 13:42:28            |                                                   | session OK, no error, last_sync 13:22:27          |
| 13:44:17            |                                                   | first Sync job, COMPLETED 13:45:11                |
| 13:48:57            | second Sync job, COMPLETED 13:48:59               |                                                   |
| 13:56:17            |                                                   | second Sync job, COMPLETED 13:56:19               |
| 14:00:57            | third Sync job, COMPLETED 14:00:59                |                                                   |

Derived measurements:

- Root first-copy interval: 13:26:45 to 13:36:57 = 10 m 12 s (inside 900 s)
- Data first-copy interval: 13:26:45 to 13:44:17 = 17 m 32 s (outside 900 s by 2 m 32 s)
- Data copy age at 13:42:28: 13:22:27 to 13:42:28 = 20 m 01 s
- Data first copy duration: 13:44:17 to 13:45:11 = 54 s

Exact names used on screen:

- Sessions: `6116fde0-2d07-4f2f-89b5-56b7682c712e` (root),
  `23dfdc6d-3feb-4281-83bb-69287b7b1a35` (data)
- Promoted volume handles on VSA-A: root `9e3b6608-30f4-42e8-aaca-4f774fe7662a`
  (claim `csivol-ec5862ac71`), data `41b0880b-916d-42a1-b4b6-a55f9c853c91`
  (claim `csivol-f756724d1d`)
- Source handles before failover: root `1282bca9-29aa-416f-b890-2a29a44e3fac`,
  data `e5ecb946-25b6-4f1a-afe0-8173392f2b7d`
- Rule: `rr-vg-VSA-B-Fifteen_Minutes`, id `06ee2d60-e38a-40a7-87af-f95d5b9dff78`,
  RPO `Fifteen_Minutes`, `alert_threshold` 15
- Arrays: VSA-A `PS3b37452a6e0f`, VSA-B `PSff392f423bd6`
- Driver image: `quay.io/openshift-virtualization-dr/csi-powerstore:20260805143521`
- Product: RHDR `v4.22.0-86.stable`, OCP 4.22.9

## Baseline and control

- VSA-B job list before the reversal: both sessions COMPLETED about every 12 minutes,
  ending 13:22:27 (data) and 13:22:28 (root).
- Preflight at 13:15:58, OVERALL PASS 24/24: 87 scheduled syncs per disk since VR
  creation, no failed jobs, all gaps <= 900 s, last two intervals carried HammerDB
  writes (57,767 and 59,673 rows).
- The run log records the same observation independently at 13:42: the data session
  last sync was still 13:22:27 while the root disk had synced at 13:36:57.

## Second occurrence

2026-10-06, same data session, after creation:

- Initial Sync job 19:09:53, COMPLETED 19:10:10
- No further data sync before the failover at 19:29:41
- Root disk on the same rule synced at 19:24:53

The ticket states the 2026-10-06 interval was about 20 minutes. The array dump retains
this history because the jobs query starts at 2026-10-06 19:00.

## Why no alert

- VSA-A alerts since 13:20: two Info `operating normally` entries at 13:26:45 (state
  CLEARED), a licence retrieval warning at 13:33, a licence expiry alert at 14:03.
  No RPO or threshold alert.
- VSA-A events 13:26 to 13:46: failover and failed-over entries for both volumes, then
  `operating normally` at 13:26:45. Nothing about a late copy.
- Dell documents the alert threshold as the time the system waits after a session
  misses its RPO before generating a compliance alert, not an alert at the RPO
  boundary. Source: Dell PowerStore Protecting Your Data, "Alert threshold",
  https://www.dell.com/support/manuals/en-us/powerstore-1000/pwrstr-protect-data/alert-threshold
- Therefore the absence of an alert inside a 152-second overrun that ended in a
  successful copy is consistent with documented behaviour. It is not presented as a
  broken alert or as evidence that the copy was on time.

## Field that is deliberately not used

`next_sync_timestamp` is null for all four sessions in the dump, including sessions
that are clearly syncing on a 12-minute cadence. The dump does not populate it
reliably, so this video does not use it as evidence. The video uses job start times
only. This avoids repeating the ambiguity of the Relocate schedule investigation.

## What remains unverified

- Why the data disk waited 17 m 32 s while the root disk waited 10 m 12 s.
- Whether the first interval after reprotect is expected PowerStore scheduling or a
  defect. VIRTDR-334 states the root cause is not established and that Dell is
  investigating.
- Whether the two to three failed Reprotect attempts are related to the first-interval
  timing. They are shown as observed, not as a cause.
- Whether the behaviour generalises to an unplanned failover, to cleanup-then-reprotect,
  or to a different array model. Only the planned failover and the same-volume
  creation case are recorded.

## Controller path (upstream source trace)

Read from the default branches of `RamenDR/ramen`, `csi-addons/kubernetes-csi-addons`
and `dell/csi-powerstore`. One beat narrates this chain; the rest of the video stays on
observed array behaviour.

1. Ramen sets the desired state. `DRPCInstance.RunFailover`
   (`internal/controller/drplacementcontrol.go:430-510`) promotes the target VRG and
   moves the progression to `Cleaning Up`, then `EnsureCleanup` ->
   `cleanupSecondary` -> `updateVRGState(cluster, rmn.Secondary)` (2395).
2. The VRG controller writes `ReplicationState: Secondary` and `AutoResync: true` on
   the old source VolumeReplications (`internal/controller/vrg_volrep.go:1442-1475`,
   1494-1495).
3. csi-addons demotes, then calls resync because auto-resync is set
   (`internal/controller/replication.storage/volumereplication_controller.go:358-383`).
4. The array Failover action is issued by csi-powerstore in `PromoteVolume` ->
   `promoteVolumeForVolume` -> `ExecuteAction(..., RsActionFailover)`
   (`pkg/controller/csiaddons_replication.go:1008-1014`;
   `pkg/controller/replication.go:270-283`).
5. Reprotect is issued in `resyncVolumeForVolume` when the session is `Failed_Over`
   and the local role is Source (`csiaddons_replication.go:1609-1619`). The promote
   path never calls Reprotect. Demote on a Failed_Over source is an explicit no-op
   (`1315-1322`).
6. No Kubernetes controller schedules the first array copy. After Reprotect,
   `ResyncVolume` returns `Ready:false` and polls session states
   (`1585-1593`). That the array performs the first sync from the replication rule is
   **UNVERIFIED by code** and is stated as array behaviour only, backed by the job
   history.
7. `GetVolumeReplicationInfo` sets `LastSyncTime = timestamppb.Now()` for an OK
   session (`csiaddons_replication.go:1862-1866`), which is the VIRTDR-333 defect used
   as a one-line reference in chapter 7.

## Corrections and cautions

- Job timestamps are start times. The video says "started at", never "completed at",
  except where the completion time is explicitly stated (13:37:01, 13:45:11).
- The console screenshots are from the same run but were captured for VIRTDR-292. The
  video labels them as historical captures and never uses them for array timing.
- The console banner names the DRPC `dell-vm-drpc` while the row names the application
  `dell-vm-workload`. They are different objects and the video keeps them separate.
