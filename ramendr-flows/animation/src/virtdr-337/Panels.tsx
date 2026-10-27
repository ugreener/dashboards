import React from 'react';
import {C, mono, sans} from '../theme';
import {prog} from '../lib/anim';
import {Def, GlossaryPanel} from '../components/newcomer';

const Box: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', left: 900, top: 205, width: 960, padding: '24px 28px', border: `2px solid ${C.blue}`, borderRadius: 18, background: `${C.bg}f4`, fontFamily: sans, boxShadow: '0 20px 60px #000c', ...style}}>{children}</div>
);

const Row: React.FC<{text: string; i: number; f: number; dur: number; color?: string; mono?: boolean; size?: number}> = ({text, i, f, dur, color = C.text, mono: isMono, size = 24}) => {
  const a = prog(f, dur * (0.04 + i * 0.04), dur * (0.04 + i * 0.04) + 20);
  return <div style={{marginTop: 14, fontSize: size, lineHeight: 1.34, color, fontFamily: isMono ? mono : sans, opacity: a, transform: `translateX(${(1 - a) * 18}px)`, overflowWrap: 'break-word'}}>{text}</div>;
};

export const PANEL_DATA: Record<string, {title: string; rows: string[]; color?: string; mono?: boolean; size?: number}> = {
  '2.2': {title: 'What one node buys you', rows: ['Both nodes active: full redundancy', 'One node active: input and output continue', 'No node active: the appliance stops servicing IOs'], color: C.cyan},
  '2.3': {title: 'The cost is test time', rows: ['A recovery buys about 3 days of DR testing', 'Powering down a source array: rejected as a simulation method', 'Reason recorded: recovery here is disruptive and flaky', 'So array reliability sets the pace of every run'], color: C.amber},
  '3.1': {title: '2026-10-11 · VSA-B', rows: ['15:20:48  Node B physically removed or shut down', '15:20:53  Node has stopped', 'vmware.log for VSA-B-B in that window: no reset', 'So the appliance stopped the node, not the hypervisor'], color: C.amber, mono: true, size: 22},
  '3.2': {title: 'What VSA-A said at 15:21:22', rows: ['replication session for csivol-ec5862ac71', 'state: System_Paused', 'reason: remote system service at 10.46.48.30 is not available', 'and the same for the volume group session'], color: C.amber, mono: true, size: 21},
  '3.3': {title: 'Both arrays, one node each', rows: ['15:22:42  VSA-A Node B stopped', '15:22:49  VSA-A reports Node has stopped', '15:24:07  VSA-B cluster management online', '15:25:52  VSA-A cluster management online'], color: C.orange, mono: true, size: 22},
  '3.4': {title: 'Healthy, then stopped', rows: ['VSA-A  15:27:32 lifecycle Disconnected to Healthy', 'VSA-A  15:27:35 cluster service stops  (3 s later)', 'VSA-B  15:24:34 lifecycle Disconnected to Healthy', 'VSA-B  15:24:35 cluster service stops  (1 s later)'], color: C.red, mono: true, size: 22},
  '4.1': {title: 'VSA-A-A · the wait', rows: ['INFO: task multipathd blocked for more than 122 seconds', '10 tasks blocked in total', 'some in device-mapper suspend, waiting on a grace period', 'others in SCSI error handling'], color: C.amber, mono: true, size: 21},
  '4.4': {title: 'The array writes the ending', rows: ['15:27:35  The appliance has stopped servicing IOs', '15:27:35  Cluster service stop is in progress', '15:27:35  Stop reason is: no_nodes_in_brick', '15:27:35  NodeA has stopped', '15:27:40  The cluster service has stopped'], color: C.red, mono: true, size: 21},
  '5.1': {title: 'The damage above the array', rows: ['Both arrays: Partial_Node_Connection_Loss', 'Workers: 1 array session instead of 2', 'Replication: System_Paused, no data movement', 'Nothing above the array changes its alert level'], color: C.amber},
  '5.3': {title: 'Why this is an outage, not a warning', rows: ['One node: no redundancy at all', 'A single-node restart does not re-integrate Node A', 'Only a two-node power-cycle restores the array', 'Until then every session sits on one failure'], color: C.red},
  '6.2': {title: 'Ruled out by the record', rows: ['No hypervisor stun or vMotion before the failure', 'No host move: two arrays, two different ESXi hosts', 'Licence valid to 2026-12-15', 'No warnings in the 24 hours before, but two replication failovers 90 min earlier'], color: C.green},
  '7.3': {title: 'Post-recovery checks · 2026-10-25 08:03', rows: ['Management addresses answer', 'Storage addresses answer on NVMe/TCP 4420', 'remote_system OK in both directions', '8 replication sessions per array, all OK', 'All six VSA-A worker initiators back to 2 sessions', 'All four DRPCs Protected=true'], color: C.green},
  '7.4': {title: 'The three-day window', rows: ['Recovery at the start of the window', 'About 72 hours later the cycle returns', 'Chosen simulation: suspend spoke node VMs', 'Rejected: power down a source array'], color: C.amber},
  '7.6': {title: 'What stays unverified', rows: ['Why Node B stops', 'What PowerStore runs on a ~72-hour schedule', 'Why Node A does not rejoin after its reboot', 'What the data-path dump shows'], color: C.purple},
};

export const PANEL_BEATS = new Set(Object.keys(PANEL_DATA));

const ARRAY_PHASES = ['Both nodes', 'Node B stops', 'Node A panics', 'Single node', 'Recovery'];

/** Phase tracker for this story: the array loses redundancy, then availability. */
export const ArrayPhases: React.FC<{current: number; appear?: number}> = ({current, appear = 1}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 118, display: 'flex', justifyContent: 'center', opacity: appear}}>
    <div style={{display: 'flex', gap: 6, padding: '6px 10px', borderRadius: 12, background: `${C.bg}e6`, border: `1px solid ${C.border}`, fontFamily: sans}}>
      {ARRAY_PHASES.map((p, i) => {
        const on = i === current;
        const done = i < current;
        const bad = i >= 1 && i <= 3;
        const col = on ? (bad ? C.red : C.blue) : done ? (bad ? C.amber : C.text) : C.faint;
        return (
          <div key={p} style={{padding: '5px 12px', borderRadius: 8, fontSize: 17, fontWeight: on ? 700 : 500, color: on ? C.bg : col, background: on ? (bad ? C.red : C.blue) : done ? `${C.blue}22` : 'transparent', border: `1px solid ${on ? (bad ? C.red : C.blue) : done ? `${C.blue}55` : C.border}`, whiteSpace: 'nowrap'}}>
            {i + 1}. {p}
          </div>
        );
      })}
    </div>
  </div>
);

const ColdCard: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', left: 80, top: 300, width: 800, fontFamily: sans}}>
    <div style={{fontFamily: mono, fontSize: 21, color: C.amber, letterSpacing: 1}}>2026-10-11 · 15:20:48 UTC</div>
    <div style={{fontSize: 60, fontWeight: 800, color: C.text, marginTop: 16, lineHeight: 1.08}}>Node B stops.<br />Healthy.<br />Stopped again.</div>
    <div style={{fontSize: 26, color: C.dim, marginTop: 24, lineHeight: 1.45, opacity: prog(f, dur * 0.12, dur * 0.12 + 24)}}>
      Three seconds separate <span style={{color: C.text}}>healthy</span> from <span style={{color: C.red}}>stopped</span> on VSA-A. By 15:27 both arrays had stopped servicing IOs.
    </div>
  </div>
);

const HourRing: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const cx = 800, cy = 520, r = 250;
  const marks = [259641, 259887, 260378, 260502];
  const labels = ['259,641 s', '259,887 s', '260,378 s', '260,502 s'];
  return <div style={{position: 'absolute', left: 60, top: 200, width: 1200, fontFamily: sans}}>
    <div style={{fontSize: 26, color: C.dim, letterSpacing: 1}}>NODE A PANIC UPTIMES</div>
    <svg width={1200} height={760}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={26} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.red} strokeWidth={8} strokeDasharray="4 14" opacity={0.85} />
      {labels.map((l, i) => {
        const a = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
        const a2 = prog(f, dur * (0.15 + i * 0.1), dur * (0.15 + i * 0.1) + 22);
        return <g key={l} opacity={a2}>
          <circle cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={15} fill={C.red} />
          <text x={cx + Math.cos(a) * (r + 58)} y={cy + Math.sin(a) * (r + 58) + 8} textAnchor="middle" fill={C.text} fontSize={25} fontFamily={mono}>{l}</text>
        </g>;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={C.text} fontSize={54} fontFamily={sans} fontWeight={800}>72.1 to 72.3 h</text>
      <text x={cx} y={cy + 38} textAnchor="middle" fill={C.dim} fontSize={23} fontFamily={sans}>four panic episodes</text>
      <text x={cx} y={cy + 92} textAnchor="middle" fill={C.amber} fontSize={22} fontFamily={sans}>one later boot reached 522,722 s</text>
    </svg>
  </div>;
};

const RecordedInferred: React.FC<{f: number; dur: number; mode: 'teaser' | 'open'}> = ({f, dur, mode}) => {
  const left = mode === 'teaser'
    ? ['the order of events', 'the exact timings', 'the recovery steps', 'the cost in test time']
    : ['the node stop sequence, four times', 'the panic signature and uptimes', 'the array event timeline', 'the recovery and its checks'];
  const right = mode === 'teaser'
    ? ['why Node B stops', 'what runs on 72 h', 'why Node A never rejoins', 'what the dump shows']
    : ['the vendor-side cause', 'the 72-hour trigger', 'the re-integration failure', 'the dump interpretation'];
  const col = (x: number, title: string, rows: string[], color: string, delay: number) => (
    <div style={{position: 'absolute', left: x, top: 250, width: 800, padding: '26px 28px', border: `2px solid ${color}`, borderRadius: 18, background: `${C.bg}f2`, opacity: prog(f, dur * delay, dur * delay + 24)}}>
      <div style={{fontSize: 30, fontWeight: 700, color}}>{title}</div>
      {rows.map((r, i) => <div key={r} style={{marginTop: 15, fontSize: 24, color: C.text, lineHeight: 1.34}}>· {r}</div>)}
    </div>
  );
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    {col(80, 'RECORDED', left, C.green, 0.12)}
    {col(940, 'INFERRED · NOT ESTABLISHED', right, C.purple, 0.42)}
    {mode === 'open' ? <div style={{position: 'absolute', left: 80, top: 640, width: 1680, fontSize: 34, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.66, dur * 0.66 + 24)}}>The root cause inside PowerStore is <span style={{color: C.purple, fontWeight: 700}}>not established</span>. Dell has the question.</div> : null}
  </div>;
};

const CallTrace: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const lines = [
    'INFO: task multipathd blocked for more than 122 seconds.',
    'task:multipathd  state:D',
    'Call Trace:',
    '  schedule_timeout',
    '  scsi_block_when_processing_errors+0xc0/0xd0 [scsi_mod]',
    '  scsi_ioctl_block_when_processing_errors+0x37/0x50 [scsi_mod]',
    '  sd_ioctl+0x67/0x220 [sd_mod]',
    '  blkdev_ioctl+0x226/0x280',
    '  __x64_sys_ioctl+0x8f/0xd0',
  ];
  const hl = [4, 5, 6, 7];
  return <Box style={{borderColor: C.red, left: 880, top: 205, width: 980, padding: '22px 26px'}}>
    <div style={{fontSize: 24, color: C.red, fontWeight: 700, marginBottom: 10}}>VSA-A-A serial console</div>
    {lines.map((l, i) => {
      const a = prog(f, dur * (0.03 + i * 0.035), dur * (0.03 + i * 0.035) + 16);
      const hot = hl.includes(i);
      return <div key={l} style={{fontFamily: mono, fontSize: 19, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: hot ? C.amber : C.dim, opacity: a, overflowWrap: 'break-word'}}>{l}</div>;
    })}
  </Box>;
};

const UptimeBars: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const bars = [
    {l: 'VSA-A-A', v: 259641, t: '10-11'},
    {l: 'VSA-B-A', v: 260378, t: '10-11'},
    {l: 'VSA-A-A', v: 260502, t: '10-17'},
    {l: 'VSA-B-A', v: 259887, t: '10-17'},
  ];
  const max = 265000;
  const h = 250;
  return <div style={{position: 'absolute', left: 90, top: 240, width: 1080, fontFamily: sans}}>
    <div style={{fontSize: 25, color: C.dim, letterSpacing: 1, marginBottom: 8}}>UPTIME AT THE PANIC</div>
    <svg width={1080} height={520}>
      <line x1={70} y1={330} x2={1040} y2={330} stroke={C.border} strokeWidth={2} />
      <line x1={70} y1={330 - (259200 / max) * h} x2={1040} y2={330 - (259200 / max) * h} stroke={C.amber} strokeWidth={2} strokeDasharray="8 8" />
      <text x={1044} y={330 - (259200 / max) * h + 7} fill={C.amber} fontSize={19} fontFamily={mono}>72 h</text>
      {bars.map((b, i) => {
        const bh = (b.v / max) * h;
        const x = 130 + i * 235;
        const a = prog(f, dur * (0.08 + i * 0.09), dur * (0.08 + i * 0.09) + 20);
        return <g key={`${b.l}-${b.t}`} opacity={a}>
          <rect x={x} y={330 - bh * a} width={120} height={bh * a} rx={8} fill={C.red} opacity={0.85} />
          <text x={x + 60} y={330 - bh - 16} textAnchor="middle" fill={C.text} fontSize={21} fontFamily={mono}>{b.v.toLocaleString('en-US')} s</text>
          <text x={x + 60} y={362} textAnchor="middle" fill={C.text} fontSize={20} fontFamily={mono}>{b.l}</text>
          <text x={x + 60} y={390} textAnchor="middle" fill={C.dim} fontSize={19} fontFamily={mono}>{b.t}</text>
        </g>;
      })}
    </svg>
  </div>;
};

const JournalPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.purple, left: 860, top: 205, width: 1000, padding: '20px 24px'}}>
    <div style={{fontSize: 23, color: C.purple, fontWeight: 700, marginBottom: 8}}>VSA-A-B journal · 2026-10-24</div>
    {[
      '10:50:01 cyc_pacemaker_proxy: Transport error with broker',
      '10:50:35 cyc_rsync: node ID: b, node_a state: healthy',
      '10:51:19 xtremapp-pm: bt dump to xenv_-1_pid_12045_panic_bt.sh',
      '10:57:06 xtremapp: nt_fe_pnvmet_on_panic: xth IoWatchdog called',
      '10:57:07 kernel: device-mapper: multipath: Failing path 251:0',
    ].map((l, i) => {
      const a = prog(f, dur * (0.04 + i * 0.08), dur * (0.04 + i * 0.08) + 18);
      return <div key={l} style={{fontFamily: mono, fontSize: 19, lineHeight: 1.55, color: i >= 3 ? C.amber : C.dim, opacity: a, overflowWrap: 'break-word'}}>{l}</div>;
    })}
    <div style={{marginTop: 14, fontSize: 20, color: C.purple, opacity: prog(f, dur * 0.5, dur * 0.5 + 18)}}>dump file: core_xenv_11.cyc_bsc_docker.xtremapp.2026-10-24_10-57-06.pid_14527.sig_6.dump.tgz</div>
  </Box>
);

const RecoverySteps: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const steps = ['Both nodes off together', 'Verify both are off', 'Hold off about one minute', 'Node B on, then Node A'];
  return <div style={{position: 'absolute', left: 80, top: 250, width: 1720, fontFamily: sans}}>
    <div style={{fontSize: 26, color: C.dim, letterSpacing: 1}}>THE DOCUMENTED REPAIR</div>
    <div style={{display: 'flex', gap: 16, marginTop: 26}}>
      {steps.map((s, i) => {
        const a = prog(f, dur * (0.08 + i * 0.1), dur * (0.08 + i * 0.1) + 22);
        return <div key={s} style={{width: 400, padding: '24px 22px', border: `2px solid ${C.amber}`, borderRadius: 16, background: `${C.amber}10`, opacity: a}}>
          <div style={{fontFamily: mono, fontSize: 18, color: C.amber}}>STEP {i + 1}</div>
          <div style={{fontSize: 27, fontWeight: 700, color: C.text, marginTop: 8, lineHeight: 1.25}}>{s}</div>
        </div>;
      })}
    </div>
    <div style={{marginTop: 34, fontSize: 30, color: C.red, opacity: prog(f, dur * 0.55, dur * 0.55 + 22)}}>A single-node restart leaves Node A outside the appliance.</div>
  </div>;
};

const ExactTimes: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const rows: [string, string][] = [
    ['07:43:05', 'VSA-A-A powered off'],
    ['07:43:12', 'VSA-A-B powered off'],
    ['07:44:09', 'VSA-A-B powered on'],
    ['07:44:11', 'VSA-A-A powered on'],
    ['07:50:19', 'both nodes active'],
    ['07:50:22', 'cluster active'],
    ['07:50:27', 'appliance servicing IOs'],
    ['07:54:27', 'cluster management online'],
  ];
  return <Box style={{borderColor: C.green, left: 880, top: 200, width: 960, padding: '20px 26px'}}>
    <div style={{fontSize: 24, color: C.green, fontWeight: 700, marginBottom: 6}}>VSA-A recovery · 2026-10-25 UTC</div>
    {rows.map(([t, e], i) => {
      const a = prog(f, dur * (0.03 + i * 0.075), dur * (0.03 + i * 0.075) + 16);
      return <div key={t} style={{display: 'flex', gap: 22, marginTop: 9, opacity: a, fontFamily: mono, fontSize: 22}}>
        <span style={{color: C.text, width: 130}}>{t}</span>
        <span style={{color: i === rows.length - 1 ? C.green : C.dim}}>{e}</span>
      </div>;
    })}
  </Box>;
};

const Checklist: React.FC<{f: number; dur: number; close?: boolean}> = ({f, dur, close}) => {
  const rows = ['Confirm both nodes active before a run', 'Treat one node as an outage, not a warning', 'If a node stops, power both off together', 'Verify two sessions per initiator before trusting a check'];
  return <div style={{position: 'absolute', left: 100, top: 250, width: 1700, fontFamily: sans}}>
    <div style={{fontSize: 25, color: C.dim, letterSpacing: 1}}>{close ? 'THE FOUR-LINE CHECKLIST' : 'CHECKS THAT PROVE THE ARRAY IS BACK'}</div>
    {rows.map((r, i) => {
      const a = prog(f, dur * (0.08 + i * 0.1), dur * (0.08 + i * 0.1) + 20);
      return <div key={r} style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 24, opacity: a}}>
        <div style={{width: 44, height: 44, borderRadius: 10, border: `2px solid ${C.green}`, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700}}>✓</div>
        <div style={{fontSize: 32, color: C.text}}>{r}</div>
      </div>;
    })}
    {close ? <div style={{marginTop: 34, fontSize: 30, color: C.amber, opacity: prog(f, dur * 0.55, dur * 0.55 + 20)}}>Four lines. The array decides which ones you skip.</div> : null}
  </div>;
};

const FourQuestions: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', left: 100, top: 230, width: 1720, fontFamily: sans}}>
    <div style={{fontSize: 25, color: C.dim, letterSpacing: 1}}>STILL UNVERIFIED</div>
    {['Why Node B stops', 'What PowerStore runs on a 72-hour schedule', 'Why Node A does not rejoin after its reboot', 'What the data-path dump actually shows'].map((q, i) => {
      const a = prog(f, dur * (0.08 + i * 0.1), dur * (0.08 + i * 0.1) + 20);
      return <div key={q} style={{marginTop: 20, fontSize: 33, color: C.text, opacity: a}}>
        <span style={{fontFamily: mono, color: C.purple, marginRight: 16}}>{i + 1}.</span>{q}
      </div>;
    })}
    <div style={{marginTop: 40, fontSize: 40, color: C.amber, lineHeight: 1.35, opacity: prog(f, dur * 0.62, dur * 0.62 + 24)}}>The sequence is recorded. The cause is still Dell&apos;s to answer.</div>
  </div>
);

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  if (id === '0.1') return <ColdCard f={f} dur={dur} />;
  if (id === '0.2') return <HourRing f={f} dur={dur} />;
  if (id === '0.3') return <RecordedInferred f={f} dur={dur} mode="teaser" />;
  if (id === '4.2') return <CallTrace f={f} dur={dur} />;
  if (id === '6.1') return <UptimeBars f={f} dur={dur} />;
  if (id === '6.3') return <JournalPanel f={f} dur={dur} />;
  if (id === '6.4') return <RecordedInferred f={f} dur={dur} mode="open" />;
  if (id === '7.1') return <RecoverySteps f={f} dur={dur} />;
  if (id === '7.2') return <ExactTimes f={f} dur={dur} />;
  if (id === '7.3') return <Checklist f={f} dur={dur} />;
  if (id === '7.5') return <Checklist f={f} dur={dur} close />;
  if (id === '7.6') return <FourQuestions f={f} dur={dur} />;
  const d = PANEL_DATA[id];
  if (!d) return null;
  const a = prog(f, 0, 22);
  return <Box style={{borderColor: d.color ?? C.blue, opacity: a}}>
    <div style={{fontSize: 29, fontWeight: 700, color: d.color ?? C.blue, marginBottom: 6}}>{d.title}</div>
    {d.rows.map((r, i) => <Row key={r} text={r} i={i} f={f} dur={dur} mono={d.mono} size={d.size} color={i === d.rows.length - 1 ? (d.color ?? C.text) : C.text} />)}
  </Box>;
};

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (!def || !card) return null;
  const a = prog(f, 0, 26);
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans, opacity: a}}>
    <div style={{position: 'absolute', left: 110, top: 300, width: 640}}>
      <div style={{fontFamily: mono, fontSize: 22, color: C.blue, letterSpacing: 1}}>{card.kind.toUpperCase()}</div>
      <div style={{fontFamily: mono, fontSize: 40, fontWeight: 700, color: C.text, marginTop: 12, lineHeight: 1.2, overflowWrap: 'break-word'}}>{card.name}</div>
      <div style={{fontSize: 26, color: C.dim, marginTop: 18, fontStyle: 'italic', lineHeight: 1.4}}>{card.role}</div>
      <div style={{marginTop: 40, fontFamily: mono, fontSize: 20, color: C.faint}}>{id.startsWith('1') ? `beat ${id}` : ''}</div>
    </div>
    <GlossaryPanel d={def} p={prog(f, dur * 0.1, dur * 0.1 + 24)} x={840} y={215} w={1010} />
  </div>;
};
