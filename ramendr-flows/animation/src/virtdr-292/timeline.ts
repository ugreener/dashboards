import timing from './timing.json';
import {FPS, sec} from '../lib/anim';

export type Chapter = {n: number; title: string; sub?: string};

export const CHAPTERS: Chapter[] = [
  {n: 0, title: 'Cold open'},
  {n: 1, title: 'The environment', sub: 'Three clusters, two arrays, one Git repo'},
  {n: 2, title: 'Protected steady state', sub: 'What "protected" actually means'},
  {n: 3, title: 'Preflight gate', sub: 'Why a console "Ready" is not enough'},
  {n: 4, title: 'Initiate'},
  {n: 5, title: 'Hub decides'},
  {n: 6, title: 'Promotion on spoke-0'},
  {n: 7, title: 'The source stops writing'},
  {n: 8, title: 'Placement moves'},
  {n: 9, title: 'GitOps reacts'},
  {n: 10, title: 'VM boots on spoke-0'},
  {n: 11, title: 'Cleaning up the source'},
  {n: 12, title: 'Completed'},
  {n: 13, title: 'What did we lose'},
  {n: 14, title: 'After the failover'},
];

export type Segment =
  | {type: 'chapter'; chapter: Chapter; from: number; dur: number}
  | {type: 'beat'; id: string; chapter: Chapter; from: number; dur: number; audio: number; afterChapter: boolean};

const PAD_BEFORE = sec(0.35);
const PAD_AFTER = sec(0.9);
const CHAPTER_CARD = sec(2.6);

const T = timing as Record<string, {seconds: number; pause?: number}>;

/** Build the ordered segment list for the given chapters (beats with generated audio only). */
export const buildTimeline = (chapters: number[]) => {
  const ids = Object.keys(T).filter((id) => chapters.includes(Number(id.split('.')[0])));
  const segs: Segment[] = [];
  let f = 0;
  let lastCh = -1;
  for (const id of ids) {
    const ch = CHAPTERS[Number(id.split('.')[0])];
    if (ch.n !== lastCh && ch.n > 0) {
      segs.push({type: 'chapter', chapter: ch, from: f, dur: CHAPTER_CARD});
      f += CHAPTER_CARD;
    }
    lastCh = ch.n;
    const audio = Math.ceil(T[id].seconds * FPS);
    const dur = PAD_BEFORE + audio + (T[id].pause !== undefined ? sec(T[id].pause as number) : PAD_AFTER);
    segs.push({type: 'beat', id, chapter: ch, from: f, dur, audio, afterChapter: segs.length > 0 && segs[segs.length - 1].type === 'chapter'});
    f += dur;
  }
  return {segs, total: f, beatOrder: ids};
};

export {PAD_BEFORE};
