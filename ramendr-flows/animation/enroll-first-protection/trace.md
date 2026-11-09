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

Pending. Filled from the pinned upstream read of RamenDR/ramen,
red-hat-storage/ramen, csi-addons/kubernetes-csi-addons, dell/csi-powerstore
and the ODF console plugin.
