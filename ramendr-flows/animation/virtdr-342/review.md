# VIRTDR-342 animation review

## Evidence review

All 23 original run screenshots were inspected at full resolution by two independent image-review sessions. Every image is 1920x1080. Neither reviewer found exposed passwords, tokens, private keys or Secret values. The originals remain ignored under `public/evidence/virtdr-342/` and are not committed.

| Image prefix | Beat | Use or reason for omission |
| --- | --- | --- |
| 01 | not used | Baseline row duplicates context supplied by the policy and source-array views. |
| 02 | not used | Baseline popover is not the replication freshness gate. |
| 03 | 3.1 | Validated policy, explicitly separated from measured freshness. |
| 04 | not used | Peer baseline duplicates the selected source-array evidence. |
| 05 | 3.5 | Source VSA-B baseline. UI timestamps use UTC+3. |
| 06 | 4.3 | Hub Failover action menu. |
| 07 | 4.4 | Target selection and known stale UI values, labeled with their bug keys. |
| 08 | not used | Same source-down boundary is explained more clearly by the popover. |
| 09 | 5.6 | Three steps completed, source cleanup still pending. |
| 10 | 7.4 | Later Phase B target-copy gate, not misrepresented as a Phase A capture. |
| 11 | not used | Multi-cluster replication inventory duplicates the focused target and source views. |
| 12 | not used | Target VolumeReplication detail supports the gate but duplicates its narration. |
| 13 | not used | Bound target claim supports the gate but does not independently prove replica identity. |
| 14 | not used | Pre-deletion VM inventory duplicates the post-resume description. |
| 15 | 7.5 | After source VM deletion, surviving target VM retained. |
| 16 | not used | Pre-deletion DataVolume inventory duplicates the cleanup sequence. |
| 17 | 7.6 | Source DataVolumes removed, target retained. |
| 18 | not used | Source claim cleanup is recorded in the Phase B attachment and narration. |
| 19 | 8.2 | Healthy hub row. Completed progression is attributed to command evidence. |
| 20 | not used | Healthy popover is redundant and its last-sync fields are not the gate. |
| 21 | 8.3 | Source Secondary, with explicit warning about skewed source condition timestamps. |
| 22 | 8.4 | VSA-A Source and fresh reverse syncs. |
| 23 | 8.5 | VSA-B Destination corroborates the reversed direction. |

Capture timestamps are not inferred from resource creation timestamps. Approximate Phase B milestones stay approximate in narration and labels. The HUD holds recorded milestones between events. Chapter 5 explicitly replays the recovery mechanism from Initiate, rather than claiming another chronological run.

## Content audit

- 15 glossary cards introduce the kinds used by the story. Three additional framing and recap beats bracket the cold open and glossary.
- One additional definition panel explains the lost-heartbeat condition.
- Generated PlacementDecision, ManifestWork and ManagedClusterView instance names are deliberately not asserted. Their glossary cards identify kinds only.
- The workload remains drawn at its home cluster, spoke-0. Source and target labels describe only this historical run.
- Source-down recovery, resumed source cleanup, source demotion, storage reprotection and fresh reverse syncs are separate handoffs.
- The original automated FAIL remains visible, with its three checker defects and the separate follow-up verification. No clean end-to-end PASS rerun is invented.
- The 556-second loss-window verdict, 900-second objective and 55 complete recovered source minutes are preserved. Order-sequence sums are not described as exact transaction counts.
- Source recovery is not a dependency of Phase A recovery. Source cleanup is separately authorized and contains no Argo CD pruning.
- The Phase B attachment does not record clock repair. This limitation is retained.
- Seven beats explicitly mark unverified controller provenance, generated instance identities or individual requests. The pinned upstream mechanism is not presented as an exact deployed-build trace.

## Shared components

The optional `Screenshot.sourceLabel` applies to consumers VIRTDR-291, VIRTDR-292 and VIRTDR-342. The first two retain the original default. VIRTDR-342 passes a PowerStore label for array views instead of mislabeling them as the hub console.

The shared pronunciation normalizer is used by VIRTDR-291, VIRTDR-292 and VIRTDR-342. New exact-token pronunciations cover this ticket, the sync-display bug and the source heartbeat condition. Existing audio files are not regenerated.

The shared stills tool also serves VIRTDR-291, VIRTDR-292 and VIRTDR-342. Its optional `--out-dir` separates review rounds without changing the default output paths, frame selection or rendering settings. Glossary metadata was validated against exact key sets after quoting comma-containing YAML strings.

## Visual and render verification

The early review found four YAML-truncated analogies, a missing glossary recap view and a delivery arrow crossing the spoke header. All were corrected. The complete review covered 195 stills at 0.2, 0.55 and 0.9 of every beat, split across four fresh image-review sessions. It found one clipped camera view, corrected in both object-restore shots and rechecked across six updated stills. Nine additional stills verified the baseline and reverse-copy arrows. Every latest review returned ALL CLEAR.

The evidence-claim review separately verified the namespace layout, disk identities, original FAIL, data verdicts and Phase A/Phase B boundary. Its requested corrections to approximate/reference clock labels, the source's initial role and introductory definitions were applied and rechecked.

TypeScript compilation and the name audit pass. Narration has exactly 65 timing entries matching the beat sheet. All speech files use the fixed voice and 24 kHz mono audio.

The final MP4 has 94,107 video frames and a container duration of 1568.469 seconds, within 0.019 seconds of the 1568.45-second timeline. It is 1920x1080 at 60/1 fps, H.264 CRF 16 with yuv420p pixels and 48 kHz stereo AAC audio. The file is 259,442,924 bytes. Audio peak is -5.8 dB with no clipping. Mean volume is -28.6 dB, near the quiet end of the approximate target and 0.6 dB below its nominal lower boundary. No post-render audio remix or quality-setting change was applied.

Two frames extracted from the final MP4 at 17:16.803 and 23:23.059 were inspected by a fresh image-review session. Both returned ALL CLEAR for content, layout, captions, screenshot identity and credentials. Visual checks are limited to reviewed stills and these final-file spot checks. The complete video was not watched end to end.
