import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, mono, sans} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud, Legend, YamlPanel} from '../components/overlays';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {Ctx, World} from './World';

type Cam = {x: number; y: number; z: number};
const OVERVIEW: Cam = {x: 1200, y: 760, z: 0.7};

/** Camera keyframes per beat: list of [fraction, cam]. The first entry is reached by easing from the previous beat. */
const CAMS: Record<string, [number, Cam][]> = {
  '0.1': [[0, {x: 1200, y: 760, z: 0.62}]],
  '1.1': [[0, OVERVIEW]],
  '1.2': [[0, {x: 610, y: 1010, z: 1.32}]],
  '1.3': [
    [0, {x: 820, y: 330, z: 1.05}],
    [0.36, {x: 1000, y: 330, z: 1.2}],
  ],
  '1.4': [[0, {x: 760, y: 360, z: 1.45}]],
  '1.5': [[0, {x: 1060, y: 360, z: 1.3}]],
  '1.6': [
    [0, {x: 1150, y: 400, z: 1.1}],
    [0.4, {x: 900, y: 720, z: 0.78}],
  ],
  '2.1': [[0, {x: 1200, y: 640, z: 0.74}]],
  '2.2': [[0, {x: 610, y: 1000, z: 1.3}]],
  '2.3': [
    [0, {x: 610, y: 980, z: 1.2}],
    [0.42, {x: 1200, y: 1180, z: 0.8}],
  ],
  '2.4': [[0, {x: 1200, y: 620, z: 0.72}]],
};

const camAt = (id: string, prevId: string | null, f: number, dur: number): Cam => {
  const keys = CAMS[id] ?? [[0, OVERVIEW]];
  const prevKeys = prevId ? CAMS[prevId] ?? [[0, OVERVIEW]] : keys;
  let cur: Cam = prevKeys[prevKeys.length - 1][1];
  for (const [frac, cam] of keys) {
    const start = frac === 0 ? -PAD_BEFORE : dur * frac;
    const t = progIO(f, start, start + sec(1.6));
    cur = {x: lerp(cur.x, cam.x, t), y: lerp(cur.y, cam.y, t), z: lerp(cur.z, cam.z, t)};
  }
  return cur;
};

const CLOCK: Record<string, string> = {};

/** Teaser: VM moves from spoke-1 to spoke-0 while the arrays flip replication direction. */
const ColdOpenDiagram: React.FC<{f: number; dur: number; appear: number; move: number}> = ({f, dur, appear, move}) => {
  if (appear <= 0) return null;
  const out = 1 - prog(f, dur * 0.9, dur);
  const box = (x: number, label: string, col: string) => (
    <g>
      <rect x={x} y={420} width={560} height={300} rx={22} fill={`${col}10`} stroke={col} strokeWidth={3} />
      <text x={x + 28} y={470} fill={col} fontFamily={sans} fontSize={34} fontWeight={700}>
        {label}
      </text>
    </g>
  );
  const arr = (x: number, label: string, role: string, rc: string) => (
    <g>
      <rect x={x + 80} y={800} width={400} height={120} rx={16} fill={`${C.array}10`} stroke={C.array} strokeWidth={2.5} />
      <text x={x + 110} y={850} fill={C.array} fontFamily={mono} fontSize={26} fontWeight={600}>
        {label}
      </text>
      <text x={x + 110} y={892} fill={rc} fontFamily={mono} fontSize={22}>
        {role}
      </text>
    </g>
  );
  const vmX = lerp(560, 1360, move);
  const flip = move > 0.25;
  const pulse = (f % 90) / 90;
  const dir = flip ? -1 : 1;
  const px = flip ? lerp(1300, 620, pulse) : lerp(620, 1300, pulse);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', opacity: appear * out}}>
      {box(280, 'spoke-1', C.spoke1)}
      {box(1080, 'spoke-0', C.spoke0)}
      {arr(280, 'VSA-B', flip ? 'destination' : 'source', flip ? C.amber : C.green)}
      {arr(1080, 'VSA-A', flip ? 'source' : 'destination', flip ? C.green : C.amber)}
      <line x1={760} y1={860} x2={1160} y2={860} stroke={C.array} strokeWidth={4} />
      <polygon points={dir > 0 ? '1160,848 1184,860 1160,872' : '760,848 736,860 760,872'} fill={C.array} />
      <circle cx={px} cy={860} r={9} fill={C.array} style={{filter: `drop-shadow(0 0 10px ${C.array})`}} />
      <g transform={`translate(${vmX}, 575)`} opacity={move > 0.05 && move < 0.6 ? 0.35 + 0.65 * Math.abs(Math.cos(move * 6)) : 1}>
        <rect x={-110} y={-60} width={220} height={120} rx={16} fill={C.panel2} stroke={C.green} strokeWidth={3} style={{filter: `drop-shadow(0 0 18px ${C.green}88)`}} />
        <text x={0} y={-10} textAnchor="middle" fill={C.green} fontFamily={sans} fontSize={22} fontWeight={700}>
          VM
        </text>
        <text x={0} y={24} textAnchor="middle" fill={C.text} fontFamily={mono} fontSize={20}>
          hammerdb-rhel9
        </text>
      </g>
    </svg>
  );
};

const ColdOpen: React.FC<{f: number; dur: number}> = ({f, dur}) => {
  const type = '13:26:40';
  const n = Math.floor(prog(f, 10, 70) * type.length);
  const click = prog(f, 90, 120);
  const fade = prog(f, dur * 0.3, dur * 0.42);
  const timer = prog(f, dur * 0.3, dur * 0.62);
  const secs = Math.round(341 * timer);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: C.bg, opacity: 1 - fade}} />
      <div style={{position: 'absolute', width: '100%', top: 380 - fade * 300, textAlign: 'center', transform: `scale(${1 - fade * 0.45})`}}>
        <div style={{fontFamily: mono, fontSize: 150, color: C.text, fontWeight: 600, letterSpacing: 4}}>
          {type.slice(0, n)}
          <span style={{opacity: Math.floor(f / 30) % 2 ? 0 : 1, color: C.blue}}>▍</span>
        </div>
        <div style={{fontFamily: sans, fontSize: 34, color: C.dim, marginTop: 6, opacity: prog(f, 60, 90)}}>UTC · October 7 · one click in the hub console</div>
        {click > 0 && click < 1 ? (
          <div style={{position: 'absolute', left: '50%', top: 260, width: 0, height: 0}}>
            <div style={{position: 'absolute', left: -120 * click, top: -120 * click, width: 240 * click, height: 240 * click, borderRadius: '50%', border: `4px solid ${C.blue}`, opacity: 1 - click}} />
          </div>
        ) : null}
      </div>
      <ColdOpenDiagram f={f} dur={dur} appear={fade} move={prog(f, dur * 0.42, dur * 0.66)} />
      {timer > 0 ? (
        <div style={{position: 'absolute', right: 70, bottom: 60, fontFamily: mono, fontSize: 64, fontWeight: 600, color: timer >= 1 ? C.green : C.text, padding: '10px 26px', background: `${C.panel}ee`, borderRadius: 14, border: `2px solid ${timer >= 1 ? C.green : C.border}`}}>
          +{Math.floor(secs / 60)}m {String(secs % 60).padStart(2, '0')}s
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Overlays: React.FC<{id: string; f: number; dur: number}> = ({id, f, dur}) => {
  const win = (a: number, b: number) => Math.min(prog(f, dur * a, dur * a + 24), 1 - prog(f, dur * b - 24, dur * b));
  switch (id) {
    case '0.1':
      return <ColdOpen f={f} dur={dur} />;
    case '1.4':
      return (
        <YamlPanel
          title="hub-dr/placement.yaml"
          appear={win(0.03, 0.97)}
          reveal={prog(f, 0, 40)}
          hl={[4]}
          x={1250}
          y={600}
          lines={[
            'kind: Placement',
            'metadata:',
            '  name: dell-vm-placement',
            '  annotations:',
            '    experimental-scheduling-disable: "true"',
            'spec:',
            '  tolerations: [unreachable, unavailable]',
          ]}
        />
      );
    case '1.5':
      return (
        <YamlPanel
          title="hub-dr/applicationset.yaml"
          appear={win(0.03, 0.97)}
          reveal={prog(f, 0, 50)}
          hl={[3, 6]}
          x={1180}
          y={560}
          w={680}
          lines={[
            'generators:',
            '  - clusterDecisionResource:',
            '      configMapRef: acm-placement',
            '      labelSelector: {placement: dell-vm-placement}',
            'template:',
            '  metadata: {name: dell-vm-workload-{{name}}}',
            '      requeueAfterSeconds: 180',
          ]}
        />
      );
    case '1.6':
      return (
        <YamlPanel
          title="generated Application (hub copy)"
          appear={win(0.02, 0.32)}
          reveal={prog(f, 0, 40)}
          hl={[2, 3]}
          x={1180}
          y={600}
          w={700}
          lines={[
            'metadata:',
            '  annotations:',
            '    argocd.argoproj.io/skip-reconcile: "true"',
            '    ocm-managed-cluster: spoke-1',
            'spec:',
            '  syncPolicy: {automated: {prune: true, selfHeal: true}}',
            '  syncOptions: [CreateNamespace=true, PruneLast=true]',
          ]}
        />
      );
    case '2.2':
      return (
        <YamlPanel
          title="VolumeReplication (created by the VRG)"
          appear={win(0.6, 0.98)}
          reveal={prog(f, dur * 0.6, dur * 0.6 + 40)}
          hl={[4, 5]}
          x={1180}
          y={130}
          w={680}
          lines={[
            'kind: VolumeReplication',
            'metadata: {name: hammerdb-rhel9-datadisk}',
            'spec:',
            '  dataSource: {kind: PersistentVolumeClaim, name: hammerdb-rhel9-datadisk}',
            '  replicationState: primary',
            '  volumeReplicationClass: powerstore-vrc-15m',
            '  autoResync: false',
          ]}
        />
      );
    case '2.3': {
      const jobs = ['12:46:27', '12:58:27', '13:10:27'];
      const a = win(0.55, 0.99);
      return a > 0 ? (
        <div style={{position: 'absolute', right: 50, bottom: 40, width: 540, opacity: a, background: `${C.bg}f0`, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 20, fontFamily: mono}}>
          <div style={{color: C.dim, fontSize: 18}}>VSA-B · job history · Sync replication session</div>
          {jobs.map((j, i) => (
            <div key={j} style={{marginTop: 12, fontSize: 24, color: C.text, opacity: prog(f, dur * (0.62 + i * 0.08), dur * (0.62 + i * 0.08) + 18)}}>
              {j} <span style={{color: C.green}}>COMPLETED</span>
              {i > 0 ? <span style={{color: C.dim, fontSize: 18}}> +12m 00s</span> : null}
            </div>
          ))}
          <div style={{marginTop: 14, color: C.faint, fontSize: 16}}>2026-10-07, from the VIRTDR-292 preflight</div>
        </div>
      ) : null;
    }
    default:
      return null;
  }
};

export const VirtDr292: React.FC<{chapters: number[]}> = ({chapters}) => {
  const frame = useCurrentFrame();
  const {segs, beatOrder} = buildTimeline(chapters);
  const beats = segs.filter((s): s is Extract<Segment, {type: 'beat'}> => s.type === 'beat');

  // current segment and the beat whose world state to show
  const seg = segs.find((s) => frame >= s.from && frame < s.from + s.dur) ?? segs[segs.length - 1];
  const beat = seg.type === 'beat' ? seg : beats.find((b) => b.from >= seg.from) ?? beats[beats.length - 1];
  const bIdx = beats.indexOf(beat);
  const prevId = bIdx > 0 ? beats[bIdx - 1].id : null;
  const f = seg.type === 'beat' ? frame - beat.from - PAD_BEFORE : -PAD_BEFORE;
  const ctx: Ctx = {order: beatOrder, id: beat.id, f, dur: beat.audio, g: frame};
  const cam = camAt(beat.id, seg.type === 'chapter' ? beat.id : prevId, f, beat.audio);
  const showLegend = beat.id >= '2.1' ? 1 : 0;

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #0b1320, ${C.bg} 70%)`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${960 - cam.x * cam.z}px, ${540 - cam.y * cam.z}px) scale(${cam.z})`}}>
        <World c={ctx} />
      </div>
      {seg.type === 'beat' && beat.id !== '0.1' ? <Hud chapter={beat.chapter.title} clock={CLOCK[beat.id] ?? null} /> : null}
      {seg.type === 'beat' ? <Legend appear={showLegend} /> : null}
      {seg.type === 'beat' ? <Overlays id={beat.id} f={f} dur={beat.audio} /> : null}
      {seg.type === 'chapter' ? (
        <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 24, seg.dur)} />
      ) : null}
      {beats.map((b) => (
        <Sequence key={b.id} from={b.from + PAD_BEFORE} durationInFrames={b.audio + 10}>
          <Audio src={staticFile(`audio/virtdr-292/${b.id}.wav`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
