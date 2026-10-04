'use strict';
(() => {
  const app = document.getElementById('app');
  const synth = window.speechSynthesis;
  const supported = !!synth && typeof SpeechSynthesisUtterance === 'function';
  const chapters = window.buildDellPodcast(document.body.dataset.flow, document.body.dataset.view);
  const section = document.createElement('section');
  section.id = 'podcast';
  section.className = 'panel';
  section.style.margin = '20px 0';
  section.innerHTML = `<h2 style="margin-top:0">Podcast: detailed dashboard walkthrough</h2>
    <p>An authored podcast episode: follow the recovery story, understand why each component matters, and hear the evidence explained in plain language. Technical examples are explained rather than read as code. Open the reader-friendly episode for your browser reader, or use the optional speech controls below.</p>
    <div class="toolbar"><button id="pod-reader">Open reader-friendly episode</button><button id="pod-save-transcript">Download complete transcript</button></div>
    <details><summary>Optional browser narration (voice availability depends on your device)</summary>
    <div class="toolbar"><button id="pod-play">Play episode</button><button id="pod-pause">Pause</button><button id="pod-resume">Resume</button><button id="pod-stop">Stop</button><button id="pod-prev">Previous chapter</button><button id="pod-next">Next chapter</button></div>
    <div class="toolbar"><label>Chapter <select id="pod-chapter"></select></label><label>Voice <select id="pod-voice"><option value="">Browser default</option></select></label><label>Speed <select id="pod-rate"><option value="0.8">0.8x</option><option value="1" selected>1x</option><option value="1.2">1.2x</option><option value="1.5">1.5x</option></select></label><button id="pod-download">Download complete transcript</button></div>
    <p id="pod-info" class="muted"></p><p id="pod-status" role="status" aria-live="polite">Ready. Select Play episode to begin.</p>
    <progress id="pod-progress" max="100" value="0" aria-label="Episode progress" style="width:100%"></progress>
    <p id="pod-current" style="border-left:3px solid var(--purple);padding-left:12px"></p></details>
    <details><summary>Read the full episode transcript</summary><div id="pod-transcript" style="max-height:500px;overflow:auto;white-space:pre-wrap"></div></details>`;
  app.querySelector('.summary').after(section);
  const get = id => document.getElementById('pod-' + id);
  const transcript = chapters.map((c, i) => `CHAPTER ${i + 1}: ${c.title}\n\n${c.text.trim()}`).join('\n\n');
  get('transcript').textContent = transcript;
  chapters.forEach((c, i) => get('chapter').add(new Option(`${i + 1}. ${c.title}`, i)));
  section.querySelectorAll('select').forEach(el => {el.style.maxWidth = 'min(420px, 80vw)'; el.style.padding = '8px';});
  const words = transcript.split(/\s+/).length;
  get('info').textContent = `${chapters.length} chapters; ${words.toLocaleString()} words. Rough listening estimate: ${Math.ceil(words / 150)} minutes at 1x (voice and code pronunciation vary).`;
  // Whitespace chunks preserve every character, including unpunctuated final text.
  const queue = chapters.flatMap((c, chapter) => {
    const chunks = []; let rest = c.text.trim();
    while (rest.length) {
      let end = rest.length <= 180 ? rest.length : rest.lastIndexOf(' ', 180);
      if (end <= 0) end = Math.min(180, rest.length);
      chunks.push({chapter, text: rest.slice(0, end)}); rest = rest.slice(end).trimStart();
    }
    return chunks;
  });
  let position = 0, generation = 0, state = 'stopped', active = null;
  const status = text => {get('status').textContent = text;};
  function cancel() {
    generation++; state = 'stopped';
    if (supported) {synth.cancel(); synth.resume();}
    active = null;
  }
  function speak() {
    if (position >= queue.length) {state = 'stopped'; active = null; get('progress').value = 100; status('Episode complete. All chapters finished.'); return;}
    const chunk = queue[position], token = generation;
    get('chapter').value = chunk.chapter;
    get('current').textContent = chunk.text;
    get('progress').value = position / queue.length * 100;
    active = new SpeechSynthesisUtterance(chunk.text);
    active.lang = 'en-US'; active.rate = Number(get('rate').value);
    active.voice = synth.getVoices().find(v => v.voiceURI === get('voice').value) || null;
    active.onstart = () => {if (token === generation) status(`Playing chapter ${chunk.chapter + 1} of ${chapters.length}: ${chapters[chunk.chapter].title}`);};
    active.onend = () => {
      if (token !== generation) return;
      position++;
      if (state === 'playing') speak();
    };
    active.onerror = event => {
      if (token !== generation) return;
      state = 'stopped';
      status(`Audio stopped: ${event.error}. No text was skipped. Select Play to retry this passage, choose another voice, or read/download the transcript.`);
    };
    synth.speak(active);
  }
  function play() {
    if (!supported) return;
    if (state === 'paused') {state = 'playing'; synth.resume(); if (!synth.speaking && !synth.pending) speak(); status('Playback resumed.'); return;}
    cancel(); if (position >= queue.length) position = 0; state = 'playing'; speak();
  }
  function jump(chapter) {
    cancel(); position = queue.findIndex(c => c.chapter === chapter);
    get('chapter').value = chapter; get('progress').value = position / queue.length * 100;
    get('current').textContent = queue[position].text;
    status(`Ready at chapter ${chapter + 1}. Select Play to listen.`);
  }
  get('play').onclick = play;
  get('resume').onclick = () => {if (state === 'paused') play();};
  get('pause').onclick = () => {if (state === 'playing') {state = 'paused'; synth.pause(); status('Paused. Select Resume to continue.');}};
  get('stop').onclick = () => {cancel(); position = 0; get('chapter').value = 0; get('progress').value = 0; get('current').textContent = ''; status('Stopped. Playback reset to the beginning.');};
  get('chapter').onchange = () => jump(Number(get('chapter').value));
  get('prev').onclick = () => jump(Math.max(0, Number(get('chapter').value) - 1));
  get('next').onclick = () => jump(Math.min(chapters.length - 1, Number(get('chapter').value) + 1));
  [get('voice'), get('rate')].forEach(el => {el.onchange = () => {if (state === 'playing') play();};});
  function voices() {
    const selected = get('voice').value;
    get('voice').replaceChildren(new Option('Browser default', ''));
    synth.getVoices().forEach(v => get('voice').add(new Option(`${v.name} (${v.lang})${v.localService ? ' - device voice' : ' - network voice'}`, v.voiceURI)));
    if ([...get('voice').options].some(o => o.value === selected)) get('voice').value = selected;
  }
  if (supported) {voices(); synth.addEventListener('voiceschanged', voices);}
  else {
    ['play', 'pause', 'resume', 'stop'].forEach(id => {get(id).disabled = true;});
    status('This browser has no speech synthesis. The complete episode transcript remains available to read and download.');
  }
  get('download').onclick = () => {
    const url = URL.createObjectURL(new Blob([transcript], {type: 'text/plain;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url;
    a.download = `virtdr-${document.body.dataset.flow}-${document.body.dataset.view}-podcast.txt`;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  get('save-transcript').onclick = get('download').onclick;
  get('reader').onclick = () => {
    cancel();
    app.hidden = true;
    const reader = document.createElement('main'); reader.id = 'podcast-reader'; reader.style.maxWidth = '1000px';
    const article = document.createElement('article');
    const heading = document.createElement('h1'); heading.textContent = document.title + ': podcast'; article.append(heading);
    const back = document.createElement('a'); back.href = location.href; back.textContent = 'Return to dashboard'; article.append(back);
    chapters.forEach((chapter, i) => {
      const title = document.createElement('h2'); title.textContent = `Chapter ${i + 1}: ${chapter.title}`; article.append(title);
      chapter.text.split(/\n+/).filter(text => text.trim()).forEach(text => {
        const paragraph = document.createElement('p'); paragraph.textContent = text.trim(); article.append(paragraph);
      });
    });
    reader.append(article); document.body.append(reader); window.scrollTo(0,0);
  };
  window.addEventListener('pagehide', cancel);
})();
