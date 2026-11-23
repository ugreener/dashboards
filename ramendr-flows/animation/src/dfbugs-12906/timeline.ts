import timing from './timing.json';
import {FPS, sec} from '../lib/anim';

export type Chapter = {n: number; title: string; sub?: string};

export const CHAPTERS: Chapter[] = [
  {n: 0, title: 'A cleanup that would not end', sub: 'A failover that worked, and two records left behind'},
  {n: 1, title: 'The pieces', sub: 'From the claim to the mark that keeps a disk alive'},
  {n: 2, title: 'The promise', sub: 'Why the old site must keep its volume records'},
  {n: 3, title: 'One second', sub: 'The recorded cleanup, event by event'},
  {n: 4, title: 'The branch', sub: 'The condition that treats an async secondary as a primary'},
  {n: 5, title: 'The delete that would not end', sub: 'What Kubernetes does with Released and Delete'},
  {n: 6, title: 'Two beliefs', sub: 'The object that says done, the array that still copies'},
  {n: 7, title: 'What it cost', sub: 'The damage, the open question, and the unproven part'},
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
