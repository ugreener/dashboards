import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES_EF = ['Start', 'Cast', 'Policy', 'Enroll', 'Handoff', 'Array', 'Protected', 'Evidence'];

export const PANEL_ONLY = new Set(['2.2', '6.3', '7.1', '7.3']);

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string}> = {
  '2.2': {
    title: 'One interval, one match per spoke',
    rows: [
      'The policy asks for 900 seconds.',
      'Each spoke must hold a class with the same interval and the Dell driver.',
      'If nothing matches, no work order is built for that disk.',
      'The policy can still report Validated=true.',
    ],
    color: C.amber,
  },
  '6.3': {
    title: 'The recorded enrollment result',
    rows: [
      'Within about two minutes: Available=true, PeerReady=true, Protected=true.',
      'Spoke-0 VRG: Primary with DataReady, DataProtected and ClusterDataProtected true.',
      'Two VolumeReplications existed, both using powerstore-vrc-15m.',
      'VSA-A: sessions state OK, role Source. VSA-B: two replica volumes.',
      'Recorded through an apply, in the historical application namespace.',
    ],
    color: C.green,
  },
  '7.1': {
    title: 'Three kinds of claim',
    rows: [
      'Observed: the object chain, the conditions, and the array sessions.',
      'Documented: the console namespace rule, the field requirements, and the driver path.',
      'Unverified: the form steps, the first-copy timeline, and the condition timing.',
      'Only the first is a recording from this run.',
    ],
    color: C.purple,
  },
  '7.3': {
    title: 'Before you trust the word Protected',
    rows: [
      'The policy is validated, and a class matched on both spokes.',
      'The DRPC reports Protected=true.',
      'The VRG reports DataReady and ClusterDataReady true.',
      'Every disk has a VolumeReplication, and every session is OK.',
      'The array job history shows a recent completed copy.',
    ],
    color: C.green,
  },
};
export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = PANEL_DATA[id];
  if (!d) return null;
  const wide = PANEL_ONLY.has(id);
  const a = prog(f, 0, 24);
  return (
    <div
      style={{
        position: 'absolute',
        left: wide ? 230 : 900,
        top: 200,
        width: wide ? 1460 : 950,
        padding: 34,
        border: `2px solid ${d.color ?? C.blue}`,
        borderRadius: 20,
        background: `${C.bg}f5`,
        opacity: a,
        fontFamily: sans,
        boxShadow: '0 20px 70px #000c',
      }}
    >
      <div style={{fontSize: 31, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 22}}>{d.title}</div>
      {d.rows.map((r, i) => {
        const at = dur * (0.03 + i * 0.055);
        const p = prog(f, at, at + 22);
        return (
          <div
            key={i}
            style={{
              marginTop: 18,
              fontSize: wide ? 27 : 25,
              lineHeight: 1.38,
              color: C.text,
              opacity: p,
              transform: `translateX(${(1 - p) * 22}px)`,
              overflowWrap: 'break-word',
            }}
          >
            {r}
          </div>
        );
      })}
    </div>
  );
};

const SeriesTile: React.FC<{title: string; x: number; y: number; a: number}> = ({title, x, y, a}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 420, padding: '14px 18px', border: `1.5px solid ${C.border}`, borderLeft: `5px solid ${C.green}`, borderRadius: 10, background: C.panel, opacity: a, fontFamily: sans}}>
    <div style={{fontSize: 19, color: C.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{title}</div>
    <div style={{fontSize: 15, color: C.green, marginTop: 4}}>opens at Protected=true</div>
  </div>
);

export const ColdOpen: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  if (id === '0.1') {
    const titles = [
      'VIRTDR-291 discovered failover',
      'VIRTDR-292 managed failover',
      'VIRTDR-307 the stalled VGR failover',
      'VIRTDR-334 the reprotection window',
      'VIRTDR-337 the 72-hour cascade',
      'VIRTDR-342 site-down failover',
      'VIRTDR-343 relocate home',
      'cleanup and reprotect',
      'the peer array gate',
      'the placeholder backup gate',
      'stop protection',
      'CSI layers',
      'CSI with vendors',
      'the Zerto primer',
    ];
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 90, top: 110, fontSize: 40, fontWeight: 700, color: C.text, opacity: prog(f, 0, 24)}}>Every video starts after the first step</div>
        {titles.map((t, i) => (
          <SeriesTile key={t} title={t} x={90 + (i % 4) * 445} y={220 + Math.floor(i / 4) * 92} a={prog(f, 8 + i * 2, 28 + i * 2)} />
        ))}
        <div style={{position: 'absolute', left: 90, top: 620, fontSize: 34, color: C.amber, fontWeight: 700, opacity: prog(f, dur * 0.55, dur * 0.55 + 26)}}>but how did the application become Protected?</div>
        <div style={{position: 'absolute', left: 90, top: 690, fontSize: 26, color: C.dim, opacity: prog(f, dur * 0.68, dur * 0.68 + 26)}}>None of them shows the enrollment that produced the badge.</div>
      </div>
    );
  }
  if (id === '0.2')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 120, top: 220, width: 500, padding: 30, border: `2px solid ${C.green}`, borderRadius: 18, background: `${C.green}10`, opacity: prog(f, 0, 24)}}>
          <div style={{fontSize: 22, letterSpacing: 1.4, color: C.green, fontWeight: 700}}>RUNNING</div>
          <div style={{fontFamily: mono, fontSize: 30, color: C.text, marginTop: 10}}>hammerdb-rhel9</div>
          <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>a database VM with two disks</div>
        </div>
        {[
          ['pair two sites', 700, 200],
          ['record the application', 700, 320],
          ['copy its disks', 700, 440],
          ['report the copy is ready', 700, 560],
        ].map(([t, x, y], i) => (
          <div key={t} style={{position: 'absolute', left: Number(x), top: Number(y), width: 520, padding: '18px 24px', border: `2px dashed ${C.faint}`, borderRadius: 14, background: `${C.faint}0a`, color: C.dim, fontSize: 26, opacity: prog(f, dur * (0.15 + i * 0.08), dur * (0.15 + i * 0.08) + 24)}}>
            {t}
          </div>
        ))}
        <div style={{position: 'absolute', left: 1300, top: 330, width: 470, padding: 34, border: `3px solid ${C.cyan}`, borderRadius: 20, background: `${C.cyan}12`, opacity: prog(f, dur * 0.55, dur * 0.55 + 26)}}>
          <div style={{fontSize: 22, letterSpacing: 1.4, color: C.cyan, fontWeight: 700}}>THE NAME FOR THIS</div>
          <div style={{fontSize: 46, color: C.text, fontWeight: 700, marginTop: 12}}>enrollment</div>
        </div>
      </div>
    );
  if (id === '0.3')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 120, top: 210, width: 620, padding: 34, border: `2px solid ${C.green}`, borderRadius: 20, background: `${C.green}10`, opacity: prog(f, 0, 24)}}>
          <div style={{fontSize: 22, letterSpacing: 1.4, color: C.green, fontWeight: 700}}>RECORDED ON THE DELL LAB</div>
          <div style={{fontSize: 36, color: C.text, marginTop: 12}}>Protected in about two minutes</div>
          <div style={{fontSize: 24, color: C.dim, marginTop: 14, lineHeight: 1.45}}>Three DRPC conditions, a Primary VRG, two work orders and four array sessions.</div>
        </div>
        <div style={{position: 'absolute', left: 850, top: 230, width: 900, padding: 34, border: `2px dashed ${C.amber}`, borderRadius: 20, background: `${C.amber}0d`, opacity: prog(f, dur * 0.4, dur * 0.4 + 26)}}>
          <div style={{fontSize: 22, letterSpacing: 1.4, color: C.amber, fontWeight: 700}}>NOT RECORDED</div>
          <div style={{fontSize: 30, color: C.text, marginTop: 12, lineHeight: 1.4}}>The console form, the timestamps of each object, and the first-copy progress.</div>
          <div style={{fontSize: 24, color: C.dim, marginTop: 12}}>The video labels those steps as documented, not observed.</div>
        </div>
      </div>
    );
  if (id === '0.4')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 150, top: 150, fontSize: 36, color: C.text, fontWeight: 700}}>What you will see</div>
        {['The policy that pairs the sites', 'The enrollment that records the application', 'The handoff to the spoke', 'The array order and the first copy', 'What the first Protected condition proves'].map((t, i) => {
          const p = prog(f, dur * (0.05 + i * 0.13), dur * (0.05 + i * 0.13) + 24);
          return (
            <div key={t} style={{position: 'absolute', left: 150, top: 270 + i * 105, display: 'flex', gap: 24, alignItems: 'center', opacity: p, transform: `translateX(${(1 - p) * 30}px)`}}>
              <div style={{width: 52, height: 52, borderRadius: 14, border: `2px solid ${C.cyan}`, color: C.cyan, fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
              <div style={{fontSize: 32, color: C.text}}>{t}</div>
            </div>
          );
        })}
      </div>
    );
  if (id === '0.5')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 200, top: 220, width: 1520, padding: 38, border: `2px solid ${C.purple}`, borderRadius: 22, background: `${C.purple}10`, opacity: prog(f, 0, 24)}}>
          <div style={{fontSize: 24, letterSpacing: 1.4, color: C.purple, fontWeight: 700}}>ABOUT THE EVIDENCE</div>
          <div style={{fontSize: 30, color: C.text, marginTop: 18, lineHeight: 1.5}}>The object chain, the conditions and the array sessions were recorded in the lab setup document.</div>
          <div style={{fontSize: 27, color: C.amber, marginTop: 18, lineHeight: 1.5}}>The console form and the first-copy timing were not. The video says which is which.</div>
        </div>
        <div style={{position: 'absolute', left: 200, top: 660, display: 'flex', gap: 18, opacity: prog(f, dur * 0.55, dur * 0.55 + 24)}}>
          {[
            ['OBSERVED', C.green],
            ['DOCUMENTED', C.blue],
            ['UNVERIFIED', C.amber],
          ].map(([t, c]) => (
            <div key={t} style={{padding: '10px 22px', borderRadius: 999, border: `2px solid ${c}`, color: c, fontSize: 22, fontWeight: 700}}>{t}</div>
          ))}
        </div>
      </div>
    );
  return null;
};

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.1')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 110, top: 170, width: 1500, fontSize: 40, color: C.text, fontWeight: 700, opacity: prog(f, 0, 24)}}>Four questions, one cast</div>
        <div style={{position: 'absolute', left: 110, top: 260, width: 1500, fontSize: 27, color: C.dim, lineHeight: 1.5, opacity: prog(f, 8, 34)}}>A record only works when every object answers one clear question. The whole chain is built from four of them.</div>
        {[
          ['Which sites may hold this application?', 'DRPolicy'],
          ['Which application is protected, and how?', 'DRPC and Placement'],
          ['Which site runs it now?', 'VRG on each spoke'],
          ['Which disk has a copy?', 'VolumeReplication and session'],
        ].map(([q, a], i) => {
          const p = prog(f, dur * (0.2 + i * 0.12), dur * (0.2 + i * 0.12) + 24);
          return (
            <div key={q} style={{position: 'absolute', left: 110, top: 390 + i * 120, width: 1700, display: 'flex', alignItems: 'center', gap: 26, opacity: p, transform: `translateX(${(1 - p) * 26}px)`}}>
              <div style={{width: 58, height: 58, borderRadius: 16, border: `2px solid ${C.cyan}`, color: C.cyan, fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
              <div style={{fontSize: 31, color: C.text, flex: 1}}>{q}</div>
              <div style={{fontFamily: mono, fontSize: 24, color: C.orange}}>{a}</div>
            </div>
          );
        })}
      </div>
    );
  if (!card || !def) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: prog(f, -20, 24)}}>
      <div style={{position: 'absolute', left: 100, top: 170, color: C.purple, fontFamily: mono, fontSize: 21}}>CAST OF CHARACTERS · {id.split('.')[1]}</div>
      <Card x={100} y={330} w={660} kind={card.kind} name={card.name} role={card.role} nameSize={29} appear={prog(f, -10, 24)} color={C.cyan} />
      <GlossaryPanel d={def} p={prog(f, dur * 0.03, dur * 0.75)} x={850} y={250} w={990} />
    </div>
  );
};

export const LegendEF: React.FC<{appear: number}> = ({appear}) => {
  const items: [string, string, boolean][] = [
    ['writes / owns', C.green, false],
    ['CSI call', C.cyan, false],
    ['reference', C.blue, true],
    ['copy', C.orange, true],
  ];
  return (
    <div style={{position: 'absolute', right: 36, top: 28, display: 'flex', gap: 20, transform: `translateY(${(1 - appear) * -16}px)`, opacity: appear, fontFamily: sans, fontSize: 17, color: C.dim, padding: '8px 16px', borderRadius: 10, background: `${C.bg}e6`, border: `1px solid ${C.border}`}}>
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
