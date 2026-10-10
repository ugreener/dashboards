// Render many stills from one bundle: node tools/still_batch.mjs <job.json>
// job: {comp, shots: [{frame, out}]}
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const job = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const composition = await selectComposition({serveUrl, id: job.comp});
for (const s of job.shots) {
  await renderStill({serveUrl, composition, frame: s.frame, output: s.out, imageFormat: 'png'});
  console.log('ok', s.out);
}
