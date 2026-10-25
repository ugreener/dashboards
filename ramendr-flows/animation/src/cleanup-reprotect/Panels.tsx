import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {YamlPanel} from '../components/overlays';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

export const CLEANUP_PHASES = ['Failover', 'Postcheck', 'Clean up', 'Reprotect'];

/** Phase tracker for this story: the fourth chip is shown as stuck once reprotection never completes. */
export const CleanupPhases: React.FC<{current: number; stuck?: boolean; appear?: number}> = ({current, stuck = false, appear = 1}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 118, display: 'flex', justifyContent: 'center', opacity: appear}}>
    <div style={{display: 'flex', gap: 6, padding: '6px 10px', borderRadius: 12, background: `${C.bg}e6`, border: `1px solid ${C.border}`, fontFamily: sans}}>
      {CLEANUP_PHASES.map((p, i) => {
        const on = i === current;
        const done = i < current;
        const isStuck = stuck && i === 3;
        const col = isStuck ? C.red : on ? C.blue : done ? C.text : C.faint;
        return (
          <div key={p} style={{padding: '5px 12px', borderRadius: 8, fontSize: 17, fontWeight: on || isStuck ? 700 : 500, color: on && !isStuck ? C.bg : col, background: on && !isStuck ? C.blue : done && !isStuck ? `${C.blue}22` : 'transparent', border: `1px ${isStuck ? 'dashed' : 'solid'} ${isStuck ? C.red : on ? C.blue : done ? `${C.blue}55` : C.border}`, whiteSpace: 'nowrap'}}>
            {i + 1}. {p}{isStuck ? ' ×' : ''}
          </div>
        );
      })}
    </div>
  </div>
);

const Box: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', left: 880, top: 205, width: 980, padding: '26px 30px', border: `2px solid ${C.blue}`, borderRadius: 18, background: `${C.bg}f4`, fontFamily: sans, boxShadow: '0 20px 60px #000c', ...style}}>{children}</div>
);

const Row: React.FC<{text: string; i: number; f: number; dur: number; color?: string; mono?: boolean}> = ({text, i, f, dur, color = C.text, mono: isMono}) => {
  const a = prog(f, dur * (0.04 + i * 0.045), dur * (0.04 + i * 0.045) + 22);
  return <div style={{marginTop: 16, fontSize: 25, lineHeight: 1.35, color, fontFamily: isMono ? mono : sans, opacity: a, transform: `translateX(${(1 - a) * 20}px)`, overflowWrap: 'break-word'}}>{text}</div>;
};

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string; mono?: boolean; yaml?: boolean; hl?: number[]}> = {
  '2.4': {title: 'Postcheck with the source still down', rows: ['Measured loss window: 576 s of 900 s', '56 complete source minutes recovered', 'Missing rows: none', 'Both disks: last two syncs carried writes', 'Verdict: within the objective, not zero loss'], color: C.green},
  '4.4': {title: 'The last useful driver line', rows: ['11:35:15 · DemoteVolume on spoke-0', '"already secondary (role=Destination, state=Failed_Over)"', 'First demote for these sessions since 10:20:24', 'After this line: no activity on either cluster'], color: C.amber, mono: true},
  '4.5': {title: 'What is missing from the record', rows: ['ResyncVolume calls on either cluster: none', 'Array job history: only the 10:20:24 failover job', 'Session last sync: 10:10:45 and 10:12:45', 'Session state: Failed_Over, unchanged'], color: C.red},
  '4.6': {title: 'The documented order was followed', rows: ['11:07 console gives the cleanup instruction', '11:08 target verified: VRG Primary, VM Running', '11:33 source VM deleted', '11:34 DataVolumes deleted', 'No step said: wait for reprotection'], color: C.amber},
  '5.2': {title: 'The source claim is held', rows: ['PVC hammerdb-win-datadisk', 'deletionTimestamp: 2026-10-22T11:34:00Z', 'finalizer: pvc-vr-protection', 'finalizer: pvc-protection', 'status.phase: Bound', 'Not gone. Not usable. Held.'], color: C.red, mono: true},
  '5.5': {title: 'The hub is waiting, not failing', rows: ['DRPC phase: FailedOver', 'progression: WaitOnUserToCleanUp', 'also cycles through: Cleaning Up', 'hub log: still waiting for peer to be ready', 'hub log: VRG on spoke-0 has not transitioned to secondary yet', 'Spec-State/Status-State: secondary/Unknown'], color: C.orange, mono: true},
  '5.6': {title: 'The arrays are idle, not broken', rows: ['VSA-B: Source · Failed_Over', 'VSA-A: Destination · Failed_Over', 'session 12aa0804 · data disk · last sync 10:10:45', 'session b7a9b1bb · root disk · last sync 10:12:45', 'Resync jobs: none · data movement: none'], color: C.red, mono: true},
  '5.7': {title: 'The target is correctly doing nothing', rows: ['Target VolumeReplications: Primary', 'autoResync: false (deliberate)', 'driver poll: about every 7.5 minutes', 'sees Failed_Over · reprotect required', 'takes no action, because it must not write over the only copy'], color: C.green},
  '6.1': {title: 'VIRTDR-342 · 19 October', rows: ['RHEL discovered application', 'source spoke-1 · target spoke-0', 'same build, same procedure', 'outcome: converged'], color: C.green},
  '6.2': {title: 'The only difference was ordering in time', rows: ['Reverse resync finished first', 'sessions ended Source and OK', 'PVC cascade completed', 'VolumeReplications removed', 'source VRG reached Secondary'], color: C.green},
  '6.5': {title: 'Where the code path stops', rows: ['demote at 11:35:15 was the last write', 'steady state would call ResyncVolume', 'spoke-0 session: Destination · Failed_Over', 'resync there: waiting for source-side resync', 'source side is the new primary, not resyncing', 'why the follow-up reconcile never ran: unverified'], color: C.amber, mono: true},
  '6.6': {title: 'Proven versus open', rows: ['Proven: the documented cleanup can wedge the reverse copy', 'Proven: no warning, no error, no timeout', 'Proven: one run converged, one run wedged', 'Refuted: a deletion-based autoResync skip', 'Open: why the follow-up reconcile never ran'], color: C.purple},
};

export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

const YAML_DATA: Record<string, {title: string; lines: string[]; hl: number[]}> = {
  '4.3': {title: 'source PVC · both finalizers', hl: [5, 6, 7, 8], lines: ['apiVersion: v1', 'kind: PersistentVolumeClaim', 'metadata:', '  name: hammerdb-win-datadisk', '  namespace: hammerdb-win', '  deletionTimestamp: "2026-10-22T11:34:00Z"', '  finalizers:', '  - volumereplicationgroups.ramendr.openshift.io/pvc-vr-protection', '  - replication.storage.openshift.io/pvc-protection', 'status:', '  phase: Bound']},
  '5.3': {title: 'source VolumeReplication', hl: [6, 7, 12, 15], lines: ['apiVersion: replication.storage.openshift.io/v1alpha1', 'kind: VolumeReplication', 'metadata:', '  name: hammerdb-win-datadisk', '  namespace: hammerdb-win', 'spec:', '  replicationState: secondary', '  autoResync: true', 'status:', '  conditions:', '  - type: Completed', '    status: "True"', '    reason: Demoted', '  - type: Degraded', '    status: "True"', '    reason: VolumeDegraded']},
  '5.4': {title: 'source VolumeReplicationGroup', hl: [8, 11, 12, 13, 14], lines: ['apiVersion: ramendr.openshift.io/v1alpha1', 'kind: VolumeReplicationGroup', 'metadata:', '  name: hammerdb-win-drpc', '  namespace: openshift-dr-ops', 'spec:', '  replicationState: secondary', 'status:', '  state: Unknown', '  conditions:', '  - type: DataReady', '    status: "False"', '    reason: Error', '    message: All PVCs of the VolumeReplicationGroup', '      are not ready']},
};

type Meta = {f: number; dur: number};

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  if (id === '0.1') return <ColdCard f={f} dur={dur} />;
  if (id === '0.2' || id === '7.5') return <FourSteps f={f} dur={dur} closing={id === '7.5'} />;
  if (id === '0.3') return <RunCompare f={f} dur={dur} mode="teaser" />;
  if (id === '5.8') return <WedgeChain f={f} dur={dur} />;
  if (id === '6.3') return <RunCompare f={f} dur={dur} mode="outcome" />;
  if (id === '6.4') return <InferenceCard f={f} dur={dur} />;
  if (id === '7.1') return <QuoteCard f={f} dur={dur} />;
  if (id === '7.2') return <Checklist f={f} dur={dur} />;
  if (id === '7.3') return <AfterGate f={f} dur={dur} />;
  if (id === '7.4') return <RecapList f={f} dur={dur} />;
  const y = YAML_DATA[id];
  if (y) return <YamlPanel title={y.title} lines={y.lines} hl={y.hl} appear={prog(f, 0, 20)} reveal={prog(f, dur * 0.03, dur * 0.55)} x={1020} y={200} w={840} />;
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 24);
  return <Box style={{borderColor: d.color ?? C.blue, opacity: a}}>
    <div style={{fontSize: 30, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 8}}>{d.title}</div>
    {d.rows.map((r, i) => <Row key={r} text={r} i={i} f={f} dur={dur} mono={d.mono} color={i === d.rows.length - 1 ? (d.color ?? C.text) : C.text} />)}
  </Box>;
};

const ColdCard: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', left: 70, top: 235, width: 760, fontFamily: sans}}>
    <div style={{fontFamily: mono, fontSize: 21, color: C.amber, letterSpacing: 1}}>22 OCTOBER 2026 · 11:07 UTC</div>
    <div style={{fontSize: 58, fontWeight: 800, color: C.text, marginTop: 18, lineHeight: 1.1}}>Action needed.<br />3 of 4 steps.</div>
    <div style={{fontSize: 27, color: C.dim, marginTop: 22, lineHeight: 1.45, opacity: prog(f, dur * .12, dur * .12 + 24)}}>Clean up <span style={{whiteSpace: 'nowrap'}}>hammerdb-win-drpc</span> on the failed cluster <span style={{whiteSpace: 'nowrap'}}>spoke-0</span> to complete the failover.</div>
    <div style={{marginTop: 30, padding: '18px 22px', borderLeft: `5px solid ${C.red}`, background: `${C.panel}cc`, fontSize: 23, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * .3, dur * .3 + 24)}}>By 11:35 the application ran on spoke-1 with <span style={{color: C.red, fontWeight: 700}}>no standby copy</span>, and no error said why.</div>
  </div>
);

const FourSteps: React.FC<{f: number; dur: number; closing: boolean}> = ({f, dur, closing}) => {
  const steps = ['Preparing', 'Failover', 'Restoring', 'Clean up'];
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 110, top: 190, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>{closing ? 'THE QUESTION THE CONSOLE DOES NOT COUNT' : 'THE CONSOLE COUNTS FOUR STEPS'}</div>
    <div style={{position: 'absolute', left: 90, top: 275, display: 'flex', gap: 14}}>
      {steps.map((s, i) => { const pending = i === 3; const col = pending ? C.amber : C.green; return <div key={s} style={{width: 330, padding: '26px 24px', border: `2px solid ${col}`, borderRadius: 16, background: `${col}12`, opacity: prog(f, dur * (.05 + i * .09), dur * (.05 + i * .09) + 22)}}>
        <div style={{fontFamily: mono, fontSize: 18, color: col}}>STEP {i + 1}</div>
        <div style={{fontSize: 34, fontWeight: 700, color: C.text, marginTop: 8}}>{s}</div>
        <div style={{fontSize: 21, color: col, marginTop: 10}}>{pending ? 'action needed' : 'completed'}</div>
      </div>; })}
    </div>
    <div style={{position: 'absolute', left: 90 + 4 * 344, top: 275, width: 330, padding: '28px 26px', border: `2px dashed ${closing ? C.red : C.purple}`, borderRadius: 16, background: `${C.purple}0f`, opacity: prog(f, dur * .48, dur * .48 + 26)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: closing ? C.red : C.purple}}>NOT COUNTED</div>
      <div style={{fontSize: 34, fontWeight: 700, color: C.text, marginTop: 8}}>Reprotect</div>
      <div style={{fontSize: 21, color: closing ? C.red : C.purple, marginTop: 10}}>{closing ? 'the old site is not a standby' : 'the old site must become a standby'}</div>
    </div>
    {closing ? <div style={{position: 'absolute', left: 110, top: 610, width: 1660, fontSize: 40, color: C.text, lineHeight: 1.35, opacity: prog(f, dur * .62, dur * .62 + 26)}}>The next time you see <span style={{color: C.amber, fontWeight: 700}}>three of four steps completed</span>, ask the fifth question. Is the old site a standby again?</div> : <div style={{position: 'absolute', left: 110, top: 610, width: 1660, fontSize: 32, color: C.dim, lineHeight: 1.4, opacity: prog(f, dur * .62, dur * .62 + 26)}}>Clean up is the fourth step. Reverse reprotection is not a step in this view, so the console can look finished while the storage side has not started.</div>}
  </div>;
};

const RunCompare: React.FC<{f: number; dur: number; mode: 'teaser' | 'outcome'}> = ({f, dur, mode}) => {
  const col = (x: number, title: string, sub: string, rows: string[], color: string, delay: number) => <div style={{position: 'absolute', left: x, top: 230, width: 790, padding: '26px 28px', border: `2px solid ${color}`, borderRadius: 18, background: `${C.bg}f2`, opacity: prog(f, dur * delay, dur * delay + 24)}}>
    <div style={{fontSize: 31, fontWeight: 700, color}}>{title}</div>
    <div style={{fontFamily: mono, fontSize: 19, color: C.dim, marginTop: 6}}>{sub}</div>
    {rows.map((r, i) => <div key={r} style={{marginTop: 14, fontSize: 23, color: i === rows.length - 1 ? color : C.text, lineHeight: 1.35, fontFamily: i === rows.length - 1 ? sans : mono}}>{r}</div>)}
  </div>;
  if (mode === 'teaser') return <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 110, top: 170, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>SAME STEPS · SAME BUILD · DIFFERENT DAY</div>
    {col(110, 'VIRTDR-342', '19 October · converged', ['reverse resync finished first', 'source VRG Secondary', 'DRPC Completed', 'PeerReady=True'], C.green, .12)}
    {col(1060, 'VIRTDR-360', '22 October · wedged', ['cleanup reached the claims first', 'PVCs stuck Terminating', 'no reverse resync', 'no standby copy'], C.red, .28)}
  </div>;
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 110, top: 170, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>THE VARIABLE WAS ORDERING IN TIME</div>
    {col(110, 'RESYNC WINS', 'VIRTDR-342 · 19 October', ['sessions: Source / OK', 'PVC cascade completes', 'VolumeReplications removed', 'VRG Secondary', 'DRPC FailedOver / Completed'], C.green, .1)}
    {col(1060, 'CLEANUP WINS', 'VIRTDR-360 · 22 October', ['PVCs: Terminating', 'finalizers: held', 'sessions: Failed_Over', 'no ResyncVolume', 'DRPC WaitOnUserToCleanUp'], C.red, .24)}
    <div style={{position: 'absolute', left: 110, top: 690, width: 1740, fontSize: 30, color: C.dim, lineHeight: 1.4, opacity: prog(f, dur * .55, dur * .55 + 24)}}>The cleanup and the automatic resync both have to happen. Nothing in the console orders them.</div>
  </div>;
};

const WedgeChain: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const rows: [string, string, string][] = [
    ['DRPlacementControl', 'FailedOver · WaitOnUserToCleanUp', C.orange],
    ['VolumeReplicationGroup · spoke-0', 'state Unknown · DataReady=False', C.orange],
    ['PersistentVolumeClaim ×2', 'Terminating · deletionTimestamp 11:34', C.red],
    ['Finalizers', 'pvc-vr-protection + pvc-protection · held', C.red],
    ['csi-addons + Dell CSM', 'no ResyncVolume call', C.red],
    ['PowerStore sessions', 'Failed_Over · no data movement', C.red],
  ];
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 120, top: 165, fontSize: 29, letterSpacing: 2, color: C.red, fontWeight: 700}}>WHO IS WAITING FOR WHOM</div>
    <div style={{position: 'absolute', left: 120, top: 230, width: 1680}}>
      {rows.map(([title, sub, color], i) => {
        const a = prog(f, dur * (.05 + i * .09), dur * (.05 + i * .09) + 22);
        return <div key={title} style={{opacity: a}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '16px 24px', border: `2px solid ${color}`, borderRadius: 14, background: i === rows.length - 1 ? `${C.red}18` : `${C.panel}ee`}}>
            <div style={{fontFamily: mono, fontSize: 18, color: C.faint, width: 40}}>{i + 1}</div>
            <div style={{fontSize: 29, fontWeight: 700, color: C.text, width: 560}}>{title}</div>
            <div style={{fontFamily: mono, fontSize: 22, color, flex: 1}}>{sub}</div>
          </div>
          {i < rows.length - 1 ? <div style={{margin: '6px 0 6px 60px', width: 5, height: 24, background: `${C.red}88`}} /> : null}
        </div>;
      })}
    </div>
    <div style={{position: 'absolute', left: 120, top: 820, width: 1680, padding: '20px 26px', border: `2px solid ${C.red}`, borderRadius: 14, background: `${C.red}12`, fontSize: 30, color: C.text, opacity: prog(f, dur * .62, dur * .62 + 24)}}>
      Application running on spoke-1 · <span style={{color: C.red, fontWeight: 700}}>no standby copy</span> · silence since 11:35:15
    </div>
  </div>;
};

const InferenceCard: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 180, top: 230, width: 1560, padding: '34px 40px', border: `3px solid ${C.purple}`, borderRadius: 20, background: `${C.purple}0e`, opacity: prog(f, dur * .05, dur * .05 + 26)}}>
      <div style={{fontFamily: mono, fontSize: 20, color: C.purple, letterSpacing: 2}}>OPEN QUESTION · NOT CONFIRMED</div>
      <div style={{fontSize: 44, fontWeight: 700, color: C.text, marginTop: 18, lineHeight: 1.3}}>Why did the follow-up reconcile never run?</div>
      <div style={{fontSize: 26, color: C.dim, marginTop: 22, lineHeight: 1.45}}>The controller code calls ResyncVolume in its steady Secondary path. The deletion based skip people expected is not there. The exact stop point is unconfirmed. The bug is open, linked to DFBUGS-6934 and DFBUGS-9565.</div>
    </div>
    <div style={{position: 'absolute', left: 180, top: 620, width: 1560, fontSize: 28, color: C.text, lineHeight: 1.45, opacity: prog(f, dur * .5, dur * .5 + 24)}}>A controller restart produced eleven minutes of zero activity, not even status polling. That argues against a lost queue, but it does not identify the stop point.</div>
  </div>
);

const QuoteCard: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 120, top: 190, width: 1680}}>
      <div style={{fontFamily: mono, fontSize: 20, color: C.amber, letterSpacing: 2}}>THE PUBLISHED PROMISE</div>
      <div style={{fontSize: 56, fontWeight: 700, color: C.text, lineHeight: 1.25, marginTop: 22, opacity: prog(f, dur * .05, dur * .05 + 26)}}>“After cleanup, replication<br />resumes automatically.”</div>
      <div style={{fontSize: 24, color: C.dim, marginTop: 20, opacity: prog(f, dur * .18, dur * .18 + 22)}}>IBM Fusion HCI 2.13 · discovered application failover · the same Ramen flow cited in VIRTDR-360</div>
      <div style={{marginTop: 54, padding: '26px 30px', borderLeft: `6px solid ${C.red}`, background: `${C.panel}dd`, opacity: prog(f, dur * .38, dur * .38 + 24)}}>
        <div style={{fontFamily: mono, fontSize: 19, color: C.red, letterSpacing: 2}}>RECORDED HERE</div>
        <div style={{fontSize: 32, color: C.text, marginTop: 12, lineHeight: 1.4}}>No ResyncVolume call. No array job. Sessions still Failed_Over. The promise and the recording disagree.</div>
      </div>
    </div>
  </div>
);

const Checklist: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const rows = ['Delete the source VM. Wait for its VMI to terminate.', 'Wait for sessions OK in reverse: Source on VSA-B, Destination on VSA-A.', 'Source VolumeReplications demoted. Allow about 40 minutes.'];
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 120, top: 175, fontSize: 29, letterSpacing: 2, color: C.green, fontWeight: 700}}>STAGE ONE · STOP THE SOURCE VM ONLY</div>
    {rows.map((r, i) => <div key={r} style={{position: 'absolute', left: 120, top: 260 + i * 115, width: 1660, display: 'flex', gap: 22, opacity: prog(f, dur * (.08 + i * .12), dur * (.08 + i * .12) + 22)}}>
      <div style={{fontFamily: mono, fontSize: 34, color: C.green}}>{i + 1}</div>
      <div style={{fontSize: 31, color: C.text, lineHeight: 1.35}}>{r}</div>
    </div>)}
    <div style={{position: 'absolute', left: 120, top: 650, width: 1660, padding: '24px 28px', border: `2px solid ${C.red}`, borderRadius: 16, background: `${C.red}10`, fontSize: 29, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * .5, dur * .5 + 24)}}>If the sessions stay Failed_Over, stop. Do not delete the DataVolumes.</div>
  </div>;
};

const AfterGate: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 120, top: 170, fontSize: 29, letterSpacing: 2, color: C.green, fontWeight: 700}}>STAGE TWO · ONLY AFTER THE REVERSE COPY IS HEALTHY</div>
    <div style={{position: 'absolute', left: 120, top: 230, fontSize: 54, fontWeight: 800, color: C.text, opacity: prog(f, dur * .05, dur * .05 + 24)}}>Delete the DataVolumes.</div>
    {['Their owned PVCs cascade normally.', 'Verify the source VRG reaches Secondary.', 'Verify the DRPC reaches FailedOver / Completed.'].map((r, i) => <div key={r} style={{position: 'absolute', left: 120, top: 330 + i * 62, fontSize: 30, color: C.text, opacity: prog(f, dur * (.12 + i * .08), dur * (.12 + i * .08) + 20)}}>{r}</div>)}
    <div style={{position: 'absolute', left: 120, top: 560, width: 1680, padding: '22px 28px', border: `2px solid ${C.amber}`, borderRadius: 16, background: `${C.amber}10`, fontSize: 28, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * .38, dur * .38 + 24)}}>If the sessions do not recover: Relocate, or the manual reprotect workaround on VIRTDR-360.</div>
    <div style={{position: 'absolute', left: 120, top: 700, width: 1680, fontSize: 29, color: C.dim, lineHeight: 1.4, opacity: prog(f, dur * .55, dur * .55 + 24)}}>The cost is easy to miss because nothing is down. The application serves traffic on spoke-1, but there is no standby copy.</div>
  </div>
);

const RecapList: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const rows = ['Failover worked.', 'The postcheck passed: 576 s of 900 s.', 'The console asked for cleanup at 11:07.', 'Cleanup cascaded to the claims at 11:34.', 'Reprotection never ran.', 'One control run shows timing, not procedure.', 'Still open: why the follow-up reconcile never ran.'];
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 130, top: 180, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>RECAP</div>
    {rows.map((r, i) => <div key={r} style={{position: 'absolute', left: 130, top: 260 + i * 88, fontSize: 34, color: i === rows.length - 1 ? C.amber : C.text, opacity: prog(f, dur * (.06 + i * .08), dur * (.06 + i * .08) + 20)}}>{r}</div>)}
  </div>;
};

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.10') return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 170, fontSize: 40, color: C.text, fontWeight: 700}}>One chain, top to bottom</div>
    {[
      ['Hub DRPC', 'asks for the move and records the progression'],
      ['VRG on each spoke', 'coordinates the disks on that site'],
      ['VolumeReplication per disk', 'requests a role change'],
      ['csi-addons + Dell CSM', 'executes against the array'],
      ['PowerStore session', 'moves the data, or does not'],
    ].map(([name, role], i) => <div key={name} style={{position: 'absolute', left: 110, top: 270 + i * 120, width: 1660, display: 'flex', gap: 28, alignItems: 'center', opacity: prog(f, dur * (.04 + i * .08), dur * (.04 + i * .08) + 22)}}>
      <div style={{width: 500, fontSize: 32, fontWeight: 700, color: C.cyan}}>{name}</div>
      <div style={{fontSize: 28, color: C.text}}>{role}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 880, fontSize: 26, color: C.dim}}>The console shows the top of this chain, not the bottom.</div>
  </div>;
  if (!card || !def) return <div style={{position: 'absolute', left: 180, top: 350, right: 180, color: C.text, fontFamily: sans, fontSize: 44, textAlign: 'center'}}>Every piece has one job. Follow the handoffs, not just the names.</div>;
  return <div style={{position: 'absolute', inset: 0, opacity: prog(f, -20, 24)}}>
    <div style={{position: 'absolute', left: 100, top: 170, color: C.purple, fontFamily: mono, fontSize: 21}}>CAST OF CHARACTERS · {id.split('.')[1]}</div>
    <Card x={100} y={300} w={660} kind={card.kind} name={card.name} role={card.role} nameSize={card.name.length > 28 ? 20 : 29} appear={prog(f, -10, 24)} color={C.cyan} />
    <GlossaryPanel d={def} p={prog(f, dur * .03, dur * .75)} x={850} y={230} w={990} />
  </div>;
};
