# VSA deployment interconnect reconstruction

This is a reconstruction from live environment captures and command output. It is not a recorded test run and has no Jira ticket.

## What is verified

- Two PowerStore VSA SE pairs were deployed with the SE kit. The first pair failed twice, both times after the base OS install and before a management IPv4 address existed. Both nodes sat at a base OS login prompt.
- The failing console shows `do_cyclone_install: Error 24: Command failed, unable to determine success based on /cyc_var/cyc_state`.
- A working pair deployed the same day had identical OVF properties, hardware, disks and NIC mapping. The only network difference was that all interconnect port groups were untagged on the shared distributed switch.
- The successful rebuild placed each pair's interconnect adapters on its own port groups with distinct VLAN IDs on a new dedicated distributed switch.
- Both rebuilt pairs report cluster state `Configured`, both nodes have management addresses, and the arrays report no active alerts.
- DRS is fully automated, and the appliance VMs do move between hosts over time.

## What is inferred

- That the shared untagged segment caused the cluster step to lose confidence. The exact internal error is inside an encrypted partition and is not readable. The vendor guide warns against sharing interconnect networks. One confound remains: the first pair's successful rebuild also landed on a different host.

## Captures

| File                | Beat | What it shows                                                          |
| ------------------- | ---- | ---------------------------------------------------------------------- |
| console-error-crop.png | 2.3 | The failing node console with the installer's Error 24 line            |
| console-login-crop.png | 2.4 | The same node at a plain Linux login prompt hours later                |
| pg-old-untagged.png | 3.4  | An older pair's interconnect port group, untagged on the shared switch |
| dvs-new.png         | 5.1  | The new dedicated distributed switch                                   |
| pg-vlan1.png        | 5.2  | First pair, interconnect link one, VLAN 1                              |
| pg-vlan2.png        | 5.3  | First pair, interconnect link two, VLAN 2                              |
| pg-vlan3.png        | 5.4  | Second pair, interconnect link one, VLAN 3                             |
| vm-adapters.png     | 5.5  | The VM's adapter order and port group names                            |
| vm-networks.png     | 6.1  | Both nodes on the two interconnect groups, two VMs each                |
| vm-summary.png      | 6.2  | Both nodes running, management addresses, 6 processors and 18 GB       |

Every capture is used. None is skipped.

## Linked merged PRs

None linked. This is not a code-change explanation.
