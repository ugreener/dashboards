'use strict';
(() => {
  const app = document.getElementById('app');
  const synth = window.speechSynthesis;
  const supported = !!synth && typeof SpeechSynthesisUtterance === 'function';
  const clean = text => text.replace(/\s+/g, ' ').trim();
  const chapters = [];
  const explanations = {
    'Topology and the three independent recovery paths': 'Think of recovery as separate but cooperating paths. Replicated blocks preserve disk contents. Kubernetes object protection preserves the definitions needed to recreate the workload. DR control coordinates the selected site and storage roles. Managed applications add GitOps reconciliation. A successful result needs these paths to agree; one healthy component does not prove the whole recovery works.',
    'CRD dependency diagram and namespaces': 'We will walk through every dependency lane and every resource card, including the explanations hidden behind expanders. A resource definition supplies an API; an instance supplies a particular configuration or observed state. Namespace and cluster scope determine where to inspect that instance. A reference, delivery connection, and observation connection have different meanings, and none should automatically be interpreted as ownership.',
    'Pre-failover readiness gates': 'This page describes the baseline that must be established before a test. Inventory identifies the exact workload and its owners. Object recovery or a functioning GitOps handoff establishes how the VM configuration reaches the target. Source services and writes provide the database baseline. Every backing disk must meet the actual replication interval. Console and controller evidence then establishes the starting state.',
    'Start-to-finish flow': 'The flow is a sequence of verification gates, not a timer or an automated execution. First confirm the paired configuration against fresh evidence. Then initiate through the authorized hub UI, verify promoted target disks, and follow the application-specific cleanup or reconciliation path. Guest recovery, exact history-gap analysis, Windows desktop verification when applicable, and stopping the writer complete the procedure.',
    'Detailed handoffs and blocking gates': 'Each stage names the responsible surface, the individual observations or actions, and the gate that blocks progress. Listen to each item separately. A completed earlier stage is not permission to skip a later gate. Discovered applications require separately authorized source cleanup; managed applications require evidence of automatic controller reconciliation.',
    'Resource map and configuration evidence': 'The next material preserves exact resource identities and configuration syntax. These names connect the hub view to spoke-local objects. The date and scope matter: recorded identities are not continuous monitoring. A repository excerpt establishes committed configuration, not proof that a live controller uses it or has reconciled it.',
    'Read-only inspection and database examples': 'Inspection commands reveal configuration and observed state without changing the cluster. Context names and time ranges explicitly marked as placeholders must be resolved before use. Database history queries distinguish recovered writes from new writes after restart. Total order counts alone cannot establish the recovery gap or an exact loss verdict.',
    'Evidence capture map': 'The evidence matrix specifies baseline, transition and completion observations for each surface. Read each row as a chain of proof: what was true before initiation, what changed during recovery, and what confirms completion. Browser screenshots and timestamped guest or database command output serve different purposes and must be paired.',
    'Known history and diagnostic boundaries': 'Historical defects explain earlier observations, but their ticket state does not establish current reproduction or current health. Preserve the distinction between a recorded test, an intended handoff, and a verified live result. Old array symptoms and addresses do not by themselves identify a Ramen fault.',
    'Run acceptance checklist': 'This checklist is a reviewer aid. Checking a box changes neither a cluster nor Jira, and does not create evidence. Each statement must be backed by the run-specific observations described earlier.'
  };
  function read(el) {
    if (el.nodeType === Node.TEXT_NODE) return el.textContent;
    if (el.nodeType !== Node.ELEMENT_NODE) return '';
    if (['SCRIPT', 'STYLE', 'INPUT'].includes(el.tagName)) return '';
    if (el.tagName === 'BR') return '\n';
    if (el.tagName === 'SVG') {
      const labels = [...el.querySelectorAll('text')].map(e => clean([...e.querySelectorAll('tspan')].map(t => t.textContent).join(' ') || e.textContent));
      return labels.length ? '\nConnection labels, in diagram order: ' + labels.join('; ') + '.\n' : '';
    }
    if (el.tagName === 'TABLE') {
      const headers = [...el.querySelectorAll('thead th')].map(e => clean(e.textContent));
      return '\nTable columns: ' + headers.join('; ') + '.\n' + [...el.querySelectorAll('tbody tr')].map((row, i) =>
        `Row ${i + 1}. ` + [...row.cells].map((cell, j) => `${headers[j] || 'Column ' + (j + 1)}: ${clean(read(cell))}`).join('. ') + '.\n'
      ).join('');
    }
    if (el.tagName === 'PRE') {
      const code = el.textContent.trim();
      let context = 'This block preserves the exact recorded resource tree or example. Indentation expresses relationships, not verified ownership.';
      if (code.includes('oc --context')) context = 'These are OpenShift read-only inspection commands. The context selects the cluster, get selects the resource, namespace narrows the scope, and YAML exposes fields and conditions. Read all comments for placeholder and applicability limits.';
      else if (code.includes('SELECT')) context = 'These read-only SQL statements group history writes by minute, locate the timestamp boundary, count rows in the recovery window, and inspect the order baseline. Substitute the actual time range and verify the database timezone; recovered rows must be compared with source evidence.';
      else if (code.includes('metadata:')) context = 'This partial YAML names the ApplicationSet and its namespace. The decision-resource generator reads a labeled PlacementDecision. The source specifies the authoritative repository, revision and path; destination identifies the generated target; automated prune and self-heal describe reconciliation intent, not proof of a working handoff.';
      return '\n' + context + '\nFull block, line by line:\n' + code.split('\n').map((line, i) => `Line ${i + 1}: ${line || 'blank line'}`).join('\n') + '\n';
    }
    if (el.tagName === 'A') {
      const text = [...el.childNodes].map(read).join('');
      return ' ' + text + (el.getAttribute('href') ? ` (link: ${el.getAttribute('href')})` : '') + ' ';
    }
    const text = [...el.childNodes].map(read).join('');
    if (el.classList.contains('namespace-badge')) return ' ' + text + ' ';
    if (el.tagName === 'LI') return '\nItem: ' + text + '\n';
    if (el.tagName === 'LABEL') return '\nChecklist or control: ' + text + '\n';
    if (el.classList.contains('resource-node')) return '\nResource card. ' + text + '\n';
    if (el.classList.contains('resource-lane-title')) return '\nDependency lane: ' + text + '\n';
    if (el.tagName === 'SUMMARY') return '\nExpandable explanation: ' + text + '\n';
    if (['P', 'DIV', 'SECTION', 'ARTICLE', 'FOOTER', 'NAV', 'H1', 'H2', 'H3', 'DETAILS', 'SMALL'].includes(el.tagName)) return '\n' + text + '\n';
    return text;
  }
  const intro = `Welcome to the detailed podcast walkthrough of ${document.title}. This episode covers the information on this dashboard, including collapsed explanations, resource cards, table cells, exact code examples, evidence limits, acceptance items and reference links. It describes the page, not current cluster health. Playback never performs any of the operations described. Chapters follow the page order. You can listen using your browser reader or download the complete transcript.`;
  chapters.push({title: 'Introduction, scenario and evidence boundaries', text: intro});
  for (const el of app.children) {
    if (el.tagName === 'H2') {
      const title = clean(el.textContent);
      chapters.push({title, text: `${title}.\n${explanations[title] || ''}`});
    } else if (el.id === 'resource-dependencies') {
      chapters.push({title: 'Resource dependencies, every lane and explanation', text: explanations['CRD dependency diagram and namespaces'] + '\n' + read(el)});
    } else {
      chapters.at(-1).text += '\n' + read(el);
    }
  }
  const section = document.createElement('section');
  section.id = 'podcast';
  section.className = 'panel';
  section.style.margin = '20px 0';
  section.innerHTML = `<h2 style="margin-top:0">Podcast: detailed dashboard walkthrough</h2>
    <p>A complete, chaptered podcast script with additional explanations. Includes collapsed resource details, tables, exact code examples and references. Open the reader-friendly episode to listen with your browser reader, or use the optional speech controls below.</p>
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
