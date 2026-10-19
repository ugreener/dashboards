import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES_CV = ['Shared half', 'Cast', 'Dell stack', 'Red Hat stack', 'One contract', 'Recap'];

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string}> = {
  '0.1': {title: 'CSI with vendors', rows: ['The companion diagram on the same board', 'Same four boxes on the left', 'Two real vendor stacks on the right: Dell and Red Hat', 'Same contracts, different machines'], color: C.cyan},
  '1.1': {title: 'The shared half', rows: ['The same cast as the three-layers diagram', 'Contract, extension, cluster-side software, orchestrator', 'One minute each, then on to the new half']},
  '1.6': {title: 'Now the new half', rows: ['Two complete vendor stacks', 'Three boxes each: extras, driver, storage', 'Dell: modules, driver, appliances', 'Red Hat: operator, driver, software storage']},
  '2.8': {title: 'So far: six new boxes', rows: ['Dell: CSM modules, csi-powerstore, PowerStore arrays', 'Red Hat: Rook, ceph-csi, a Ceph cluster', 'Every name is a real project on GitHub', 'Next: what connects the halves']},
  '3.1': {title: 'The Dell stack', rows: ['Modules connected to the driver', 'The driver pointing at the array', 'Accessories around a translator']},
  '3.4': {title: 'Board honesty notes', rows: ["Owen's builds: custom driver builds, not stock", 'Array identifiers are labels as drawn', 'Architecture, not a live inventory'], color: C.amber},
  '4.1': {title: 'The Red Hat stack', rows: ['No appliance at the bottom', 'Rook grows Ceph inside the cluster', 'Your machines run programs and store bytes']},
  '4.4': {title: 'Two stacks, same debts', rows: ['Differ below: appliance versus software', 'Differ in who builds the translator', 'Same contracts owed above']},
  '5.1': {title: 'The test: one contract, twice', rows: ['CSI implements-arrow into the Dell driver', 'CSI implements-arrow into the Ceph driver', 'One menu, honored by both']},
  '5.4': {title: 'What standards buy', rows: ['Vendors compete on machines and features', 'All answer the same menu of calls', 'Recovery logic above stays generic'], color: C.green},
  '6.3': {title: 'The whole picture', rows: ['Left: contracts and one consumer', 'Right: two interchangeable vendor stacks', 'Six cross arrows, zero exceptions', 'Not a report of any running cluster'], color: C.green},
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
  if (id === '2.1')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 110, top: 160, fontSize: 40, color: C.text, fontWeight: 700}}>Two stacks, three jobs each</div>
        <div style={{position: 'absolute', left: 110, top: 250, width: 1500, fontSize: 30, color: C.dim, lineHeight: 1.5, opacity: prog(f, 10, 40)}}>
          Extra vendor pieces around the driver. The driver, a contract translator. And the storage itself.
          Dell fills the three jobs with modules, a driver, and appliances. Red Hat fills them with an operator, a driver, and software storage.
        </div>
        {[['Dell', 'modules · driver · appliances', C.orange], ['Red Hat', 'operator · driver · software storage', C.red]].map(([name, role, col], i) => (
          <div key={name as string} style={{position: 'absolute', left: 110 + i * 810, top: 460, width: 760, minHeight: 220, padding: 30, border: `2px solid ${col as string}`, borderRadius: 18, background: C.panel, opacity: prog(f, dur * (0.1 + i * 0.14), dur * (0.1 + i * 0.14) + 24)}}>
            <div style={{fontSize: 34, color: col as string, fontWeight: 700}}>{name as string}</div>
            <div style={{fontSize: 27, color: C.text, lineHeight: 1.4, marginTop: 20}}>{role as string}</div>
          </div>
        ))}
      </div>
    );
  if (id === '2.8')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 110, top: 150, fontSize: 40, color: C.text, fontWeight: 700}}>Two stacks, six boxes</div>
        {[
          ['Dell CSM Replication', 'enterprise add-ons around the driver', C.orange],
          ['csi-powerstore', 'the Dell translator', C.orange],
          ['PowerStore Array', 'the storage appliances', C.orange],
          ['Rook', 'grows Ceph on the cluster', C.red],
          ['ceph-csi', 'the Ceph translator', C.red],
          ['Ceph Cluster', 'the software storage', C.red],
        ].map(([name, role, col], i) => (
          <div key={name as string} style={{position: 'absolute', left: 110 + (i % 2) * 380, top: 290 + Math.floor(i / 2) * 260, width: 350, minHeight: 220, padding: 24, border: `2px solid ${col as string}`, borderRadius: 18, background: C.panel, opacity: prog(f, dur * (0.03 + i * 0.08), dur * (0.03 + i * 0.08) + 24)}}>
            <div style={{fontSize: 26, color: col as string, fontWeight: 700}}>{name as string}</div>
            <div style={{fontSize: 22, color: C.text, lineHeight: 1.4, marginTop: 16}}>{role as string}</div>
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

export const LegendCV: React.FC<{appear: number}> = ({appear}) => {
  const items: [string, string, boolean][] = [
    ['extends', C.purple, true],
    ['implements', C.blue, false],
    ['implements (via sidecar)', C.blue, true],
    ['gRPC to sidecar', C.cyan, false],
    ['commands the array', C.orange, false],
    ["vendor's own link", C.dim, true],
  ];
  return (
    <div style={{position: 'absolute', right: 36, top: 28, display: 'flex', gap: 20, transform: `translateY(${(1 - appear) * -16}px)`, opacity: appear, fontFamily: sans, fontSize: 16, color: C.dim, padding: '8px 14px', borderRadius: 10, background: `${C.bg}e6`, border: `1px solid ${C.border}`}}>
      {items.map(([t, c, d]) => (
        <span key={t} style={{display: 'flex', alignItems: 'center', gap: 7}}>
          <svg width={28} height={10}>
            <line x1={0} y1={5} x2={28} y2={5} stroke={c} strokeWidth={3} strokeDasharray={d ? '5 5' : undefined} />
          </svg>
          {t}
        </span>
      ))}
    </div>
  );
};
