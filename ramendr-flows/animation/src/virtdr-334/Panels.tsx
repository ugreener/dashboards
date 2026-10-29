import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const PHASES_334 = ['Steady state', 'Reversal', 'First copies', 'Silence', 'Other day', 'Gate'];

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string}> = {
  '0.1': {title: 'Seventeen minutes and thirty-two seconds', rows: ['The policy promised a copy every fifteen minutes.', 'One disk started its first new copy 17m 32s after reprotect.', 'The session stayed OK. No alert fired.', 'VIRTDR-334 · recorded 2026-10-07 · hub edge36'], color: C.red},
  '0.2': {title: 'The promise is about the gap', rows: ['Copy to copy, not click to click.', 'A reversal restarts the copy history.', 'The first copy after the reversal is the one nobody watches.'], color: C.cyan},
  '0.3': {title: 'One recorded run', rows: ['VIRTDR-292 run, 2026-10-07, Dell PowerStore lab', 'Managed app dell-vm-workload · VM hammerdb-rhel9', 'DRPC dell-vm-drpc · policy dr-policy-15m', 'Arrays VSA-A and VSA-B · hub edge36'], color: C.blue},

  '2.3': {title: 'Preflight · 13:15:58 UTC', rows: ['OVERALL PASS · 24 of 24 checks', '87 scheduled syncs per disk since creation', 'No failed sync jobs', 'Every gap under 900 seconds', 'The last two intervals carried HammerDB writes'], color: C.green},

  '4.4': {title: '13:42:28 · healthy and late', rows: ['Session state: OK, the array calls the session healthy.', 'Error code: none.', 'Last completed copy: 13:22:27.', 'Age at this moment: 20m 01s.', 'The promise: 900 seconds.', 'OK describes the session, not the age of the copy.'], color: C.red},

  '5.1': {title: 'Array alerts · 13:20 to 14:04', rows: ['13:26:45 Info · root volume operating normally', '13:26:45 Info · data volume operating normally', '13:33 Minor · licensing retrieval failed', '14:03 Info · licence trial expires 2026-12-15', 'No RPO or threshold alert.'], color: C.amber},
  '5.2': {title: 'What the alert threshold means', rows: ['Dell: the time the array waits after a session misses its RPO before raising a compliance alert.', 'Threshold 15, RPO 15 minutes. A short miss that recovers can stay silent.', 'Silence is not proof the copy was on time.', 'Source: Dell PowerStore Protecting Your Data.'], color: C.purple},

  '6.1': {title: '2026-10-06 · session created', rows: ['19:09:53 initial Sync job started.', '19:10:10 COMPLETED, 17 seconds.', 'No further data sync before failover at 19:29:41.', 'Root disk on the same rule synced at 19:24:53.'], color: C.amber},
  '6.3': {title: 'Twice on the same volume', rows: ['2026-10-06 after creation: the data disk waited about 20 minutes.', '2026-10-07 after reprotect: 17m 32s.', 'The root disk was on time both times.', 'Cause inside PowerStore: not established.'], color: C.red},

  '7.1': {title: 'The lab gate', rows: ['Two COMPLETED scheduled copies per disk.', 'Since the protection was created or last reversed.', 'Each carrying writes, with no failed jobs.', 'Every gap and the latest copy within the RPO.', 'Applied in the site-down run, VIRTDR-342.'], color: C.cyan},
  '7.3': {title: 'VIRTDR-361 · GA requirements', rows: ['Expose basic protection status.', 'Show the last successful synchronization timestamp.', 'Support planned and unplanned failover, failback, and re-protection.', 'Confirm automatic re-protection after cleanup.'], color: C.green},
  '7.5': {title: 'What stays unverified', rows: ['Why the two disks differed.', 'Whether the first interval is expected scheduling or a defect.', 'Whether the failed reprotect attempts matter.', 'The record shows the timing, not the cause.'], color: C.amber},
};

export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  const cold = id.startsWith('0.');
  return <div style={{position: 'absolute', left: cold ? 170 : 900, top: cold ? 290 : 220, width: cold ? 1580 : 950, padding: 32, border: `2px solid ${d.color ?? C.blue}`, borderRadius: 20, background: `${C.bg}f5`, opacity: a, fontFamily: sans, boxShadow: '0 20px 70px #000c'}}>
    <div style={{fontSize: cold ? 48 : 29, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 24}}>{d.title}</div>
    {d.rows.map((r, i) => <div key={r} style={{marginTop: 18, fontSize: cold ? 34 : 25, lineHeight: 1.35, color: C.text, opacity: prog(f, dur * (.03 + i * .055), dur * (.03 + i * .055) + 22), transform: `translateX(${(1 - prog(f, dur * (.03 + i * .055), dur * (.03 + i * .055) + 22)) * 22}px)`, fontFamily: /^(csivol|[a-z-]+:|  volumeName|\d\.)/.test(r) ? mono : sans, overflowWrap: 'break-word'}}>{r}</div>)}
  </div>;
};

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.1') return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 160, fontSize: 40, color: C.text, fontWeight: 700}}>Three clusters, two arrays, one direction</div>
    {[
      ['HUB · edge36', 'DRPC · policy · console view', C.blue],
      ['SPOKE-0 · edge95', 'runs the workload after the failover · array VSA-A', C.spoke0],
      ['SPOKE-1 · edge97', 'ran the workload before the failover · array VSA-B', C.spoke1],
    ].map(([name, role, color], i) => <div key={name} style={{position: 'absolute', left: 110 + i * 570, top: 290, width: 520, minHeight: 190, padding: 28, border: `2px solid ${color}`, borderRadius: 18, background: C.panel, opacity: prog(f, dur * (.03 + i * .09), dur * (.03 + i * .09) + 24)}}><div style={{fontSize: 31, color, fontWeight: 700}}>{name}</div><div style={{fontSize: 24, color: C.text, lineHeight: 1.4, marginTop: 18}}>{role}</div></div>)}
    {[['VSA-A', 'spoke-0 storage · new Source after the reversal'], ['VSA-B', 'spoke-1 storage · Destination after the reversal']].map(([name, role], i) => <div key={name} style={{position: 'absolute', left: 240 + i * 800, top: 610, width: 660, minHeight: 150, padding: 28, border: `2px solid ${C.array}`, borderRadius: 18, background: C.panel, opacity: prog(f, dur * (.25 + i * .1), dur * (.25 + i * .1) + 24)}}><div style={{fontSize: 31, color: C.array, fontWeight: 700}}>{name}</div><div style={{fontSize: 24, color: C.text, marginTop: 16}}>{role} · asynchronous copy</div></div>)}
  </div>;
  if (!card || !def) return <div style={{position: 'absolute', left: 180, top: 350, right: 180, color: C.text, fontFamily: sans, fontSize: 44, textAlign: 'center'}}>Two disks, two sessions, one rule. Follow the copies, not the badges.</div>;
  return <div style={{position: 'absolute', inset: 0, opacity: prog(f, -20, 24)}}>
    <div style={{position: 'absolute', left: 100, top: 170, color: C.purple, fontFamily: mono, fontSize: 21}}>CAST OF CHARACTERS · {id.split('.')[1]}</div>
    <Card x={100} y={300} w={680} kind={card.kind} name={card.name} role={card.role} nameSize={28} appear={prog(f, -10, 24)} color={C.cyan}/>
    <GlossaryPanel d={def} p={prog(f, dur * .03, dur * .75)} x={860} y={230} w={980}/>
  </div>;
};
