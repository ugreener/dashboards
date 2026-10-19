# csi-vendors trace

Explains the Miro board diagram "CSI with vendors" for viewers with no prior
knowledge of Kubernetes, CSI, or Ramen. Companion to csi-layers ("3 layers of
CSI"); designed to also stand alone.

## Source

- Board: https://miro.com/app/board/uXjVHt-1XPA=/ (read with miro-mcp
  canvas_read_as_svg on 2026-10-19).
- Widget: 3458764681984341001, title "CSI with vendors", Mermaid flowchart.

Mermaid source as drawn:

```
graph TB
    CSI["container-storage-interface/spec<br>(CSI Specification — CNCF standard)"]
    ADDONS_SPEC["csi-addons/spec<br>(CSI-Addons Specification — NOT yet CNCF)"]
    K8S_ADDONS["csi-addons/kubernetes-csi-addons<br>(Controller + Sidecar)"]
    RAMEN["RamenDR/ramen<br>(DR Orchestrator)"]

    CSI -->|"extends"| ADDONS_SPEC
    ADDONS_SPEC -->|"implements"| K8S_ADDONS
    K8S_ADDONS -->|"consumed by"| RAMEN

    subgraph Dell
        CSM_REP["Dell CSM Replication<br>(enterprise add-ons:<br>authz, resiliency, observability)"]
        PSTORE_DRV["csi-powerstore driver<br>(Owen's builds)"]
        PSTORE_HW["PowerStore Array<br>(PSa97b49e924cd / PSdc7f3064c752)"]
        CSM_REP --- PSTORE_DRV
        PSTORE_DRV --> PSTORE_HW
    end

    subgraph Red Hat
        ROOK["Rook Operator<br>(manages Ceph cluster on K8s)"]
        CEPH_DRV["ceph-csi driver"]
        CEPH_HW["Ceph Cluster<br>(RBD / CephFS)"]
        ROOK --- CEPH_DRV
        CEPH_DRV --> CEPH_HW
    end

    CSI -->|"implements"| PSTORE_DRV
    CSI -->|"implements"| CEPH_DRV
    ADDONS_SPEC -->|"implements<br>(via sidecar)"| PSTORE_DRV
    ADDONS_SPEC -->|"implements<br>(via sidecar)"| CEPH_DRV
    K8S_ADDONS -->|"gRPC to sidecar"| PSTORE_DRV
    K8S_ADDONS -->|"gRPC to sidecar"| CEPH_DRV
```

## Verified repository facts (gh api repos/<repo>, 2026-10-19)

- dell/csm: "Dell Container Storage Modules (CSM)".
- dell/csi-powerstore: "CSI Driver for Dell PowerStore".
- rook/rook: "Storage Orchestration for Kubernetes".
- ceph/ceph-csi: "CSI driver for Ceph".
- ceph/ceph: "Ceph is a distributed object, block, and file storage platform".
- Shared-half facts: see csi-layers/trace.md (CSI spec, csi-addons spec,
  kubernetes-csi-addons, RamenDR/ramen).

## Claims policy

- "Dell CSM Replication" with "authz, resiliency, observability" is drawn on
  the board; narration presents it as the board's box for Dell Container
  Storage Modules add-ons, without asserting Dell's exact module taxonomy.
- "Owen's builds" is the board's annotation on the csi-powerstore driver box:
  custom builds, not the stock release. Narration says exactly that.
- The PowerStore identifiers PSa97b49e924cd and PSdc7f3064c752 are labels as
  drawn. They are NOT the current lab arrays (Setup Doc: VSA-A
  PS3b37452a6e0f, VSA-B PSff392f423bd6). Narration states the diagram is
  architecture, not a live inventory.
- Rook "manages Ceph cluster on K8s" is drawn on the board and matches the
  rook/rook description ("Storage Orchestration for Kubernetes").
- RBD / CephFS are drawn on the board; narration describes them as block
  disks and a shared filesystem, matching ceph/ceph ("object, block, and file
  storage platform").
- gRPC, sidecar, operator and contract definitions are general knowledge
  (evidence: [general-knowledge]); the gRPC and sidecar edges are the board's
  labels.
- Conceptual explainer only: no run logs and no live cluster state.
