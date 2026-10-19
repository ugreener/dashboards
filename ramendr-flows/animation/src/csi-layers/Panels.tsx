import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES_CL = ['Cast', 'Contract', 'Extension', 'Cluster side', 'Consumer', 'Recap'];

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string}> = {
  '0.1': {title: 'Three layers of CSI', rows: ['A diagram explainer from the RamenDR board', 'Five boxes, six arrows, no prior knowledge needed', 'Contracts, translators, and one recovery conductor'], color: C.cyan},
  '3.1': {title: 'Why a contract at all?', rows: ['Kubernetes must give every program its disks.', 'Dozens of vendors, each with a private language.', 'Nobody wants N-times-N one-off integrations.', 'One shared contract: write it once, honor it everywhere.']},
  '3.4': {title: 'So far: layer one', rows: ['CSI: the standard menu of storage requests.', 'Drivers: one translator per vendor.', 'Kubernetes never learns a vendor language.', 'Missing: any request about copies of a disk.']},
  '4.1': {title: 'The gap CSI left open', rows: ['Plain CSI: create, attach, expand, delete.', 'No copy-disk, no keep-fresh, no promote-copy.', 'Disaster recovery lives on exactly those requests.'], color: C.amber},
  '4.4': {title: 'So far: layer two', rows: ['csi-addons extends the CSI contract.', 'Replication requests join the menu.', 'Drivers opt in via an add-ons sidecar.', 'Still missing: a cluster-side caller.']},
  '5.1': {title: 'Who places the extended calls?', rows: ['Driver sidecars can now receive requests.', 'Someone in the cluster must send them.', 'Accept the job, find the driver, speak add-ons.']},
  '5.4': {title: 'So far: layer three', rows: ['kubernetes-csi-addons: controller plus sidecars.', 'gRPC phone lines into every driver sidecar.', 'Both ends of the extension now speak.', 'Missing: a decision maker.']},
  '6.4': {title: 'So far: the consumer', rows: ['Ramen decides when copies must switch.', 'It asks kubernetes-csi-addons, nothing lower.', 'The whole stack answers one caller.']},
  '7.3': {title: 'The whole picture', rows: ['CSI: the base contract.', 'csi-addons: the extension.', 'kubernetes-csi-addons and the driver sidecars: the implementations.', 'Ramen: the consumer that triggers recovery.', 'Every arrow is a handoff between two neighbors.'], color: C.green},
};
export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  const cold = id === '0.1';
  return (
    <div style={{position: 'absolute', left: cold ? 170 : 900, top: cold ? 290 : 220, width: cold ? 1580 : 950, padding: 32, border: `2px solid ${d.color ?? C.blue}`, borderRadius: 20, background: `${C.bg}f5`, opacity: a, fontFamily: sans, boxShadow: '0 20px 70px #000c'}}>
      <div style={{fontSize: cold ? 48 : 29, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 24}}>{d.title}</div>
      {d.rows.map((r, i) => (
        <div key={i} style={{marginTop: 18, fontSize: cold ? 34 : 25, lineHeight: 1.35, color: C.text, opacity: prog(f, dur * (0.03 + i * 0.055), dur * (0.03 + i * 0.055) + 22), transform: `translateX(${(1 - prog(f, dur * (0.03 + i * 0.055), dur * (0.03 + i * 0.055) + 22)) * 22}px)`, overflowWrap: 'break-word'}}>{r}</div>
      ))}
    </div>
  );
};

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.1')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 110, top: 160, fontSize: 40, color: C.text, fontWeight: 700}}>Five ideas before the diagram</div>
        <div style={{position: 'absolute', left: 110, top: 250, width: 1400, fontSize: 30, color: C.dim, lineHeight: 1.5, opacity: prog(f, 10, 40)}}>
          Containers, Kubernetes, volumes, storage systems, drivers, specifications, and the CNCF.
          One plain sentence each, so every name in the diagram already has a meaning.
        </div>
        {['Container', 'Kubernetes', 'Volume', 'Storage system', 'Driver', 'Specification', 'CNCF'].map((t, i) => (
          <div key={t} style={{position: 'absolute', left: 110 + (i % 4) * 440, top: 420 + Math.floor(i / 4) * 300, width: 400, minHeight: 200, padding: 26, border: `2px solid ${C.purple}`, borderRadius: 18, background: C.panel, opacity: prog(f, dur * (0.04 + i * 0.08), dur * (0.04 + i * 0.08) + 24)}}>
            <div style={{fontSize: 30, color: C.purple, fontWeight: 700}}>{t}</div>
            <div style={{fontSize: 24, color: C.dim, marginTop: 16, lineHeight: 1.35}}>defined next, one per beat</div>
          </div>
        ))}
      </div>
    );
  if (id === '2.1')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 110, top: 170, fontSize: 40, color: C.text, fontWeight: 700}}>Meet the five boxes</div>
        <div style={{position: 'absolute', left: 110, top: 260, width: 1500, fontSize: 30, color: C.dim, lineHeight: 1.5, opacity: prog(f, 10, 40)}}>
          Every box is a real project on GitHub. Every arrow is one relationship. Four community contracts or programs, one group of vendor drivers, and one recovery coordinator.
        </div>
      </div>
    );
  if (id === '2.7')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 110, top: 150, fontSize: 40, color: C.text, fontWeight: 700}}>Five boxes, five jobs</div>
        {[
          ['CSI spec', 'the standard contract'],
          ['csi-addons spec', 'the extension'],
          ['kubernetes-csi-addons', 'the cluster-side speaker'],
          ['CSI drivers', 'the vendor-side speakers'],
          ['Ramen', 'the consumer'],
        ].map(([name, role], i) => (
          <div key={name} style={{position: 'absolute', left: 110 + (i % 3) * 585, top: 290 + Math.floor(i / 3) * 280, width: 540, minHeight: 210, padding: 28, border: `2px solid ${C.cyan}`, borderRadius: 18, background: C.panel, opacity: prog(f, dur * (0.03 + i * 0.09), dur * (0.03 + i * 0.09) + 24)}}>
            <div style={{fontSize: 30, color: C.cyan, fontWeight: 700}}>{name}</div>
            <div style={{fontSize: 25, color: C.text, lineHeight: 1.4, marginTop: 20}}>{role}</div>
          </div>
        ))}
      </div>
    );
  if (!card || !def) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: prog(f, -20, 24)}}>
      <div style={{position: 'absolute', left: 100, top: 170, color: C.purple, fontFamily: mono, fontSize: 21}}>CAST OF CHARACTERS · {id.split('.')[1]}</div>
      <Card x={100} y={300} w={660} kind={card.kind} name={card.name} role={card.role} nameSize={29} appear={prog(f, -10, 24)} color={C.cyan} />
      <GlossaryPanel d={def} p={prog(f, dur * 0.03, dur * 0.75)} x={850} y={230} w={990} />
    </div>
  );
};

export const LegendCL: React.FC<{appear: number}> = ({appear}) => {
  const items: [string, string, boolean][] = [
    ['extends', C.purple, true],
    ['implements', C.blue, false],
    ['implements (via sidecar)', C.blue, true],
    ['calls gRPC', C.cyan, false],
    ['consumed by', C.green, false],
  ];
  return (
    <div style={{position: 'absolute', right: 36, top: 28, display: 'flex', gap: 22, transform: `translateY(${(1 - appear) * -16}px)`, opacity: appear, fontFamily: sans, fontSize: 17, color: C.dim, padding: '8px 16px', borderRadius: 10, background: `${C.bg}e6`, border: `1px solid ${C.border}`}}>
      {items.map(([t, c, d]) => (
        <span key={t} style={{display: 'flex', alignItems: 'center', gap: 7}}>
          <svg width={30} height={10}>
            <line x1={0} y1={5} x2={30} y2={5} stroke={c} strokeWidth={3} strokeDasharray={d ? '5 5' : undefined} />
          </svg>
          {t}
        </span>
      ))}
    </div>
  );
};
