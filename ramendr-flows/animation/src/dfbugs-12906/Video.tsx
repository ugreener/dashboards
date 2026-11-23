import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud, TimelineBar, TEvent} from '../components/overlays';
import {PhaseTracker} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {World, FOCUS, RECT, CH} from './World';
import {BeatPanel, ColdOpen, EvidencePanel, EVIDENCE, GlossaryScene, PANEL_BEATS, PHASES_DFBUGS} from './Panels';
import BEATS from './beats.json';

type Meta = {
  t?: string;
  card?: {kind: string; name: string; role: string};
  def?: {what: string; creator: string; reader: string; where: string; analogy: string};
};
const META = BEATS as Record<string, Meta>;
type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const CAMS: Record<string, Partial<Cam>> = {};

const BAND_OF: Record<string, string> = {
  drpc: 'hub', policy: 'hub',
  vrg1: 'spoke1', vm1: 'spoke1', pvcRoot1: 'spoke1', pvcData1: 'spoke1', pvRoot1: 'spoke1', pvData1: 'spoke1', vgr1: 'spoke1', driver1: 'spoke1', err: 'spoke1',
  vrg0: 'spoke0', vm0: 'spoke0', pvcRoot0: 'spoke0', pvcData0: 'spoke0', pvRoot0: 'spoke0', pvData0: 'spoke0', driver0: 'spoke0',
  groupA: 'arrayA', groupB: 'arrayB',
};

const sidePanel = (id: string) => PANEL_BEATS.has(id);

const fit = (id: string): Cam => {
  const side = sidePanel(id);
  const keys = FOCUS[id] ?? Object.keys(RECT);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const key of keys) {
    const r = RECT[key];
    if (!r) continue;
    x0 = Math.min(x0, r[0]);
    y0 = Math.min(y0, r[1]);
    x1 = Math.max(x1, r[0] + r[2]);
    y1 = Math.max(y1, r[1] + r[3]);
  }
  if (!Number.isFinite(x0)) {
    x0 = 0; y0 = 0; x1 = 2480; y1 = 1780;
  }
  const bands = new Set(keys.map((k) => BAND_OF[k]).filter(Boolean));
  if (bands.size === 1) {
    const b = [...bands][0];
    if (b === 'spoke1') { x0 = 70; x1 = 1240; y0 = 362; }
    if (b === 'spoke0') { x0 = 1235; x1 = 2410; y0 = 362; }
    if (b === 'arrayB') { x0 = 70; x1 = 1240; y0 = 1405; }
    if (b === 'arrayA') { x0 = 1235; x1 = 2410; y0 = 1405; }
    if (b === 'hub') { x0 = Math.min(x0, 70); y0 = 20; }
  } else if (y0 >= 1400) {
    y0 = 1420;
  } else if (y0 >= 400) {
    y0 = 362;
  } else {
    y0 = 0;
  }
  x0 -= 40;
  x1 += 40;
  y1 += 45;
  const left = 35, right = side ? 895 : 1880, top = 210, bottom = 895;
  const z = Math.min(1.2, (right - left) / (x1 - x0), (bottom - top) / (y1 - y0));
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, sx: (left + right) / 2, sy: (top + bottom) / 2, ...CAMS[id]};
};

const CLOCK: Record<string, string> = {
  '3.1': '07:34:30', '3.2': '07:34:48', '3.3': '07:35:04', '3.4': '07:35:04',
  '3.5': '07:35:05', '3.6': '07:35:05', '3.7': '07:35:05',
  '4.1': '07:35:05', '4.2': '07:35:05', '4.3': '07:35:05', '4.4': '07:35:05', '4.5': '07:35:05', '4.6': '07:35:05',
  '5.1': '07:35:06', '5.2': '07:35:06', '5.3': '07:35:30', '5.4': '07:35:40', '5.5': '08:47:00', '5.6': '08:47:00',
  '6.1': '08:26:00', '6.2': '08:26:00', '6.3': '08:39:56', '6.4': '08:47:00', '6.5': '08:47:00', '6.6': '08:47:00',
  '7.1': '07:53:37', '7.2': '08:47:00', '7.3': '13:05:00', '7.4': '08:47:00', '7.5': '08:47:00', '7.6': '13:05:00',
};
const CLOCK_LABELS: Record<string, string> = {
  '3.1': '~07:34', '4.1': '~07:35', '4.2': '~07:35', '4.3': '~07:35', '4.4': '~07:35', '4.5': '~07:35', '4.6': '~07:35',
  '5.1': '~07:35', '5.2': '~07:35', '5.3': '~07:35', '5.4': '~07:35', '5.5': '~08:47', '5.6': '~08:47',
  '6.1': '~08:26', '6.2': '~08:26', '6.4': '~08:47', '6.5': '~08:47', '6.6': '~08:47',
  '7.2': '~08:47', '7.4': '~08:47', '7.5': '~08:47',
};

const EVENTS: TEvent[] = [
  ['07:22:21', 'failover', C.blue],
  ['07:35:04', 'peer ready', C.green],
  ['07:35:05', 'policy undone', C.red],
  ['07:35:06', 'claims gone', C.orange],
  ['08:47:00', 'evidence', C.cyan],
];

const SFX: Record<string, [number, string, number][]> = {
  '0.1': [[0.05, 'type', 0.2], [0.5, 'alert', 0.18]],
  '0.2': [[0.2, 'chime', 0.2]],
  '1.1': [[0.2, 'pop', 0.16]],
  '1.2': [[0.2, 'pop', 0.16]],
  '1.5': [[0.3, 'flip', 0.18]],
  '1.6': [[0.2, 'pop', 0.16]],
  '1.9': [[0.3, 'tick', 0.18]],
  '2.2': [[0.3, 'tick', 0.18]],
  '3.3': [[0.4, 'flip', 0.2]],
  '3.4': [[0.4, 'alert', 0.2]],
  '4.1': [[0.3, 'tick', 0.18]],
  '4.3': [[0.3, 'chime', 0.2]],
  '5.2': [[0.3, 'tick', 0.18]],
  '5.4': [[0.4, 'alert', 0.22]],
  '5.5': [[0.4, 'alert', 0.2]],
  '6.3': [[0.3, 'tick', 0.18]],
  '7.1': [[0.3, 'chime', 0.2]],
  '7.5': [[0.4, 'chime', 0.2]],
};

const win = (f: number, audio: number, a: number, z: number) =>
  Math.min(prog(f, audio * a, audio * a + 22), 1 - prog(f, audio * z - 22, audio * z));

export const Dfbugs12906: React.FC<{chapters: number[]}> = ({chapters}) => {
  const frame = useCurrentFrame();
  const {segs} = buildTimeline(chapters);
  const beats = segs.filter((s): s is Extract<Segment, {type: 'beat'}> => s.type === 'beat');
  const seg = segs.find((s) => frame >= s.from && frame < s.from + s.dur) ?? segs[segs.length - 1];
  if (!seg) return <AbsoluteFill style={{background: C.bg}} />;
  const b = seg.type === 'beat' ? seg : beats.find((v) => v.from >= seg.from) ?? beats[beats.length - 1];
  const i = beats.indexOf(b);
  const prev = i > 0 && !b.afterChapter ? beats[i - 1].id : b.id;
  const f = seg.type === 'beat' ? frame - b.from - PAD_BEFORE : -PAD_BEFORE;
  const target = fit(b.id);
  const old = fit(prev);
  const p = progIO(f, -PAD_BEFORE, sec(1.6));
  const cam = {x: lerp(old.x, target.x, p), y: lerp(old.y, target.y, p), z: lerp(old.z, target.z, p), sx: lerp(old.sx, target.sx, p), sy: lerp(old.sy, target.sy, p)};
  const ch = b.chapter.n;
  const m = META[b.id] ?? {};

  const cues: {at: number; name: string; v: number}[] = [];
  const seen = new Set<string>();
  for (const beat of beats) {
    const base = beat.from + PAD_BEFORE;
    const list: [number, string, number][] = [...(SFX[beat.id] ?? [])];
    for (const [id, frac, key] of CH) if (id === beat.id && (FOCUS[beat.id] ?? []).includes(key)) list.push([frac, 'flip', 0.18]);
    if (META[beat.id]?.card) list.push([0.04, 'pop', 0.17]);
    for (const [frac, name, v] of list) {
      const at = base + Math.round(frac * beat.audio);
      const key = `${at}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cues.push({at, name, v});
    }
  }

  const showWorld = ch >= 2;
  const cast = ch === 1;
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`, overflow: 'hidden'}}>
    {showWorld ? <div style={{position: 'absolute', inset: 0, clipPath: 'inset(210px 0 185px 0)'}}><div style={{position: 'absolute', transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px,${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}><World c={{id: b.id, f, dur: b.audio, zoom: cam.z}} panel={sidePanel(b.id)} /></div></div> : null}
    {seg.type === 'beat' && b.id === '0.1' ? <ColdOpen f={f} dur={b.audio} /> : null}
    {seg.type === 'beat' && cast ? <GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def} /> : null}
    {seg.type === 'beat' ? <Hud chapter={b.chapter.title} clock={ch >= 3 ? CLOCK_LABELS[b.id] ?? CLOCK[b.id] ?? null : null} ticket="DFBUGS-12906" /> : null}
    {seg.type === 'beat' && ch >= 2 ? <PhaseTracker current={Math.max(0, Math.min(PHASES_DFBUGS.length - 1, ch - 2))} phases={PHASES_DFBUGS} /> : null}
    {seg.type === 'beat' && ch >= 3 ? <TimelineBar now={CLOCK[b.id] ?? null} events={EVENTS} /> : null}
    {seg.type === 'beat' && PANEL_BEATS.has(b.id) && b.id !== '0.1' ? (EVIDENCE[b.id] ? <EvidencePanel id={b.id} f={f} dur={b.audio} /> : <BeatPanel id={b.id} f={f} dur={b.audio} />) : null}
    {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)} /> : null}
    {beats.map((beat) => <Sequence key={beat.id} from={beat.from + PAD_BEFORE} durationInFrames={beat.audio + 10}><Audio src={staticFile(`audio/dfbugs-12906/${beat.id}.wav`)} volume={0.72} /></Sequence>)}
    {cues.map((cue, k) => <Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v} /></Sequence>)}
  </AbsoluteFill>;
};
