#!/usr/bin/env python3
"""Generate per-beat narration audio with Kokoro (local, offline) and a timing file.

Usage:
  ~/.local/share/kokoro-venv/bin/python tools/tts.py virtdr-292 [--chapters 0,1,2] [--voice af_heart]

Writes public/audio/<ticket>/<beat-id>.wav (git-ignored, regenerable) and
src/<ticket>/timing.json (committed) with each beat's audio duration.
"""
import argparse
import json
import os
import re
import sys

import soundfile as sf
import yaml
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MODELS = os.path.expanduser("~/.local/share/kokoro-models")
DEFAULT_PAUSE = 0.8  # seconds of silence after a beat unless beats.yaml sets pause_after

# Exact-token replacements applied before generic rules (order matters: longest first).
SPOKEN = {
    "VIRTDR-307": "VIRT D R three oh seven",
    "ocp-primary": "O C P primary",
    "ocp-secondary": "O C P secondary",
    "gitops-vm-protection": "Git Ops V M protection",
    "VolumeGroupReplicationContent": "Volume Group Replication Content",
    "VolumeGroupReplicationClass": "Volume Group Replication Class",
    "VolumeGroupReplication": "Volume Group Replication",
    "DestinationInfoAvailable": "Destination Info Available",
    "GetReplicationDestinationInfo": "get replication destination info",
    "ModifyVolumeGroupMembership": "modify volume group membership",
    "ClusterDataProtected": "Cluster Data Protected",
    "ClusterDataReady": "Cluster Data Ready",
    "WaitForResourceRestore": "Wait For Resource Restore",
    "WaitForReadiness": "Wait For Readiness",
    "Total/Restored": "total restored",
    "ClaimMisbound": "Claim Misbound",
    "claimRef": "claim ref",
    "volumeHandle": "volume handle",
    "bind-completed": "bind completed",
    "destination-volume-handle": "destination volume handle",
    "ocs-storagecluster-ceph-rbd-virtualization": "O C S storage cluster Ceph R B D virtualization",
    "2m-vm": "two minute V M policy",
    "flatten-mode": "flatten mode",
    "8/1": "eight slash one",
    "6/1": "six slash one",
    "8/0": "eight slash zero",
    "4.22": "four point twenty-two",
    "e6d8e968": "E six D eight E nine six eight",
    "VGRC": "V G R C",
    "VGR": "V G R",
    "UIDs": "U I Ds",
    "UID": "U I D",
    "ODF": "O D F",
    "VIRTDR-342": "VIRT D R three forty-two",
    "VIRTDR-360": "VIRT D R three sixty",
    "VIRTDR-344": "VIRT D R three forty-four",
    "DFBUGS-6934": "D F bugs six nine three four",
    "DFBUGS-9565": "D F bugs nine five six five",
    "hammerdb-win-drpc": "hammer D B win D R P C",
    "hammerdb-win-rootdisk": "hammer D B win root disk",
    "hammerdb-win-datadisk": "hammer D B win data disk",
    "hammerdb-win": "hammer D B win",
    "dell-vm-drpc": "dell V M D R P C",
    "dell-vm-workload": "dell V M workload",
    "dell-vm-placement-decision-1": "dell V M placement decision one",
    "dell-vm-placement": "dell V M placement",
    "dell-win-workload": "dell win workload",
    "csivol-ec5862ac71": "C S I volume E C five eight six two A C seven one",
    "csivol-f756724d1d": "C S I volume F seven five six seven two four D one D",
    "powerstore-vrc-15m": "Power Store V R C fifteen M",
    "dr-policy-15m": "D R policy fifteen M",
    "hammerdb-rhel9-rootdisk": "hammer D B R H E L nine root disk",
    "hammerdb-rhel9-datadisk": "hammer D B R H E L nine data disk",
    "hammerdb-rhel9": "hammer D B R H E L nine",
    "gitops-vms": "Git Ops V M S",
    "openshift-gitops": "OpenShift GitOps",
    "next_sync_timestamp": "next sync timestamp",
    "ocp-4.22-rhdr-dell": "O C P four point twenty-two R H D R dell",
    "clusters/dell-s4/workloads": "clusters dell S four workloads",
    "elsapassaro/ramendr-starter-kit": "elsa passaro ramendr starter kit",
    "worker-0": "worker zero",
    "csi-addons": "C S I add ons",
    "ramen-metadata": "ramen metadata",
    "2,252,463": "two million two hundred fifty-two thousand four hundred sixty-three",
    "VIRTDR-343": "VIRT D R three forty-three",
    "VIRTDR-334": "VIRT D R three thirty-four",
    "VIRTDR-333": "VIRT D R three thirty-three",
    "VIRTDR-292": "VIRT D R two ninety-two",
    "VIRTDR-361": "VIRT D R three sixty-one",
    "12aa0804": "twelve A A oh eight oh four",
    "autoResync": "auto resync",
    "Failed_Over": "Failed Over",
    "ResyncVolume": "resync volume",
    "DemoteVolume": "demote volume",
    "GetVolumeReplicationInfo": "get volume replication info",
    "Requeue": "re queue",
    "pvc-protection": "P V C protection",
    "UTC": "U T C",
    "VirtualMachineInstance": "Virtual Machine Instance",
    "VirtualMachine": "Virtual Machine",
    "VolumeReplicationGroup": "Volume Replication Group",
    "VolumeReplicationClass": "Volume Replication Class",
    "VolumeReplication": "Volume Replication",
    "DeleteVolumeGroup": "delete volume group",
    "DisableVolumeReplication": "disable volume replication",
    "CreateVolumeGroup": "create volume group",
    "DataVolumes": "Data Volumes",
    "DataVolume": "Data Volume",
    "PlacementDecision": "Placement Decision",
    "ApplicationSet": "Application Set",
    "virt-launcher": "virt launcher",
    "virt-controller": "virt controller",
    "virt-handler": "virt handler",
    "VMware": "V M ware",
    "vSphere": "v Sphere",
    "vMotion": "v Motion",
    "VMFS": "V M F S",
    "VMDK": "V M D K",
    "RDM": "R D M",
    "SRM": "S R M",
    "SRA": "S R A",
    "SSO": "S S O",
    "VLAN": "V LAN",
    "HA": "H A",
    "DRS": "D R S",
    "OVN": "O V N",
    "OIDC": "O I D C",
    "RBAC": "R B A C",
    "vDS": "v D S",
    "descheduler": "de scheduler",
    "ESXi": "E S X i",
    "VRA": "V R A",
    "VPG": "V P G",
    "q66lw": "q sixty six L W",
    "PowerStore": "Power Store",
    "RPOs": "R P Os",
    "RWO": "R W O",
    "DRPolicy": "D R Policy",
    "DRCluster": "D R Cluster",
    "DRPlacementControl": "D R Placement Control",
    "VIRTDR-333": "VIRT D R three thirty-three",
    "ManagedClusterLeaseUpdateStopped": "Managed Cluster Lease Update Stopped",
    "RetainedForFailover": "Retained For Failover",
    "hammerdb-drpc-openshift-dr-ops-vrg-mw": "hammer D B D R P C, openshift D R ops, V R G M W",
    "hammerdb-drpc-openshift-dr-ops-vrg-mcv": "hammer D B D R P C, openshift D R ops, V R G M C V",
    "hammerdb-drpc-hammerdb-ns-mw": "hammer D B D R P C, hammer D B, N S M W",
    "hammerdb-placement-decision-1": "hammer D B placement decision one",
    "hammerdb-placement": "hammer D B placement",
    "hammerdb-drpc": "hammer D B D R P C",
    "openshift-dr-ops": "openshift D R ops",
    "openshift-adp": "openshift A D P",
    "minio-on-hub": "min I O on hub",
    "WaitOnUserToCleanUp": "Wait On User To Clean Up",
    "WaitingForResourceRestore": "Waiting For Resource Restore",
    "FailingOver": "Failing Over",
    "FailedOver": "Failed Over",
    "PeerReady": "Peer Ready",
    "VIRTDR-310": "VIRT D R three ten",
    "VIRTDR-308": "VIRT D R three oh eight",
    "hammerdb": "hammer D B",
    "OADP": "O A D P",
    "VM's": "V M's",
    "Velero": "Velero",
    "Velero's": "Velero's",
    "volumereplicationgroups.ramendr.openshift.io/pvc-vr-protection": "volume replication groups, ramen D R dot openshift dot I O, slash P V C V R protection",
    "ocp-4.22-rhdr-dell": "O C P four twenty-two R H D R Dell",
    "clusters/dell-s4/workloads": "clusters, dell S four, workloads",
    "experimental-scheduling-disable": "experimental scheduling disable",
    "powerstore-vrc-15m": "powerstore V R C fifteen M",
    "pvc-vr-protection": "P V C V R protection",
    "dell-vm-placement-decision-1": "dell V M placement decision one",
    "dell-vm-drpc-gitops-vms-vrg-mw": "dell V M D R P C, git ops V M S, V R G M W",
    "dell-vm-drpc-gitops-vms-vrg-mcv": "dell V M D R P C, git ops V M S, V R G M C V",
    "hammerdb-rhel9-rootdisk": "hammer D B R H E L nine root disk",
    "hammerdb-rhel9-datadisk": "hammer D B R H E L nine data disk",
    "VIRTDR-308": "VIRT D R three oh eight",
    "VIRTDR-316": "VIRT D R three sixteen",
    "9e3b6608": "nine E three B, six six oh eight",
    "41b0880b": "four one B, oh eight eight oh B",
    "systemd": "system D",
    "KubeVirt": "Kube Virt",
    "dell-vm-placement": "dell V M placement",
    "dell-vm-workload-spoke-0": "dell V M workload spoke zero",
    "dell-vm-workload-spoke-1": "dell V M workload spoke one",
    "dell-vm-workload": "dell V M workload",
    "dell-vm-drpc": "dell V M D R P C",
    "dr-policy-15m": "D R policy fifteen M",
    "hammerdb-rhel9": "hammer D B R H E L nine",
    "ramen-metadata": "ramen metadata",
    "openshift-gitops": "openshift git ops",
    "powerstore-sc": "powerstore S C",
    "gitops-vms": "git ops V M S",
    "acm-placement": "A C M placement",
    "ramendr-postgresql.service": "ramen D R Postgres service",
    "ramendr-dr-hammerdb.service": "ramen D R Hammer D B service",
    "skip-reconcile": "skip reconcile",
    "drprotection": "D R protection",
    "PostgreSQL": "Postgres",
    "HammerDB": "Hammer D B",
    "TPC-C": "T P C C",
    "RHEL": "R H E L",
    "VSA-A-A": "V S A A node A",
    "VSA-A-B": "V S A A node B",
    "VSA-B-A": "V S A B node A",
    "VSA-B-B": "V S A B node B",
    "VSA-A": "V S A A",
    "VSA-B": "V S A B",
    "edge36": "edge thirty-six",
    "edge95": "edge ninety-five",
    "edge97": "edge ninety-seven",
    "spoke-0": "spoke zero",
    "spoke-1": "spoke one",
    "worker-2": "worker two",
    "gRPC": "G R P C",
    "NVMe/TCP": "N V M E over T C P",
    "NVMe": "N V M E",
    "libvirt": "lib virt",
    "PausedIOError": "Paused I O Error",
    "csi-addons": "C S I addons",
    "RamenDR/ramen": "Ramen D R, ramen",
    "RamenDR": "Ramen D R",
    "container-storage-interface/spec": "container storage interface, spec",
    "container-storage-interface": "container storage interface",
    "csi-addons/spec": "C S I addons, spec",
    "csi-addons/kubernetes-csi-addons": "C S I addons, kubernetes C S I addons",
    "kubernetes-csi-addons": "kubernetes C S I addons",
    "csi-powerstore": "C S I powerstore",
    "ceph-csi": "ceph C S I",
    "dell-csi": "dell C S I",
    "CephFS": "Ceph F S",
    "S3": "S three",
    "Ramen": "Ramen",
    "Argo CD": "Argo C D",
    "ACM's": "A C M's",
    "pvcSelector": "P V C selector",
    "OpenShift 4.22": "OpenShift four twenty-two",
    "MinIO": "min I O",
}
NO_SPLIT = {"OpenShift", "PowerStore", "GitOps", "KubeVirt", "NetApp"}
ACRONYMS = {"DRPC", "VRG", "VRGs", "PVC", "PVCs", "PV", "PVs", "VMI", "VM", "VMs",
             "UTC", "RPO", "ACM", "CSI", "TCP", "OS", "API", "DR", "YAML", "ID", "OCP", "CDI", "SSH",
             "CNCF", "RBD", "CSM", "USB", "RTO", "DNS", "LUN", "OADP", "RWO", "OS", "IP"}


def split_camel(word: str) -> str:
    # ApplicationSet -> Application Set, DRPlacementControl -> D R Placement Control
    m = re.match(r"^([A-Z]{2,})([A-Z][a-z].*)$", word)
    if m:
        return " ".join(m.group(1)) + " " + split_camel(m.group(2))
    if re.search(r"[a-z][A-Z]", word):
        return re.sub(r"(?<=[a-z])(?=[A-Z])", " ", word)
    return word


ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = {2: "twenty", 3: "thirty", 4: "forty", 5: "fifty"}


def num_words(n: int) -> str:
    if n < 20:
        return ONES[n]
    t, o = divmod(n, 10)
    return TENS[t] + ("" if o == 0 else "-" + ONES[o])


def time_words(m: re.Match) -> str:
    h, mi, s = int(m.group(1)), int(m.group(2)), m.group(3)
    minute = "hundred" if mi == 0 else ("oh " + ONES[mi] if mi < 10 else num_words(mi))
    out = f"{num_words(h)} {minute}"
    if s:
        out += f" and {num_words(int(s))} seconds"
    return out


def speakable(text: str) -> str:
    t = " ".join(text.split())
    t = re.sub(r"\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b", time_words, t)
    for k in sorted(SPOKEN, key=len, reverse=True):
        t = re.sub(r"(?<![\w-])" + re.escape(k) + r"(?![\w-])", SPOKEN[k], t)
    words = []
    for w in re.split(r"(\s+)", t):
        core = w.strip(".,;:!?")
        if core in ACRONYMS:
            plural = core.endswith("s") and core[:-1] in ACRONYMS
            spoken = " ".join(core[:-1]) + "s" if plural else " ".join(core)
            w = w.replace(core, spoken)
        elif core in NO_SPLIT:
            pass
        elif re.fullmatch(r"[A-Za-z]+", core):
            w = w.replace(core, split_camel(core))
        words.append(w)
    return "".join(words)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("ticket")
    ap.add_argument("--chapters", default="")
    ap.add_argument("--beats", default="", help="comma-separated beat ids to (re)generate only")
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--dry-run", action="store_true", help="print speakable text only")
    ap.add_argument("--timing-only", action="store_true", help="refresh pause_after values without regenerating audio")
    ap.add_argument("--prune", action="store_true", help="drop timing.json entries whose beat id is no longer in beats.yaml")
    a = ap.parse_args()

    beats = yaml.safe_load(open(os.path.join(ROOT, a.ticket, "beats.yaml")))["beats"]
    all_ids = {str(b["id"]) for b in beats}
    chapters = {c.strip() for c in a.chapters.split(",") if c.strip()}
    if chapters:
        beats = [b for b in beats if str(b["id"]).split(".")[0] in chapters]
    only = {x.strip() for x in a.beats.split(",") if x.strip()}
    if only:
        beats = [b for b in beats if str(b["id"]) in only]

    if a.dry_run:
        for b in beats:
            print(f"[{b['id']}] {speakable(b['narration'])}\n")
        return 0

    kokoro = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
    out_dir = os.path.join(ROOT, "public", "audio", a.ticket)
    os.makedirs(out_dir, exist_ok=True)
    timing_path = os.path.join(ROOT, "src", a.ticket, "timing.json")
    timing = json.load(open(timing_path)) if os.path.exists(timing_path) else {}

    if a.prune:
        for k in [k for k in timing if k not in all_ids]:
            del timing[k]
            print(f"pruned {k}")
        beats = []

    if a.timing_only:
        for b in beats:
            bid = str(b["id"])
            if bid in timing:
                timing[bid]["pause"] = float(b.get("pause_after", DEFAULT_PAUSE))
        beats = []

    for b in beats:
        bid = str(b["id"])
        samples, rate = kokoro.create(speakable(b["narration"]), voice=a.voice, speed=a.speed, lang="en-us")
        sf.write(os.path.join(out_dir, f"{bid}.wav"), samples, rate)
        timing[bid] = {"seconds": round(len(samples) / rate, 3), "voice": a.voice, "pause": float(b.get("pause_after", DEFAULT_PAUSE))}
        print(f"{bid}: {timing[bid]['seconds']}s", flush=True)

    os.makedirs(os.path.dirname(timing_path), exist_ok=True)
    with open(timing_path, "w") as f:
        json.dump(dict(sorted(timing.items(), key=lambda kv: [int(x) for x in kv[0].split(".")])), f, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
