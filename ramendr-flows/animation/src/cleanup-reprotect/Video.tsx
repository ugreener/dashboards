import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud, TEvent, TimelineBar} from '../components/overlays';
import {DefinitionPanel, Def, Screenshot} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {World, FOCUS, RECT} from './World';
import {BeatPanel, CleanupPhases, GlossaryScene, PANEL_BEATS} from './Panels';
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
  y1 += 65;
  const left = 35, right = side ? 825 : 1880, top = 210, bottom = META[id]?.define ? 740 : 895;
  const z = Math.min(1.2, (right - left) / (x1 - x0), (bottom - top) / (y1 - y0));
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, sx: (left + right) / 2, sy: (top + bottom) / 2, ...CAMS[id]};
};

export const CLOCK: Record<string, string> = {
  '2.1': '10:19:37', '2.2': '10:20:17', '2.3': '10:22:00', '2.4': '10:40:00', '2.5': '10:40:00',
  '3.1': '11:05:00', '3.2': '11:07:00', '3.3': '11:08:00', '3.4': '11:08:00', '3.5': '11:08:00',
  '4.1': '11:33:01', '4.2': '11:34:00', '4.3': '11:34:00', '4.4': '11:35:15', '4.5': '11:35:15', '4.6': '11:35:15', '4.7': '11:35:15',
  '5.1': '11:35:15', '5.2': '11:35:15', '5.3': '11:35:15', '5.4': '11:35:15', '5.5': '11:35:15', '5.6': '11:35:15', '5.7': '11:35:15', '5.8': '11:35:15',
  '7.1': '11:35:15', '7.2': '11:35:15', '7.3': '11:35:15', '7.4': '11:35:15', '7.5': '11:35:15',
};
const CLOCK_LABELS: Record<string, string> = {
  '2.3': '~10:22', '3.1': '~11:05', '3.2': '11:07', '3.3': '~11:08', '3.4': '~11:08', '3.5': '~11:08', '4.4': '11:35:15', '4.5': '11:35:15',
  '5.1': '11:35:15 (held)', '5.2': '11:35:15 (held)', '5.3': '11:35:15 (held)', '5.4': '11:35:15 (held)',
  '5.5': '11:35:15 (held)', '5.6': '11:35:15 (held)', '5.7': '11:35:15 (held)', '5.8': '11:35:15 (held)',
  '7.1': '11:35:15 (held)', '7.2': '11:35:15 (held)', '7.3': '11:35:15 (held)', '7.4': '11:35:15 (held)', '7.5': '11:35:15 (held)',
};
const EVENTS: TEvent[] = [
  ['10:19:37', 'source suspended', C.red],
  ['10:20:17', 'Initiate', C.blue],
  ['10:20:24', 'array failover', C.orange],
  ['10:22:00', 'target running', C.green],
  ['10:40:00', 'phase A pass', C.green],
  ['11:07:00', 'cleanup asked', C.amber],
  ['11:33:01', 'source VM deleted', C.amber],
  ['11:34:00', 'PVCs deleting', C.red],
  ['11:35:15', 'last driver action', C.red],
];
const SFX: Record<string, [number, string, number][]> = {
  '0.1': [[.05, 'type', .2], [.5, 'whoosh', .18]],
  '2.2': [[.25, 'alert', .2]],
  '2.3': [[.3, 'chime', .2]],
  '3.2': [[.2, 'click', .28]],
  '4.3': [[.3, 'flip', .2]],
  '4.4': [[.25, 'alert', .22]],
  '4.5': [[.4, 'tick', .16]],
  '5.4': [[.25, 'alert', .2]],
  '5.8': [[.2, 'land', .24]],
  '6.4': [[.3, 'flip', .2]],
  '7.1': [[.25, 'alert', .2]],
  '7.4': [[.4, 'chime', .2]],
};

export const CleanupReprotect: React.FC<{chapters: number[]}> = ({chapters}) => {
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
    if (META[beat.id]?.screenshot) list.push([.14, 'whoosh', .16]);
    if (META[beat.id]?.card) list.push([.04, 'pop', .17]);
    return list.map(([frac, name, v]) => ({at: base + Math.round(frac * beat.audio), name, v}));
  });
  const showWorld = ch >= 2 && ch <= 5;
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`, overflow: 'hidden'}}>
    {showWorld ? <div style={{position: 'absolute', inset: 0, clipPath: 'inset(210px 0 0 0)'}}><div style={{position: 'absolute', transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px,${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}><World c={{id: b.id, f, dur: b.audio, zoom: cam.z}} /></div></div> : null}
    {seg.type === 'beat' && ch === 1 ? <GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def} /> : null}
    {seg.type === 'beat' ? <BeatPanel id={b.id} f={f} dur={b.audio} /> : null}
    {seg.type === 'beat' ? <Hud chapter={b.chapter.title} clock={ch === 6 ? null : CLOCK_LABELS[b.id] ?? CLOCK[b.id] ?? null} ticket="VIRTDR-360" /> : null}
    {seg.type === 'beat' && ch >= 2 ? <CleanupPhases current={ch <= 2 ? 0 : ch === 3 ? 1 : ch === 4 ? 2 : 3} stuck={ch >= 5} /> : null}
    {seg.type === 'beat' && ch >= 2 && ch !== 6 ? <TimelineBar now={CLOCK[b.id] ?? null} events={EVENTS} /> : null}
    {seg.type === 'beat' && m.screenshot ? <Screenshot src={`evidence/cleanup-reprotect/${m.screenshot}`} date="2026-10-22" caption={m.caption ?? ''} focus={m.focus} a={win(.14, .98)} z={progIO(f, b.audio * .2, b.audio * .65)} y={215} x={865} w={1010} sourceLabel="hub console · historical capture" /> : null}
    {seg.type === 'beat' && m.define ? <DefinitionPanel term={m.define.term} text={m.define.text} a={win(.05, .97)} bottom={150} /> : null}
    {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)} /> : null}
    {beats.map((beat) => <Sequence key={beat.id} from={beat.from + PAD_BEFORE} durationInFrames={beat.audio + 10}><Audio src={staticFile(`audio/cleanup-reprotect/${beat.id}.wav`)} volume={.72} /></Sequence>)}
    {cues.map((cue, k) => <Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v} /></Sequence>)}
  </AbsoluteFill>;
};
