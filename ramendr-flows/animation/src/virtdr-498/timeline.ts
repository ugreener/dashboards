import timing from './timing.json';
import {FPS, sec} from '../lib/anim';

export type Chapter = {n: number; title: string; sub?: string};

export const CHAPTERS: Chapter[] = [
  {n: 0, title: 'A grouped handover', sub: 'Two disks, one database, both sites still up'},
  {n: 1, title: 'The pieces', sub: 'From the sites and arrays to the group and its session'},
  {n: 2, title: 'Protection', sub: 'What had to be true before the operator clicked Initiate'},
  {n: 3, title: 'The request', sub: 'One console action, two fields on the hub record'},
  {n: 4, title: 'Promotion', sub: 'Restore the objects, promote the group once, start the guest'},
  {n: 5, title: 'Data', sub: 'A completed job is not the recovery point'},
  {n: 6, title: 'Reverse copy', sub: 'Storage health and peer readiness are different milestones'},
  {n: 7, title: 'Cleanup', sub: 'The documented cleanup that left two PVs deleting'},
  {n: 8, title: 'Recap', sub: 'What the run established, and what it did not'},
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
