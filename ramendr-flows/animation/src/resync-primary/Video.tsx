import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud} from '../components/overlays';
import {DefinitionPanel} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {World, FOCUS, RECT} from './World';
import {BeatPanel, GlossaryScene, PANEL_BEATS} from './Panels';
import BEATS from './beats.json';

type Meta = {t?: string; define?: {term: string; text: string}; card?: {kind: string; name: string; role: string}; def?: {what: string; creator: string; reader: string; where: string; analogy: string}};
const META = BEATS as Record<string, Meta>;
type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const CAMS: Record<string, Partial<Cam>> = {
  '2.1': {z: 0.52, sy: 640},
  '2.3': {z: 0.54},
};

const fit = (id: string): Cam => {
  const side = PANEL_BEATS.has(id) || !!META[id]?.define;
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
    x0 = 0; y0 = 0; x1 = 2480; y1 = 1600;
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

const SFX: Record<string, [number, string, number][]> = {
  '0.1': [[0.04, 'type', 0.2], [0.45, 'whoosh', 0.18]],
  '0.2': [[0.2, 'pop', 0.16]],
  '2.2': [[0.25, 'alert', 0.2]],
  '2.3': [[0.3, 'flip', 0.2]],
  '3.4': [[0.3, 'alert', 0.22]],
  '4.2': [[0.35, 'chime', 0.2]],
  '4.3': [[0.25, 'alert', 0.2]],
  '4.4': [[0.25, 'alert', 0.22]],
  '5.2': [[0.25, 'pop', 0.18]],
  '5.4': [[0.3, 'flip', 0.2]],
  '6.3': [[0.55, 'chime', 0.22]],
};

const Badge: React.FC = () => (
  <div style={{position: 'absolute', right: 36, top: 28, padding: '8px 16px', borderRadius: 10, background: `${C.bg}e6`, border: `1px solid ${C.amber}66`, color: C.amber, fontFamily: 'sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1.1, whiteSpace: 'nowrap'}}>
    ARCHITECTURAL EXAMPLE · NOT A RECORDED RUN
  </div>
);

export const ResyncPrimary: React.FC<{chapters: number[]}> = ({chapters}) => {
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
  const cues: {at: number; name: string; v: number}[] = [];
  const seen = new Set<string>();
  for (const beat of beats) {
    const base = beat.from + PAD_BEFORE;
    const list: [number, string, number][] = [...(SFX[beat.id] ?? [])];
    if (META[beat.id]?.card) list.push([0.04, 'pop', 0.17]);
    for (const [frac, name, v] of list) {
      const at = base + Math.round(frac * beat.audio);
      const key = `${at}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cues.push({at, name, v});
    }
  }
  const showWorld = ch >= 2 && ch <= 5;
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`, overflow: 'hidden'}}>
    {showWorld ? <div style={{position: 'absolute', inset: 0, clipPath: 'inset(210px 0 0 0)'}}><div style={{position: 'absolute', transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px,${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}><World c={{id: b.id, f, dur: b.audio, zoom: cam.z}} /></div></div> : null}
    {seg.type === 'beat' && ch === 1 ? <GlossaryScene id={b.id} f={f} dur={b.audio} card={m.card} def={m.def} /> : null}
    {seg.type === 'beat' ? <BeatPanel id={b.id} f={f} dur={b.audio} /> : null}
    {seg.type === 'beat' ? <Hud chapter={b.chapter.title} clock={null} ticket="conceptual" /> : null}
    {seg.type === 'beat' ? <Badge /> : null}
    {seg.type === 'beat' && m.define && !PANEL_BEATS.has(b.id) ? <DefinitionPanel term={m.define.term} text={m.define.text} a={Math.min(1, Math.max(0, Math.min(f / 20, (b.audio - f) / 20)))} x={1050} bottom={280} /> : null}
    {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={Math.min(1, Math.max(0, (frame - seg.from) / 30))} out={Math.min(1, Math.max(0, (frame - seg.from - (seg.dur - 30)) / 30))} /> : null}
    {beats.map((beat) => <Sequence key={beat.id} from={beat.from + PAD_BEFORE} durationInFrames={beat.audio + 10}><Audio src={staticFile(`audio/resync-primary/${beat.id}.wav`)} volume={0.72} /></Sequence>)}
    {cues.map((cue, k) => <Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}><Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v} /></Sequence>)}
  </AbsoluteFill>;
};
