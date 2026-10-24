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
  ['PlacementDecision', 'dell-vm-placement-decision-1', 'DR control', 'the chosen cluster'],
  ['Placement', 'dell-vm-placement', 'DR control', 'the selection rule'],
  ['ManifestWork', 'dell-vm-drpc-gitops-vms-vrg-mw', 'delivery', 'the hub-to-spoke envelope'],
  ['Bucket', 'ramen-metadata', 'delivery', 'the PV and PVC notebook'],
  ['ApplicationSet', 'dell-vm-workload', 'GitOps', 'the template per cluster'],
  ['Application', 'dell-vm-workload-spoke-0', 'GitOps', 'what Argo CD syncs'],
  ['Backup', 'OADP + Velero', 'GitOps', 'Kubernetes object backup'],
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
              nameSize={n.length > 26 ? 15 : 18}
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
          <div style={{fontFamily: sans, fontSize: 30, color: C.dim, marginTop: 20}}>The objects in this story, one small job each. Green is the VM, amber is storage, orange is DR control, cyan is delivery, pink is GitOps.</div>
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
        CAST OF CHARACTERS · {id.split('.')[1]}
      </div>
      <Card x={110} y={250} w={660} kind={card.kind} name={card.name} role={card.role} appear={prog(f, -10, 30)} hl={0.6} nameSize={card.name.length > 26 ? 28 : 34} />
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

/** Chapter 10 translation tables: the VMware term on the left, the OpenShift term on the right. */
type TranslateRow = [string, string, string];
const TRANSLATE: Record<string, {title: string; note: string; takeaway: string; rows: TranslateRow[]}> = {
  '10.9': {
    title: 'The closest analogy is SRM, not Zerto',
    note: 'Same recovery shape, different copy engine.',
    takeaway: 'Ramen supplies the plan and the placement. The CSI driver supplies the copy. Neither supplies a per-write journal.',
    rows: [
      ['Recovery plan', 'SRM recovery plan', 'Ramen DRPC and VRG'],
      ['Copy engine', 'Array replication with a storage adapter', 'CSI driver and VolumeReplication'],
      ['Test run', 'SRM test recovery', 'Ramen dry run'],
      ['Missing piece', 'Zerto journal in the write path', 'Not part of this stack'],
    ],
  },
  '10.10': {
    title: 'Storage, translated',
    note: 'The datastore is a policy. The disk is a claim.',
    takeaway: 'A VM disk here is a PVC. Its lifetime is a Kubernetes lifetime, so deleting the PVC can destroy the disk.',
    rows: [
      ['Datastore and policy', 'VMFS datastore, storage policy', 'StorageClass and CSI driver'],
      ['Virtual disk', 'VMDK file', 'PVC bound to a PV'],
      ['Raw device', 'RDM', 'Block-mode PVC, RWO'],
      ['Point in time', 'Array snapshot', 'CSI VolumeSnapshot'],
    ],
  },
  '10.11': {
    title: 'Network, translated',
    note: 'There is no port group object. The overlay, policy, and Multus do that job.',
    takeaway: 'The guest address lives inside the pod network. Recovery usually changes it, so plan DNS and re-IP as part of the runbook.',
    rows: [
      ['Segmentation', 'Port group and VLAN', 'OVN network and NetworkPolicy'],
      ['Uplink', 'vDS uplink', 'Node network, Multus for a VLAN'],
      ['Address', 'VM IP on the subnet', 'Guest IP inside the pod network'],
      ['Service name', 'DNS A record', 'Service and external DNS'],
    ],
  },
  '10.12': {
    title: 'Mobility, translated',
    note: 'vMotion is not disaster recovery. It moves within one cluster.',
    takeaway: 'Live migration keeps a VM running on another node in the same cluster. Only a DR plan moves it to another site.',
    rows: [
      ['Live move', 'vMotion', 'Live migration, same cluster'],
      ['Disk move', 'Storage vMotion', 'Volume migration or storage clone'],
      ['Placement', 'DRS', 'Scheduler and descheduler'],
      ['Host failure', 'HA restart', 'Pod restart and VM restart policy'],
      ['Across sites', 'SRM or Zerto', 'A DR plan, not live migration'],
    ],
  },
  '10.13': {
    title: 'Management, translated',
    note: 'Different console, same questions.',
    takeaway: 'The API is the single control point. If it goes down with the site, the plan has to run from the surviving side.',
    rows: [
      ['Control plane', 'vCenter', 'ACM hub and the Kubernetes API'],
      ['Identity', 'SSO and roles', 'OIDC and RBAC'],
      ['Grouping', 'Folders and resource pools', 'Namespaces and projects'],
      ['Activity', 'Tasks and events', 'Conditions, events, Argo CD sync'],
    ],
  },
};

const TranslationTable: React.FC<PP & {id: string}> = ({id, f, dur}) => {
  const data = TRANSLATE[id];
  if (!data) return null;
  return (
    <div style={{position: 'absolute', left: 80, top: 285, width: 1760}}>
      <div style={{fontFamily: sans, fontSize: 44, fontWeight: 800, color: C.text}}>{data.title}</div>
      <div style={{fontSize: 24, color: C.dim, marginTop: 8}}>{data.note}</div>
      <div style={{display: 'flex', fontFamily: mono, fontSize: 17, color: C.faint, borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginTop: 26}}>
        <div style={{width: 360}}>DIMENSION</div>
        <div style={{width: 700}}>VMWARE</div>
        <div style={{width: 700}}>OPENSHIFT VIRTUALIZATION</div>
      </div>
      {data.rows.map(([k, a, b], i) => (
        <div key={k} style={{display: 'flex', fontSize: 24, padding: '14px 0', borderBottom: `1px solid ${C.border}`, opacity: prog(f, dur * (0.08 + i * 0.12), dur * (0.08 + i * 0.12) + 16)}}>
          <div style={{width: 360, color: C.dim}}>{k}</div>
          <div style={{width: 700, color: C.purple}}>{a}</div>
          <div style={{width: 700, color: C.spoke0}}>{b}</div>
        </div>
      ))}
      <div style={{marginTop: 34, paddingTop: 20, borderTop: `1px solid ${C.border}`, fontSize: 25, color: C.text, lineHeight: 1.4}}>
        {data.takeaway}
      </div>
    </div>
  );
};

/** Chapter 10: VMware/Zerto versus OpenShift Virtualization/Ramen. */
export const CompareScene: React.FC<PP & {id: string}> = ({f, dur, id}) => {
  const n = Number(id.split('.')[1]);
  const reveal = (k: number) => prog(f, dur * (0.06 + k * 0.08), dur * (0.06 + k * 0.08) + 20);
  const showTable = n === 5 || n === 7;
  const showScale = n === 6;
  const showOptions = n === 8;
  const showRecap = n === 14;
  const translate = n >= 9 && n <= 13;
  const rows: [string, string, string][] = [
    ['Unit of protection', 'VM on an ESXi host', 'VirtualMachine in a namespace'],
    ['Where writes are seen', 'Hypervisor I/O, via the VRA', 'QEMU block device or storage layer'],
    ['Replication', 'Per-VM journal on the target', 'Per-volume array session'],
    ['RPO', 'Seconds, as publicly described', 'Minutes, set by the policy'],
    ['Metadata', 'Inside the VPG and journal', 'PV/PVC in S3, objects in OADP'],
    ['Control plane', 'vCenter and Zerto manager', 'Kubernetes API and ACM'],
    ['Migration', 'vMotion and storage vMotion', 'Live migration and volume migration'],
    ['Orchestration', 'VPG, VRA, Zerto manager', 'DRPC, VRG, Placement, Argo CD'],
  ];
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 80, top: 70, fontFamily: sans, fontSize: 44, fontWeight: 800, color: C.text}}>
        {translate ? 'The vocabulary changes. The job does not.' : 'Two architectures, one question: where do you see the write?'}
      </div>
      <div style={{position: 'absolute', left: 80, top: 128, fontFamily: sans, fontSize: 21, color: C.dim}}>
        {translate ? 'Translate each VMware term, then check what the native stack does not cover.' : 'The concepts survive. The integration points do not.'}
      </div>

      {!translate ? (
        <>
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
        </>
      ) : null}

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
          <div style={{fontFamily: mono, fontSize: 22, color: C.text, marginBottom: 18}}>Two candidate capture points, neither a supported Zerto integration today</div>
          <div style={{display: 'flex', gap: 40}}>
            <div style={{flex: 1, border: `2px solid ${C.cyan}`, borderRadius: 14, padding: 24, background: `${C.cyan}10`}}>
              <div style={{fontFamily: mono, fontSize: 25, color: C.cyan}}>A. At the storage layer</div>
              <div style={{fontSize: 21, color: C.dim, marginTop: 10, lineHeight: 1.4}}>A driver or array integration could capture block changes. CSI alone does not expose every guest write. Requires separate engineering and support validation.</div>
            </div>
            <div style={{flex: 1, border: `2px solid ${C.purple}`, borderRadius: 14, padding: 24, background: `${C.purple}10`}}>
              <div style={{fontFamily: mono, fontSize: 25, color: C.purple}}>B. Inside the guest</div>
              <div style={{fontSize: 21, color: C.dim, marginTop: 10, lineHeight: 1.4}}>An agent can quiesce an application only if it integrates with that application. It must run in every guest and survive a guest that does not boot.</div>
            </div>
          </div>
        </div>
      ) : null}

      {n >= 9 && n <= 13 ? <TranslationTable id={id} f={f} dur={dur} /> : null}

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
  ['Store metadata outside the cluster', 'VM spec, PVC and PV definitions, Service, and references to Secrets. Never copy Secret values into Git. Encrypt the store and restrict access.'],
  ['Orchestrate placement', 'Use ACM Placement with a DRPC-like object, or integrate with Ramen. Promote the disk before the VM starts.'],
  ['Fix the restore order', 'Ensure namespace and prerequisites, promote disks, recover PV/PVC bindings, restore or deploy VM definitions, then start and verify.'],
  ['Handle guest and network', 'Quiesce with application hooks or VSS before a snapshot, re-IP or re-DNS on the target, and verify unattended startup.'],
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
      {!pitfalls && !recap ? (
        <div style={{position: 'absolute', left: 90, top: 180, width: 1740}}>
          {STEPS.map(([t, d], i) => {
            const a = i < shown ? prog(f, dur * 0.02, dur * 0.02 + 20) : 0;
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
      ) : null}
      {pitfalls ? (
        <div style={{position: 'absolute', left: 90, top: 215, width: 1740, padding: 34, border: `2px solid ${C.red}`, borderRadius: 16, background: `${C.red}10`, opacity: prog(f, 0, 24)}}>
          <div style={{fontFamily: mono, fontSize: 32, color: C.red}}>Hard lessons from this lab</div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 44px', marginTop: 26}}>
            {[
              ['Shared-storage migration is unavailable here', 'These lab disks cannot live-migrate. Any other storage-migration path needs its own version and configuration validation.'],
              ['Cleanup order matters', 'Delete the VM and the DataVolumes only after the target is protected. Never delete a PVC to reset it: a new PVC is a new, empty disk.'],
              ['Finalizers can wedge', 'A stuck pvc-vr-protection finalizer can block source cleanup. Diagnose it, do not force remove it.'],
              ['Green can hide a skip', 'One disk can skip a sync while the replication session still reports OK. Compare per-disk status, not just the summary.'],
            ].map(([h, d]) => (
              <div key={h} style={{borderLeft: `4px solid ${C.red}`, paddingLeft: 18}}>
                <div style={{fontFamily: mono, fontSize: 24, color: C.text}}>{h}</div>
                <div style={{fontSize: 21, color: C.dim, marginTop: 8, lineHeight: 1.35}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {recap ? (
        <div style={{position: 'absolute', left: 90, top: 215, width: 1740}}>
          <div style={{fontFamily: mono, fontSize: 28, color: C.green}}>The chain, in order</div>
          <div style={{display: 'flex', gap: 10, marginTop: 26}}>
            {STEPS.map(([t], i) => (
              <div key={t} style={{flex: 1, textAlign: 'center', padding: '20px 10px', border: `2px solid ${C.green}66`, borderRadius: 12, background: `${C.green}12`, opacity: prog(f, dur * (0.04 + i * 0.06), dur * (0.04 + i * 0.06) + 18)}}>
                <div style={{fontFamily: mono, fontSize: 18, color: C.green}}>{i + 1}</div>
                <div style={{fontSize: 20, color: C.text, marginTop: 8, lineHeight: 1.25}}>{t}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize: 26, color: C.dim, marginTop: 34, lineHeight: 1.4}}>
            Agree the support matrix and the acceptance tests before you build. A completed plan is not a data verdict: verify the guest, then test the reverse path.
          </div>
        </div>
      ) : null}
    </div>
  );
};

/** YAML excerpts and small side panels. */
export const PANEL_BEATS = new Set(['2.8', '7.4', '8.10', '9.5', '12.3', '12.4']);

export const BeatPanel: React.FC<PP & {id: string}> = ({id, f, dur}) => {
  const w = (a: number, b: number) => win(f, dur, a, b);
  switch (id) {
    case '2.8':
      return (
        <div style={{position: 'absolute', left: 960, top: 185, width: 880, boxSizing: 'border-box', padding: '24px 28px 26px', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 16, boxShadow: '0 24px 70px #000d', opacity: w(0.04, 0.97)}}>
          <div style={{fontFamily: mono, fontSize: 20, letterSpacing: 2, color: C.purple}}>VM LIFECYCLE</div>
          <div style={{fontFamily: sans, fontSize: 32, fontWeight: 800, color: C.text, marginTop: 10, lineHeight: 1.2}}>The operations you know, and what they need</div>
          <div style={{marginTop: 22, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: 'hidden'}}>
            {[
              ['Start and stop', 'The VirtualMachine object stays defined while the VM is off.'],
              ['Templates', 'A catalog entry that stamps out VMs with the same hardware and disks.'],
              ['Live migration', 'Moves a running VM to another node. Needs shared or migratable storage.'],
              ['Eviction', 'A node drain restarts the VM elsewhere unless it can migrate first.'],
              ['This lab', 'Block disks on one array, so the console reports live migration as false.'],
            ].map(([k, v], i) => (
              <div key={k} style={{display: 'flex', gap: 16, padding: '13px 18px', borderTop: i ? `1px solid ${C.border}` : 'none', background: i % 2 ? `${C.panel}88` : 'transparent', opacity: prog(f, dur * (0.08 + i * 0.1), dur * (0.08 + i * 0.1) + 18)}}>
                <div style={{flex: 'none', width: 160, fontFamily: mono, fontSize: 18, color: C.amber}}>{k}</div>
                <div style={{fontSize: 18, color: C.dim, lineHeight: 1.35}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      );
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
            '  # Argo CD owns this app and removes it',
            '  # from the source after the placement moves',
            '  drPolicyRef:',
            '    name: dr-policy-15m',
          ]}
        />
      );
    case '8.10':
      return (
        <div style={{position: 'absolute', left: 980, top: 190, width: 860, opacity: w(0.04, 0.97)}}>
          <div style={{fontFamily: mono, fontSize: 20, letterSpacing: 2, color: C.purple}}>DATA VERDICT</div>
          <div style={{fontFamily: sans, fontSize: 34, fontWeight: 800, color: C.text, marginTop: 12}}>The DRPC does not measure data loss</div>
          <div style={{marginTop: 26, border: `2px solid ${C.border}`, borderRadius: 14, overflow: 'hidden'}}>
            {[
              ['Baseline', 'row counts or checksums captured at a known time'],
              ['Last sync', 'the completed sync before Initiate'],
              ['Recovered', 'the same counts on the target'],
              ['Verdict', 'delta must fit inside the RPO, not the badge'],
            ].map(([k, v], i) => (
              <div key={k} style={{display: 'flex', gap: 20, padding: '18px 22px', borderTop: i ? `1px solid ${C.border}` : 'none', background: i % 2 ? `${C.panel}88` : 'transparent', opacity: prog(f, dur * (0.08 + i * 0.12), dur * (0.08 + i * 0.12) + 18)}}>
                <div style={{flex: 'none', width: 160, fontFamily: mono, fontSize: 20, color: C.amber}}>{k}</div>
                <div style={{fontSize: 20, color: C.dim, lineHeight: 1.35}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case '12.3':
      return (
        <div style={{position: 'absolute', left: 980, top: 190, width: 860, opacity: w(0.04, 0.97)}}>
          <div style={{fontFamily: mono, fontSize: 20, letterSpacing: 2, color: C.green}}>READINESS GATE</div>
          <div style={{fontFamily: sans, fontSize: 34, fontWeight: 800, color: C.text, marginTop: 12}}>Before you press Failover</div>
          <div style={{marginTop: 24}}>
            {['Versions pinned', 'Policy validated', 'Both clusters reachable', 'Every disk synced within RPO', 'Application writer active', 'Baseline captured', 'Target capacity reserved'].map((t, i) => (
              <div key={t} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', opacity: prog(f, dur * (0.08 + i * 0.09), dur * (0.08 + i * 0.09) + 16)}}>
                <div style={{width: 26, height: 26, borderRadius: 6, border: `2px solid ${C.green}`, background: `${C.green}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 18, color: C.green}}>✓</div>
                <div style={{fontFamily: mono, fontSize: 22, color: C.text}}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case '12.4':
      return (
        <div style={{position: 'absolute', left: 980, top: 190, width: 860, opacity: w(0.04, 0.97)}}>
          <div style={{fontFamily: mono, fontSize: 20, letterSpacing: 2, color: C.amber}}>MEASURE THREE THINGS</div>
          <div style={{fontFamily: sans, fontSize: 34, fontWeight: 800, color: C.text, marginTop: 12}}>Not one of them is a green badge</div>
          <div style={{marginTop: 28, display: 'flex', flexDirection: 'column', gap: 18}}>
            {[
              ['RPO', 'Last completed sync', 'The gap before the failure sets the exposure.', C.amber],
              ['RTO', 'Click to first write', 'The first successful application write ends the clock.', C.green],
              ['Data loss', 'Recovered rows', 'Compare against the baseline at the last known sync.', C.red],
            ].map(([k, h, d, col], i) => (
              <div key={k as string} style={{borderLeft: `6px solid ${col as string}`, padding: '14px 20px', background: `${col as string}10`, opacity: prog(f, dur * (0.08 + i * 0.16), dur * (0.08 + i * 0.16) + 18)}}>
                <div style={{fontFamily: mono, fontSize: 19, color: col as string}}>{k}</div>
                <div style={{fontFamily: mono, fontSize: 27, color: C.text, marginTop: 4}}>{h}</div>
                <div style={{fontSize: 19, color: C.dim, marginTop: 6}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
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
        ['A VM runs in a pod, with a disk.', 'KVM and QEMU run in a pod, and the disk is a CSI volume.'],
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
