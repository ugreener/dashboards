import timing from './timing.json';
import {FPS, sec} from '../lib/anim';
export type Chapter = {n: number; title: string; sub?: string};
export const CHAPTERS: Chapter[] = [
  {n: 0, title: 'Four steps and the job they do not count'},
  {n: 1, title: 'Cast of characters', sub: 'One job for every object in the cleanup chain'},
  {n: 2, title: 'A failover that worked', sub: 'The application moved, within the objective'},
  {n: 3, title: 'The instruction', sub: 'The console asks for cleanup, and the target is verified'},
  {n: 4, title: 'Cleanup and the silence after', sub: 'Deletion starts, one driver call runs, then nothing'},
  {n: 5, title: 'Anatomy of the wedge', sub: 'Every layer waits for the next, and the last is silent'},
  {n: 6, title: 'The control run and the line between fact and inference', sub: 'Same steps, same build, opposite outcome'},
  {n: 7, title: 'What the test established', sub: 'The promise, the safe gate and the open question'},
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
