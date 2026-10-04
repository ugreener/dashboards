'use strict';
(() => {
  const app = document.getElementById('app');
  const chapters = window.buildDellPodcast(document.body.dataset.flow, document.body.dataset.view);
  const section = document.createElement('section');
  section.id = 'podcast';
  section.className = 'panel';
  section.style.margin = '20px 0';
  section.innerHTML = `<h2 style="margin-top:0">Dashboard walkthrough transcript</h2>
    <details><summary>Read the full episode transcript</summary><div id="pod-transcript" style="max-height:500px;overflow:auto;white-space:pre-wrap"></div></details>`;
  app.querySelector('.summary').after(section);
  const transcript = chapters.map((c, i) => `CHAPTER ${i + 1}: ${c.title}\n\n${c.text.trim()}`).join('\n\n');
  document.getElementById('pod-transcript').textContent = transcript;
})();
