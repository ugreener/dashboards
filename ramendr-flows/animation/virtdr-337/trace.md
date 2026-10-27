# VIRTDR-337 trace

Provenance for the animation `virtdr-337` (working title "The 72-hour cascade").

## What this video is built from

Every fact comes from the Jira ticket VIRTDR-337 and its 27 attachments, plus one
knowledge-base document that records a recovery the ticket does not. No new lab
work was performed for this video, and no live cluster or array was queried.

| Claim                                                             | Source                                                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Nine node-stop episode dates, 2026-09-11 to 2026-10-14            | `VSA-A-node-stops-since-2026-09-01.txt`, `VSA-B-node-stops-since-2026-09-01.txt`, ticket description table |
| Kernel panic signature and uptimes                                | `VSA-A-A-panic-excerpt.txt`, `VSA-B-A-panic-excerpt.txt`, `VSA-A-A-panic-excerpt-2026-10-24.txt`           |
| Blocked-task count per episode                                    | counted in the three panic excerpts: 10, 10, 5                                                             |
| Array event timeline, 2026-10-11                                  | `VSA-A-events-2026-10-11.txt`, `VSA-B-events-2026-10-11.txt`                                               |
| Array event timeline, 2026-10-24                                  | `vsa-events-2026-10-24-1045-1115.txt`                                                                      |
| No hypervisor reset before the node stop                          | `VSA-A-A-vmware.log`, `VSA-A-B-vmware.log`, `VSA-B-A-vmware.log`, `VSA-B-B-vmware.log`                     |
| Node B journal before and at the stop                             | `vsa-a-2026-10-24-node-b-key-events.txt`                                                                   |
| Recovery steps, 2026-10-14 and 2026-10-25                         | ticket recovery sections                                                                                   |
| Post-recovery checks, 2026-10-18                                  | `docs/ramendr/unplanned-failover-simulation.md`, "Environment state (verified)"                            |
| `Partial_Node_Connection_Loss` and "1 array session instead of 2" | same knowledge-base document                                                                               |
| Test-window cost and the rejected simulation method               | ticket impact section, and the options table in the same document                                          |
| Vendor system dump and IoWatchdog lead                            | ticket comment of 2026-10-25, data collection `ea461201-ff1f-4f32-83cd-b02db60c2d17`                       |

## Corrections to the ticket summary

These were checked against the attachments and differ from the ticket text.

1. The ticket says "about 10 multipathd / multipath threads are blocked in the same
   SCSI error-handling path". The count is exact per episode, not approximate:
   10 blocked tasks in `VSA-A-A-panic-excerpt.txt`, 10 in `VSA-B-A-panic-excerpt.txt`
   (8 `multipathd` and 2 `multipath`), and 5 in the 2026-10-24 excerpt.
2. Not every blocked task is in SCSI error handling. In `VSA-A-A-panic-excerpt.txt`
   the first blocked task is `multipathd:4527` in `dm_suspend` waiting in
   `__synchronize_srcu`, while the later tasks are in
   `scsi_block_when_processing_errors`. The video therefore says the blocked tasks
   are in the device-mapper suspend and SCSI error-handling paths, and does not
   claim they are all in one path.
3. The ticket's 2026-10-11 table lists VSA-A Node B stopping at 15:22:42. The array
   event file agrees on that timestamp and adds 15:22:49 for "Node has stopped".
4. The ticket lists a single "Node B rejoins then stops again". The event files show
   the same three-part shape on both arrays and on both episodes examined: the node
   stops, cluster management comes back online about three minutes later, the node is
   declared `Healthy` for less than one second, then it stops again with stop reason
   351. VSA-A on 2026-10-11: management online 15:25:52, lifecycle `Healthy` 15:27:32,
   stopped again and cluster service stopped 15:27:35. VSA-B on 2026-10-11:
   management online 15:24:07, lifecycle `Healthy` 15:24:34, stopped again 15:24:35,
   cluster service stopped 15:24:39. VSA-A on 2026-10-24: stop 10:51:19, management
   online 10:54:26, `Healthy` 11:00:03.465, stopped again 11:00:03.786, cluster service
   stopped 11:00:08.
5. The ticket says Node A "never rejoins after its automatic reboot". The serial logs
   and the recovery records support this, but the reason is not established. The video
   states the observation and the unknown, never a cause.

## What is labelled unverified in the video

- Why Node B stops at all. The stop reason 351 is recorded, its meaning is not.
- What PowerStore does on a roughly 72-hour schedule.
- Why Node A does not re-integrate after its automatic reboot.
- The device-level reason `multipathd` blocks in the SCSI error-handling path.
- The meaning of the `xtremapp` signal-6 dump and the `IoWatchdog` line. These are
  presented as a lead, never as a cause.
- Whether the HA-proxy connection failures in the Node B journal precede every
  episode. They are shown for the 2026-10-24 episode only, where the journal exists.

## Causal discipline

The video presents the node stop and the Node A panic as an observed sequence that
repeated four times, not as a proven causal chain. The only mechanism asserted with
confidence is the one visible in the kernel backtrace itself: `multipathd` blocked in
device-mapper suspend and SCSI error handling, the `hung_task` watchdog firing after
122 seconds, and the resulting panic. Everything upstream of that is labelled.

## Environment names used

Arrays `VSA-A` (`PS3b37452a6e0f`) and `VSA-B` (`PSff392f423bd6`). Node VMs
`VSA-A-A`, `VSA-A-B`, `VSA-B-A`, `VSA-B-B`, as named in the attachment filenames.
Clusters `edge36` (hub, `ocp-edge36`), `edge95` (spoke-0, `ocp-edge95`), `edge97`
(spoke-1, `ocp-edge97`). Management addresses `10.46.48.20` and `10.46.48.30`, node
addresses `10.46.48.22`, `10.46.48.23`, `10.46.48.32`, `10.46.48.33`, storage
addresses `10.46.49.1` and `10.46.49.4`. Two DRPC names that appear in the record are
`dell-vm-drpc` and `dell-win-drpc`. The other two of the four DRPCs are not named in
any source used here, so they are never given a name on screen.

## Sensitive data

The lab documents contain an array administrator credential. It is not used, not
quoted, and not shown. The video shows management and storage IP addresses only,
which are lab-internal and already present in the ticket attachments.
