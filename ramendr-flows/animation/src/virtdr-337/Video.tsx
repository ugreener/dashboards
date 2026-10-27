import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud, TEvent, TimelineBar} from '../components/overlays';
import {DefinitionPanel, Def, Screenshot} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {World, FOCUS, RECT} from './World';
import {ArrayPhases, BeatPanel, GlossaryScene, PANEL_BEATS} from './Panels';
import BEATS from './beats.json';

type Meta = {t?: string; screenshot?: string; focus?: {x: number; y: number; w: number; h: number}; caption?: string; define?: {term: string; text: string}; card?: {kind: string; name: string; role: string}; def?: Def};
const META = BEATS as Record<string, Meta>;
type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const CAMS: Record<string, Partial<Cam>> = {};

const fit = (id: string): Cam => {
  const side = !!META[id]?.screenshot || PANEL_BEATS.has(id) || !!META[id]?.define;
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
  if (y0 >= 1100) y0 = 1060;
  else if (y0 >= 450) y0 = 385;
  else y0 = 0;
  x0 -= 40;
  x1 += 40;
  y1 += 70;
  const left = 35, right = side ? 825 : 1880, top = 210, bottom = META[id]?.define ? 740 : 895;
  const z = Math.min(1.2, (right - left) / (x1 - x0), (bottom - top) / (y1 - y0));
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, sx: (left + right) / 2, sy: (top + bottom) / 2, ...CAMS[id]};
};

const CLOCK: Record<string, string> = {
  '3.1': '15:20:48', '3.2': '15:21:22', '3.3': '15:22:42', '3.4': '15:27:32',
  '4.1': '15:27:33', '4.2': '15:27:33', '4.3': '15:27:35', '4.4': '15:27:35', '4.5': '15:31:00',
  '5.1': '15:31:00', '5.2': '15:31:00', '5.3': '15:31:00',
  '7.2': '07:43:05', '7.3': '08:03:00',
};
const CLOCK_LABELS: Record<string, string> = {
  '3.1': '15:20:48', '3.2': '15:21:22', '3.3': '15:22:42', '3.4': '15:27:32',
  '4.1': '~15:27:33', '4.2': '~15:27:33', '4.3': '15:27:35', '4.4': '15:27:35', '4.5': '~15:31',
  '5.1': '~15:31', '5.2': '~15:31', '5.3': '~15:31',
  '7.2': '07:43:05', '7.3': '08:03',
};
const EVENTS: TEvent[] = [
  ['15:20:48', 'VSA-B Node B stops', C.amber],
  ['15:21:22', 'sessions System_Paused', C.amber],
  ['15:22:42', 'VSA-A Node B stops', C.orange],
  ['15:24:34', 'declared Healthy', C.orange],
  ['15:27:35', 'panic and cluster stop', C.red],
  ['15:30:36', 'Node A hard reset', C.red],
];
const SFX: Record<string, [number, string, number][]> = {
  '0.1': [[0.05, 'type', 0.2], [0.55, 'whoosh', 0.16]],
  '0.2': [[0.2, 'tick', 0.14], [0.5, 'tick', 0.14], [0.8, 'tick', 0.14]],
  '3.1': [[0.3, 'alert', 0.2]],
  '3.3': [[0.3, 'alert', 0.18]],
  '3.4': [[0.2, 'flip', 0.2], [0.62, 'alert', 0.22]],
  '4.3': [[0.28, 'alert', 0.26]],
  '4.4': [[0.28, 'alert', 0.24], [0.5, 'land', 0.2]],
  '5.3': [[0.4, 'tick', 0.14]],
  '6.4': [[0.3, 'flip', 0.18]],
  '7.1': [[0.2, 'click', 0.22]],
  '7.2': [[0.6, 'chime', 0.2]],
  '7.3': [[0.2, 'land', 0.22]],
  '7.6': [[0.6, 'chime', 0.18]],
};

export const VsaCascade: React.FC<{chapters: number[]}> = ({chapters}) => {
  const frame = useCurrentFrame();
  const {segs} = buildTimeline(chapters);
  const beats = segs.filter((s): s is Extract<Segment, {type: 'beat'}> => s.type === 'beat');
  const seg = segs.find((s) => frame >= s.from && frame < s.from + s.dur) ?? segs[segs.length - 1];
  if (!seg) return <AbsoluteFill style={{background: C.bg}} />;
  const b = seg.type === 'beat' ? seg : beats.find((v) => v.from >= seg.from) ?? beats[beats.length - 1];
  const i = beats.indexOf(b);
  const prev = i > 0 && !b.afterChapter ? beats[i - 1].id : b.id;
  const f = seg.type === 'beat' ? frame - b.from - PAD_BEFORE : -PAD_BEFORE;
  const target = fit(b.id), old = fit(prev);
  const p = progIO(f, -PAD_BEFORE, sec(1.6));
  const cam = {x: lerp(old.x, target.x, p), y: lerp(old.y, target.y, p), z: lerp(old.z, target.z, p), sx: lerp(old.sx, target.sx, p), sy: lerp(old.sy, target.sy, p)};
  const ch = b.chapter.n, m = META[b.id] ?? {};
  const win = (a: number, z: number) => Math.min(prog(f, b.audio * a, b.audio * a + 22), 1 - prog(f, b.audio * z - 22, b.audio * z));
  const cues = beats.flatMap((beat) => {
    const base = beat.from + PAD_BEFORE;
    const list: [number, string, number][] = [...(SFX[beat.id] ?? [])];
    if (META[beat.id]?.screenshot) list.push([0.14, 'whoosh', 0.16]);
    if (META[beat.id]?.card) list.push([0.04, 'pop', 0.17]);
    return list.map(([frac, name, v]) => ({at: base + Math.round(frac * beat.audio), name, v}));
  });
  const showWorld = ch >= 2;
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`, overflow: 'hidden'}}>
    {showWorld ? <div style={{position: 'absolute', inset: 0, clipPath: 'inset(210px 0 0 0)'}}><div style={{position: 'absolute', transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px,${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}><World c={{id: b.id, f, dur: b.audio, zoom: cam.z}} /></div></div> : null}
    {seg.type === 'beat' && ch === 1 ? <GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def} /> : null}
    {seg.type === 'beat' ? <BeatPanel id={b.id} f={f} dur={b.audio} /> : null}
    {seg.type === 'beat' ? <Hud chapter={b.chapter.title} clock={CLOCK_LABELS[b.id] ?? CLOCK[b.id] ?? null} ticket="VIRTDR-337" /> : null}
    {seg.type === 'beat' && ch >= 2 ? <ArrayPhases current={ch <= 2 ? 0 : ch === 3 ? 1 : ch === 4 ? 2 : ch === 5 ? 3 : ch === 6 ? 3 : 4} appear={1} /> : null}
    {seg.type === 'beat' && ch >= 3 && ch <= 5 ? <TimelineBar now={CLOCK[b.id] ?? null} events={EVENTS} /> : null}
    {seg.type === 'beat' && m.screenshot ? <Screenshot src={`evidence/virtdr-337/${m.screenshot}`} date="2026-10-24" caption={m.caption ?? ''} focus={m.focus} a={win(0.14, 0.98)} z={progIO(f, b.audio * 0.2, b.audio * 0.65)} y={215} x={865} w={1010} sourceLabel="PowerStore Manager · historical capture" /> : null}
    {seg.type === 'beat' && m.define ? <DefinitionPanel term={m.define.term} text={m.define.text} a={win(0.05, 0.97)} x={1050} bottom={300} /> : null}
    {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)} /> : null}
    {beats.map((beat) => <Sequence key={beat.id} from={beat.from + PAD_BEFORE} durationInFrames={beat.audio + 10}><Audio src={staticFile(`audio/virtdr-337/${beat.id}.wav`)} volume={0.72} /></Sequence>)}
    {cues.map((cue, k) => <Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v} /></Sequence>)}
  </AbsoluteFill>;
};
