import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud} from '../components/overlays';
import {DefinitionPanel, Def} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {World, FOCUS, RECT, REGIONS, REGION_OF, TOPMOST} from './World';
import {BeatPanel, PANEL_BEATS} from './Panels';
import BEATS from './beats.json';

type Meta = {define?: {term: string; text: string}; card?: {kind: string; name: string; role: string}; def?: Def};
const META = BEATS as Record<string, Meta>;

type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const CAMS: Record<string, Partial<Cam>> = {};

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
    const rk = REGION_OF[key];
    if (rk) {
      const reg = REGIONS.find((g) => g.key === rk)!;
      y0 = Math.min(y0, reg.b.y + 10);
      if (!side) {
        x0 = Math.min(x0, reg.b.x + 20);
        x1 = Math.max(x1, reg.b.x + reg.b.w - 20);
      }
    }
  }
  if (!Number.isFinite(x0)) {
    x0 = 0; y0 = 0; x1 = 2500; y1 = 1800;
  }
  x0 -= 60; x1 += 60; y1 += 70;
  const left = 35, right = side ? 825 : 1880, top = 210, bottom = META[id]?.define ? 760 : 900;
  const z = Math.min(1.2, (right - left) / (x1 - x0), (bottom - top) / (y1 - y0));
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, sx: (left + right) / 2, sy: (top + bottom) / 2, ...CAMS[id]};
};

const SFX: Record<string, [number, string, number][]> = {
  '0.1': [[0.04, 'type', 0.2], [0.45, 'whoosh', 0.18]],
  '1.1': [[0.05, 'pop', 0.16]],
  '1.2': [[0.05, 'pop', 0.15]],
  '1.3': [[0.3, 'pop', 0.15]],
  '2.1': [[0.3, 'whoosh', 0.18]],
  '2.2': [[0.35, 'pop', 0.16]],
  '2.3': [[0.45, 'flip', 0.18]],
  '3.1': [[0.05, 'pop', 0.15]],
  '3.2': [[0.4, 'flip', 0.18]],
  '4.1': [[0.05, 'pop', 0.15]],
  '4.2': [[0.35, 'pop', 0.15]],
  '5.1': [[0.1, 'whoosh', 0.18]],
  '5.2': [[0.35, 'tick', 0.16]],
  '6.1': [[0.05, 'pop', 0.15]],
  '7.1': [[0.3, 'tick', 0.16]],
  '7.2': [[0.35, 'pop', 0.15]],
  '8.1': [[0.05, 'pop', 0.15]],
  '8.2': [[0.4, 'tick', 0.16]],
  '8.3': [[0.45, 'chime', 0.2]],
  '9.1': [[0.05, 'pop', 0.15]],
  '9.2': [[0.35, 'pop', 0.15]],
  '10.1': [[0.45, 'chime', 0.22]],
};

const Badge: React.FC = () => (
  <div style={{position: 'absolute', right: 36, top: 28, padding: '8px 16px', borderRadius: 10, background: `${C.bg}e6`, border: `1px solid ${C.amber}66`, color: C.amber, fontFamily: 'sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1.1, whiteSpace: 'nowrap'}}>
    ARCHITECTURAL EXAMPLE · NOT A RECORDED RUN
  </div>
);

export const DellDrQa: React.FC<{chapters: number[]}> = ({chapters}) => {
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
  const win = (a: number, z: number) => Math.min(1, Math.max(0, (f - b.audio * a) / 22)) * Math.min(1, Math.max(0, (b.audio * z - f) / 22));
  const side = PANEL_BEATS.has(b.id) || !!m.define;
  const showWorld = ch >= 1;
  const cues: {at: number; name: string; v: number}[] = [];
  const seen = new Set<string>();
  for (const beat of beats) {
    const base = beat.from + PAD_BEFORE;
    const list: [number, string, number][] = [...(SFX[beat.id] ?? [])];
    if (META[beat.id]?.define) list.push([0.04, 'pop', 0.15]);
    for (const [frac, name, v] of list) {
      const at = base + Math.round(frac * beat.audio);
      const key = `${at}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cues.push({at, name, v});
    }
  }
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%,#0b1320,${C.bg} 70%)`, overflow: 'hidden'}}>
      {showWorld ? (
        <div style={{position: 'absolute', transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px,${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}>
          <World c={{id: b.id, f, dur: b.audio, zoom: cam.z, hideTitles: PANEL_BEATS.has(b.id)}} />
        </div>
      ) : null}
      {seg.type === 'beat' ? <Hud chapter={b.chapter.title} clock={null} ticket="DELL DR · SESSION Q&A" /> : null}
      <Badge />
      {seg.type === 'beat' ? <BeatPanel id={b.id} f={f} dur={b.audio} /> : null}
      {seg.type === 'beat' && m.define ? <DefinitionPanel term={m.define.term} text={m.define.text} a={win(0.05, 0.97)} x={880} bottom={150} /> : null}
      {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={Math.min(1, Math.max(0, (frame - seg.from) / 30))} out={Math.min(1, Math.max(0, (frame - seg.from - (seg.dur - 30)) / 30))} /> : null}
      {beats.map((beat) => (
        <Sequence key={beat.id} from={beat.from + PAD_BEFORE} durationInFrames={beat.audio + 10}>
          <Audio src={staticFile(`audio/dell-dr-qa/${beat.id}.wav`)} volume={0.72} />
        </Sequence>
      ))}
      {cues.map((cue, k) => (
        <Sequence key={k} from={cue.at} durationInFrames={sec(1.6)}>
          <Audio src={staticFile(`sfx/${cue.name}.wav`)} volume={cue.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
