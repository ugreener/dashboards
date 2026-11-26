# dell-dr-qa trace

Mode: conceptual explainer, no recorded run. run: conceptual explainer, no recorded run.

Purpose: answer the questions raised while helping a second engineer build a Dell PowerStore + RamenDR environment. The video explains the object ownership chain, the pairing labels, the driver image set, where the bundle and images come from, what this lab actually installed, the install order, and whether the hub needs OpenShift Virtualization.

## Pinned sources

| Repository                       | Commit                                   | Files read                                                                                                                                                                      |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dell/csi-powerstore              | cf21f44f70933e8540b039b02e3e50d49d1c9739 | `pkg/controller/csiaddons_replication.go`, `pkg/controller/replication.go`, `samples/storageclass/powerstore-replication.yaml`, `dell-csi-helm-installer/csi-offline-bundle.md` |
| RamenDR/ramen                    | 86728b6efb91f8c3a63a249a8f1874a828cb5db3 | `docs/configure.md`, `docs/install.md`, `docs/usage.md`, `internal/controller/vrg_volrep.go`, `internal/controller/drpolicy_peerclass.go`                                       |
| csi-addons/kubernetes-csi-addons | 23b386b2bc0aec93440e169d9ee1efe5660bb33c | `docs/volumereplication.md`, `docs/volumereplicationclass.md`                                                                                                                   |

Supporting environment record: the Setup Google Doc (`1npumTvaf2SRj2wdEUoBBuYLZXwqXxJNUvY3SNqrLfe0`), sections Step 7, Deployment paths, Verified version baseline, Hub Fleet Virtualization integration, and Current configuration.

Live read-only checks (hub and both spokes): Helm release values, controller and node container images, ServiceAccount imagePullSecrets, StorageClass and replication class labels, MultiClusterHub component list, HyperConverged and ConsolePlugin, MinIO PVC and StorageClass, and array `policy`, `replication_rule`, `replication_session` and `ip_port` collections.

## Linked merged PRs

None linked. No design issue or unmerged candidate branch applies to this explainer.

## Steps and citations

1. Cold open: the session's questions. No technical claim.
2. Cast: hub control plane, spokes, arrays, the object chain.
   - `RamenDR/ramen` `docs/usage.md`: VRGs are automatically created and managed by the DRPC on managed clusters.
   - `RamenDR/ramen` `internal/controller/vrg_volrep.go`: class selection by provisioner, VRG scheduling interval and storageid/replicationid labels.
3. Who creates the array copy.
   - `dell/csi-powerstore` `pkg/controller/csiaddons_replication.go` `EnableVolumeReplication`: resolves the remote system by name, then configures async/sync replication.
   - `dell/csi-powerstore` `pkg/controller/replication.go` `EnsureProtectionPolicyExists`: builds `pp-` and `rr-` names from the group prefix, remote system and RPO, reuses an existing policy, creates the rule and policy when absent.
   - `csiaddons_replication.go` `configureBlockReplication`: `ModifyVolume` with `ProtectionPolicyID` assigns the policy, which is what creates the session.
   - `csiaddons_replication.go` `enableVolumeReplicationForVolumeGroup`: the volume-group path creates or reuses the policy and rule, assigns the policy and verifies the session.
   - Live: peer array `policy` collection shows `is_replica=true` mirror policies named `<source policy>_<source remote system>`.
4. Who creates what.
   - Live hub: `dr-policy-15m` carries `kubectl.kubernetes.io/last-applied-configuration`, so it came from an applied manifest. `drpolicy_controller.go` (read while tracing) reconciles against existing DRClusters and does not create them.
   - `csiaddons_replication.go`: `replicationState` primary/secondary/resync is set by Ramen on the request; the class names the local array as source and the peer as target.
5. The three labels.
   - `RamenDR/ramen` `docs/configure.md` section Storage Discovery Mechanism: same `storageid` across clusters means metro, different means regional async.
   - `RamenDR/ramen` `docs/install.md` Async Mode: StorageClasses on managed clusters with different `storageid` labels.
   - `internal/controller/drpolicy_peerclass.go` `getVRID` and `getVGRID`: the replication class must match the StorageClass storageid, the policy interval and the provisioner, then the pair needs equal replicationid (or groupreplicationid) values.
   - Dell bundle `settings.yaml`, `sc.yaml`, `vgrc-5m.yaml` per cluster: the label values are pre-filled, with a different storageid per cluster and identical pair identifiers.
   - md5/sha1/sha256 of array global IDs, pair strings and class names do not reproduce the values.
6. Installer kit.
   - Live: controller has 7 containers, node has 2, the driver image is shared; images are attacher v4.10.0, provisioner v6.1.0, snapshotter v8.4.0, resizer v2.0.0, node-driver-registrar v2.15.0, csi-metadata-retriever v1.13.0, csi-addons sidecar v0.14.10.
   - Live: chart values carry `images.driver.image`; the pod spec has no imagePullSecrets; both ServiceAccounts carry the pull secrets.
   - Anonymous pull refused for the driver image; sidecar images pull anonymously.
7. Where the pieces come from.
   - Dell bundle `settings.yaml` `images:` block lists the driver plus every sidecar, including disabled optional images.
   - `dell-csi-helm-installer/csi-offline-bundle.md`: the offline bundle script derives required images by parsing the chart.
   - Live: the bundle's `powerstore-config.yaml` per cluster holds that lab's array endpoint, global ID and credential (base64 `config`).
8. What we installed.
   - Live: driver `quay.io/martjack/csi-powerstore@sha256:d922a937...` (tag v26.11.17) in controller and node, recorded in Helm release revision 3.
   - Official Dell image for chart 2.14.0: `quay.io/dell/container-storage-modules/csi-powerstore:v2.14.0`, digest `sha256:5a7538443a01...`.
   - Live: csi-addons sidecar `quay.io/nnevin/csi-addons/k8s-sidecar:v0.14.10`; csi-addons controller `quay.io/sughosh/k8s-controller@sha256:737e45c6...` as a bare Deployment in `csi-addons-system`.
9. The order.
   - Setup Doc Step 7 install runbook and the recorded install: namespace, array secret, empty secret, Helm chart, ServiceAccount pull secret, pods, classes, bind test, second cluster, separate csi-addons controller.
10. The hub question.
   - Live hub: no VMs; HyperConverged `kubevirt-hyperconverged`; ConsolePlugin `kubevirt-plugin`; MultiClusterHub `cnv-mtv-integrations=true`; MTV subscription and `forklift-console-plugin`.
   - Live hub: only StorageClass `hostpath-csi` (default, `kubevirt.io.hostpath-provisioner`); MinIO PVC `minio-data` 149Gi on it.
   - Setup Doc Hub Fleet Virtualization integration: the perspective and per-VM Manage disaster recovery action come from the component, which also installs CNV and MTV.
11. Recap: one sentence per chapter.

## Unverified or inferred

- The bundle's label values are not derived from a documented formula. The video says they arrive pre-filled and that no derivation was found, which is the observed state.
- The install order is the one recorded in this lab, not a vendor-mandated sequence.
