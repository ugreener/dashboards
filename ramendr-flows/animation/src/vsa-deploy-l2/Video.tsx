import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp, prog, progIO, sec} from '../lib/anim';
import {ChapterCard, Hud} from '../components/overlays';
import {PhaseTracker, Screenshot} from '../components/newcomer';
import {buildTimeline, PAD_BEFORE, Segment} from './timeline';
import {Ctx, FOCUS, RECT, World} from './World';
import {ColdOpen, HonestyBadge, InferenceBadge, TermCard} from './Panels';
import BEATS from './beats.json';

type BeatMeta = {
  chapter: string;
  screenshot?: string;
  focus?: {x: number; y: number; w: number; h: number};
  caption?: string;
  define?: {term: string; text: string};
  shot?: {w: number; x: number; y: number};
  iw?: number;
  ih?: number;
  unverified?: boolean;
};
const META = BEATS as unknown as Record<string, BeatMeta>;

type Cam = {x: number; y: number; z: number; sx: number; sy: number};
const WORLD: [number, number, number, number] = [0, 0, 2600, 1500];

const fit = (id: string): Cam => {
  const top = 175;
  const bottom = 1010;
  const areaX0 = 40;
  const areaX1 = 1880;
  const keys = FOCUS[id];
  let [x0, y0, x1, yb] = [WORLD[0], WORLD[1], WORLD[2], WORLD[3]];
  if (keys && keys.length) {
    x0 = Infinity;
    y0 = Infinity;
    x1 = -Infinity;
    yb = -Infinity;
    for (const k of keys) {
      const r = RECT[k];
      if (!r) continue;
      x0 = Math.min(x0, r[0]);
      y0 = Math.min(y0, r[1]);
      x1 = Math.max(x1, r[0] + r[2]);
      yb = Math.max(yb, r[1] + r[3]);
    }
    const pad = 70;
    x0 -= pad;
    y0 -= pad + 55;
    x1 += pad;
    yb += pad;
  }
  const z = Math.max(0.3, Math.min(1.15, (areaX1 - areaX0) / (x1 - x0), (bottom - top) / (yb - y0)));
  return {x: (x0 + x1) / 2, y: (y0 + yb) / 2, z, sx: (areaX0 + areaX1) / 2, sy: (top + bottom) / 2};
};

const camAt = (id: string, prevId: string | null, f: number): Cam => {
  const to = fit(id);
  const from = prevId ? fit(prevId) : to;
  const t = progIO(f, -PAD_BEFORE, sec(1.6));
  return {x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), z: lerp(from.z, to.z, t), sx: lerp(from.sx, to.sx, t), sy: lerp(from.sy, to.sy, t)};
};

const PHASES = ['The appliance', 'What happened', 'Ruled out', 'Why', 'The change', 'The result', 'Recap'];
const PHASE_OF: Record<number, number> = {1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6};

type Sfx = 'click' | 'type' | 'pop' | 'tick' | 'whoosh' | 'land' | 'flip' | 'chime' | 'alert';
const SFX: Record<string, [number, Sfx, number][]> = {
  '0.1': [[0.2, 'whoosh', 0.28], [0.46, 'pop', 0.24], [0.72, 'chime', 0.22]],
  '0.2': [[0.35, 'land', 0.22]],
  '2.1': [[0.3, 'pop', 0.2]],
  '2.2': [[0.55, 'alert', 0.18]],
  '3.1': [[0.2, 'pop', 0.2], [0.5, 'tick', 0.18]],
  '4.1': [[0.25, 'pop', 0.2], [0.55, 'pop', 0.2]],
  '4.3': [[0.3, 'tick', 0.16]],
  '6.3': [[0.45, 'chime', 0.26]],
};

const SHOT_WIN: [number, number] = [0.12, 0.95];

export const VsaDeployL2: React.FC<{chapters: number[]}> = ({chapters}) => {
  const frame = useCurrentFrame();
  const {segs, beatOrder} = buildTimeline(chapters);
  const beats = segs.filter((s): s is Extract<Segment, {type: 'beat'}> => s.type === 'beat');

  const seg = segs.find((s) => frame >= s.from && frame < s.from + s.dur) ?? segs[segs.length - 1];
  const beat = seg.type === 'beat' ? seg : beats.find((b) => b.from >= seg.from) ?? beats[beats.length - 1];
  const bIdx = beats.indexOf(beat);
  const prevId = bIdx > 0 && !beat.afterChapter ? beats[bIdx - 1].id : null;
  const f = seg.type === 'beat' ? frame - beat.from - PAD_BEFORE : -PAD_BEFORE;
  const ch = beat.chapter.n;
  const meta = META[beat.id] ?? {chapter: ''};
  const cam0 = camAt(beat.id, seg.type === 'chapter' ? null : prevId, f);
  let push = 1;
  if (seg.type === 'chapter') push = lerp(0.86, 0.9, prog(frame - seg.from, seg.dur - 30, seg.dur));
  else if (beat.afterChapter) push = lerp(0.9, 1, progIO(f, -PAD_BEFORE, sec(1.2)));
  const cam = {...cam0, z: cam0.z * push};
  const ctx: Ctx = {order: beatOrder, id: beat.id, f, dur: beat.audio, g: frame, zoom: cam.z};
  const winA = (a: number, b: number) => Math.min(prog(f, beat.audio * a, beat.audio * a + 24), 1 - prog(f, beat.audio * b - 24, beat.audio * b));

  const sfx: {at: number; s: Sfx; v: number}[] = [];
  for (const b of beats) {
    const base = b.from + PAD_BEFORE;
    const add = (frac: number, s: Sfx, v: number) => sfx.push({at: base + Math.round(frac * b.audio), s, v});
    for (const [frac, s, v] of SFX[b.id] ?? []) add(frac, s, v);
    if (META[b.id]?.screenshot) {
      add(SHOT_WIN[0], 'whoosh', 0.2);
      add(SHOT_WIN[0] + 0.03, 'land', 0.18);
    }
  }
  for (const s of segs) if (s.type === 'chapter') sfx.push({at: s.from + 4, s: 'chime', v: 0.18});

  const shot = seg.type === 'beat' && !!meta.screenshot;
  const term = seg.type === 'beat' && (ch === 1 || ch === 7) && !!meta.define;
  const showWorld = !shot && !term && ch >= 2 && ch <= 6;
  const isConsole = (meta.screenshot ?? '').startsWith('console-');
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #0b1320, ${C.bg} 70%)`, overflow: 'hidden'}}>
      {showWorld ? (
        <div style={{position: 'absolute', left: 0, top: 0}}>
          <div style={{transformOrigin: '0 0', transform: `translate(${cam.sx - cam.x * cam.z}px, ${cam.sy - cam.y * cam.z}px) scale(${cam.z})`}}>
            <World c={ctx} />
          </div>
        </div>
      ) : null}
      {seg.type === 'beat' && ch === 0 && (beat.id === '0.1' || beat.id === '0.2') ? <ColdOpen f={f} dur={beat.audio} settled={beat.id === '0.2'} /> : null}
      {term ? <TermCard term={meta.define!.term} text={meta.define!.text} f={f} dur={beat.audio} /> : null}
      {seg.type === 'beat' && beat.id !== '0.1' && beat.id !== '0.2' ? <Hud chapter={beat.chapter.title} ticket="VSA DEPLOY" /> : null}
      {seg.type === 'beat' && PHASE_OF[ch] !== undefined ? <PhaseTracker current={PHASE_OF[ch]} phases={PHASES} /> : null}
      {seg.type === 'beat' && meta.screenshot ? (
        <Screenshot
          src={`evidence/vsa-deploy-l2/${meta.screenshot}`}
          focus={meta.focus}
          caption={meta.caption ?? ''}
          a={winA(SHOT_WIN[0], SHOT_WIN[1])}
          z={progIO(f, beat.audio * 0.1, beat.audio * 0.45)}
          x={meta.shot?.x ?? 250}
          y={meta.shot?.y ?? 190}
          w={meta.shot?.w ?? 1400}
          iw={meta.iw ?? 1920}
          ih={meta.ih ?? 1080}
          date={isConsole ? '2026-11-24' : '2026-11-25'}
          sourceLabel={isConsole ? 'VM console · live capture' : 'vCenter · live capture'}
          captionPrefix={isConsole ? 'Captured from the VM console' : 'Captured from vCenter'}
        />
      ) : null}
      {seg.type === 'beat' && meta.unverified ? <InferenceBadge a={winA(0.08, 0.95)} /> : null}
      {ch > 0 ? <HonestyBadge /> : null}
      {seg.type === 'chapter' ? <ChapterCard n={seg.chapter.n} title={seg.chapter.title} sub={seg.chapter.sub} p={prog(frame - seg.from, 0, 30)} out={prog(frame - seg.from, seg.dur - 30, seg.dur)} /> : null}
      {beats.map((b) => (
        <Sequence key={b.id} from={b.from + PAD_BEFORE} durationInFrames={b.audio + 10}>
          <Audio src={staticFile(`audio/vsa-deploy-l2/${b.id}.wav`)} volume={0.72} />
        </Sequence>
      ))}
      {sfx.map((x, i) => (
        <Sequence key={`sfx${i}`} from={x.at} durationInFrames={sec(1.6)}>
          <Audio src={staticFile(`sfx/${x.s}.wav`)} volume={x.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
