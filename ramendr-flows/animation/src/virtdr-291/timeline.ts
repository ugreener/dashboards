import timing from './timing.json';
import {FPS, sec} from '../lib/anim';

export type Chapter = {n: number; title: string; sub?: string};

export const CHAPTERS: Chapter[] = [
  {n: 0, title: 'Cold open'},
  {n: 1, title: 'Cast of characters', sub: 'Every object in this story, in plain words'},
  {n: 2, title: 'The environment', sub: 'Three clusters, two arrays, one namespace to protect'},
  {n: 3, title: 'Protected steady state', sub: 'Disks, claims and the VM definition, all copied'},
  {n: 4, title: 'Before the click', sub: 'How recent is the copy?'},
  {n: 5, title: 'Initiate', sub: 'One click, two fields'},
  {n: 6, title: 'Hub checks the target', sub: 'Validate before moving anything'},
  {n: 7, title: 'Promotion on spoke-1', sub: 'Reconnect the claims, then make the copies writable'},
  {n: 8, title: 'Restoring the VM', sub: 'No Git, so Velero rebuilds it'},
  {n: 9, title: 'The source freezes', sub: 'A write to a read-only disk'},
  {n: 10, title: 'Placement and the wait', sub: 'Ramen will not delete your app'},
  {n: 11, title: 'Manual cleanup', sub: 'VM first, then DataVolumes, spoke-0 only'},
  {n: 12, title: 'Completed', sub: 'The old site becomes the spare'},
  {n: 13, title: 'What was verified', sub: 'And what this run cannot prove'},
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
