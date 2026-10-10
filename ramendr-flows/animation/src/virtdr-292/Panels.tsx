import React from 'react';
import {C, mono, sans} from '../theme';
import {prog} from '../lib/anim';
import {Card} from '../components/primitives';
import {YamlPanel} from '../components/overlays';
import {GlossaryPanel, Def, PHASES} from '../components/newcomer';

type PP = {f: number; dur: number};
const win = (f: number, dur: number, a: number, b: number) => Math.min(prog(f, dur * a, dur * a + 24), 1 - prog(f, dur * b - 24, dur * b));
const at = (f: number, dur: number, fr: number) => prog(f, dur * fr, dur * fr + 20);

/** Right-side panel frame (screen space). */
const Frame: React.FC<{a: number; title: string; children: React.ReactNode; y?: number; h?: number}> = ({a, title, children, y = 178, h}) =>
  a > 0 ? (
    <div
      style={{
        position: 'absolute',
        left: 900,
        top: y,
        width: 980,
        minHeight: h,
        opacity: a,
        transform: `translateX(${(1 - a) * 60}px)`,
        background: `${C.bg}f4`,
        border: `1.5px solid ${C.border}`,
        borderRadius: 16,
        padding: '22px 28px',
        fontFamily: sans,
        color: C.text,
        boxShadow: '0 20px 60px #000c',
      }}
    >
      <div style={{fontSize: 18, letterSpacing: 2, color: C.blue, fontWeight: 700, textTransform: 'uppercase'}}>{title}</div>
      {children}
    </div>
  ) : null;

const Row: React.FC<{a: number; children: React.ReactNode; size?: number; color?: string}> = ({a, children, size = 26, color = C.text}) => (
  <div style={{marginTop: 16, fontSize: size, color, opacity: a, transform: `translateX(${(1 - a) * 20}px)`, lineHeight: 1.35}}>{children}</div>
);

/** Sync tick timeline row. ticks: [label, fraction 0..1 along the bar, ok|missing]. */
const TickRow: React.FC<{label: string; ticks: [string, number, 'ok' | 'missing'][]; p: number}> = ({label, ticks, p}) => (
  <div style={{marginTop: 26}}>
    <div style={{fontFamily: mono, fontSize: 22, color: C.text}}>{label}</div>
    <svg width={900} height={70}>
      <line x1={10} y1={30} x2={890} y2={30} stroke={C.border} strokeWidth={4} />
      {ticks.map(([t, x, k], i) => {
        const a = Math.min(1, Math.max(0, p * (ticks.length + 1) - i));
        const cx = 10 + 880 * x;
        const col = k === 'ok' ? C.green : C.red;
        return (
          <g key={i} opacity={a}>
            {k === 'ok' ? <circle cx={cx} cy={30} r={11} fill={col} /> : <g stroke={col} strokeWidth={4}><circle cx={cx} cy={30} r={13} fill="none" strokeDasharray="5 4" /><line x1={cx - 7} y1={23} x2={cx + 7} y2={37} /><line x1={cx + 7} y1={23} x2={cx - 7} y2={37} /></g>}
            <text x={cx} y={66} textAnchor="middle" fill={k === 'ok' ? C.dim : C.red} fontFamily={mono} fontSize={17}>{t}</text>
          </g>
        );
      })}
    </svg>
  </div>
);

const RPO_BARS: [string, number, string][] = [
  ['13:10', 5022, C.green],
  ['13:15', 5055, C.green],
  ['13:16', 2860, C.green],
  ['13:20', 3632, C.green],
  ['13:21', 4501, C.green],
  ['13:22', 2100, C.amber],
  ['13:23 to 13:30', 0, C.red],
  ['13:31', 222, C.blue],
];

const RECAP: [string, string][] = [
  ['Protect', 'Two VRGs, replicating disks, definitions in S3.'],
  ['Gate', 'Array job history: recent syncs carrying writes.'],
  ['Initiate', 'The console sets action and failoverCluster on the DRPC.'],
  ['Validate', 'Target checked, source kept as RetainedForFailover.'],
  ['Promote', 'Claims restored from S3, replicas made writable.'],
  ['Switch placement', 'The PlacementDecision gains spoke-0.'],
  ['Redeploy', 'ApplicationSet polls, Argo CD builds the VM on recovered disks.'],
  ['Clean up', 'Argo CD prunes the source, its VRG becomes Secondary.'],
  ['Complete', 'PeerReady True: FailedOver / Completed.'],
  ['Verify data', 'Count recovered rows around the recovery point.'],
];

export const GLOSSARY_GRID: [string, string][] = [
  ['VirtualMachine', 'hammerdb-rhel9'],
  ['DataVolume', 'hammerdb-rhel9-rootdisk'],
  ['PowerStore replication session', '23dfdc6d-3feb-4281-83bb-69287b7b1a35'],
  ['VolumeReplicationClass', 'powerstore-vrc-15m'],
  ['VolumeReplication', 'hammerdb-rhel9-datadisk'],
  ['VolumeReplicationGroup', 'dell-vm-drpc'],
  ['S3 bucket', 'ramen-metadata'],
  ['DRPolicy', 'dr-policy-15m'],
  ['Placement', 'dell-vm-placement'],
  ['PlacementDecision', 'dell-vm-placement-decision-1'],
  ['DRPlacementControl', 'dell-vm-drpc'],
  ['ManifestWork', 'dell-vm-drpc-gitops-vms-vrg-mw'],
  ['ManagedClusterView', 'dell-vm-drpc-gitops-vms-vrg-mcv'],
  ['ApplicationSet', 'dell-vm-workload'],
  ['Application', 'dell-vm-workload-spoke-0'],
];
const GROUP = ['workload', 'workload', 'storage', 'storage', 'storage', 'storage', 'storage', 'DR control', 'DR control', 'DR control', 'DR control', 'delivery', 'delivery', 'GitOps', 'GitOps'];
const GCOL: Record<string, string> = {workload: C.green, storage: C.amber, 'DR control': C.orange, delivery: C.cyan, GitOps: C.pink};

/** Chapter 1: one card alone with its definition panel. */
export const GlossaryScene: React.FC<PP & {card?: {kind: string; name: string; role: string}; def?: Def; id: string}> = ({f, dur, card, def, id}) => {
  const enter = prog(f, -20, 25);
  if (id === '1.17') {
    return (
      <div style={{position: 'absolute', inset: 0, opacity: enter}}>
        <div style={{position: 'absolute', left: 110, top: 120, fontFamily: sans, fontSize: 40, fontWeight: 750, color: C.text}}>The whole cast</div>
        {GLOSSARY_GRID.map(([k, n], i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const a = prog(f, dur * (i * 0.04), dur * (i * 0.04) + 18);
          const hl = (() => {
            const g = GROUP[i];
            const order = ['workload', 'storage', 'DR control', 'delivery', 'GitOps'];
            const gi = order.indexOf(g);
            return f > dur * (0.08 + gi * 0.18) && f < dur * (0.26 + gi * 0.18) ? 1 : 0;
          })();
          return <Card key={k} x={110 + col * 430} y={210 + row * 205} w={400} kind={k} name={n} appear={a} hl={hl} color={GCOL[GROUP[i]]} badge={<span style={{fontFamily: sans, fontSize: 14, color: GCOL[GROUP[i]], background: C.bg, padding: '2px 8px', borderRadius: 8, border: `1px solid ${GCOL[GROUP[i]]}`}}>{GROUP[i]}</span>} />;
        })}
      </div>
    );
  }
  if (!card || !def) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: enter}}>
      <div style={{position: 'absolute', left: 110, top: 125, fontFamily: mono, fontSize: 18, letterSpacing: 3, color: C.purple}}>CAST OF CHARACTERS · {id.split('.')[1]} OF 16</div>
      <Card x={110} y={250} w={660} kind={card.kind} name={card.name} role={card.role} appear={prog(f, -10, 30)} hl={0.6} nameSize={34} />
      <GlossaryPanel d={def} p={prog(f, dur * 0.05, dur * 0.8)} x={860} y={240} w={980} />
    </div>
  );
};

/** Per-beat right-side panels and YAML excerpts. Returns null when the beat has none. */
export const PANEL_BEATS = new Set(['2.4', '2.5', '2.6', '2.7', '3.3', '4.1', '4.3', '4.4', '5.4', '10.1', '10.3', '10.4', '11.2', '14.1', '14.2', '14.3', '15.1', '15.2', '15.3', '15.4']);

export const BeatPanel: React.FC<PP & {id: string}> = ({id, f, dur}) => {
  const w = (a: number, b: number) => win(f, dur, a, b);
  switch (id) {
    case '2.4':
      return <YamlPanel title="clusters/dell-s4/hub-dr/placement.yaml" appear={w(0.03, 0.97)} reveal={prog(f, 0, 40)} hl={[5]} x={900} y={178} w={980} lines={['kind: Placement', 'metadata:', '  name: dell-vm-placement', '  namespace: openshift-gitops', '  annotations:', '    cluster.open-cluster-management.io/experimental-scheduling-disable: "true"']} />;
    case '2.5':
      return <YamlPanel title="clusters/dell-s4/hub-dr/applicationset.yaml" appear={w(0.03, 0.97)} reveal={prog(f, 0, 50)} hl={[2, 6]} x={900} y={178} w={980} lines={['generators:', '  - clusterDecisionResource:', '      configMapRef: acm-placement', '      labelSelector:', '        matchLabels:', '          cluster.open-cluster-management.io/placement: dell-vm-placement', '      requeueAfterSeconds: 180']} />;
    case '2.6':
      return <YamlPanel title="applicationset.yaml · template (hub copy of each Application)" appear={w(0.02, 0.4)} reveal={prog(f, 0, 40)} hl={[3, 4]} x={900} y={178} w={980} lines={['template:', '  metadata:', '    name: dell-vm-workload-{{name}}', '    annotations:', '      argocd.argoproj.io/skip-reconcile: "true"', '      apps.open-cluster-management.io/ocm-managed-cluster: "{{name}}"']} />;
    case '2.7':
      return <YamlPanel title="applicationset.yaml · template.spec.syncPolicy" appear={w(0.03, 0.97)} reveal={prog(f, 0, 40)} hl={[5]} x={900} y={178} w={980} lines={['syncPolicy:', '  automated:', '    prune: true', '    selfHeal: true', '  syncOptions:', '    - CreateNamespace=true', '    - PruneLast=true']} />;
    case '3.3':
      return <YamlPanel title="VolumeReplication (created by the VRG, spec excerpt)" appear={w(0.62, 0.98)} reveal={prog(f, dur * 0.62, dur * 0.62 + 40)} hl={[6, 7]} x={900} y={178} w={980} lines={['kind: VolumeReplication', 'metadata: {name: hammerdb-rhel9-datadisk, namespace: gitops-vms}', 'spec:', '  dataSource:', '    kind: PersistentVolumeClaim', '    name: hammerdb-rhel9-datadisk', '  replicationState: primary', '  volumeReplicationClass: powerstore-vrc-15m']} />;
    case '4.1':
      return (
        <Frame a={w(0.02, 0.98)} title="Flashback · previous run, October 6 (VSA-A job history)">
          <TickRow label="hammerdb-rhel9-rootdisk" p={prog(f, dur * 0.2, dur * 0.5)} ticks={[['19:09:53 initial', 0.15, 'ok'], ['19:24:53', 0.62, 'ok']]} />
          <TickRow label="hammerdb-rhel9-datadisk" p={prog(f, dur * 0.3, dur * 0.6)} ticks={[['19:09:53 initial', 0.15, 'ok'], ['no scheduled sync', 0.62, 'missing']]} />
          <Row a={at(f, dur, 0.6)}>Session state <span style={{color: C.green}}>OK</span> · no failed job · no alert</Row>
          <Row a={at(f, dur, 0.72)}>Failover at 19:29:41 · recovered history ended at 15:11 · <span style={{color: C.red, fontWeight: 700}}>RPO FAIL</span></Row>
        </Frame>
      );
    case '4.3':
      return (
        <Frame a={w(0.02, 0.98)} title="Scripted preflight · dell_dr_check.py · 13:15:58 UTC">
          <Row a={at(f, dur, 0.15)} size={40}><span style={{color: C.green, fontWeight: 800}}>OVERALL: PASS</span> <span style={{color: C.dim, fontSize: 28}}>24 of 24 checks</span></Row>
          <Row a={at(f, dur, 0.3)}>Each disk: <b>87</b> completed scheduled syncs, <b>0</b> failed, every gap ≤ 900 s</Row>
          <Row a={at(f, dur, 0.4)} size={18} color={C.dim}>sessions: datadisk 23dfdc6d-3feb-4281-83bb-69287b7b1a35 · rootdisk 6116fde0-2d07-4f2f-89b5-56b7682c712e · OK</Row>
          <Row a={at(f, dur, 0.6)}>12:46:27 to 12:58:27 · <span style={{color: C.green}}>57,767 history rows</span></Row>
          <Row a={at(f, dur, 0.72)}>12:58:27 to 13:10:27 · <span style={{color: C.green}}>59,673 history rows</span></Row>
          <Row a={at(f, dur, 0.82)} size={20} color={C.faint}>Source: VIRTDR-292 preflight JSON, 2026-10-07</Row>
        </Frame>
      );
    case '4.4':
      return (
        <Frame a={w(0.02, 0.98)} title="Gate validity versus the recorded click">
          <div style={{display: 'flex', gap: 30, marginTop: 24}}>
            {[['Preflight finished', '13:15:58', C.green], ['Initiate', '13:26:40', C.blue]].map(([k, v, col], i) => (
              <div key={k} style={{flex: 1, padding: 20, border: `2px solid ${col}`, borderRadius: 14, opacity: at(f, dur, 0.08 + i * 0.12)}}>
                <div style={{fontSize: 20, color: C.dim}}>{k}</div>
                <div style={{fontFamily: mono, fontSize: 52, fontWeight: 600, color: col as string}}>{v}</div>
              </div>
            ))}
          </div>
          <Row a={at(f, dur, 0.35)} size={34}>Elapsed <span style={{fontFamily: mono, color: C.amber, fontWeight: 700}}>10m 42s</span> · required <span style={{fontFamily: mono}}>≤ 2 min</span></Row>
          <Row a={at(f, dur, 0.55)} color={C.amber}>No fresh scripted PASS is evidenced inside the window.</Row>
          <Row a={at(f, dur, 0.7)} color={C.dim}>Recovery result: PASS. Procedure timing: not an example to copy.</Row>
        </Frame>
      );
    case '5.4':
      return <YamlPanel title="DRPlacementControl · fields the console sets (excerpt)" appear={w(0.03, 0.97)} reveal={prog(f, 0, 40)} hl={[5, 6]} x={900} y={178} w={980} lines={['kind: DRPlacementControl', 'metadata:', '  name: dell-vm-drpc', '  namespace: openshift-gitops', 'spec:', '  action: Failover', '  failoverCluster: spoke-0', '  preferredCluster: spoke-0']} />;
    case '10.1': {
      const p = prog(f, dur * 0.05, dur * 0.45);
      const left = Math.round(180 * (1 - p));
      return (
        <Frame a={w(0.02, 0.98)} title="ApplicationSet generator poll">
          <div style={{display: 'flex', alignItems: 'center', gap: 40, marginTop: 20}}>
            <svg width={220} height={220}>
              <circle cx={110} cy={110} r={90} fill="none" stroke={C.border} strokeWidth={14} />
              <circle cx={110} cy={110} r={90} fill="none" stroke={C.pink} strokeWidth={14} strokeDasharray={`${565 * (1 - p)} 565`} transform="rotate(-90 110 110)" />
              <text x={110} y={128} textAnchor="middle" fill={C.text} fontFamily={mono} fontSize={52} fontWeight={600}>{left}s</text>
            </svg>
            <div>
              <Row a={1}>requeueAfterSeconds: <span style={{fontFamily: mono}}>180</span></Row>
              <Row a={at(f, dur, 0.5)} color={C.green}>Reads decision: spoke-0 listed</Row>
              <Row a={at(f, dur, 0.62)}>Generates <span style={{fontFamily: mono}}>dell-vm-workload-spoke-0</span></Row>
              <Row a={at(f, dur, 0.75)} size={21} color={C.amber}>Recorded only as about 13:29. Linking it to this poll is inference.</Row>
            </div>
          </div>
        </Frame>
      );
    }
    case '10.3':
      return (
        <>
          <YamlPanel title="clusters/dell-s4/workloads/datavolumes.yaml (excerpt)" appear={w(0.03, 0.97)} reveal={prog(f, 0, 40)} hl={[3, 4, 5]} x={900} y={178} w={980} lines={['kind: DataVolume', 'metadata:', '  name: hammerdb-rhel9-rootdisk', 'spec:', '  sourceRef:', '    kind: DataSource', '    name: rhel9', '    namespace: openshift-virtualization-os-images']} />
          <Frame a={w(0.45, 0.97)} title="On spoke-0" y={600}>
            <Row a={at(f, dur, 0.5)}>PVC <span style={{fontFamily: mono}}>hammerdb-rhel9-rootdisk</span> already exists, restored by Ramen</Row>
            <Row a={at(f, dur, 0.62)} color={C.green}>Recovered disk kept · no fresh clone of rhel9, no blank disk</Row>
            <Row a={at(f, dur, 0.75)} size={20} color={C.amber}>Exact CDI adoption steps not traced (inference). Reuse is recorded.</Row>
          </Frame>
        </>
      );
    case '10.4':
      return (
        <Frame a={w(0.02, 0.98)} title="Run log · target claims use the promoted replicas">
          {[
            ['hammerdb-rhel9-rootdisk', '1282bca9-29aa-416f-b890-2a29a44e3fac', '9e3b6608-30f4-42e8-aaca-4f774fe7662a'],
            ['hammerdb-rhel9-datadisk', 'e5ecb946-25b6-4f1a-afe0-8173392f2b7d', '41b0880b-916d-42a1-b4b6-a55f9c853c91'],
          ].map(([pvc, src, dst], i) => (
            <div key={pvc} style={{marginTop: 24, opacity: at(f, dur, 0.1 + i * 0.3), fontFamily: mono, fontSize: 21}}>
              <div style={{color: C.text, fontSize: 24}}>{pvc}</div>
              <div style={{color: C.dim, marginTop: 6}}>VSA-B source · {src}</div>
              <div style={{color: C.green, marginTop: 6}}>VSA-A promoted · {dst}</div>
            </div>
          ))}
        </Frame>
      );
    case '11.2':
      return (
        <Frame a={w(0.02, 0.98)} title="Inside the recovered guest (spoke-0)">
          <Row a={at(f, dur, 0.1)}>Boot from crash-consistent disks</Row>
          <Row a={at(f, dur, 0.3)}><span style={{fontFamily: mono}}>ramendr-postgresql.service</span> <span style={{color: C.green}}>active</span> · log replay</Row>
          <Row a={at(f, dur, 0.55)}><span style={{fontFamily: mono}}>ramendr-dr-hammerdb.service</span> <span style={{color: C.green}}>active</span> · started by itself</Row>
          <Row a={at(f, dur, 0.8)} size={32}>First new row <span style={{fontFamily: mono, color: C.blue}}>13:31:37</span></Row>
        </Frame>
      );
    case '14.1':
    case '14.2':
    case '14.3': {
      const max = 5055;
      const p14 = id === '14.1' ? prog(f, dur * 0.4, dur * 0.95) : 1;
      return (
        <Frame a={id === '14.1' ? w(0.02, 1.2) : id === '14.3' ? w(-0.2, 0.98) : 1} title="Recovered history rows per minute (run log excerpt)">
          <svg width={920} height={360} style={{marginTop: 10}}>
            {RPO_BARS.map(([m, n, col], i) => {
              const x = 20 + i * 112;
              const h = (n / max) * 250 * Math.min(1, Math.max(0, p14 * RPO_BARS.length - i));
              const show = id !== '14.1' || i < 6 || p14 > 0.98;
              return (
                <g key={m} opacity={show ? 1 : 0.15}>
                  <rect x={x} y={280 - h} width={84} height={Math.max(h, n === 0 ? 0 : 2)} rx={6} fill={col} opacity={0.85} />
                  {n === 0 ? <line x1={x} y1={280} x2={x + 84} y2={280} stroke={C.red} strokeWidth={4} strokeDasharray="6 5" /> : null}
                  <text x={x + 42} y={270 - h} textAnchor="middle" fill={C.text} fontFamily={mono} fontSize={17}>{n.toLocaleString('en-US')}</text>
                  <text x={x + 42} y={310} textAnchor="middle" fill={C.dim} fontFamily={mono} fontSize={m.length > 6 ? 13 : 17}>{m}</text>
                </g>
              );
            })}
            {id !== '14.1' ? <text x={20 + 5 * 112 + 42} y={345} textAnchor="middle" fill={C.amber} fontFamily={mono} fontSize={16}>ends 13:22:27</text> : null}
          </svg>
          {id === '14.2' ? <Row a={at(f, dur, 0.6)}>Gap last recovered row to first new row: <b style={{fontFamily: mono}}>550 s</b></Row> : null}
          {id === '14.3' ? (
            <>
              <svg width={920} height={150} style={{marginTop: 8}}>
                {(() => {
                  const x0 = 20;
                  const px = (s: number) => x0 + (s / 900) * 880; // seconds after 13:22:27
                  return (
                    <g>
                      <rect x={x0} y={70} width={880 * at(f, dur, 0.55)} height={22} rx={6} fill={`${C.green}33`} stroke={C.green} />
                      <text x={x0} y={122} fill={C.green} fontFamily={sans} fontSize={18}>RPO limit 900 s</text>
                      <rect x={px(0)} y={30} width={(px(257) - px(0)) * at(f, dur, 0.35)} height={30} rx={6} fill={`${C.red}55`} stroke={C.red} />
                      <text x={px(0)} y={22} fill={C.red} fontFamily={mono} fontSize={16}>13:22:27 last sync</text>
                      <line x1={px(253)} y1={24} x2={px(253)} y2={98} stroke={C.blue} strokeWidth={3} opacity={at(f, dur, 0.45)} />
                      <text x={px(253) + 8} y={110} fill={C.blue} fontFamily={mono} fontSize={16} opacity={at(f, dur, 0.45)}>13:26:40 Initiate (253 s)</text>
                      <text x={px(257) + 8} y={52} fill={C.red} fontFamily={mono} fontSize={16} opacity={at(f, dur, 0.4)}>13:26:44 source pause · lost</text>
                    </g>
                  );
                })()}
              </svg>
              <Row a={at(f, dur, 0.15)}><span style={{color: C.green}}>277,433</span> rows from 59 full minutes before the sync: all recovered</Row>
              <Row a={at(f, dur, 0.8)} size={30}><b style={{color: C.green}}>RPO PASS</b> · <b style={{color: C.amber}}>not zero loss</b></Row>
            </>
          ) : null}
        </Frame>
      );
    }
    case '15.1':
      return (
        <Frame a={w(0.02, 0.98)} title="Reversed sessions, VSA-A to VSA-B · observed at 13:42">
          <TickRow label="hammerdb-rhel9-rootdisk" p={prog(f, dur * 0.1, dur * 0.4)} ticks={[['13:22:27', 0.1, 'ok'], ['13:36:57', 0.55, 'ok']]} />
          <TickRow label="hammerdb-rhel9-datadisk" p={prog(f, dur * 0.25, dur * 0.55)} ticks={[['13:22:27', 0.1, 'ok'], ['none yet at 13:42', 0.75, 'missing']]} />
          <Row a={at(f, dur, 0.65)} color={C.amber}>Delayed, not proven permanently skipped</Row>
          <Row a={at(f, dur, 0.8)}>Rerun the two-sync preflight before any relocate</Row>
        </Frame>
      );
    case '15.2':
      return (
        <Frame a={w(0.02, 0.98)} title="End of test · recovered guest on spoke-0">
          <Row a={at(f, dur, 0.1)}><span style={{fontFamily: mono}}>ramendr-dr-hammerdb.service</span> <span style={{color: C.amber}}>inactive · disabled</span></Row>
          <Row a={at(f, dur, 0.3)}><span style={{fontFamily: mono}}>ramendr-postgresql.service</span> <span style={{color: C.green}}>active</span></Row>
          <Row a={at(f, dur, 0.55)} size={32}>order-sequence sum <span style={{fontFamily: mono, color: C.text}}>1,443,612</span> · stable</Row>
          <Row a={at(f, dur, 0.75)} size={21} color={C.dim}>Not an exact transaction count. Stop step hit an SSH error after disabling; verified separately.</Row>
        </Frame>
      );
    case '15.3':
    case '15.4': {
      const base = id === '15.3' ? 0 : 5;
      return (
        <Frame a={id === '15.3' ? w(0.02, 1.2) : w(-0.2, 0.98)} title="Full chain recap">
          {RECAP.map(([k, v], i) => {
            const on = i >= base && i < base + 5 && f > dur * (0.08 + (i - base) * 0.17);
            const done = i < base || (on && f > dur * (0.08 + (i - base + 1) * 0.17));
            return (
              <div key={k} style={{display: 'flex', gap: 16, marginTop: 12, fontSize: 23, opacity: i < base + 5 ? 1 : 0.35}}>
                <span style={{flex: 'none', width: 230, fontWeight: 700, color: on && !done ? C.blue : done ? C.text : C.faint}}>{i + 1}. {k}</span>
                <span style={{color: on || done ? C.dim : C.faint}}>{v}</span>
              </div>
            );
          })}
        </Frame>
      );
    }
    default:
      return null;
  }
};

/** Closing result card (15.5). */
export const ResultCard: React.FC<PP> = ({f, dur}) => {
  const a = Math.min(prog(f, 0, 30), 1 - prog(f, dur * 1.05, dur * 1.1));
  const items: [string, string, string][] = [
    ['Click to Completed', '5m 41s', C.blue],
    ['Recovery point before Initiate', '253 s', C.amber],
    ['RPO limit', '900 s', C.green],
    ['Manual source cleanup', 'none', C.green],
  ];
  return a > 0 ? (
    <div style={{position: 'absolute', left: 260, right: 260, top: 300, opacity: a, padding: 40, background: `${C.bg}f2`, border: `2px solid ${C.green}`, borderRadius: 20, fontFamily: sans, boxShadow: '0 30px 80px #000d'}}>
      <div style={{fontSize: 22, letterSpacing: 3, color: C.green, fontWeight: 700}}>RECORDED RESULT · 2026-10-07 · SPOKE-1 TO SPOKE-0</div>
      <div style={{display: 'flex', gap: 24, marginTop: 30}}>
        {items.map(([k, v, col], i) => (
          <div key={k} style={{flex: 1, opacity: prog(f, dur * (0.08 + i * 0.12), dur * (0.08 + i * 0.12) + 20)}}>
            <div style={{fontFamily: mono, fontSize: 60, fontWeight: 700, color: col}}>{v}</div>
            <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize: 28, color: C.text, marginTop: 34, opacity: prog(f, dur * 0.6, dur * 0.6 + 20)}}>RPO PASS, not zero loss. Each controller did one small job.</div>
    </div>
  ) : null;
};

export {PHASES};
