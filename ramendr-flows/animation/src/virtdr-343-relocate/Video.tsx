import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud, Legend, TimelineBar, TEvent} from '../components/overlays';
import {DefinitionPanel, Def, PhaseTracker, Screenshot} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {World, FOCUS, RECT, CH} from './World';
import {BeatPanel, GlossaryScene, PANEL_BEATS, PHASES_343} from './Panels';
import BEATS from './beats.json';
type Meta = {t?: string; screenshot?: string; focus?: {x: number; y: number; w: number; h: number}; caption?: string; define?: {term: string; text: string}; card?: {kind: string; name: string; role: string}; def?: Def};
const META = BEATS as Record<string, Meta>;
type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const CAMS: Record<string, Partial<Cam>> = {
  '2.1': {x: 370, y: 190, z: 1.2, sx: 430, sy: 552},
  '2.3': {x: 650, y: 1180, z: .8, sx: 430, sy: 552},
  '4.4': {x: 1815, y: 950, z: .66, sx: 430, sy: 552},
  '5.3': {x: 370, y: 545, z: 1.2, sx: 430, sy: 552},
  '5.4': {x: 1830, y: 1180, z: .8, sx: 430, sy: 552},
  '6.2': {x: 1830, y: 1180, z: .8, sx: 430, sy: 552},
  '6.5': {x: 1830, y: 1180, z: .8, sx: 430, sy: 552},
  '6.6': {x: 1830, y: 1180, z: .8, sx: 430, sy: 552},
  '7.3': {x: 650, y: 1180, z: .8, sx: 430, sy: 552},
};
const fit = (id: string): Cam => {
  const side = !!META[id]?.screenshot || PANEL_BEATS.has(id);
  const keys = FOCUS[id] ?? Object.keys(RECT);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const key of keys) {const r = RECT[key]; if (!r) continue; x0 = Math.min(x0, r[0]); y0 = Math.min(y0, r[1]); x1 = Math.max(x1, r[0] + r[2]); y1 = Math.max(y1, r[1] + r[3]);}
  if (y0 >= 1100) y0 = 1000; else if (y0 >= 465) y0 = 385; else y0 = 0;
  x0 -= 40; x1 += 40; y1 += 65;
  const left = 35, right = side ? 825 : 1880, top = 210, bottom = META[id]?.define ? 740 : 895;
  const z = Math.min(1.2, (right - left) / (x1 - x0), (bottom - top) / (y1 - y0));
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, sx: (left + right) / 2, sy: (top + bottom) / 2, ...CAMS[id]};
};
export const CLOCK: Record<string, string> = {
  '2.1': '13:41:46', '2.2': '13:41:46', '2.3': '13:42:16', '2.4': '13:45:36', '2.5': '13:45:36', '2.6': '13:45:36',
  '3.1': '13:46:22', '3.2': '13:46:22', '3.3': '13:46:22', '3.4': '13:46:32', '3.5': '13:47:02', '3.6': '13:48:42', '3.7': '13:48:42', '3.8': '13:48:42',
  '4.1': '13:49:58', '4.2': '13:50:10', '4.3': '13:50:10', '4.4': '13:50:10', '4.5': '13:51:05', '4.6': '13:54:29', '4.7': '13:54:49', '4.8': '13:54:49',
  '5.1': '13:51:00', '5.2': '13:48:42', '5.3': '13:51:00', '5.4': '13:55:40', '5.5': '13:55:40', '5.6': '13:56:53', '5.7': '13:56:53',
  '6.1': '13:56:53', '6.2': '13:55:32', '6.3': '13:55:32', '6.4': '13:55:32', '6.5': '13:55:40', '6.6': '15:59:00', '6.7': '15:59:00', '6.8': '15:59:00',
  '7.1': '15:59:00', '7.2': '15:58:51', '7.3': '15:59:00', '7.4': '15:59:00', '7.5': '15:59:00', '7.6': '15:59:00', '7.7': '15:59:00',
};
const CLOCK_LABELS: Record<string, string> = {
  '5.4': '~13:55 (array capture)', '5.5': '~13:55 (array capture)', '6.6': '~15:59 (state capture)', '7.2': '15:58:51',
};
const EVENTS_343: TEvent[] = [
  ['13:41:46', 'precheck', C.amber], ['13:46:32', 'Initiate', C.blue], ['13:47:02', 'final sync', C.orange],
  ['13:48:42', 'both secondary', C.amber], ['13:50:10', 'Relocated', C.green], ['13:55:32', 'manual sync', C.red],
  ['15:59:00', 'state capture', C.dim],
];
const SFX: Record<string, [number, string, number][]> = {
  '0.1': [[.05, 'type', .2], [.45, 'whoosh', .2]], '2.4': [[.2, 'whoosh', .16]], '3.2': [[.2, 'whoosh', .16]],
  '3.3': [[.2, 'whoosh', .16]], '3.4': [[.25, 'click', .3]], '3.6': [[.4, 'flip', .2]], '4.2': [[.4, 'chime', .22]],
  '4.5': [[.2, 'whoosh', .16]], '5.4': [[.2, 'whoosh', .16]], '5.6': [[.2, 'whoosh', .16]], '6.2': [[.3, 'alert', .2]],
  '6.5': [[.4, 'chime', .22]], '7.7': [[.5, 'chime', .2]],
};
const sourceLabel = (file: string) => file.includes('replication') ? 'PowerStore console · historical capture' : file.includes('application') ? 'Argo CD · historical capture' : 'hub console · historical capture';
export const RelocateHome: React.FC<{chapters: number[]}> = ({chapters}) => {
  const frame = useCurrentFrame();
  const {segs} = buildTimeline(chapters);
  const beats = segs.filter((s): s is Extract<Segment, {type: 'beat'}> => s.type === 'beat');
  const seg = segs.find(s => frame >= s.from && frame < s.from + s.dur) ?? segs[segs.length - 1];
  if (!seg) return <AbsoluteFill style={{background: C.bg}}/>;
  const b = seg.type === 'beat' ? seg : beats.find(v => v.from >= seg.from) ?? beats[beats.length - 1];
  const i = beats.indexOf(b), prev = i > 0 && !b.afterChapter ? beats[i - 1].id : b.id;
  const f = seg.type === 'beat' ? frame - b.from - PAD_BEFORE : -PAD_BEFORE;
  const target = fit(b.id), old = fit(prev);
  const p = progIO(f, -PAD_BEFORE, sec(1.6));
  const cam = {x: lerp(old.x, target.x, p), y: lerp(old.y, target.y, p), z: lerp(old.z, target.z, p), sx: lerp(old.sx, target.sx, p), sy: lerp(old.sy, target.sy, p)};
  const ch = b.chapter.n, m = META[b.id] ?? {};
  const win = (a: number, z: number) => Math.min(prog(f, b.audio * a, b.audio * a + 22), 1 - prog(f, b.audio * z - 22, b.audio * z));
  const cues = beats.flatMap(beat => {
    const base = beat.from + PAD_BEFORE;
    const list: [number, string, number][] = [...(SFX[beat.id] ?? [])];
    for (const [id, frac] of CH) if (id === beat.id) list.push([frac, 'flip', .18]);
    if (META[beat.id]?.screenshot) list.push([.14, 'whoosh', .16]);
    if (META[beat.id]?.card) list.push([.04, 'pop', .17]);
    return list.map(([frac, name, v]) => ({at: base + Math.round(frac * beat.audio), name, v}));
  });
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`, overflow: 'hidden'}}>
    {ch >= 2 ? <div style={{position: 'absolute', left: 20, top: 205, width: m.screenshot || PANEL_BEATS.has(b.id) ? 820 : 1880, height: 690, overflow: 'hidden'}}>
      <div style={{position: 'absolute', transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z - 20}px,${cam.sy - cam.y * cam.z - 205}px) scale(${cam.z})`}}><World c={{id: b.id, f, dur: b.audio, zoom: cam.z}}/></div>
    </div> : null}
    {seg.type === 'beat' && ch === 1 ? <GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def}/> : null}
    {seg.type === 'beat' ? <Hud chapter={b.chapter.title} clock={CLOCK_LABELS[b.id] ?? CLOCK[b.id] ?? null} ticket="VIRTDR-343"/> : null}
    {seg.type === 'beat' && ch >= 2 ? <PhaseTracker current={ch - 2} phases={PHASES_343}/> : null}
    {seg.type === 'beat' && b.id === '2.6' ? <Legend appear={win(.04, .96)}/> : null}
    {seg.type === 'beat' && ch >= 3 ? <TimelineBar now={CLOCK[b.id] ?? null} events={EVENTS_343}/> : null}
    {seg.type === 'beat' ? <BeatPanel id={b.id} f={f} dur={b.audio}/> : null}
    {seg.type === 'beat' && m.screenshot ? <Screenshot src={`evidence/virtdr-343-relocate/${m.screenshot}`} date="2026-10-26" caption={m.caption ?? ''} focus={m.focus} a={win(.14, .98)} z={progIO(f, b.audio * .2, b.audio * .65)} y={215} x={865} w={1010} sourceLabel={sourceLabel(m.screenshot)}/> : null}
    {seg.type === 'beat' && m.define ? <DefinitionPanel term={m.define.term} text={m.define.text} a={win(.05, .97)} bottom={150}/> : null}
    {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)}/> : null}
    {beats.map(beat => <Sequence key={beat.id} from={beat.from + PAD_BEFORE} durationInFrames={beat.audio + 10}><Audio src={staticFile(`audio/virtdr-343-relocate/${beat.id}.wav`)} volume={.72}/></Sequence>)}
    {cues.map((cue, k) => <Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v}/></Sequence>)}
  </AbsoluteFill>;
};
