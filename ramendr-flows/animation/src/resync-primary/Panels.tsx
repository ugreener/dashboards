import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

const Box: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', left: 990, top: 200, width: 890, padding: '24px 28px', border: `2px solid ${C.blue}`, borderRadius: 18, background: `${C.bg}f4`, fontFamily: sans, boxShadow: '0 20px 60px #000c', ...style}}>{children}</div>
);

const Row: React.FC<{text: React.ReactNode; i: number; f: number; dur: number; color?: string; mono?: boolean; size?: number}> = ({text, i, f, dur, color = C.text, mono: isMono, size = 24}) => {
  const a = prog(f, dur * (0.04 + i * 0.06), dur * (0.04 + i * 0.06) + 22);
  return <div style={{marginTop: 14, fontSize: size, lineHeight: 1.35, color, fontFamily: isMono ? mono : sans, opacity: a, transform: `translateX(${(1 - a) * 20}px)`, overflowWrap: 'break-word'}}>{text}</div>;
};

const Chip: React.FC<{t: string; c: string; a?: number}> = ({t, c, a = 1}) => (
  <span style={{display: 'inline-block', opacity: a, padding: '3px 12px', borderRadius: 999, border: `1.5px solid ${c}`, background: `${c}1c`, color: c, fontFamily: mono, fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap'}}>{t}</span>
);

/** Syntax-light code panel for the side column. */
const CodePanel: React.FC<{title: string; lines: string[]; hl?: number[]; f: number; dur: number; x?: number; y?: number; w?: number; h?: number}> = ({title, lines, hl = [], f, dur, x = 1000, y = 210, w = 870, h}) => {
  const a = prog(f, 0, 22);
  const tokens = (line: string) => {
    const parts = line.split(/(\b(?:switch|case|if|return|func|func\s*\(|for|range|nil|true|false)\b|\/\/.*$)/g).filter(Boolean);
    return parts.map((p, i) => {
      if (p.startsWith('//')) return <span key={i} style={{color: C.faint}}>{p}</span>;
      if (/^(switch|case|if|return|func|for|range|nil|true|false)$/.test(p)) return <span key={i} style={{color: C.purple}}>{p}</span>;
      return <span key={i}>{p}</span>;
    });
  };
  return <div style={{position: 'absolute', left: x, top: y, width: w, opacity: a, transform: `translateX(${(1 - a) * 50}px)`, background: `${C.bg}f7`, border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 70px #000d', height: h}}>
    <div style={{padding: '10px 16px', background: C.panel, borderBottom: `1px solid ${C.border}`, fontFamily: mono, fontSize: 15, color: C.dim, display: 'flex', gap: 8, alignItems: 'center'}}>
      <span style={{width: 11, height: 11, borderRadius: 6, background: C.red}} />
      <span style={{width: 11, height: 11, borderRadius: 6, background: C.amber}} />
      <span style={{width: 11, height: 11, borderRadius: 6, background: C.green}} />
      <span style={{marginLeft: 10}}>{title}</span>
    </div>
    <div style={{padding: '12px 0'}}>
      {lines.map((l, i) => <div key={i} style={{display: 'flex', gap: 14, padding: '2px 16px', background: hl.includes(i) ? `${C.amber}1c` : undefined, borderLeft: `4px solid ${hl.includes(i) ? C.amber : 'transparent'}`}}>
        <span style={{width: 26, textAlign: 'right', color: C.faint, fontFamily: mono, fontSize: 15, lineHeight: 1.55, flex: 'none'}}>{i + 1}</span>
        <span style={{fontFamily: mono, fontSize: 18, lineHeight: 1.55, color: hl.includes(i) ? C.text : C.dim, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{tokens(l)}</span>
      </div>)}
    </div>
  </div>;
};

export const PANEL_BEATS = new Set(['3.1', '3.2', '3.3', '3.5', '4.1', '4.3', '4.4', '4.5', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6']);

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.1') return <TwoSites f={f} dur={dur} />;
  if (id === '1.7') return <ChainScene f={f} dur={dur} />;
  if (!card || !def) return null;
  return <div style={{position: 'absolute', inset: 0, opacity: prog(f, -20, 24)}}>
    <div style={{position: 'absolute', left: 100, top: 170, color: C.purple, fontFamily: mono, fontSize: 21}}>CAST OF CHARACTERS</div>
    <Card x={100} y={300} w={660} kind={card.kind} name={card.name} role={card.role} nameSize={card.name.length > 28 ? 18 : 28} appear={prog(f, -10, 24)} color={C.cyan} />
    <GlossaryPanel d={def} p={prog(f, dur * 0.03, dur * 0.75)} x={850} y={220} w={990} />
  </div>;
};

const TwoSites: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 175, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>THE PHYSICAL PICTURE</div>
    {([
      ['SITE A', 'PRIMARY', 'serves input and output', 'the live copy', C.green, 120],
      ['SITE B', 'SECONDARY', 'receives changes and stays ready', 'the standby copy', C.cyan, 980],
    ] as [string, string, string, string, string, number][]).map(([site, role, sub, tag, col, x], i) => <div key={site as string} style={{position: 'absolute', left: x as number, top: 250, width: 760, padding: '30px 34px', border: `2px solid ${col}`, borderRadius: 20, background: `${col}10`, opacity: prog(f, dur * (0.05 + i * 0.1), dur * (0.05 + i * 0.1) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 20, color: col, letterSpacing: 2}}>{site}</div>
      <div style={{fontSize: 58, fontWeight: 800, color: C.text, marginTop: 10}}>{role}</div>
      <div style={{fontSize: 28, color: C.dim, marginTop: 12}}>{sub}</div>
      <div style={{marginTop: 22}}><Chip t={tag as string} c={col as string} /></div>
    </div>)}
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <path d="M890,470 L960,470" stroke={C.orange} strokeWidth={7} markerEnd="url(#tipTS)" />
      <defs><marker id="tipTS" markerWidth={12} markerHeight={12} refX={9} refY={4} orient="auto"><path d="M0,0 L0,8 L11,4 z" fill={C.orange} /></marker></defs>
    </svg>
    <div style={{position: 'absolute', left: 110, top: 680, width: 1660, fontSize: 34, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.55, dur * 0.55 + 24)}}>
      Primary and secondary describe the <span style={{color: C.amber, fontWeight: 700}}>current job</span>. They do not belong permanently to a site.
    </div>
  </div>
);

const ChainScene: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const rows: [string, string][] = [
    ['DRPlacementControl', 'asks for the move and records the progression'],
    ['VolumeReplicationGroup', 'coordinates every protected disk on one site'],
    ['VolumeReplication', 'carries one disk and its requested role'],
    ['csi-addons controller', 'translates the role into CSI driver calls'],
    ['Dell CSI driver', 'executes the call against the array'],
    ['PowerStore session', 'the only place where data actually moves'],
  ];
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 165, fontSize: 40, color: C.text, fontWeight: 700}}>One chain, top to bottom</div>
    {rows.map(([name, role], i) => <div key={name} style={{position: 'absolute', left: 110, top: 265 + i * 112, width: 1680, display: 'flex', gap: 30, alignItems: 'center', opacity: prog(f, dur * (0.04 + i * 0.08), dur * (0.04 + i * 0.08) + 22)}}>
      <div style={{width: 520, fontSize: 31, fontWeight: 700, color: i === rows.length - 1 ? C.array : C.cyan}}>{name}</div>
      <div style={{fontSize: 27, color: C.text}}>{role}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 925, fontSize: 25, color: C.dim}}>The console shows the top of this chain, not the bottom.</div>
  </div>;
};

const CephPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.green}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.green, marginBottom: 6}}>Ceph expects the secondary</div>
    <Row text="The demoted old site is the side that can start receiving again." i={0} f={f} dur={dur} />
    <Row text="The upstream secondary branch calls ResyncVolume there." i={1} f={f} dur={dur} />
    <Row text="The same path has worked for Ceph for years." i={2} f={f} dur={dur} />
    <div style={{marginTop: 26, padding: '18px 20px', borderLeft: `5px solid ${C.green}`, background: `${C.green}12`, fontSize: 26, color: C.text, opacity: prog(f, dur * 0.55, dur * 0.55 + 22)}}>No change is needed for Ceph. The annotation is what protects that behaviour.</div>
  </Box>
);

const DriverPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <>
    <CodePanel title="dell/csi-powerstore · pkg/controller/csiaddons_replication.go" f={f} dur={dur} y={185} lines={[
      'switch replicationSession.State {',
      'case RsStateFailedOver:',
      '    if localIsPrimary {',
      '        // local role Source, the new primary',
      '        ExecuteAction(RsActionReprotect)',
      '        return Ready: false',
      '    }',
      '    if localIsSecondary {',
      '        // local role Destination, the old site',
      '        return OutOfRange',
      '        "waiting for Source-side Resync"',
      '    }',
      '}',
    ]} hl={[3, 4, 5, 8, 9, 10]} h={520} />
    <div style={{position: 'absolute', left: 1000, top: 730, width: 870, padding: '18px 22px', border: `2px solid ${C.purple}`, borderRadius: 14, background: `${C.purple}10`, fontFamily: sans, opacity: prog(f, dur * 0.5, dur * 0.5 + 22)}}>
      <div style={{fontFamily: mono, fontSize: 16, color: C.purple, letterSpacing: 1}}>REPROTECT</div>
      <div style={{fontSize: 22, color: C.text, marginTop: 6, lineHeight: 1.35}}>The PowerStore action that reverses a failed-over pair, so the new primary becomes the source and the old site receives again.</div>
    </div>
  </>
);

const RoleTable: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const rows: [string, string, string, string, string][] = [
    ['B · active', 'primary', 'Source', 'Reprotect', C.green],
    ['A · old site', 'secondary', 'Destination', 'OutOfRange', C.red],
  ];
  return <Box style={{borderColor: C.amber}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.amber, marginBottom: 18}}>The call must go to B</div>
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr 1.1fr', gap: 12, fontFamily: mono, fontSize: 17, color: C.faint, borderBottom: `1px solid ${C.border}`, paddingBottom: 10}}>
      <div>SITE</div><div>VOLUME-REPLICATION</div><div>ARRAY ROLE</div><div>WHAT THE DRIVER DOES</div>
    </div>
    {rows.map(([site, vr, role, action, col], i) => <div key={site} style={{display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr 1.1fr', gap: 12, padding: '18px 0', borderBottom: `1px solid ${C.border}`, opacity: prog(f, dur * (0.1 + i * 0.18), dur * (0.1 + i * 0.18) + 22)}}>
      <div style={{fontSize: 21, color: C.text, fontWeight: 700}}>{site}</div>
      <div style={{fontFamily: mono, fontSize: 19, color: C.dim}}>{vr}</div>
      <div style={{fontFamily: mono, fontSize: 19, color: C.dim}}>{role}</div>
      <div style={{fontFamily: mono, fontSize: 19, color: col, fontWeight: 700}}>{action}</div>
    </div>)}
    <div style={{marginTop: 24, fontSize: 24, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.6, dur * 0.6 + 22)}}>B holds the array Source role. Only the Source can reverse the session. The old site cannot do it from the Destination role.</div>
  </Box>;
};

const PatchPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <CodePanel title="redhat-dr/kubernetes-csi-addons · rhdr: call resync on primary" f={f} dur={dur} y={190} lines={[
    'replicationErr = markVolumeAsPrimary(vr)',
    'if replicationErr == nil {',
    '    vr.force = spec.autoResync',
    '    resyncVolume()        // ResyncVolume',
    '}',
    '',
    'if resp.Error != nil {',
    '    if IsOutOfRangeError(resp.Error) {',
    '        return false, nil  // ignore the wrong side',
    '    }',
    '}',
  ]} hl={[3, 8, 9]} h={430} />
);

const BugPanel: React.FC<{f: number; dur: number; mode: 'race' | 'peer'}> = ({f, dur, mode}) => {
  const race = mode === 'race';
  const title = race ? 'The call can miss its moment' : 'The peer can block recovery';
  const rows = race
    ? [
      'The patch runs once, when the VR first becomes primary.',
      'If the session is not yet Failed_Over, the call returns already synchronized or in progress.',
      'The steady primary branch never asks again.',
      'A cleanup that arrives after that gap can wedge the failover.',
      'DFBUGS-12498. The exact stop point is unverified.',
    ]
    : [
      'On the primary, ResyncVolume immediately runs Reprotect.',
      'If the other array is powered off, Reprotect fails.',
      'csi-addons reports FailedToResync.',
      'Ramen sets DataReady=False.',
      'The kube-object restore never creates the VM.',
      'DFBUGS-12519. Re-protection gates recovery.',
    ];
  return <Box style={{borderColor: race ? C.amber : C.red}}>
    {race ? <div style={{fontFamily: mono, fontSize: 15, color: C.amber, letterSpacing: 1.5, marginBottom: 8}}>INFERRED FROM THE CODE AND LOGS</div> : null}
    <div style={{fontSize: 30, fontWeight: 700, color: race ? C.amber : C.red, marginBottom: 4}}>{title}</div>
    {rows.map((r, i) => <Row key={r} text={r} i={i} f={f} dur={dur} color={i === rows.length - 1 ? (race ? C.amber : C.red) : C.text} size={23} />)}
  </Box>;
};

const RequirementsPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.green}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.green, marginBottom: 18}}>What the fix must do</div>
    {[
      ['Trigger from the primary', 'because that is the side that can reverse the pair', C.green],
      ['Do not gate recovery on the peer', 'so a lost peer cannot stop the workload from starting', C.cyan],
    ].map(([t, s, col], i) => <div key={t} style={{display: 'flex', gap: 18, marginTop: 20, opacity: prog(f, dur * (0.1 + i * 0.2), dur * (0.1 + i * 0.2) + 24)}}>
      <div style={{fontSize: 34, color: col, lineHeight: 1}}>✓</div>
      <div><div style={{fontSize: 27, color: C.text, fontWeight: 700}}>{t}</div><div style={{fontSize: 22, color: C.dim, marginTop: 4}}>{s}</div></div>
    </div>)}
    <div style={{marginTop: 30, padding: '18px 20px', borderLeft: `5px solid ${C.red}`, background: `${C.red}10`, fontSize: 24, color: C.text, opacity: prog(f, dur * 0.55, dur * 0.55 + 22)}}>The first patch had the first property. It did not yet have the second.</div>
  </Box>
);

const OptionsPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.blue}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.blue, marginBottom: 12}}>Two ways to add the primary call</div>
    <div style={{display: 'flex', gap: 18, marginTop: 12}}>
      {[
        ['OPTION 1', 'Always resync on the primary', 'Ignore OutOfRange. Simple, but it changes the path for every vendor and would require Ceph to return the new error.', C.faint, false],
        ['OPTION 2', 'Use the existing Resync state', 'Opt in with a DRPC annotation. Ceph keeps its current behaviour. The resync is driven by a condition.', C.green, true],
      ].map(([tag, title, body, col, chosen], i) => <div key={tag as string} style={{width: 400, padding: '20px', border: `2px ${chosen ? 'solid' : 'dashed'} ${col}`, borderRadius: 14, background: `${col}0f`, opacity: prog(f, dur * (0.08 + i * 0.15), dur * (0.08 + i * 0.15) + 24)}}>
        <div style={{fontFamily: mono, fontSize: 16, color: col as string, letterSpacing: 1.5}}>{tag}</div>
        <div style={{fontSize: 24, fontWeight: 700, color: C.text, marginTop: 8, lineHeight: 1.3}}>{title}</div>
        <div style={{fontSize: 20, color: C.dim, marginTop: 10, lineHeight: 1.4}}>{body}</div>
        {chosen ? <div style={{marginTop: 14}}><Chip t="chosen" c={C.green} /></div> : null}
      </div>)}
    </div>
    <div style={{marginTop: 26, fontSize: 22, color: C.dim, lineHeight: 1.4, opacity: prog(f, dur * 0.55, dur * 0.55 + 22)}}>The decision was option 2, to keep Ceph backward compatible.</div>
  </Box>
);

const AnnotationPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <CodePanel title="DRPlacementControl · the opt-in switch" f={f} dur={dur} y={190} lines={[
    'apiVersion: ramendr.openshift.io/v1alpha1',
    'kind: DRPlacementControl',
    'metadata:',
    '  name: hammerdb-drpc',
    '  namespace: openshift-dr-ops',
    '  annotations:',
    '    drplacementcontrol.ramendr.openshift.io/resync-on-primary: "true"',
    '',
    '# absent  -> old behaviour, Ceph unchanged',
    '# present -> Ramen enables the primary-side path',
  ]} hl={[6, 8, 9]} h={430} />
);

const SignalPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.amber}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.amber, marginBottom: 8}}>The signal is a condition</div>
    <div style={{marginTop: 14, padding: '18px 20px', border: `2px solid ${C.amber}`, borderRadius: 14, background: `${C.amber}10`, opacity: prog(f, dur * 0.08, dur * 0.08 + 22)}}>
      <div style={{fontFamily: mono, fontSize: 23, color: C.text}}>Replicating = False</div>
      <div style={{fontSize: 22, color: C.dim, marginTop: 6}}>on a VolumeReplication whose spec is primary</div>
    </div>
    <Row text="It means: I am primary, but I am not copying to a secondary." i={0} f={f} dur={dur} />
    <Row text="The VRG checks it on every reconcile, not once at promotion." i={1} f={f} dur={dur} />
    <Row text="That is the difference between a one-shot call and a level-triggered repair." i={2} f={f} dur={dur} color={C.amber} />
  </Box>
);

const StatePanel: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const steps = [
    ['primary', 'the volume is promoted and serving', C.green],
    ['resync', 'force a reverse copy', C.purple],
    ['primary', 'promote again after the copy completes', C.green],
  ];
  const active = f < dur * 0.3 ? 0 : f < dur * 0.65 ? 1 : 2;
  return <Box style={{borderColor: C.purple}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.purple}}>The state machine</div>
    <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 24}}>
      {steps.map(([name, sub, col], i) => <React.Fragment key={i}>
        <div style={{padding: '16px 18px', borderRadius: 12, border: `2px solid ${col}`, background: i === active ? `${col}28` : `${C.panel}cc`, opacity: i <= active ? 1 : 0.45, minWidth: 200}}>
          <div style={{fontFamily: mono, fontSize: 22, color: col, fontWeight: 700}}>{name}</div>
          <div style={{fontSize: 16, color: C.dim, marginTop: 4}}>{sub}</div>
        </div>
        {i < steps.length - 1 ? <div style={{color: C.faint, fontSize: 22}}>then</div> : null}
      </React.Fragment>)}
    </div>
    <Row text="Set resync when Replicating=False." i={0} f={f} dur={dur} />
    <Row text="Wait until Degraded=False and Resyncing=False." i={1} f={f} dur={dur} />
    <Row text="Then return to primary, so the volume is promoted again." i={2} f={f} dur={dur} />
    <div style={{marginTop: 20, fontSize: 20, color: C.dim, opacity: prog(f, dur * 0.55, dur * 0.55 + 22)}}>Global VGRs shared with sibling VRGs are skipped. Removing the annotation returns the volume to primary.</div>
  </Box>;
};

const ConditionsPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.green}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.green, marginBottom: 10}}>Two different answers</div>
    {[
      ['DataReady', 'True', 'the workload can start and serve', C.green],
      ['DataProtected', 'Progressing', 'the reverse copy is still catching up', C.amber],
      ['ReplicationHealthy', 'False', 'this is not yet a healthy pair', C.red],
    ].map(([k, v, s, col], i) => <div key={k as string} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '16px 0', borderBottom: `1px solid ${C.border}`, opacity: prog(f, dur * (0.08 + i * 0.14), dur * (0.08 + i * 0.14) + 22)}}>
      <div style={{width: 240, fontFamily: mono, fontSize: 20, color: C.dim}}>{k}</div>
      <div style={{width: 170}}><Chip t={v as string} c={col as string} /></div>
      <div style={{fontSize: 21, color: C.text, flex: 1}}>{s}</div>
    </div>)}
    <div style={{marginTop: 24, fontSize: 25, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.55, dur * 0.55 + 22)}}>Local readiness and remote protection are separate answers. The first is what lets the VM start.</div>
  </Box>
);

const SplitPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.cyan}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.cyan, marginBottom: 8}}>Where the trigger lives</div>
    <div style={{display: 'flex', gap: 18, marginTop: 16}}>
      {[
        ['RAMEN BRANCH', 'Ramen flips the VolumeReplication to resync and back.', 'built in the candidate branch', C.green],
        ['LATER BRANCH', 'Ramen copies the annotation down to the VR.', 'csi-addons would act on it', C.amber],
      ].map(([tag, body, sub, col], i) => <div key={tag as string} style={{width: 390, padding: '20px', border: `2px solid ${col}`, borderRadius: 14, background: `${col}10`, opacity: prog(f, dur * (0.1 + i * 0.18), dur * (0.1 + i * 0.18) + 24)}}>
        <div style={{fontFamily: mono, fontSize: 16, color: col as string, letterSpacing: 1.5}}>{tag}</div>
        <div style={{fontSize: 23, color: C.text, marginTop: 10, lineHeight: 1.4}}>{body}</div>
        <div style={{fontSize: 19, color: C.dim, marginTop: 10}}>{sub}</div>
      </div>)}
    </div>
    <div style={{marginTop: 24, padding: '16px 20px', borderLeft: `5px solid ${C.red}`, background: `${C.red}10`, fontSize: 21, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.55, dur * 0.55 + 22)}}>The VR annotation key is defined locally in Ramen until csi-addons defines it. No consumer is published yet, so the second split is intent, not a shipped path.</div>
  </Box>
);

const StatusPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const rows: [string, string, string, string][] = [
    ['VIRTDR-167', 'Closed', 'driver + RHDR csi-addons', C.green],
    ['VIRTDR-478', 'In Progress', 'implement in Ramen', C.amber],
    ['VIRTDR-477', 'New', 'upstream the Ramen and csi-addons parts', C.blue],
    ['DFBUGS-6801', 'Assigned', 'product RFE', C.purple],
    ['csi-addons#1200', 'Open', 'design discussion', C.orange],
  ];
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 120, top: 170, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>WHERE THE PIECES STAND</div>
    {rows.map(([k, state, what, col], i) => <div key={k} style={{position: 'absolute', left: 120, top: 250 + i * 118, width: 1680, display: 'flex', alignItems: 'center', gap: 26, opacity: prog(f, dur * (0.05 + i * 0.1), dur * (0.05 + i * 0.1) + 22)}}>
      <div style={{width: 300, fontFamily: mono, fontSize: 27, color: C.text, fontWeight: 700}}>{k}</div>
      <div style={{width: 220}}><Chip t={state} c={col} /></div>
      <div style={{fontSize: 27, color: C.dim}}>{what}</div>
    </div>)}
    <div style={{position: 'absolute', left: 120, top: 880, fontSize: 23, color: C.dim}}>The lab image has no source label, so exact commit provenance is unverified.</div>
  </div>;
};

const CaveatPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 170, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>WHAT THE OPEN DESIGN STILL OWES</div>
    <div style={{position: 'absolute', left: 110, top: 240, width: 820, padding: '24px 26px', border: `2px solid ${C.amber}`, borderRadius: 18, background: `${C.amber}0e`, opacity: prog(f, dur * 0.06, dur * 0.06 + 24)}}>
      <div style={{fontSize: 26, fontWeight: 700, color: C.amber}}>The maintainer position</div>
      {['Some backends need the primary-side call.', 'The trigger timing and automation drawbacks need agreement.', 'The change touches the spec, the drivers and csi-addons.'].map((r, i) => <div key={r} style={{marginTop: 16, fontSize: 23, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * (0.14 + i * 0.1), dur * (0.14 + i * 0.1) + 20)}}>{r}</div>)}
    </div>
    <div style={{position: 'absolute', left: 1000, top: 240, width: 810, padding: '24px 26px', border: `2px solid ${C.red}`, borderRadius: 18, background: `${C.red}0e`, opacity: prog(f, dur * 0.3, dur * 0.3 + 24)}}>
      <div style={{fontSize: 26, fontWeight: 700, color: C.red}}>Until the Ramen side is merged</div>
      {['A failover can still end with sessions Failed_Over.', 'The application can run without a standby copy.', 'The lab workaround is an array-side Reprotect.', 'It is a recovery step, not a fix.'].map((r, i) => <div key={r} style={{marginTop: 16, fontSize: 23, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * (0.36 + i * 0.1), dur * (0.36 + i * 0.1) + 20)}}>{r}</div>)}
    </div>
    <div style={{position: 'absolute', left: 110, top: 690, width: 1700, fontSize: 28, color: C.dim, lineHeight: 1.4, opacity: prog(f, dur * 0.62, dur * 0.62 + 24)}}>The need is not in dispute. The shape of the fix is.</div>
  </div>
);

const RecapPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 160, fontSize: 29, letterSpacing: 2, color: C.blue, fontWeight: 700}}>THE CHAIN IN FOUR LINES</div>
    {[
      ['Ceph', 'reverses on the secondary.', C.green],
      ['PowerStore', 'reverses on the primary, through Reprotect.', C.orange],
      ['The first patch', 'called the primary once, at promotion.', C.amber],
      ['The redesign', 'calls it while Replicating=False, and keeps DataReady true.', C.cyan],
    ].map(([k, v, col], i) => <div key={k} style={{position: 'absolute', left: 110, top: 235 + i * 95, width: 1700, display: 'flex', gap: 28, opacity: prog(f, dur * (0.04 + i * 0.08), dur * (0.04 + i * 0.08) + 22)}}>
      <div style={{width: 320, fontSize: 30, fontWeight: 700, color: col as string}}>{k}</div>
      <div style={{fontSize: 29, color: C.text}}>{v}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 660, width: 1700, padding: '26px 30px', border: `3px solid ${C.green}`, borderRadius: 18, background: `${C.green}10`, opacity: prog(f, dur * 0.5, dur * 0.5 + 24)}}>
      <div style={{fontSize: 23, letterSpacing: 2, color: C.green, fontFamily: mono}}>REMEMBER THIS</div>
      <div style={{fontSize: 38, color: C.text, lineHeight: 1.35, marginTop: 10}}>Ask the side that can actually reverse the copy. Do not let the reverse copy gate recovery.</div>
    </div>
  </div>
);

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  if (id === '0.1') return <ColdOpen1 f={f} dur={dur} />;
  if (id === '0.2') return <ColdOpen2 f={f} dur={dur} />;
  if (id === '0.3') return <ScopeCard f={f} dur={dur} />;
  if (id === '3.1') return <CodePanel title="csi-addons · internal/controller/replication.storage/volumereplication_controller.go" f={f} dur={dur} y={190} lines={[
    'switch instance.Spec.ReplicationState {',
    'case Primary:',
    '    if status.State != PrimaryState {',
    '        enableReplication()',
    '        markVolumeAsPrimary()   // PromoteVolume',
    '    }                                // no resync here',
    'case Secondary:',
    '    markVolumeAsSecondary()     // DemoteVolume',
    '    vr.force = spec.autoResync',
    '    resyncVolume()              // ResyncVolume',
    'case Resync:',
    '    vr.force = true',
    '    resyncVolume()',
    '}',
  ]} hl={[3, 4, 5, 6, 9, 12]} h={520} />;
  if (id === '3.2') return <CephPanel f={f} dur={dur} />;
  if (id === '3.3') return <DriverPanel f={f} dur={dur} />;
  if (id === '3.5') return <RoleTable f={f} dur={dur} />;
  if (id === '4.1') return <PatchPanel f={f} dur={dur} />;
  if (id === '4.3') return <BugPanel f={f} dur={dur} mode="race" />;
  if (id === '4.4') return <BugPanel f={f} dur={dur} mode="peer" />;
  if (id === '4.5') return <RequirementsPanel f={f} dur={dur} />;
  if (id === '5.1') return <OptionsPanel f={f} dur={dur} />;
  if (id === '5.2') return <AnnotationPanel f={f} dur={dur} />;
  if (id === '5.3') return <SignalPanel f={f} dur={dur} />;
  if (id === '5.4') return <StatePanel f={f} dur={dur} />;
  if (id === '5.5') return <ConditionsPanel f={f} dur={dur} />;
  if (id === '5.6') return <SplitPanel f={f} dur={dur} />;
  if (id === '6.1') return <StatusPanel f={f} dur={dur} />;
  if (id === '6.2') return <CaveatPanel f={f} dur={dur} />;
  if (id === '6.3') return <RecapPanel f={f} dur={dur} />;
  return null;
};

const ColdOpen1: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 90, top: 165, fontSize: 24, letterSpacing: 2, color: C.amber, fontFamily: mono}}>AFTER A FAILOVER</div>
    <div style={{position: 'absolute', left: 90, top: 210, width: 900, fontSize: 62, fontWeight: 800, color: C.text, lineHeight: 1.12}}>The application is back.<br />The standby is not.</div>
    <div style={{position: 'absolute', left: 90, top: 390, width: 820, fontSize: 27, color: C.dim, lineHeight: 1.45, opacity: prog(f, dur * 0.15, dur * 0.15 + 24)}}>Site B serves input and output. Site A is online again. The two arrays still read Failed_Over, and nothing is copying between them.</div>
    <div style={{position: 'absolute', left: 90, top: 585, width: 820, padding: '22px 26px', borderLeft: `6px solid ${C.red}`, background: `${C.panel}cc`, fontSize: 27, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.42, dur * 0.42 + 24)}}>Something has to tell the storage to copy back. <span style={{color: C.red, fontWeight: 700}}>Which side gets that command?</span></div>
    <div style={{position: 'absolute', left: 1010, top: 225, width: 820}}>
      <div style={{display: 'flex', gap: 18}}>
        {['A', 'B'].map((s, i) => <div key={s} style={{width: 390, padding: '24px 26px', borderRadius: 18, border: `2px solid ${i === 1 ? C.green : C.red}`, background: i === 1 ? `${C.green}12` : `${C.red}10`, opacity: prog(f, dur * (0.2 + i * 0.12), dur * (0.2 + i * 0.12) + 24)}}>
          <div style={{fontFamily: mono, fontSize: 19, color: i === 1 ? C.green : C.red}}>SITE {s}</div>
          <div style={{fontSize: 34, fontWeight: 700, color: C.text, marginTop: 8}}>{i === 1 ? 'running' : 'stale'}</div>
          <div style={{fontSize: 20, color: C.dim, marginTop: 6}}>{i === 1 ? 'serves the workload' : 'no current copy'}</div>
        </div>)}
      </div>
      <div style={{marginTop: 22, padding: '20px 24px', borderRadius: 18, border: `2px dashed ${C.red}`, background: `${C.red}0c`, opacity: prog(f, dur * 0.5, dur * 0.5 + 24)}}>
        <div style={{fontFamily: mono, fontSize: 18, color: C.red, letterSpacing: 1}}>REPLICATION PAIR</div>
        <div style={{fontSize: 30, color: C.text, marginTop: 8}}>Failed_Over</div>
        <div style={{fontFamily: mono, fontSize: 18, color: C.dim, marginTop: 6}}>no data movement</div>
      </div>
    </div>
  </div>
);

const ColdOpen2: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 110, top: 160, fontSize: 24, letterSpacing: 2, color: C.blue, fontFamily: mono}}>SAME QUESTION · TWO STORAGE VENDORS</div>
    <div style={{position: 'absolute', left: 110, top: 205, fontSize: 54, fontWeight: 800, color: C.text}}>The answer depends on the array.</div>
    {[
      ['CEPH', 'resync on the secondary', 'the demoted old site starts receiving', C.green, 110],
      ['POWERSTORE', 'resync on the primary', 'the new active site executes Reprotect', C.orange, 1000],
    ].map(([name, answer, sub, col, x], i) => <div key={name as string} style={{position: 'absolute', left: x as number, top: 330, width: 810, padding: '30px 34px', border: `2px solid ${col}`, borderRadius: 20, background: `${col}0e`, opacity: prog(f, dur * (0.08 + i * 0.12), dur * (0.08 + i * 0.12) + 24)}}>
      <div style={{fontFamily: mono, fontSize: 20, color: col as string, letterSpacing: 2}}>{name}</div>
      <div style={{fontSize: 40, fontWeight: 700, color: C.text, marginTop: 12, lineHeight: 1.2}}>{answer}</div>
      <div style={{fontSize: 24, color: C.dim, marginTop: 10}}>{sub}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 600, width: 1700, padding: '24px 28px', border: `2px solid ${C.red}`, borderRadius: 16, background: `${C.red}0e`, opacity: prog(f, dur * 0.45, dur * 0.45 + 24)}}>
      <div style={{fontSize: 32, color: C.text, lineHeight: 1.4}}>The controller currently calls the secondary. On PowerStore, that call is rejected, and <span style={{color: C.red, fontWeight: 700}}>the primary is never asked</span>.</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 760, fontSize: 22, color: C.faint, fontFamily: mono}}>Conceptual explainer · no recorded run</div>
  </div>
);

const ScopeCard: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 140, top: 200, width: 1640}}>
      <div style={{fontFamily: mono, fontSize: 21, color: C.amber, letterSpacing: 2}}>SCOPE · WHAT THIS IS BUILT FROM</div>
      <div style={{fontSize: 50, fontWeight: 800, color: C.text, marginTop: 18, lineHeight: 1.2}}>A design change, explained from the code.</div>
      {[
        ['The open issue', 'csi-addons/kubernetes-csi-addons#1200', C.blue],
        ['The downstream patch', 'redhat-dr/kubernetes-csi-addons · rhdr: call resync on primary', C.purple],
        ['The driver source', 'dell/csi-powerstore · ResyncVolume', C.orange],
        ['The failure modes', 'DFBUGS-12498 and DFBUGS-12519, used as labelled examples', C.red],
      ].map(([k, v, col], i) => <div key={k as string} style={{display: 'flex', gap: 24, marginTop: 26, opacity: prog(f, dur * (0.12 + i * 0.1), dur * (0.12 + i * 0.1) + 22)}}>
        <div style={{width: 330, fontSize: 22, color: col as string, fontWeight: 700}}>{k}</div>
        <div style={{fontFamily: mono, fontSize: 21, color: C.dim}}>{v}</div>
      </div>)}
      <div style={{marginTop: 40, padding: '22px 26px', borderLeft: `6px solid ${C.green}`, background: `${C.panel}cc`, fontSize: 27, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.55, dur * 0.55 + 24)}}>Where a cause is inferred rather than proven, the video says so. This is not a failover run, and it does not start one.</div>
    </div>
  </div>
);
