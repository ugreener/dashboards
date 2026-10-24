import React from 'react';
import {C, mono, sans} from '../theme';
import {prog} from '../lib/anim';
import {Card} from '../components/primitives';
import {YamlPanel} from '../components/overlays';
import {GlossaryPanel, Def} from '../components/newcomer';

type PP = {f: number; dur: number};
const win = (f: number, dur: number, a: number, b: number) => Math.min(prog(f, dur * a, dur * a + 24), 1 - prog(f, dur * b - 24, dur * b));

/** Chapter 1: one card alone with its definition panel. */
const GLOSSARY: [string, string, string, string][] = [
  ['Pod', 'virt-launcher-hammerdb-rhel9-q66lw', 'workload', 'the sandbox that runs the VM process'],
  ['VirtualMachine', 'hammerdb-rhel9', 'workload', 'the desired state'],
  ['VirtualMachineInstance', 'hammerdb-rhel9', 'workload', 'one running copy'],
  ['Pod', 'virt-launcher', 'workload', 'the pod that runs libvirt and QEMU'],
  ['DataVolume', 'hammerdb-rhel9-rootdisk', 'workload', 'a PVC plus a recipe'],
  ['PersistentVolumeClaim', 'hammerdb-rhel9-rootdisk', 'workload', 'the storage request'],
  ['StorageClass', 'powerstore-sc', 'storage', 'the provisioning recipe'],
  ['VolumeReplication', 'hammerdb-rhel9-rootdisk', 'storage', 'per-disk replication order'],
  ['VolumeReplicationGroup', 'dell-vm-drpc', 'storage', 'all disks of one app'],
  ['DRPolicy', 'dr-policy-15m', 'DR control', 'clusters and interval'],
  ['DRPlacementControl', 'dell-vm-drpc', 'DR control', 'the per-app request'],
  ['Placement', 'dell-vm-placement', 'DR control', 'the selection rule'],
  ['ManifestWork', 'dell-vm-drpc-gitops-vms-vrg-mw', 'delivery', 'the hub-to-spoke envelope'],
  ['Bucket', 'ramen-metadata', 'delivery', 'the PV and PVC notebook'],
  ['ApplicationSet', 'dell-vm-workload', 'GitOps', 'the template per cluster'],
  ['Application', 'dell-vm-workload-spoke-0', 'GitOps', 'what Argo CD syncs'],
  ['Backup', 'OADP + Velero', 'GitOps', 'Kubernetes object backup'],
  ['Pod', 'virt-launcher', 'workload', 'the VM process'],
];
const GCOL: Record<string, string> = {workload: C.green, storage: C.amber, 'DR control': C.orange, delivery: C.cyan, GitOps: C.pink};

export const GlossaryScene: React.FC<PP & {card?: {kind: string; name: string; role: string}; def?: Def; id: string}> = ({f, dur, card, def, id}) => {
  const enter = prog(f, -20, 25);
  if (id === '1.18') {
    return (
      <div style={{position: 'absolute', inset: 0, opacity: enter}}>
        <div style={{position: 'absolute', left: 80, top: 105, fontFamily: sans, fontSize: 38, fontWeight: 750, color: C.text}}>The whole cast</div>
        <div style={{position: 'absolute', left: 84, top: 155, fontFamily: sans, fontSize: 20, color: C.dim}}>Green is the VM, amber is storage, orange is DR control, cyan is delivery, pink is GitOps.</div>
        {GLOSSARY.map(([k, n, g, role], i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const a = prog(f, dur * (i * 0.025), dur * (i * 0.025) + 18);
          const order = ['workload', 'storage', 'DR control', 'delivery', 'GitOps'];
          const gi = order.indexOf(g);
          const hl = f > dur * (0.06 + gi * 0.17) && f < dur * (0.21 + gi * 0.17) ? 1 : 0;
          return (
            <Card
              key={`${k}-${i}`}
              x={80 + col * 362}
              y={205 + row * 205}
              w={338}
              kind={k}
              name={n}
              role={role}
              appear={a}
              hl={hl}
              color={GCOL[g]}
              nameSize={n.length > 30 ? 16 : 18}
            />
          );
        })}
      </div>
    );
  }
  if (id === '1.1') {
    return (
      <div style={{position: 'absolute', inset: 0, opacity: enter}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center'}}>
          <div style={{fontFamily: sans, fontSize: 84, fontWeight: 800, color: C.text}}>Cast of characters</div>
          <div style={{fontFamily: sans, fontSize: 30, color: C.dim, marginTop: 20}}>Seventeen objects, one small job each. Green is the VM, amber is storage, orange is DR control, cyan is delivery, pink is GitOps.</div>
          <div style={{display: 'flex', justifyContent: 'center', gap: 26, marginTop: 60}}>
            {Object.entries(GCOL).map(([g, col]) => (
              <div key={g} style={{fontFamily: mono, fontSize: 22, color: col, border: `2px solid ${col}`, borderRadius: 999, padding: '10px 24px', background: `${col}14`}}>{g}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (!card || !def) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: enter}}>
      <div style={{position: 'absolute', left: 110, top: 125, fontFamily: mono, fontSize: 18, letterSpacing: 3, color: C.purple}}>
        CAST OF CHARACTERS · {id.split('.')[1]} OF 17
      </div>
      <Card x={110} y={250} w={660} kind={card.kind} name={card.name} role={card.role} appear={prog(f, -10, 30)} hl={0.6} nameSize={34} />
      <GlossaryPanel d={def} p={prog(f, dur * 0.05, dur * 0.8)} x={860} y={240} w={980} />
    </div>
  );
};

const Box: React.FC<{a: number; x: number; y: number; w: number; h: number; title: string; sub?: string; col: string}> = ({a, x, y, w, h, title, sub, col}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      opacity: a,
      transform: `translateY(${(1 - a) * 18}px)`,
      border: `2px solid ${col}`,
      borderRadius: 12,
      background: `${col}12`,
      padding: '14px 18px',
    }}
  >
    <div style={{fontFamily: mono, fontSize: 24, color: col, fontWeight: 700}}>{title}</div>
    {sub ? <div style={{fontSize: 19, color: C.dim, marginTop: 6, lineHeight: 1.3}}>{sub}</div> : null}
  </div>
);

/** Chapter 10: VMware/Zerto versus OpenShift Virtualization/Ramen. */
export const CompareScene: React.FC<PP & {id: string}> = ({f, dur, id}) => {
  const n = Number(id.split('.')[1]);
  const reveal = (k: number) => prog(f, dur * (0.06 + k * 0.08), dur * (0.06 + k * 0.08) + 20);
  const showTable = n >= 5 && n <= 7;
  const showScale = n === 6;
  const showOptions = n === 8;
  const showRecap = n === 9;
  const rows: [string, string, string][] = [
    ['Unit of protection', 'VM on an ESXi host', 'VirtualMachine in a namespace'],
    ['Where writes are seen', 'Hypervisor I/O, via the VRA', 'QEMU block device or CSI volume'],
    ['Replication', 'Per-VM journal on the target', 'Per-volume array session'],
    ['RPO', 'Seconds, near-synchronous', 'Minutes, set by the policy'],
    ['Metadata', 'Inside the VPG and journal', 'PV/PVC in S3, objects in OADP'],
    ['Orchestration', 'VPG, VRA, Zerto manager', 'DRPC, VRG, Placement, Argo CD'],
  ];
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 80, top: 70, fontFamily: sans, fontSize: 44, fontWeight: 800, color: C.text}}>
        Two architectures, one question: where do you see the write?
      </div>
      <div style={{position: 'absolute', left: 80, top: 128, fontFamily: sans, fontSize: 21, color: C.dim}}>
        The concepts survive. The integration points do not.
      </div>

      <div style={{position: 'absolute', left: 80, top: 185, width: 800, height: 310}}>
        <div style={{fontFamily: mono, fontSize: 20, letterSpacing: 2, color: C.purple}}>VMWARE + ZERTO (CLASSIC)</div>
        <Box a={reveal(0)} x={0} y={40} w={800} h={70} title="ESXi host" sub="hypervisor owns the virtual disk and device state" col={C.purple} />
        <Box a={reveal(1)} x={0} y={125} w={380} h={70} title="VM" sub="virtual hardware" col={C.green} />
        <Box a={reveal(1)} x={420} y={125} w={380} h={70} title="VRA" sub="virtual replication appliance" col={C.orange} />
        <Box a={reveal(2)} x={0} y={210} w={800} h={80} title="Journal on the target" sub="checkpoints every 5 to 15 seconds, recover to a point in time" col={C.amber} />
        {n >= 3
          ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} style={{position: 'absolute', left: 30 + i * 95, top: 262, width: 12, height: 12, borderRadius: 6, background: C.amber, opacity: reveal(3)}} />
            ))
          : null}
      </div>

      <div style={{position: 'absolute', left: 1020, top: 185, width: 800, height: 310}}>
        <div style={{fontFamily: mono, fontSize: 20, letterSpacing: 2, color: C.spoke0}}>OPENSHIFT VIRTUALIZATION + RAMEN</div>
        <Box a={reveal(3)} x={0} y={40} w={800} h={70} title="virt-launcher pod" sub="QEMU and libvirt run inside a Kubernetes pod" col={C.green} />
        <Box a={reveal(3)} x={0} y={125} w={380} h={70} title="PVC" sub="block device, RWO" col={C.dim} />
        <Box a={reveal(3)} x={420} y={125} w={380} h={70} title="CSI + array" sub="VSA-A to VSA-B, async" col={C.orange} />
        <Box a={reveal(3)} x={0} y={210} w={380} h={70} title="S3 metadata" sub="PV and PVC definitions" col={C.s3} />
        <Box a={reveal(3)} x={420} y={210} w={380} h={70} title="DRPC + Placement" sub="who runs it and where" col={C.blue} />
      </div>

      {showTable ? (
        <div style={{position: 'absolute', left: 80, top: 500, width: 1760}}>
          <div style={{display: 'flex', fontFamily: mono, fontSize: 17, color: C.faint, borderBottom: `1px solid ${C.border}`, paddingBottom: 8}}>
            <div style={{width: 380}}>DIMENSION</div>
            <div style={{width: 690}}>VMWARE + ZERTO</div>
            <div style={{width: 690}}>OPENSHIFT + RAMEN</div>
          </div>
          {rows.map(([k, a, b], i) => (
            <div key={k} style={{display: 'flex', fontSize: 21, padding: '11px 0', borderBottom: `1px solid ${C.border}`, opacity: n === 5 ? prog(f, dur * (0.1 + i * 0.1), dur * (0.1 + i * 0.1) + 16) : 1}}>
              <div style={{width: 380, color: C.dim}}>{k}</div>
              <div style={{width: 690, color: C.purple}}>{a}</div>
              <div style={{width: 690, color: C.spoke0}}>{b}</div>
            </div>
          ))}
        </div>
      ) : null}

      {showScale ? (
        <div style={{position: 'absolute', left: 120, top: 560, width: 1680}}>
          <div style={{fontFamily: mono, fontSize: 22, color: C.text, marginBottom: 16}}>What an RPO of seconds versus minutes buys you</div>
          <svg width={1680} height={210}>
            <line x1={40} y1={120} x2={1640} y2={120} stroke={C.border} strokeWidth={6} />
            {[
              [40, '0', C.green],
              [300, '5 s', C.green],
              [600, '1 min', C.amber],
              [980, '15 min', C.orange],
              [1400, '1 h', C.red],
            ].map(([x, l, col]) => (
              <g key={String(l)}>
                <circle cx={x as number} cy={120} r={11} fill={col as string} />
                <text x={x as number} y={165} textAnchor="middle" fill={col as string} fontFamily={mono} fontSize={22}>{l}</text>
              </g>
            ))}
            <rect x={40} y={60} width={260} height={34} rx={8} fill={`${C.green}33`} stroke={C.green} />
            <text x={50} y={84} fill={C.green} fontFamily={sans} fontSize={18}>journal, seconds</text>
            <rect x={980} y={60} width={300} height={34} rx={8} fill={`${C.orange}33`} stroke={C.orange} />
            <text x={990} y={84} fill={C.orange} fontFamily={sans} fontSize={18}>async array, this lab</text>
          </svg>
          <div style={{fontSize: 23, color: C.dim, lineHeight: 1.4}}>
            A journal needs a data path that sees every write. An array session only promises the last schedule, so the recovery point is the last completed sync.
          </div>
        </div>
      ) : null}

      {showOptions ? (
        <div style={{position: 'absolute', left: 100, top: 520, width: 1720}}>
          <div style={{fontFamily: mono, fontSize: 22, color: C.text, marginBottom: 18}}>Two places a journal can live on OpenShift</div>
          <div style={{display: 'flex', gap: 40}}>
            <div style={{flex: 1, border: `2px solid ${C.cyan}`, borderRadius: 14, padding: 24, background: `${C.cyan}10`}}>
              <div style={{fontFamily: mono, fontSize: 25, color: C.cyan}}>A. Between CSI and the array</div>
              <div style={{fontSize: 21, color: C.dim, marginTop: 10, lineHeight: 1.4}}>Sees block writes. No guest agent. Must integrate with the CSI driver and the array, and it must handle RWO attach and NQN identity.</div>
            </div>
            <div style={{flex: 1, border: `2px solid ${C.purple}`, borderRadius: 14, padding: 24, background: `${C.purple}10`}}>
              <div style={{fontFamily: mono, fontSize: 25, color: C.purple}}>B. Inside the guest</div>
              <div style={{fontSize: 21, color: C.dim, marginTop: 10, lineHeight: 1.4}}>Sees application writes and can quiesce the database. Needs an agent in every guest, and it must survive a guest that does not boot.</div>
            </div>
          </div>
        </div>
      ) : null}

      {showRecap ? (
        <div style={{position: 'absolute', left: 160, top: 470, width: 1600, textAlign: 'center'}}>
          <div style={{fontFamily: sans, fontSize: 54, fontWeight: 800, color: C.text, lineHeight: 1.2}}>Port the guarantees. Rebuild the architecture.</div>
          <div style={{fontFamily: sans, fontSize: 28, color: C.dim, marginTop: 24}}>Seconds of RPO needs a journal. Minutes of RPO can be array replication. Both need metadata and a placement decision.</div>
        </div>
      ) : null}
    </div>
  );
};

const STEPS: [string, string][] = [
  ['Discover the workload', 'Watch VirtualMachine, VirtualMachineInstance, DataVolume, PVC, and the owning Application. Map every VM to its disks and namespace.'],
  ['Choose the data path', 'CSI snapshots for point-in-time copies, CSI replication for continuous copies, or a data-path component for a journal.'],
  ['Store metadata outside the cluster', 'VM spec, PVC and PV definitions, Service, and references to Secrets. Never copy Secret values into Git.'],
  ['Orchestrate placement', 'Use ACM Placement with a DRPC-like object, or integrate with Ramen. Promote the disk before the VM starts.'],
  ['Fix the restore order', 'Promote disk, recreate PV and PVC, restore objects, create namespace, start VM. Starting early gives a blank disk or a pending pod.'],
  ['Handle guest and network', 'Freeze and unfreeze for consistency, re-IP or re-DNS on the target, and verify unattended startup.'],
  ['Test the guarantees', 'Measure last sync, run a test failover, verify recovered rows, then test cleanup and the reverse path.'],
];

/** Chapter 11: implementation blueprint. */
export const BlueprintScene: React.FC<PP & {id: string}> = ({f, dur, id}) => {
  const n = Number(id.split('.')[1]);
  const shown = n === 1 ? 0 : Math.min(7, n - 1);
  const recap = n === 10;
  const pitfalls = n === 9;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 90, top: 65, fontFamily: sans, fontSize: 44, fontWeight: 800, color: C.text}}>A blueprint for Zerto on OpenShift Virtualization</div>
      <div style={{position: 'absolute', left: 92, top: 122, fontFamily: sans, fontSize: 21, color: C.dim}}>A design checklist, not a statement of current product support.</div>
      <div style={{position: 'absolute', left: 90, top: 180, width: 1740}}>
        {STEPS.map(([t, d], i) => {
          const a = i < shown ? prog(f, dur * 0.02, dur * 0.02 + 20) : recap ? 1 : 0;
          return (
            <div key={t} style={{display: 'flex', gap: 22, alignItems: 'flex-start', opacity: a, marginBottom: 15}}>
              <div style={{flex: 'none', width: 54, height: 54, borderRadius: 27, background: i < shown ? C.blue : C.panel, border: `2px solid ${i < shown ? C.blue : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 24, fontWeight: 700, color: i < shown ? C.bg : C.dim}}>{i + 1}</div>
              <div>
                <div style={{fontFamily: mono, fontSize: 26, color: i < shown ? C.text : C.faint}}>{t}</div>
                <div style={{fontSize: 21, color: C.dim, marginTop: 4, lineHeight: 1.35}}>{d}</div>
              </div>
            </div>
          );
        })}
      </div>
      {pitfalls ? (
        <div style={{position: 'absolute', left: 90, top: 200, width: 1740, padding: 30, border: `2px solid ${C.red}`, borderRadius: 16, background: `${C.red}10`}}>
          <div style={{fontFamily: mono, fontSize: 30, color: C.red}}>Hard lessons from this lab</div>
          <div style={{display: 'flex', gap: 30, marginTop: 20}}>
            {[
              ['RWO cannot live migrate', 'A block PVC with ReadWriteOnce is not shared storage.'],
              ['Cleanup order matters', 'VM, then DataVolumes, then PVCs. Delete the DV first, not the PVC.'],
              ['Finalizers can wedge', 'A stuck pvc-vr-protection finalizer blocks the source VRG.'],
              ['Green can hide a skip', 'One disk can skip a sync while the session still says OK.'],
            ].map(([h, d]) => (
              <div key={h} style={{flex: 1}}>
                <div style={{fontFamily: mono, fontSize: 22, color: C.text}}>{h}</div>
                <div style={{fontSize: 19, color: C.dim, marginTop: 8, lineHeight: 1.35}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {recap ? (
        <div style={{position: 'absolute', left: 90, top: 200, width: 1740}}>
          <div style={{fontFamily: mono, fontSize: 32, color: C.green}}>Discover, copy, store metadata, place, restore in order, validate the guest, test the reverse path.</div>
        </div>
      ) : null}
    </div>
  );
};

/** YAML excerpts and small side panels. */
export const PANEL_BEATS = new Set(['7.4', '9.5']);

export const BeatPanel: React.FC<PP & {id: string}> = ({id, f, dur}) => {
  const w = (a: number, b: number) => win(f, dur, a, b);
  switch (id) {
    case '7.4':
      return (
        <YamlPanel
          title="DRPlacementControl · spec excerpt"
          appear={w(0.04, 0.97)}
          reveal={prog(f, 0, 40)}
          hl={[4, 5, 6]}
          x={980}
          y={190}
          w={860}
          lines={[
            'kind: DRPlacementControl',
            'metadata:',
            '  name: dell-vm-drpc',
            '  namespace: openshift-gitops',
            'spec:',
            '  drPolicyRef:',
            '    name: dr-policy-15m',
            '  placementRef:',
            '    name: dell-vm-placement',
            '  pvcSelector:',
            '    matchLabels:',
            '      drprotection: "true"',
            '  action: Failover',
            '  failoverCluster: spoke-0',
          ]}
        />
      );
    case '9.5':
      return (
        <YamlPanel
          title="Managed application DRPC · selector rules"
          appear={w(0.04, 0.97)}
          reveal={prog(f, 0, 40)}
          hl={[2, 3, 4, 8]}
          x={980}
          y={190}
          w={860}
          lines={[
            'spec:',
            '  pvcSelector:',
            '    matchLabels:',
            '      drprotection: "true"',
            '  # no protectedNamespaces:',
            '  # Ramen owns this app and cleans it up',
            '  # on the source after promotion',
            '  drPolicyRef:',
            '    name: dr-policy-15m',
          ]}
        />
      );
    default:
      return null;
  }
};

/** Closing card for 12.5. */
export const ClosingCard: React.FC<PP> = ({f, dur}) => {
  const a = Math.min(prog(f, 0, 24), 1 - prog(f, dur * 1.02, dur * 1.08));
  if (a <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 220,
        right: 220,
        top: 300,
        opacity: a,
        padding: 42,
        background: `${C.bg}f4`,
        border: `2px solid ${C.green}`,
        borderRadius: 20,
        fontFamily: sans,
        boxShadow: '0 30px 80px #000d',
      }}
    >
      <div style={{fontSize: 20, letterSpacing: 3, color: C.green, fontWeight: 700}}>THREE THINGS TO REMEMBER</div>
      {[
        ['A VM is a pod with a disk.', 'KubeVirt puts QEMU in a pod and the disk on a CSI volume.'],
        ['DR is a chain, not a copy.', 'Blocks, Kubernetes objects, placement, and guest recovery.'],
        ['Measure the sync, not the badge.', 'The last completed sync sets the RPO. The first new write sets the RTO.'],
      ].map(([h, d], i) => (
        <div key={h} style={{marginTop: 26, opacity: prog(f, dur * (0.1 + i * 0.12), dur * (0.1 + i * 0.12) + 18)}}>
          <div style={{fontFamily: mono, fontSize: 30, color: C.text}}>{h}</div>
          <div style={{fontSize: 22, color: C.dim, marginTop: 6}}>{d}</div>
        </div>
      ))}
    </div>
  );
};
