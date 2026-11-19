import React from 'react';
import {C, mono, sans} from '../theme';
import {Card} from '../components/primitives';
import {Def, GlossaryPanel} from '../components/newcomer';
import {prog} from '../lib/anim';

const Box: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', left: 985, top: 190, width: 900, padding: '24px 28px', border: `2px solid ${C.blue}`, borderRadius: 18, background: C.bg, fontFamily: sans, boxShadow: '0 20px 60px #000c', ...style}}>{children}</div>
);

const Row: React.FC<{text: React.ReactNode; i: number; f: number; dur: number; color?: string; mono?: boolean; size?: number}> = ({text, i, f, dur, color = C.text, mono: isMono, size = 24}) => {
  const a = prog(f, dur * (0.04 + i * 0.06), dur * (0.04 + i * 0.06) + 22);
  return <div style={{marginTop: 14, fontSize: size, lineHeight: 1.35, color, fontFamily: isMono ? mono : sans, opacity: a, transform: `translateX(${(1 - a) * 20}px)`, overflowWrap: 'break-word'}}>{text}</div>;
};

const Chip: React.FC<{t: string; c: string; a?: number}> = ({t, c, a = 1}) => (
  <span style={{display: 'inline-block', opacity: a, padding: '3px 12px', borderRadius: 999, border: `1.5px solid ${c}`, background: `${c}1c`, color: c, fontFamily: mono, fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap'}}>{t}</span>
);

const CodePanel: React.FC<{title: string; lines: string[]; hl?: number[]; f: number; dur: number; x?: number; y?: number; w?: number; h?: number}> = ({title, lines, hl = [], f, dur, x = 1000, y = 205, w = 870, h}) => {
  const a = prog(f, 0, 22);
  const tokens = (line: string) => {
    const parts = line.split(/(\b(?:apiVersion|kind|metadata|name|namespace|spec|parameters|sourceArray|targetArray|remoteSystem|rpo|schedulingInterval|autoResync|replicationState|primary|status|state|message|reason|grouping|storageClassName|storageID|replicationID|groupreplicationID|true|false)\b|#.*$)/g).filter(Boolean);
    return parts.map((p, i) => {
      if (p.startsWith('#')) return <span key={i} style={{color: C.faint}}>{p}</span>;
      if (/^(apiVersion|kind|metadata|name|namespace|spec|parameters|status|state|message|reason)$/.test(p)) return <span key={i} style={{color: C.purple}}>{p}</span>;
      if (/^(sourceArray|targetArray|remoteSystem|rpo|schedulingInterval|autoResync|replicationState|grouping|storageClassName|storageID|replicationID|groupreplicationID)$/.test(p)) return <span key={i} style={{color: C.cyan}}>{p}</span>;
      if (/^(primary|true|false)$/.test(p)) return <span key={i} style={{color: C.green}}>{p}</span>;
      return <span key={i}>{p}</span>;
    });
  };
  return <div style={{position: 'absolute', left: x, top: y, width: w, opacity: a, transform: `translateX(${(1 - a) * 50}px)`, background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 70px #000d', height: h}}>
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

export const PANEL_BEATS = new Set(['2.6', '2.7', '3.2', '3.3', '5.1', '5.2', '5.3']);

export const GlossaryScene: React.FC<{id: string; f: number; dur: number; card?: {kind: string; name: string; role: string}; def?: Def}> = ({id, f, dur, card, def}) => {
  if (id === '1.1') return <TwoSites f={f} dur={dur} />;
  if (id === '1.2') return <ClaimScene f={f} dur={dur} />;
  if (id === '1.3') return <PerDiskScene f={f} dur={dur} />;
  if (id === '1.4') return <GroupScene f={f} dur={dur} />;
  if (id === '1.5') return <ChainScene f={f} dur={dur} />;
  if (!card || !def) return null;
  return <div style={{position: 'absolute', inset: 0, opacity: prog(f, -20, 24)}}>
    <div style={{position: 'absolute', left: 100, top: 170, color: C.purple, fontFamily: mono, fontSize: 21}}>CAST OF CHARACTERS</div>
    <Card x={100} y={300} w={720} kind={card.kind} name={card.name} role={card.role} nameSize={card.name.length > 30 ? 16 : 26} appear={prog(f, -10, 24)} color={C.cyan} />
    <GlossaryPanel d={def} p={prog(f, dur * 0.03, dur * 0.75)} x={860} y={220} w={980} />
  </div>;
};

const TwoSites: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 165, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>THE PHYSICAL PICTURE</div>
    <div style={{position: 'absolute', left: 110, top: 215, fontSize: 46, color: C.text, fontWeight: 800}}>Two sites, two arrays, one live copy.</div>
    {([
      ['SPOKE-0 · edge95', 'HOME', 'VSA-A · serves input and output', 'the live copy', C.green, 110],
      ['SPOKE-1 · edge97', 'TARGET', 'VSA-B · receives copies and stays ready', 'the standby copy', C.cyan, 1000],
    ] as [string, string, string, string, string, number][]).map(([site, role, sub, tag, col, x], i) => <div key={site} style={{position: 'absolute', left: x, top: 320, width: 800, padding: '30px 34px', border: `2px solid ${col}`, borderRadius: 20, background: `${col}10`, opacity: prog(f, dur * (0.05 + i * 0.1), dur * (0.05 + i * 0.1) + 26)}}>
      <div style={{fontFamily: mono, fontSize: 20, color: col, letterSpacing: 1}}>{site}</div>
      <div style={{fontSize: 54, fontWeight: 800, color: C.text, marginTop: 10}}>{role}</div>
      <div style={{fontSize: 26, color: C.dim, marginTop: 12}}>{sub}</div>
      <div style={{marginTop: 22}}><Chip t={tag as string} c={col as string} /></div>
    </div>)}
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <path d="M900,520 L990,520" stroke={C.orange} strokeWidth={7} markerEnd="url(#tipTS)" />
      <defs><marker id="tipTS" markerWidth={12} markerHeight={12} refX={9} refY={4} orient="auto"><path d="M0,0 L0,8 L11,4 z" fill={C.orange} /></marker></defs>
    </svg>
    <div style={{position: 'absolute', left: 110, top: 700, width: 1700, fontSize: 30, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.55, dur * 0.55 + 24)}}>
      Primary and secondary describe the <span style={{color: C.amber, fontWeight: 700}}>current job</span>. They do not belong permanently to a site.
    </div>
  </div>
);

const ClaimScene: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const rows: [string, string, string, string][] = [
    ['PersistentVolumeClaim', 'test-478-vgr-resync-pvc', 'the request for storage', C.blue],
    ['PersistentVolume', 'csivol-b9398cf70c', 'the record of the disk that was bound', C.cyan],
    ['Volume handle', 'ec517385-c8e1-4210-b719-1c00bf85331c/PS3b37452a6e0f/scsi', 'the array identifier inside the record', C.orange],
  ];
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 160, fontSize: 30, letterSpacing: 2, color: C.blue, fontWeight: 700}}>THREE RECORDS, ONE DISK</div>
    <div style={{position: 'absolute', left: 100, top: 205, fontSize: 42, fontWeight: 800, color: C.text, width: 820, lineHeight: 1.2}}>The claim asks. The record answers. The handle names the disk.</div>
    {rows.map(([kind, name, role, col], i) => <div key={kind} style={{position: 'absolute', left: 100, top: 320 + i * 165, width: 840, padding: '20px 24px', border: `2px solid ${col}`, borderRadius: 16, background: `${col}0e`, opacity: prog(f, dur * (0.1 + i * 0.16), dur * (0.1 + i * 0.16) + 24)}}>
      <div style={{fontFamily: mono, fontSize: 16, color: col as string, letterSpacing: 1.4}}>{kind}</div>
      <div style={{fontFamily: mono, fontSize: i === 2 ? 17 : 24, color: C.text, marginTop: 6, overflowWrap: 'anywhere'}}>{name}</div>
      <div style={{fontSize: 21, color: C.dim, marginTop: 6}}>{role}</div>
    </div>)}
    <div style={{position: 'absolute', left: 100, top: 845, width: 840, fontSize: 24, color: C.dim, lineHeight: 1.4, opacity: prog(f, dur * 0.62, dur * 0.62 + 24)}}>Kubernetes records ownership. The array moves the data.</div>
  </div>;
};

const PerDiskScene: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const claims = ['claim-1', 'claim-2', 'claim-3', 'claim-4', 'claim-5'];
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 160, fontSize: 30, letterSpacing: 2, color: C.amber, fontWeight: 700}}>THE PER-DISK PATH</div>
    <div style={{position: 'absolute', left: 100, top: 205, fontSize: 42, fontWeight: 800, color: C.text}}>Five disks, five independent schedules.</div>
    {claims.map((c, i) => <div key={c} style={{opacity: prog(f, dur * (0.06 + i * 0.05), dur * (0.06 + i * 0.05) + 22)}}>
      <div style={{position: 'absolute', left: 110, top: 330 + i * 118, width: 330, padding: '14px 18px', border: `2px solid ${C.blue}`, borderRadius: 12, background: `${C.blue}0e`}}>
        <div style={{fontFamily: mono, fontSize: 15, color: C.blue}}>PersistentVolumeClaim</div>
        <div style={{fontFamily: mono, fontSize: 21, color: C.text, marginTop: 3}}>{c}</div>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={`M450,${386 + i * 118} L560,${386 + i * 118}`} stroke={C.purple} strokeWidth={4} markerEnd="url(#tipPD)" />
        <defs><marker id="tipPD" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.purple} /></marker></defs>
      </svg>
      <div style={{position: 'absolute', left: 570, top: 330 + i * 118, width: 560, padding: '14px 18px', border: `2px solid ${C.purple}`, borderRadius: 12, background: `${C.purple}0e`}}>
        <div style={{fontFamily: mono, fontSize: 15, color: C.purple}}>VolumeReplication</div>
        <div style={{fontFamily: mono, fontSize: 19, color: C.text, marginTop: 3}}>one disk, one object</div>
      </div>
      <div style={{position: 'absolute', left: 1190, top: 330 + i * 118, width: 560, padding: '14px 18px', border: `2px dashed ${C.array}`, borderRadius: 12, background: `${C.array}0c`}}>
        <div style={{fontFamily: mono, fontSize: 15, color: C.array}}>PowerStore session</div>
        <div style={{fontFamily: mono, fontSize: 19, color: C.text, marginTop: 3}}>its own clock and its own point</div>
      </div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 940, width: 1700, fontSize: 26, color: C.red, lineHeight: 1.4, opacity: prog(f, dur * 0.6, dur * 0.6 + 24)}}>Nothing here makes the five recovery points agree.</div>
  </div>;
};

const GroupScene: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 100, top: 160, fontSize: 30, letterSpacing: 2, color: C.green, fontWeight: 700}}>THE GROUP PATH</div>
    <div style={{position: 'absolute', left: 100, top: 205, fontSize: 42, fontWeight: 800, color: C.text}}>One container, one session, one point in time.</div>
    <div style={{position: 'absolute', left: 130, top: 330, width: 1660, padding: '34px 40px', border: `3px solid ${C.green}`, borderRadius: 24, background: `${C.green}0c`, opacity: prog(f, dur * 0.06, dur * 0.06 + 26)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.green, letterSpacing: 1.5}}>VolumeGroupReplication</div>
      <div style={{fontFamily: mono, fontSize: 27, color: C.text, marginTop: 8, overflowWrap: 'anywhere'}}>vgr-4251c970ec7af885d6ec79c1d2c40661-test-478-vgr-resync-drpc</div>
      <div style={{display: 'flex', gap: 16, marginTop: 24}}>
        {['claim-1', 'claim-2', 'claim-3', 'claim-4', 'claim-5'].map((c, i) => <div key={c} style={{flex: 1, padding: '18px 12px', border: `2px solid ${C.blue}`, borderRadius: 12, background: `${C.blue}12`, textAlign: 'center', opacity: prog(f, dur * (0.2 + i * 0.05), dur * (0.2 + i * 0.05) + 22)}}>
          <div style={{fontFamily: mono, fontSize: 15, color: C.blue}}>claim</div>
          <div style={{fontSize: 24, color: C.text, marginTop: 4}}>{c}</div>
        </div>)}
      </div>
    </div>
    <div style={{position: 'absolute', left: 130, top: 640, width: 800, padding: '24px 28px', border: `2px solid ${C.array}`, borderRadius: 18, background: `${C.array}0e`, opacity: prog(f, dur * 0.35, dur * 0.35 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 16, color: C.array, letterSpacing: 1.4}}>ON THE ARRAY</div>
      <div style={{fontSize: 30, color: C.text, marginTop: 8, lineHeight: 1.3}}>One volume group.<br />One replication session.</div>
    </div>
    <div style={{position: 'absolute', left: 990, top: 640, width: 800, padding: '24px 28px', border: `2px solid ${C.green}`, borderRadius: 18, background: `${C.green}0e`, opacity: prog(f, dur * 0.48, dur * 0.48 + 24)}}>
      <div style={{fontFamily: mono, fontSize: 16, color: C.green, letterSpacing: 1.4}}>WHAT IT BUYS</div>
      <div style={{fontSize: 30, color: C.text, marginTop: 8, lineHeight: 1.3}}>Every disk shares<br />one recovery point.</div>
    </div>
    <div style={{position: 'absolute', left: 130, top: 850, fontSize: 23, color: C.dim, opacity: prog(f, dur * 0.6, dur * 0.6 + 22)}}>The lab example protects one claim. The mechanism is the same for many.</div>
  </div>
);

const ChainScene: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const rows: [string, string][] = [
    ['DRPlacementControl', 'asks for the move and records the progression'],
    ['VolumeReplicationGroup', 'coordinates the claims on one site'],
    ['VolumeGroupReplication', 'carries the container and its state'],
    ['VolumeReplication', 'the companion record that tracks the group'],
    ['csi-addons controller', 'turns the group state into CSI driver calls'],
    ['Dell CSI driver', 'executes the call against the array'],
    ['PowerStore volume group', 'the only place where data actually moves'],
  ];
  return <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 150, fontSize: 40, color: C.text, fontWeight: 700}}>One chain, top to bottom</div>
    {rows.map(([name, role], i) => <div key={name} style={{position: 'absolute', left: 110, top: 245 + i * 100, width: 1680, display: 'flex', gap: 30, alignItems: 'center', opacity: prog(f, dur * (0.04 + i * 0.07), dur * (0.04 + i * 0.07) + 22)}}>
      <div style={{width: 560, fontSize: 30, fontWeight: 700, color: i === rows.length - 1 ? C.array : i === 3 ? C.amber : C.cyan}}>{name}</div>
      <div style={{fontSize: 26, color: C.text}}>{role}</div>
    </div>)}
    <div style={{position: 'absolute', left: 110, top: 965, fontSize: 24, color: C.dim}}>The console shows the top of this chain, not the bottom.</div>
  </div>;
};

const ClassPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <>
    <CodePanel title="The group class names both arrays and the RPO" f={f} dur={dur} y={190} lines={[
      'kind: VolumeGroupReplicationClass',
      'metadata:',
      '  name: powerstore-vgrc-5m',
      'spec:',
      '  provisioner: csi-powerstore.dellemc.com',
      '  parameters:',
      '    replication.storage.dell.com/sourceArray: PS3b37452a6e0f',
      '    replication.storage.dell.com/targetArray: PSff392f423bd6',
      '    replication.storage.dell.com/remoteSystem: VSA-B',
      '    replication.storage.dell.com/rpo: Five_Minutes',
      '    schedulingInterval: 5m',
    ]} hl={[6, 7, 8, 9, 10]} h={430} />
    <div style={{position: 'absolute', left: 1000, top: 650, width: 870, padding: '18px 22px', border: `2px solid ${C.amber}`, borderRadius: 14, background: `${C.amber}10`, fontFamily: sans, opacity: prog(f, dur * 0.5, dur * 0.5 + 22)}}>
      <div style={{fontFamily: mono, fontSize: 16, color: C.amber, letterSpacing: 1}}>PAIRED CLASS</div>
      <div style={{fontSize: 22, color: C.text, marginTop: 6, lineHeight: 1.35}}>powerstore-vrc-group-5m is the per-volume class the companion VolumeReplication uses. The same source, target and five minute interval.</div>
    </div>
  </>
);

const PeerClassPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.purple}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.purple, marginBottom: 6}}>How Ramen knows a class is a group</div>
    <Row text="The StorageClass carries a group replication identifier." i={0} f={f} dur={dur} />
    <Row text="The DRPolicy reports a peer class for powerstore-sc-group." i={1} f={f} dur={dur} />
    <div style={{marginTop: 20, padding: '18px 20px', border: `2px solid ${C.green}`, borderRadius: 14, background: `${C.green}0e`, opacity: prog(f, dur * 0.4, dur * 0.4 + 22)}}>
      <div style={{fontFamily: mono, fontSize: 19, color: C.text, lineHeight: 1.6}}>
        storageClassName: powerstore-sc-group<br />
        grouping: true<br />
        groupreplicationID: 4251c970ec7af885d6ec79c1d2c40661
      </div>
    </div>
    <Row text="Only that entry allows the group path. A class without grouping true stays per-disk." i={2} f={f} dur={dur} color={C.cyan} />
  </Box>
);

const ClockPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.amber}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.amber}}>The sync is the recovery point</div>
    <div style={{marginTop: 18}}>
      {[0, 1, 2].map((i) => <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 18, opacity: prog(f, dur * (0.1 + i * 0.16), dur * (0.1 + i * 0.16) + 22)}}>
        <div style={{fontFamily: mono, fontSize: 18, color: C.faint, width: 120}}>{['10:46', '10:51', '10:56'][i]}</div>
        <div style={{flex: 1, height: 16, borderRadius: 8, background: `${C.amber}33`, border: `1px solid ${C.amber}`}} />
        <div style={{width: 190}}><Chip t={i === 2 ? 'last sync' : 'completed'} c={i === 2 ? C.green : C.amber} /></div>
      </div>)}
    </div>
    <Row text="Every completed sync becomes a point the application can return to." i={0} f={f} dur={dur} />
    <Row text="The class asks for five minutes. The array writes the timestamps." i={1} f={f} dur={dur} />
    <div style={{marginTop: 20, fontSize: 21, color: C.dim, lineHeight: 1.4, opacity: prog(f, dur * 0.62, dur * 0.62 + 22)}}>The console's last-synced value is a reading, not the record. Read the session.</div>
  </Box>
);

const ConditionsPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const rows: [string, string, string, string][] = [
    ['state', 'Primary', 'this side serves the workload', C.green],
    ['Completed', 'True', 'the group is promoted', C.green],
    ['Replicating', 'True', 'the copy is synchronized and healthy', C.green],
    ['Degraded', 'False', 'no replication error is reported', C.dim],
  ];
  return <Box style={{borderColor: C.green}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.green, marginBottom: 6}}>The group answers for itself</div>
    <div style={{marginTop: 14, padding: '14px 18px', border: `1.5px solid ${C.border}`, borderRadius: 12, background: `${C.panel}aa`, opacity: prog(f, dur * 0.06, dur * 0.06 + 22)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.cyan}}>VolumeGroupReplication · status</div>
    </div>
    {rows.map(([k, v, s, col], i) => <div key={k} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '15px 0', borderBottom: `1px solid ${C.border}`, opacity: prog(f, dur * (0.12 + i * 0.14), dur * (0.12 + i * 0.14) + 22)}}>
      <div style={{width: 190, fontFamily: mono, fontSize: 19, color: C.dim}}>{k}</div>
      <div style={{width: 130}}><Chip t={v} c={col} /></div>
      <div style={{fontSize: 20, color: C.text, flex: 1}}>{s}</div>
    </div>)}
    <div style={{marginTop: 22, fontSize: 23, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.66, dur * 0.66 + 22)}}>These describe the container. They are separate from the DRPC's Protected condition.</div>
  </Box>;
};

const AnnotationPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.red}}>
    <div style={{fontFamily: mono, fontSize: 15, color: C.red, letterSpacing: 1.5, marginBottom: 8}}>BLOCKER ONE · A STALE OWNER NAME</div>
    <div style={{fontSize: 29, fontWeight: 700, color: C.red, lineHeight: 1.25}}>The restored claim names an older group.</div>
    <div style={{marginTop: 18, padding: '16px 18px', border: `1.5px solid ${C.border}`, borderRadius: 12, background: `${C.panel}aa`, opacity: prog(f, dur * 0.08, dur * 0.08 + 22)}}>
      <div style={{fontFamily: mono, fontSize: 15, color: C.faint}}>annotation on the restored PersistentVolumeClaim</div>
      <div style={{fontFamily: mono, fontSize: 17, color: C.text, marginTop: 8, overflowWrap: 'anywhere'}}>replication.storage.openshift.io/<br />volume-group-replication-name</div>
    </div>
    <Row text="csi-addons will not change an existing owner." i={0} f={f} dur={dur} size={22} />
    <div style={{marginTop: 14, padding: '14px 18px', borderLeft: `5px solid ${C.red}`, background: `${C.red}0e`, opacity: prog(f, dur * 0.4, dur * 0.4 + 22)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.text, lineHeight: 1.5}}>PVC (test-478-vgr-resync/test-478-vgr-resync-pvc) not owned by correct VolumeReplication/VolumeGroupReplication</div>
    </div>
    <Row text="The group stays Unknown and the DRPC waits in WaitForReadiness." i={1} f={f} dur={dur} size={22} color={C.amber} />
    <Row text="Set the annotation to the new group name; the next reconcile promotes." i={2} f={f} dur={dur} size={22} color={C.green} />
  </Box>
);

const AutoResyncPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.amber}}>
    <div style={{fontFamily: mono, fontSize: 15, color: C.amber, letterSpacing: 1.5, marginBottom: 8}}>BLOCKER TWO · NO AUTOMATIC REVERSE COPY</div>
    <div style={{fontSize: 29, fontWeight: 700, color: C.amber, lineHeight: 1.25}}>The target promotes, then stops.</div>
    <div style={{display: 'flex', gap: 16, marginTop: 18}}>
      <div style={{flex: 1, padding: '14px 16px', border: `1.5px solid ${C.border}`, borderRadius: 12, background: `${C.panel}aa`, opacity: prog(f, dur * 0.08, dur * 0.08 + 22)}}>
        <div style={{fontFamily: mono, fontSize: 15, color: C.faint}}>VGR spec</div>
        <div style={{fontFamily: mono, fontSize: 21, color: C.text, marginTop: 6}}>autoResync: false</div>
      </div>
      <div style={{flex: 1, padding: '14px 16px', border: `1.5px solid ${C.border}`, borderRadius: 12, background: `${C.panel}aa`, opacity: prog(f, dur * 0.14, dur * 0.14 + 22)}}>
        <div style={{fontFamily: mono, fontSize: 15, color: C.faint}}>VGR status</div>
        <div style={{fontFamily: mono, fontSize: 21, color: C.amber, marginTop: 6}}>Failed_Over</div>
      </div>
    </div>
    <div style={{marginTop: 16, padding: '14px 18px', borderLeft: `5px solid ${C.amber}`, background: `${C.amber}0e`, opacity: prog(f, dur * 0.3, dur * 0.3 + 22)}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.text, lineHeight: 1.5}}>replication has failed over, reprotect required</div>
    </div>
    <Row text="No Reprotect and no Resync call is sent, so no reverse copy starts." i={0} f={f} dur={dur} size={22} />
    <Row text="The DRPC can still read Protected true and PeerReady true." i={1} f={f} dur={dur} size={22} color={C.red} />
    <div style={{marginTop: 16, fontSize: 20, color: C.dim, lineHeight: 1.4, opacity: prog(f, dur * 0.62, dur * 0.62 + 22)}}>Protected describes the metadata and the forward copy from before the failover. It is not a new standby.</div>
  </Box>
);

const TwoAnswersPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <Box style={{borderColor: C.cyan}}>
    <div style={{fontSize: 30, fontWeight: 700, color: C.cyan}}>A green DRPC is not a standby</div>
    <div style={{display: 'flex', gap: 18, marginTop: 20}}>
      {[
        ['DRPC', 'Protected = True', 'the records are protected and the move completed', C.green],
        ['VGR', 'Replicating = False', 'no copy is reaching the other array', C.red],
      ].map(([who, value, gloss, col], i) => <div key={who as string} style={{flex: 1, padding: '20px', border: `2px solid ${col}`, borderRadius: 14, background: `${col}0f`, opacity: prog(f, dur * (0.08 + i * 0.16), dur * (0.08 + i * 0.16) + 24)}}>
        <div style={{fontFamily: mono, fontSize: 16, color: col as string, letterSpacing: 1.4}}>{who}</div>
        <div style={{fontFamily: mono, fontSize: 23, color: C.text, marginTop: 10}}>{value}</div>
        <div style={{fontSize: 20, color: C.dim, marginTop: 10, lineHeight: 1.4}}>{gloss}</div>
      </div>)}
    </div>
    <Row text="Read the group and the array session after the move." i={0} f={f} dur={dur} />
    <Row text="A green DRPC alone does not prove a standby exists." i={1} f={f} dur={dur} color={C.amber} />
    <div style={{marginTop: 20, padding: '16px 20px', border: `2px dashed ${C.border}`, borderRadius: 12, fontSize: 20, color: C.dim, lineHeight: 1.45, opacity: prog(f, dur * 0.6, dur * 0.6 + 22)}}>
      The array's session role and last sync are the evidence that a copy is moving.
    </div>
  </Box>
);

const RecapPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 160, fontSize: 29, letterSpacing: 2, color: C.blue, fontWeight: 700}}>ONE CONTAINER, FOUR HANDOFFS</div>
    {[
      ['One claim', 'one container, one session', C.blue],
      ['One promote', 'every disk changes role together', C.green],
      ['One mapping', 'the target names the copy it already has', C.cyan],
      ['One check', 'read the group and the session, not only the DRPC', C.amber],
    ].map(([k, v, col], i) => <div key={k} style={{position: 'absolute', left: 110, top: 235 + i * 100, width: 1700, display: 'flex', gap: 28, opacity: prog(f, dur * (0.04 + i * 0.08), dur * (0.04 + i * 0.08) + 22)}}>
      <div style={{width: 320, fontSize: 30, fontWeight: 700, color: col as string}}>{k}</div>
      <div style={{fontSize: 29, color: C.text}}>{v}</div>
    </div>)}
  </div>
);

const RememberPanel: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans}}>
    <div style={{position: 'absolute', left: 110, top: 160, fontSize: 29, letterSpacing: 2, color: C.blue, fontWeight: 700}}>WHAT THE LAB SHOWED</div>
    <div style={{position: 'absolute', left: 110, top: 225, width: 1700, padding: '26px 30px', border: `2px solid ${C.green}`, borderRadius: 18, background: `${C.green}0d`, opacity: prog(f, dur * 0.04, dur * 0.04 + 24)}}>
      <div style={{fontSize: 23, letterSpacing: 2, color: C.green, fontFamily: mono}}>MEASURED, NOT A RECORDED RUN</div>
      <div style={{fontSize: 32, color: C.text, lineHeight: 1.35, marginTop: 10}}>The group-protected application's return move completed in two minutes and three seconds, and its session carried a newer sync.</div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 470, width: 1700, fontSize: 24, color: C.dim, lineHeight: 1.5, opacity: prog(f, dur * 0.35, dur * 0.35 + 24)}}>
      The example protects one claim today. The mechanism is the same for many, and that is where grouping matters: a database that writes across several disks needs all of them from the same completed sync.
    </div>
    <div style={{position: 'absolute', left: 110, top: 660, width: 1700, padding: '26px 30px', border: `3px solid ${C.amber}`, borderRadius: 18, background: `${C.amber}10`, opacity: prog(f, dur * 0.55, dur * 0.55 + 24)}}>
      <div style={{fontSize: 23, letterSpacing: 2, color: C.amber, fontFamily: mono}}>REMEMBER THIS</div>
      <div style={{fontSize: 38, color: C.text, lineHeight: 1.35, marginTop: 10}}>A volume-grouped DRPC moves every disk in one operation, from one recovery point. Check the group after the move.</div>
    </div>
  </div>
);

const ColdOpen1: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 90, top: 160, fontSize: 24, letterSpacing: 2, color: C.amber, fontFamily: mono}}>TWO DISKS · ONE APPLICATION</div>
    <div style={{position: 'absolute', left: 90, top: 205, width: 900, fontSize: 62, fontWeight: 800, color: C.text, lineHeight: 1.12}}>One disk came from ten fifty-two.<br />The other from ten forty-seven.</div>
    <div style={{position: 'absolute', left: 90, top: 400, width: 820, fontSize: 27, color: C.dim, lineHeight: 1.45, opacity: prog(f, dur * 0.14, dur * 0.14 + 24)}}>Each disk was promoted on its own schedule. The database wrote across both, so it recovered a moment that never existed.</div>
    <div style={{position: 'absolute', left: 90, top: 600, width: 820, padding: '22px 26px', borderLeft: `6px solid ${C.red}`, background: `${C.panel}cc`, fontSize: 27, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.42, dur * 0.42 + 24)}}>A volume group exists so that <span style={{color: C.red, fontWeight: 700}}>every disk moves as one</span>.</div>
    <div style={{position: 'absolute', left: 1010, top: 225, width: 820}}>
      {[['DISK 1', '10:52', C.green, 0.2], ['DISK 2', '10:47', C.red, 0.32]].map(([d, t, col, a], i) => <div key={d as string} style={{marginTop: i ? 20 : 0, padding: '22px 24px', borderRadius: 16, border: `2px solid ${col}`, background: `${col}10`, opacity: prog(f, dur * (a as number), dur * (a as number) + 24)}}>
        <div style={{fontFamily: mono, fontSize: 18, color: col as string}}>{d}</div>
        <div style={{fontSize: 40, fontWeight: 800, color: C.text, marginTop: 6}}>{t}</div>
        <div style={{fontSize: 20, color: C.dim, marginTop: 4}}>its own recovery point</div>
      </div>)}
      <div style={{marginTop: 26, padding: '20px 24px', borderRadius: 16, border: `2px dashed ${C.red}`, background: `${C.red}0c`, opacity: prog(f, dur * 0.55, dur * 0.55 + 24)}}>
        <div style={{fontFamily: mono, fontSize: 17, color: C.red, letterSpacing: 1}}>THE APPLICATION SEES</div>
        <div style={{fontSize: 28, color: C.text, marginTop: 8}}>a torn point in time</div>
      </div>
    </div>
  </div>
);

const ColdOpen2: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 110, top: 160, fontSize: 24, letterSpacing: 2, color: C.blue, fontFamily: mono}}>THE FIX · ONE CONTAINER</div>
    <div style={{position: 'absolute', left: 110, top: 210, fontSize: 54, fontWeight: 800, color: C.text}}>Copy the disks as one unit. Change their role in one step.</div>
    <div style={{position: 'absolute', left: 110, top: 340, width: 1700, padding: '34px 40px', border: `3px solid ${C.green}`, borderRadius: 24, background: `${C.green}0c`, opacity: prog(f, dur * 0.08, dur * 0.08 + 26)}}>
      <div style={{fontFamily: mono, fontSize: 18, color: C.green, letterSpacing: 1.5}}>VOLUME GROUP</div>
      <div style={{display: 'flex', gap: 18, marginTop: 20}}>
        {['disk 1', 'disk 2', 'disk 3'].map((d, i) => <div key={d} style={{flex: 1, padding: '22px 18px', border: `2px solid ${C.blue}`, borderRadius: 12, background: `${C.blue}12`, opacity: prog(f, dur * (0.18 + i * 0.05), dur * (0.18 + i * 0.05) + 22)}}>
          <div style={{fontFamily: mono, fontSize: 15, color: C.blue}}>inside the container</div>
          <div style={{fontSize: 30, color: C.text, marginTop: 6}}>{d}</div>
        </div>)}
      </div>
    </div>
    <div style={{position: 'absolute', left: 110, top: 640, width: 1700, fontSize: 30, color: C.text, lineHeight: 1.5, opacity: prog(f, dur * 0.4, dur * 0.4 + 24)}}>
      The array copies the container on one schedule and promotes it with one action. Every disk inside comes from the same completed sync.
    </div>
    <div style={{position: 'absolute', left: 110, top: 810, fontSize: 22, color: C.faint, fontFamily: mono}}>Conceptual explainer · no recorded run</div>
  </div>
);

const ScopeCard: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: sans, background: C.bg}}>
    <div style={{position: 'absolute', left: 140, top: 190, width: 1640}}>
      <div style={{fontFamily: mono, fontSize: 21, color: C.amber, letterSpacing: 2}}>SCOPE · WHAT THIS IS BUILT FROM</div>
      <div style={{fontSize: 48, fontWeight: 800, color: C.text, marginTop: 18, lineHeight: 1.2}}>A mechanism, explained from source and live objects.</div>
      {[
        ['The pinned source', 'csi-addons, Ramen and the Dell PowerStorage driver', C.blue],
        ['The lab classes', 'powerstore-sc-group, powerstore-vgrc-5m, powerstore-vrc-group-5m', C.amber],
        ['The live chain', 'test-478-vgr-resync-drpc and its group objects', C.green],
        ['What is not here', 'no recorded run, no screenshots, no failover initiated', C.red],
      ].map(([k, v, col], i) => <div key={k as string} style={{display: 'flex', gap: 24, marginTop: 26, opacity: prog(f, dur * (0.12 + i * 0.1), dur * (0.12 + i * 0.1) + 22)}}>
        <div style={{width: 330, fontSize: 22, color: col as string, fontWeight: 700}}>{k}</div>
        <div style={{fontFamily: mono, fontSize: 21, color: C.dim, maxWidth: 1200, overflowWrap: 'anywhere'}}>{v}</div>
      </div>)}
      <div style={{marginTop: 40, padding: '22px 26px', borderLeft: `6px solid ${C.green}`, background: `${C.panel}cc`, fontSize: 26, color: C.text, lineHeight: 1.4, opacity: prog(f, dur * 0.55, dur * 0.55 + 24)}}>Where a cause is inferred rather than proven, the video says so. The two blockers are shown as examples, not as one timeline.</div>
    </div>
  </div>
);

export const BeatPanel: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  if (id === '0.1') return <ColdOpen1 f={f} dur={dur} />;
  if (id === '0.2') return <ColdOpen2 f={f} dur={dur} />;
  if (id === '0.3') return <ScopeCard f={f} dur={dur} />;
  if (id === '2.6') return <ClassPanel f={f} dur={dur} />;
  if (id === '2.7') return <PeerClassPanel f={f} dur={dur} />;
  if (id === '3.2') return <ClockPanel f={f} dur={dur} />;
  if (id === '3.3') return <ConditionsPanel f={f} dur={dur} />;
  if (id === '5.1') return <AnnotationPanel f={f} dur={dur} />;
  if (id === '5.2') return <AutoResyncPanel f={f} dur={dur} />;
  if (id === '5.3') return <TwoAnswersPanel f={f} dur={dur} />;
  if (id === '6.1') return <RecapPanel f={f} dur={dur} />;
  if (id === '6.2') return <RememberPanel f={f} dur={dur} />;
  return null;
};
