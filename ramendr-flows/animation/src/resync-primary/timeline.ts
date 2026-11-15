import timing from './timing.json';
import {FPS, sec} from '../lib/anim';
export type Chapter = {n: number; title: string; sub?: string};
export const CHAPTERS: Chapter[] = [
  {n: 0, title: 'Two vendors, one question', sub: 'Who tells the array to copy back?'},
  {n: 1, title: 'Primer', sub: 'Sites, records and the translator'},
  {n: 2, title: 'The reverse copy', sub: 'What a failover leaves behind'},
  {n: 3, title: 'The asymmetry', sub: 'Which side can reverse the pair'},
  {n: 4, title: 'First fix and its edges', sub: 'A one-shot call, and a peer dependency'},
  {n: 5, title: 'The redesign', sub: 'Opt in, watch the condition, keep the workload ready'},
  {n: 6, title: 'Where it stands', sub: 'Shipped, in progress, still open'},
];
export type Segment =
  | {type: 'chapter'; chapter: Chapter; from: number; dur: number}
  | {type: 'beat'; id: string; chapter: Chapter; from: number; dur: number; audio: number; afterChapter: boolean};
export const PAD_BEFORE = sec(0.35);
export const buildTimeline = (chapters: number[]) => {
  const t = timing as Record<string, {seconds: number; pause?: number}>;
  const ids = Object.keys(t)
    .filter((id) => chapters.includes(Number(id.split('.')[0])))
    .sort((a, b) => {
      const x = a.split('.').map(Number);
      const y = b.split('.').map(Number);
      return x[0] - y[0] || x[1] - y[1];
    });
  const segs: Segment[] = [];
  let f = 0;
  let last = -1;
  for (const id of ids) {
    const ch = CHAPTERS[Number(id.split('.')[0])];
    const afterChapter = ch.n !== last && ch.n > 0;
    if (afterChapter) {
      segs.push({type: 'chapter', chapter: ch, from: f, dur: sec(2.6)});
      f += sec(2.6);
    }
    last = ch.n;
    const audio = Math.ceil(t[id].seconds * FPS);
    const dur = PAD_BEFORE + audio + sec(t[id].pause ?? 0.8);
    segs.push({type: 'beat', id, chapter: ch, from: f, dur, audio, afterChapter});
    f += dur;
  }
  return {segs, total: f, beatOrder: ids};
};
