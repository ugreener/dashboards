# csi-layers trace

Explains the Miro board diagram "3 layers of CSI" for viewers with no prior
knowledge of Kubernetes, CSI, or Ramen.

## Source

- Board: https://miro.com/app/board/uXjVHt-1XPA=/ (read with miro-mcp
  canvas_read_as_svg on 2026-10-19).
- Widget: 3458764681984200830, title "3 layers of CSI", Mermaid flowchart.

Mermaid source as drawn:

```
graph TB
    CSI["container-storage-interface/spec<br>(CSI Specification — CNCF standard)"]
    ADDONS_SPEC["csi-addons/spec<br>(CSI-Addons Specification — NOT yet CNCF)"]
    K8S_ADDONS["csi-addons/kubernetes-csi-addons<br>(Kubernetes implementation)"]
    RAMEN["RamenDR/ramen<br>(DR Orchestrator)"]
    DRIVER_CEPH["ceph-csi / dell-csi / trident<br>(CSI Drivers)"]

    CSI -->|"extends"| ADDONS_SPEC
    ADDONS_SPEC -->|"implements"| K8S_ADDONS
    K8S_ADDONS -->|"consumed by"| RAMEN
    CSI -->|"implements"| DRIVER_CEPH
    ADDONS_SPEC -->|"implements (via sidecar)"| DRIVER_CEPH
    K8S_ADDONS -->|"calls gRPC to"| DRIVER_CEPH
```

## Verified repository facts (gh api repos/<repo>, 2026-10-19)

- container-storage-interface/spec: "Container Storage Interface (CSI)
  Specification." README: contains the CSI specification and protobuf files;
  adopted by Cloud Foundry, Kubernetes, Mesos, Nomad.
- csi-addons/spec: "Storage Provider extensions to the CSI Specification".
- csi-addons/kubernetes-csi-addons: "CSI-Addons implementation and APIs for
  Kubernetes". The companion board diagram labels it "Controller + Sidecar".
- RamenDR/ramen: README: "an open-cluster-management (OCM) placement extension
  that provides Kubernetes-native Disaster Recovery for workloads and their
  persistent data across a pair of OCM managed clusters", via Relocate
  (planned migration) and Failover (unplanned recovery).
- ceph/ceph-csi: "CSI driver for Ceph".
- NetApp/trident: "Storage orchestrator for containers".
- dell/csi-powerstore: "CSI Driver for Dell PowerStore".

## Claims policy

- "CNCF standard" and "NOT yet CNCF" are the board's labels; narration
  attributes them to the diagram instead of asserting CNCF hosting status.
- Core CSI requests narrated (create, delete, attach, expand) correspond to
  core CSI RPCs (CreateVolume, DeleteVolume, ControllerPublishVolume,
  ControllerExpandVolume). Snapshots are NOT claimed as core CSI.
- The csi-addons extension being about replication matches the repo
  description ("Storage Provider extensions to the CSI Specification") and the
  replication APIs in that spec.
- gRPC between the kubernetes-csi-addons controller and driver sidecars is the
  board's edge label ("calls gRPC to"); narration defines gRPC generically.
- "dell-csi" is drawn on the board as one of the drivers; Dell's drivers live
  under github.com/dell (for example dell/csi-powerstore). Narration says
  "Dell's drivers" without asserting a single repository named dell-csi.
- Conceptual explainer only: no run logs, no live cluster state, no resource
  instances beyond the repository names drawn on the board. Basic-concept
  definitions (container, Kubernetes, volume, driver, specification, CNCF)
  are general knowledge and marked evidence: [general-knowledge].
