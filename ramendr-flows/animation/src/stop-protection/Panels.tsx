import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES_SP = ['Teardown', 'Cast', 'Two cleanups', 'Primary chain', 'Destination gap', 'Lab record', 'Fix', 'Evidence'];

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string}> = {
  '1.1': {
    title: 'One question, one cast',
    rows: [
      'Removing protection must delete a group of volumes on two arrays.',
      'A deletion happens because some object owns the handle and is deleted.',
      'So the whole video asks: which object holds the handle on each side?',
    ],
    color: C.cyan,
  },
  '1.11': {
    title: 'So far: the cast',
    rows: [
      'The DRPC is the hub ticket for one application.',
      'The VRG is the site manager, and its deletion starts the local cleanup.',
      'A VolumeReplication is one disk work order. A VolumeGroupReplication is one group switch.',
      'The VolumeGroupReplicationContent holds the group handle. DeleteVolumeGroup removes the group.',
      'Stop protection keeps the application. It removes the copy and the DR records.',
    ],
  },
  '2.5': {
    title: 'The bar upstream states',
    rows: [
      'After enable, then disable, both sides return to a pre replication state.',
      'The replication session is gone.',
      'The source volume group is deleted.',
      'The destination volume group is deleted, not left as an orphan.',
    ],
    color: C.amber,
  },
  '2.6': {
    title: 'So far: two cleanups',
    rows: [
      'Replication created a group on the source, and the array created one on the destination.',
      'The application, its claim and its data must survive.',
      'The session and both groups must go.',
      'The open question is not whether a group can be deleted. It is who holds its handle.',
    ],
  },
  '3.8': {
    title: 'So far: the primary chain',
    rows: [
      'The DRPC delete leads Ramen to delete the primary VRG.',
      'Deleting the VRG deletes the group replication and the group content.',
      'Those deletions produce DisableVolumeReplication and DeleteVolumeGroup.',
      'The source group is gone and the workload volume remains.',
    ],
    color: C.green,
  },
  '4.7': {
    title: 'So far: the destination gap',
    rows: [
      'The destination has no claims, so Ramen creates no group objects there.',
      'No group object means no delete call to that array.',
      'The replica volumes exist because the source created them.',
      'The cleanup chain fires only where the objects are.',
    ],
    color: C.amber,
  },
  '5.1': {
    title: 'Three ways to remove protection',
    rows: [
      'A. Atomic. Protected, then stop. Nothing has moved.',
      'B. After failover. Replication reversed and resynced, then stop.',
      'C. After relocate. Application back home, then stop.',
      'If all three leave the group, the cause is structural.',
    ],
  },
  '5.2': {
    title: 'Path A: atomic stop',
    rows: [
      'The application never moved.',
      'The source group is deleted and the session ends.',
      'The destination group remains on the array.',
    ],
  },
  '5.3': {
    title: 'Path B: after failover',
    rows: [
      'The application runs on the other site.',
      'Replication is reversed and resynced.',
      'Protection is removed.',
      'The orphan lands on whichever array is the destination at that moment.',
    ],
  },
  '5.4': {
    title: 'Path C: after relocate',
    rows: [
      'The application returns to its preferred site.',
      'Replication is reversed a second time.',
      'Protection is removed.',
      'Again the destination array keeps its group.',
    ],
  },
  '5.6': {
    title: 'Two earlier reports, corrected',
    rows: [
      'A DRPC stuck in Deleting was reported from older labs. It did not reproduce here.',
      'A circular dependency between a claim and its replication was reported. It did not reproduce either.',
      'Driver changes around the destination side refusal closed both.',
      'Do not repeat those reports as current behavior.',
    ],
    color: C.red,
  },
  '5.8': {
    title: 'So far: the lab record',
    rows: [
      'Three paths were run on the edge lab, with VSA-A and VSA-B.',
      'All three removed protection and kept the application.',
      'All three left the destination group behind.',
      'The finding is structural. The fix is a separate question.',
    ],
  },
  '6.2': {
    title: 'Why a secondary group object is unsafe',
    rows: [
      'On every reconcile, the controller rewrites the group volume list from the claim selector.',
      'It then calls ModifyVolumeGroupMembership with that list.',
      'On a destination with no claims, the list is empty.',
      'An empty modify can wipe the destination handles that were pre filled.',
    ],
    color: C.red,
  },
  '6.5': {
    title: 'A design question above the code',
    rows: [
      'Ramen already keeps a group object in secondary state for another product.',
      'Maintainers asked that new work unify with that mechanism.',
      'Two parallel paths would be harder to reason about than one.',
    ],
    color: C.purple,
  },
  '6.7': {
    title: 'So far: the fix',
    rows: [
      'A group object on both sides would give the destination a handle to delete.',
      'Creating one today is unsafe, because a secondary group object is treated as a local owner.',
      'The controller contract comes first, then the orchestration.',
      'Nothing in this chapter is shipped.',
    ],
    color: C.amber,
  },
  '7.1': {
    title: 'The boundary of the evidence',
    rows: [
      'Observed in the lab: protection removed, application intact, group left behind.',
      'Documented upstream: which object is missing, and why the chain does not fire.',
      'Not attached: a run log, a postcheck, or a screenshot.',
      'So the mechanism is documented, not recorded here.',
    ],
    color: C.amber,
  },
  '7.2': {
    title: 'Three kinds of claim',
    rows: [
      'Seen. Three paths, one orphan, on the edge lab.',
      'Documented. No claims means no group objects means no delete call.',
      'Proposed. A group object on both sides for the life of protection.',
      'Only the first is an observation. The other two are design.',
    ],
  },
  '7.4': {
    title: 'Is it an orphan, or a standby?',
    rows: [
      'The group exists on the destination array.',
      'No active volume handle uses it.',
      'No replication destination identifier names it.',
      'No replication session refers to it.',
      'Only when all four hold is it safe to call it an orphan.',
    ],
    color: C.green,
  },
};
export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  return (
    <div
      style={{
        position: 'absolute',
        left: 900,
        top: 225,
        width: 950,
        padding: 32,
        border: `2px solid ${d.color ?? C.blue}`,
        borderRadius: 20,
        background: `${C.bg}f5`,
        opacity: a,
        fontFamily: sans,
        boxShadow: '0 20px 70px #000c',
      }}
    >
      <div style={{fontSize: 29, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 20}}>{d.title}</div>
      {d.rows.map((r, i) => {
        const at = dur * (0.03 + i * 0.055);
        const p = prog(f, at, at + 22);
        return (
          <div
            key={i}
            style={{
              marginTop: 16,
              fontSize: 25,
              lineHeight: 1.35,
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

const Site: React.FC<{x: number; title: string; sub: string; color: string; a: number; children?: React.ReactNode}> = ({x, title, sub, color, a, children}) => (
  <div style={{position: 'absolute', left: x, top: 250, width: 760, height: 470, border: `2.5px solid ${color}aa`, borderRadius: 22, background: `linear-gradient(160deg,${color}14,${C.bg2}cc 40%)`, opacity: a}}>
    <div style={{position: 'absolute', left: 24, top: -22, padding: '6px 16px', borderRadius: 999, background: C.bg, border: `2px solid ${color}`, color, fontWeight: 700, fontSize: 27}}>
      {title} <span style={{color: C.dim, fontWeight: 500, fontSize: 21, marginLeft: 10}}>{sub}</span>
    </div>
    {children}
  </div>
);

export const ColdOpen: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  if (id === '0.1')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 90, top: 120, fontSize: 40, fontWeight: 700, color: C.text, opacity: prog(f, 0, 25)}}>Remove protection, keep the application</div>
        <Site x={90} title="PRIMARY SITE" sub="application running" color={C.green} a={prog(f, dur * 0.12, dur * 0.12 + 26)}>
          <div style={{position: 'absolute', left: 40, top: 70, width: 300, padding: 20, border: `2px solid ${C.green}`, borderRadius: 14, background: C.panel, fontSize: 25, color: C.text}}>VirtualMachine</div>
          <div style={{position: 'absolute', left: 40, top: 160, width: 300, padding: 20, border: `2px solid ${C.dim}`, borderRadius: 14, background: C.panel, fontSize: 23, color: C.dim}}>claim, still bound</div>
          <div style={{position: 'absolute', left: 40, top: 250, width: 300, padding: 20, border: `2px solid ${C.orange}`, borderRadius: 14, background: C.panel, fontSize: 23, color: C.orange}}>volume on VSA-A</div>
          <div style={{position: 'absolute', left: 400, top: 70, width: 320, padding: 22, border: `2px dashed ${C.blue}`, borderRadius: 14, background: `${C.blue}12`, fontSize: 22, color: C.blue, opacity: prog(f, dur * 0.55, dur * 0.55 + 26)}}>DR records removed</div>
        </Site>
        <Site x={1060} title="SECOND SITE" sub="standby copy" color={C.orange} a={prog(f, dur * 0.3, dur * 0.3 + 26)}>
          <div style={{position: 'absolute', left: 40, top: 70, width: 300, padding: 20, border: `2px solid ${C.dim}`, borderRadius: 14, background: C.panel, fontSize: 23, color: C.dim}}>replica volumes</div>
          <div style={{position: 'absolute', left: 40, top: 170, width: 660, padding: 24, border: `3px solid ${C.red}`, borderRadius: 14, background: `${C.red}14`, fontSize: 27, color: C.red, opacity: prog(f, dur * 0.62, dur * 0.62 + 26)}}>
            volume group still on VSA-B
            <div style={{fontSize: 21, color: C.dim, marginTop: 10}}>nothing left in the cluster names it</div>
          </div>
        </Site>
      </div>
    );
  if (id === '0.2')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 120, top: 260, width: 760, padding: 34, border: `3px solid ${C.red}`, borderRadius: 22, background: `${C.red}12`, opacity: prog(f, 0, 24)}}>
          <div style={{fontSize: 24, letterSpacing: 1.4, color: C.red, fontWeight: 700}}>DESTINATION ARRAY · VSA-B</div>
          <div style={{fontSize: 44, color: C.text, fontWeight: 700, marginTop: 16}}>volume group</div>
          <div style={{fontSize: 25, color: C.dim, marginTop: 12, lineHeight: 1.4}}>created by the array when the first copy started</div>
        </div>
        <div style={{position: 'absolute', left: 1000, top: 280, width: 780, fontSize: 30, lineHeight: 1.5, color: C.text, opacity: prog(f, dur * 0.4, dur * 0.4 + 26)}}>
          The teardown ran. The command was correct.
          <div style={{marginTop: 22, color: C.amber}}>The record that could delete this group was never made on this side.</div>
        </div>
      </div>
    );
  if (id === '0.3')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 110, top: 220, width: 800, padding: 30, border: `2px solid ${C.green}`, borderRadius: 20, background: `${C.green}10`, opacity: prog(f, 0, 24)}}>
          <div style={{fontSize: 23, color: C.green, fontWeight: 700}}>PROMISE KEPT</div>
          <div style={{fontSize: 27, color: C.text, marginTop: 14, lineHeight: 1.4}}>Application running. Data intact. DR configuration gone from both clusters.</div>
        </div>
        <div style={{position: 'absolute', left: 970, top: 220, width: 810, padding: 30, border: `2px solid ${C.red}`, borderRadius: 20, background: `${C.red}10`, opacity: prog(f, dur * 0.35, dur * 0.35 + 24)}}>
          <div style={{fontSize: 23, color: C.red, fontWeight: 700}}>PROMISE NOT KEPT</div>
          <div style={{fontSize: 27, color: C.text, marginTop: 14, lineHeight: 1.4}}>A volume group no application uses still occupies the destination array.</div>
        </div>
        <div style={{position: 'absolute', left: 110, top: 520, width: 1670, fontSize: 26, color: C.dim, lineHeight: 1.5, opacity: prog(f, dur * 0.6, dur * 0.6 + 26)}}>
          It costs capacity, and it confuses the next setup. This video follows the teardown, one handoff at a time.
        </div>
      </div>
    );
  if (id === '0.4')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 220, top: 250, width: 1480, padding: 40, border: `2px solid ${C.purple}`, borderRadius: 22, background: `${C.purple}10`, opacity: prog(f, 0, 24)}}>
          <div style={{fontSize: 24, letterSpacing: 1.4, color: C.purple, fontWeight: 700}}>ABOUT THE EVIDENCE</div>
          <div style={{fontSize: 30, color: C.text, marginTop: 20, lineHeight: 1.5}}>
            The stop protection scenarios were run in the lab and written up in the ticket. No logs and no screenshots were attached.
          </div>
          <div style={{fontSize: 27, color: C.amber, marginTop: 22, lineHeight: 1.5}}>
            Where a step comes from controller source or an upstream design issue, the video says so on screen.
          </div>
        </div>
        <div style={{position: 'absolute', left: 220, top: 640, display: 'flex', gap: 18, opacity: prog(f, dur * 0.55, dur * 0.55 + 24)}}>
          {[
            ['OBSERVED', C.green],
            ['DOCUMENTED', C.blue],
            ['PROPOSED', C.purple],
          ].map(([t, c]) => (
            <div key={t} style={{padding: '10px 20px', borderRadius: 999, border: `2px solid ${c}`, color: c, fontSize: 22, fontWeight: 700}}>{t}</div>
          ))}
        </div>
      </div>
    );
  if (id === '0.5')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 150, top: 170, fontSize: 34, color: C.text, fontWeight: 700}}>What you will see</div>
        {['The objects that do the deleting', 'The side where the chain fires', 'The side where it has nothing to fire', 'Three paths to the same orphan', 'The fix that is still argued upstream'].map((t, i) => {
          const p = prog(f, dur * (0.05 + i * 0.13), dur * (0.05 + i * 0.13) + 24);
          return (
            <div key={t} style={{position: 'absolute', left: 150, top: 280 + i * 105, display: 'flex', gap: 24, alignItems: 'center', opacity: p, transform: `translateX(${(1 - p) * 30}px)`}}>
              <div style={{width: 52, height: 52, borderRadius: 14, border: `2px solid ${C.cyan}`, color: C.cyan, fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
              <div style={{fontSize: 32, color: C.text}}>{t}</div>
            </div>
          );
        })}
      </div>
    );
  return null;
};

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.1')
    return (
      <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
        <div style={{position: 'absolute', left: 110, top: 190, width: 1500, fontSize: 40, color: C.text, fontWeight: 700, opacity: prog(f, 0, 24)}}>One question, one cast</div>
        <div style={{position: 'absolute', left: 110, top: 290, width: 1450, fontSize: 29, color: C.dim, lineHeight: 1.5, opacity: prog(f, 8, 34)}}>
          Removing protection must delete a group of volumes on two arrays. A deletion happens because some object owns the handle and is deleted. So the whole video asks one question.
        </div>
        <div style={{position: 'absolute', left: 110, top: 520, width: 1700, padding: 34, border: `2px solid ${C.cyan}`, borderRadius: 20, background: `${C.cyan}0d`, fontSize: 38, color: C.cyan, fontWeight: 700, opacity: prog(f, dur * 0.45, dur * 0.45 + 26)}}>
          Which object holds the group handle on each side?
        </div>
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

export const LegendSP: React.FC<{appear: number}> = ({appear}) => {
  const items: [string, string, boolean][] = [
    ['owns / deletes', C.green, false],
    ['CSI call', C.cyan, false],
    ['replication', C.orange, true],
    ['absent', C.faint, true],
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
