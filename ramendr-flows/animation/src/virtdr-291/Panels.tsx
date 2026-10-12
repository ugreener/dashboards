import React from 'react';
import {C, mono, sans} from '../theme';
import {prog} from '../lib/anim';
import {Card} from '../components/primitives';
import {YamlPanel} from '../components/overlays';
import {GlossaryPanel, Def} from '../components/newcomer';

type PP = {f: number; dur: number};
const win = (f: number, dur: number, a: number, b: number) => Math.min(prog(f, dur * a, dur * a + 24), 1 - prog(f, dur * b - 24, dur * b));
const at = (f: number, dur: number, fr: number) => prog(f, dur * fr, dur * fr + 20);

export const PHASES_291 = ['Protect', 'Check', 'Initiate', 'Validate', 'Promote', 'Restore VM', 'Source pauses', 'Wait', 'Clean up', 'Complete', 'Verify'];

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
const M: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => <span style={{fontFamily: mono, color}}>{children}</span>;

const RECAP: [string, string][] = [
  ['Protect', 'Two VRGs, copying disks, claim and VM definitions in S3.'],
  ['Check', 'Recent syncs, quiet database.'],
  ['Initiate', 'The console sets action and failoverCluster.'],
  ['Validate', 'Target checked, spoke-0 kept in the decision.'],
  ['Promote', 'Claims rebuilt from S3, copies made writable.'],
  ['Restore VM', 'Velero rebuilds the VM on spoke-1.'],
  ['Switch placement', 'Decision gains spoke-1; old VM freezes.'],
  ['Manual cleanup', 'A person deletes the old VM and DataVolumes.'],
  ['Complete', 'Old VRG steps down, replication reverses, PeerReady True.'],
];

export const GLOSSARY_GRID: [string, string, string][] = [
  ['VirtualMachine', 'hammerdb-rhel9', 'workload'],
  ['DataVolume', 'hammerdb-rhel9-rootdisk', 'workload'],
  ['PersistentVolumeClaim', 'hammerdb-rhel9-datadisk', 'workload'],
  ['PowerStore replication session', '52001a43-4c9e-44c2-ad24-df241b86b69d', 'storage'],
  ['VolumeReplicationClass', 'powerstore-vrc-15m', 'storage'],
  ['VolumeReplication', 'hammerdb-rhel9-rootdisk', 'storage'],
  ['VolumeReplicationGroup', 'hammerdb-drpc', 'storage'],
  ['S3 bucket', 'ramen-metadata', 'backup'],
  ['Velero (OADP)', 'openshift-adp', 'backup'],
  ['DRPolicy', 'dr-policy-15m', 'DR control'],
  ['Placement', 'hammerdb-placement', 'DR control'],
  ['PlacementDecision', 'hammerdb-placement-decision-1', 'DR control'],
  ['DRPlacementControl', 'hammerdb-drpc', 'DR control'],
  ['ManifestWork', 'hammerdb-drpc-openshift-dr-ops-vrg-mw', 'delivery'],
  ['ManagedClusterView', 'hammerdb-drpc-openshift-dr-ops-vrg-mcv', 'delivery'],
];
const GORDER = ['workload', 'storage', 'backup', 'DR control', 'delivery'];
const GCOL: Record<string, string> = {workload: C.green, storage: C.amber, backup: C.s3, 'DR control': C.orange, delivery: C.cyan};

export const GLOSSARY_LAST = '1.17';

export const GlossaryScene: React.FC<PP & {card?: {kind: string; name: string; role: string}; def?: Def; id: string}> = ({f, dur, card, def, id}) => {
  const enter = prog(f, -20, 25);
  if (id === GLOSSARY_LAST) {
    return (
      <div style={{position: 'absolute', inset: 0, opacity: enter}}>
        <div style={{position: 'absolute', left: 110, top: 120, fontFamily: sans, fontSize: 40, fontWeight: 750, color: C.text}}>The whole cast</div>
        {GLOSSARY_GRID.map(([k, n, g], i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const a = prog(f, dur * (i * 0.025), dur * (i * 0.025) + 18);
          const gi = GORDER.indexOf(g);
          const hl = f > dur * (0.05 + gi * 0.09) && f < dur * (0.14 + gi * 0.09) ? 1 : 0;
          return (
            <Card
              key={k}
              x={90 + col * 350}
              y={200 + row * 215}
              w={325}
              kind={k}
              name={n}
              appear={a}
              hl={hl}
              color={GCOL[g]}
              nameSize={19}
              badge={<span style={{fontFamily: sans, fontSize: 14, color: GCOL[g], background: C.bg, padding: '2px 8px', borderRadius: 8, border: `1px solid ${GCOL[g]}`}}>{g}</span>}
            />
          );
        })}
      </div>
    );
  }
  if (!card || !def) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: enter}}>
      <div style={{position: 'absolute', left: 110, top: 125, fontFamily: mono, fontSize: 18, letterSpacing: 3, color: C.purple}}>CAST OF CHARACTERS · {id.split('.')[1]} OF 16</div>
      <Card x={110} y={250} w={660} kind={card.kind} name={card.name} role={card.role} appear={prog(f, -10, 30)} hl={0.6} nameSize={card.name.length > 30 ? 26 : 34} />
      <GlossaryPanel d={def} p={prog(f, dur * 0.05, dur * 0.8)} x={860} y={240} w={980} />
    </div>
  );
};

export const PANEL_BEATS = new Set(['2.4', '2.5', '3.3', '3.6', '4.2', '4.3', '5.2', '7.4', '8.5', '9.2', '9.3', '12.3', '13.1', '13.4', '13.5']);

export const BeatPanel: React.FC<PP & {id: string}> = ({id, f, dur}) => {
  const w = (a: number, b: number) => win(f, dur, a, b);
  switch (id) {
    case '2.4':
      return <YamlPanel title="Placement hammerdb-placement (live object, excerpt)" appear={w(0.03, 0.97)} reveal={prog(f, 0, 40)} hl={[5]} x={900} y={178} w={980} lines={['kind: Placement', 'metadata:', '  name: hammerdb-placement', '  namespace: openshift-dr-ops', '  annotations:', '    cluster.open-cluster-management.io/experimental-scheduling-disable: "true"']} />;
    case '2.5':
      return <YamlPanel title="DRPlacementControl hammerdb-drpc (live spec, excerpt)" appear={w(0.03, 0.97)} reveal={prog(f, 0, 50)} hl={[7, 8, 11, 12]} x={900} y={178} w={980} lines={['kind: DRPlacementControl', 'metadata: {name: hammerdb-drpc, namespace: openshift-dr-ops}', 'spec:', '  drPolicyRef: {kind: DRPolicy, name: dr-policy-15m}', '  placementRef: {name: hammerdb-placement, namespace: openshift-dr-ops}', '  preferredCluster: spoke-0', '  pvcSelector: {}', '  protectedNamespaces:', '  - hammerdb', '  kubeObjectProtection:', '    kubeObjectSelector: {}', '    captureInterval: 15m0s']} />;
    case '3.3':
      return <YamlPanel title="VolumeReplication (created by the VRG, spec excerpt)" appear={w(0.55, 0.98)} reveal={prog(f, dur * 0.55, dur * 0.55 + 40)} hl={[6, 7]} x={900} y={178} w={980} lines={['kind: VolumeReplication', 'metadata: {name: hammerdb-rhel9-rootdisk, namespace: hammerdb}', 'spec:', '  dataSource:', '    kind: PersistentVolumeClaim', '    name: hammerdb-rhel9-rootdisk', '  replicationState: primary', '  volumeReplicationClass: powerstore-vrc-15m']} />;
    case '3.6':
      return (
        <Frame a={w(0.45, 0.98)} title="Velero archive contents (read back before the run)">
          {[
            ['VirtualMachine', 'hammerdb-rhel9'],
            ['DataVolume', 'hammerdb-rhel9-rootdisk'],
            ['DataVolume', 'hammerdb-rhel9-datadisk'],
            ['Secret', 'cloudinit-hammerdb'],
          ].map(([k, n], i) => (
            <Row key={n} a={at(f, dur, 0.5 + i * 0.07)}>
              <span style={{color: C.dim, display: 'inline-block', width: 230}}>{k}</span>
              <M>{n}</M>
            </Row>
          ))}
          <Row a={at(f, dur, 0.85)} size={20} color={C.faint}>Both archive copies found in MinIO. Secret values were not printed.</Row>
        </Frame>
      );
    case '4.2':
      return (
        <Frame a={w(0.02, 0.98)} title="Baseline inventory · 13:53:45 UTC">
          {[
            ['hammerdb-rhel9-rootdisk', '52001a43-4c9e-44c2-ad24-df241b86b69d', '13:51:26'],
            ['hammerdb-rhel9-datadisk', 'f98a3cde-a18e-46d0-b298-1efb8d1bc417', '13:50:26'],
          ].map(([pvc, sess, t], i) => (
            <div key={pvc} style={{marginTop: 22, opacity: at(f, dur, 0.15 + i * 0.25)}}>
              <div style={{fontFamily: mono, fontSize: 24}}>{pvc}</div>
              <div style={{fontFamily: mono, fontSize: 19, color: C.dim, marginTop: 6}}>session {sess}</div>
              <div style={{fontSize: 24, marginTop: 6}}>
                state <span style={{color: C.green}}>OK</span> · no error · last sync <M color={C.green}>{t}</M>
              </div>
            </div>
          ))}
          <Row a={at(f, dur, 0.75)}>VSA-A <span style={{color: C.green}}>Source</span> · VSA-B <span style={{color: C.amber}}>Destination</span></Row>
        </Frame>
      );
    case '4.3':
      return (
        <Frame a={w(0.02, 0.98)} title="Inside the source guest · 13:51:34 UTC">
          <Row a={at(f, dur, 0.1)}><M>ramendr-postgresql.service</M> <span style={{color: C.green}}>active</span></Row>
          <Row a={at(f, dur, 0.22)}><M>ramendr-dr-hammerdb.service</M> <span style={{color: C.amber}}>inactive · disabled</span></Row>
          <Row a={at(f, dur, 0.4)}>order-sequence sum <M>8,482,937</M></Row>
          <Row a={at(f, dur, 0.55)}>newest history row <M>2026-09-29 10:15:11 -04</M></Row>
          <Row a={at(f, dur, 0.78)} size={30} color={C.amber}>Recovery of a quiet database, not an RPO-gap test</Row>
        </Frame>
      );
    case '5.2':
      return <YamlPanel title="DRPlacementControl · fields the console sets (excerpt)" appear={w(0.03, 0.97)} reveal={prog(f, 0, 40)} hl={[5, 6]} x={900} y={178} w={980} lines={['kind: DRPlacementControl', 'metadata:', '  name: hammerdb-drpc', '  namespace: openshift-dr-ops', 'spec:', '  action: Failover', '  failoverCluster: spoke-1', '  preferredCluster: spoke-0']} />;
    case '7.4':
      return (
        <Frame a={w(0.02, 0.98)} title="Recorded after promotion · claims use the VSA-B copies">
          {[
            ['hammerdb-rhel9-rootdisk', 'b78834ea-f1ba-4e08-9770-335a626c708a', '79a21ec8-a12a-4eca-9f26-c5c8a5e6edbf/PSff392f423bd6/scsi'],
            ['hammerdb-rhel9-datadisk', 'ac6dcaf0-52fb-4ba9-b99c-e263b32f52cf', 'd8c237c7-bec9-4b03-8019-a6b374db6e5c/PSff392f423bd6/scsi'],
          ].map(([pvc, src, dst], i) => (
            <div key={pvc} style={{marginTop: 22, opacity: at(f, dur, 0.15 + i * 0.25), fontFamily: mono, fontSize: 20}}>
              <div style={{color: C.text, fontSize: 24}}>{pvc}</div>
              <div style={{color: C.red, marginTop: 6}}>VSA-A Destination · {src}</div>
              <div style={{color: C.green, marginTop: 6, overflowWrap: 'anywhere'}}>VSA-B handle · {dst}</div>
            </div>
          ))}
        </Frame>
      );
    case '8.5':
      return (
        <Frame a={w(0.02, 0.98)} title="Inside the recovered guest (spoke-1) · 14:01:16 UTC">
          <Row a={at(f, dur, 0.1)}><M>ramendr-postgresql.service</M> <span style={{color: C.green}}>active</span></Row>
          <Row a={at(f, dur, 0.22)}><M>ramendr-dr-hammerdb.service</M> <span style={{color: C.amber}}>inactive · disabled (as before)</span></Row>
          <Row a={at(f, dur, 0.4)}>order-sequence sum <M color={C.green}>8,482,937</M> · matches</Row>
        </Frame>
      );
    case '9.2':
      return (
        <Frame a={w(0.02, 0.98)} title="Source worker kernel log · spoke-0 worker-2">
          <div style={{marginTop: 18, fontFamily: mono, fontSize: 19, color: C.dim, lineHeight: 1.5, opacity: at(f, dur, 0.15)}}>
            Oct 05 13:57:36 worker-2 kernel: nvme0c0n5: Write(0x1) @ LBA 11794704, 2 blocks, <span style={{color: C.red}}>Attempted Write to Read Only Range</span> (sct 0x1 / sc 0x82) DNR
          </div>
          <Row a={at(f, dur, 0.55)}>Namespace NGUID <M>8c55336eaeb399718ccf0968007b76f4</M></Row>
          <Row a={at(f, dur, 0.7)}>= VSA-A volume <M>csivol-841ca78019</M> · <span style={{color: C.red}}>is_replication_destination: true</span></Row>
          <Row a={at(f, dur, 0.85)} size={21} color={C.dim}>Both NVMe/TCP paths stayed live: the array refused the write, the network was fine.</Row>
        </Frame>
      );
    case '9.3':
      return (
        <>
          <YamlPanel title="Running domain on spoke-0 (virsh dumpxml, parsed attributes)" appear={w(0.03, 0.97)} reveal={prog(f, 0, 30)} hl={[0, 1]} x={900} y={178} w={980} lines={['vda: source /dev/rootdisk, driver error_policy=stop', 'vdb: source /dev/datadisk, driver error_policy=stop', '', 'virsh domstate --reason', '  paused (I/O error)']} />
          <Frame a={w(0.45, 0.97)} title="Paused vs powered off" y={520}>
            <Row a={at(f, dur, 0.5)}><b>Paused:</b> process and memory kept, guest CPU stopped</Row>
            <Row a={at(f, dur, 0.62)}><b>Powered off:</b> running state gone, a restart means a boot</Row>
          </Frame>
        </>
      );
    case '12.3':
      return (
        <Frame a={w(0.02, 0.98)} title="Two different durations">
          <div style={{display: 'flex', gap: 30, marginTop: 24}}>
            {[
              ['Click to target VM Running', '~1 min', C.green, '13:57:26 to 13:58:28'],
              ['Recorded DRPC duration', '1h 44m 50s', C.amber, '13:57:26 to ~15:42:17'],
            ].map(([k, v, col, sub], i) => (
              <div key={k} style={{flex: 1, padding: 20, border: `2px solid ${col}`, borderRadius: 14, opacity: at(f, dur, 0.08 + i * 0.25)}}>
                <div style={{fontSize: 21, color: C.dim}}>{k}</div>
                <div style={{fontFamily: mono, fontSize: 52, fontWeight: 600, color: col}}>{v}</div>
                <div style={{fontFamily: mono, fontSize: 18, color: C.dim}}>{sub}</div>
              </div>
            ))}
          </div>
          <Row a={at(f, dur, 0.6)} color={C.amber}>Includes about 1.5 h of deliberate waiting for investigation and cleanup approval</Row>
        </Frame>
      );
    case '13.1':
      return (
        <Frame a={w(0.02, 0.98)} title="Recovered guest on spoke-1 · after completion">
          <Row a={at(f, dur, 0.1)}>15:44:22 · order-sequence sum <M color={C.green}>8,482,937</M></Row>
          <Row a={at(f, dur, 0.25)}>15:44:53 · order-sequence sum <M color={C.green}>8,482,937</M></Row>
          <Row a={at(f, dur, 0.45)}>newest history row <M>2026-09-29 10:15:11 -04</M></Row>
          <Row a={at(f, dur, 0.6)}>history rows since 2026-10-05 13:40 UTC: <M>0</M></Row>
          <Row a={at(f, dur, 0.8)} size={21} color={C.dim}>An order-sequence sum, not an exact transaction count.</Row>
        </Frame>
      );
    case '13.4':
    case '13.5': {
      const base = id === '13.4' ? 0 : 5;
      const n = id === '13.4' ? 5 : 4;
      return (
        <Frame a={id === '13.4' ? w(0.02, 1.2) : w(-0.2, 0.98)} title="Full chain recap">
          {RECAP.map(([k, v], i) => {
            const on = i >= base && i < base + n && f > dur * (0.08 + (i - base) * (0.85 / n));
            const done = i < base || (on && f > dur * (0.08 + (i - base + 1) * (0.85 / n)));
            return (
              <div key={k} style={{display: 'flex', gap: 16, marginTop: 12, fontSize: 23, opacity: i < base + n ? 1 : 0.35}}>
                <span style={{flex: 'none', width: 250, fontWeight: 700, color: on && !done ? C.blue : done ? C.text : C.faint}}>{i + 1}. {k}</span>
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

/** Closing result card (13.6). */
export const ResultCard: React.FC<PP> = ({f, dur}) => {
  const a = Math.min(prog(f, 0, 30), 1 - prog(f, dur * 1.05, dur * 1.1));
  const items: [string, string, string][] = [
    ['Click to target VM Running', '~1 min', C.green],
    ['Source VM', 'paused', C.red],
    ['Source cleanup', 'manual', C.amber],
    ['Order sum before = after', '8,482,937', C.blue],
  ];
  return a > 0 ? (
    <div style={{position: 'absolute', left: 200, right: 200, top: 300, opacity: a, padding: 40, background: `${C.bg}f2`, border: `2px solid ${C.green}`, borderRadius: 20, fontFamily: sans, boxShadow: '0 30px 80px #000d'}}>
      <div style={{fontSize: 22, letterSpacing: 3, color: C.green, fontWeight: 700}}>RECORDED RESULT · 2026-10-05 · SPOKE-0 TO SPOKE-1</div>
      <div style={{display: 'flex', gap: 24, marginTop: 30}}>
        {items.map(([k, v, col], i) => (
          <div key={k} style={{flex: 1, opacity: prog(f, dur * (0.08 + i * 0.12), dur * (0.08 + i * 0.12) + 20)}}>
            <div style={{fontFamily: mono, fontSize: 54, fontWeight: 700, color: col}}>{v}</div>
            <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize: 26, color: C.text, marginTop: 34, opacity: prog(f, dur * 0.6, dur * 0.6 + 20)}}>FailedOver / Completed. Writer was off: recovery proven, data loss under load not measured.</div>
    </div>
  ) : null;
};
