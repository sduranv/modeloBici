import { applyState } from '../anim/engine.js';
import { all, get, setOpacity, syncVisibility } from '../scene/registry.js';

const SRC_NAME = { C: 'Confirmado', E: 'Estimado (fotos/video)', S: 'Decisión de diseño' };

const TREE = [
  ['Bicicleta', ['housing', 'crank', 'mast', 'bar', 'grips', 'console', 'consoleBolts', 'knob', 'frame', 'seat']],
  ['Soporte', ['P1', 'P2a', 'P2b', 'P3a', 'P3b']],
  ['Herrajes', ['H1', 'H2', 'H4', 'H5', 'H6', 'H10', 'W1']],
  ['Equipos', ['laptop', 'keyboard']],
  ['Ayudas visuales', ['Z1', 'Z2', 'Z3', 'Z4', 'Z5']],
];

export function initUI({ viewer, model, stages, onShowPart }) {
  const $ = (id) => document.getElementById(id);
  const S = { stage: 0, t: 0, playing: false, device: 'laptop', selected: null, step: -1, dirty: true };

  // Mallas por id para resaltar
  const meshesById = new Map();
  for (const [id, o] of all()) {
    if (!o.userData.info) continue;
    const list = [];
    o.traverse((m) => { if (m.isMesh && m.userData.pickId === id) list.push(m); });
    meshesById.set(id, list);
  }

  // ---------- Árbol de etapas ----------
  const tree = $('stage-tree');
  function buildStageTree() {
    tree.innerHTML = '';
    stages.forEach((st, i) => {
      const li = document.createElement('li');
      li.className = i < S.stage ? 'done' : i === S.stage ? 'current' : '';
      const b = document.createElement('button');
      b.className = 'st';
      b.innerHTML = `<span class="n">${i}</span><span>${st.title}</span>`;
      b.onclick = () => goStage(i, true);
      li.appendChild(b);
      if (i === S.stage) {
        const ul = document.createElement('ul');
        st.steps.forEach((sp, j) => {
          const sli = document.createElement('li');
          if (j === S.step) sli.className = 'on';
          const sb = document.createElement('button');
          sb.textContent = `${j + 1}. ${sp.text.split(/[.:]/)[0]}`;
          sb.title = sp.text;
          sb.onclick = () => { S.t = sp.at; S.playing = true; S.dirty = true; if (sp.cam) viewer.flyTo(...sp.cam); };
          sli.appendChild(sb);
          ul.appendChild(sli);
        });
        li.appendChild(ul);
      }
      tree.appendChild(li);
    });
  }

  // ---------- Segmentos de progreso ----------
  const segs = $('segments');
  const segFills = stages.map((st, i) => {
    const b = document.createElement('button');
    b.title = `${i}. ${st.title}`;
    b.onclick = () => goStage(i, true);
    const f = document.createElement('span');
    f.className = 'fill';
    b.appendChild(f);
    segs.appendChild(b);
    return { b, f };
  });

  // ---------- Árbol de componentes ----------
  const comp = $('comp-tree');
  const compLabels = new Map();
  for (const [title, ids] of TREE) {
    const d = document.createElement('details');
    d.open = title === 'Soporte' || title === 'Bicicleta';
    d.innerHTML = `<summary>${title}</summary>`;
    for (const id of ids) {
      const o = get(id);
      if (!o) continue;
      const info = o.userData.info || { name: id };
      const lab = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.onchange = () => { o.userData.userHidden = !cb.checked; syncVisibility(); };
      const nm = document.createElement('span');
      nm.textContent = info.name;
      nm.onclick = (e) => { e.preventDefault(); select(id); };
      lab.append(cb, nm);
      if (info.src) lab.insertAdjacentHTML('beforeend', `<span class="tag ${info.src}">${info.src}</span>`);
      d.appendChild(lab);
      compLabels.set(id, { lab, cb });
    }
    comp.appendChild(d);
  }

  // ---------- Selección ----------
  function select(id) {
    S.selected = id;
    const card = $('info');
    compLabels.forEach(({ lab }, k) => lab.classList.toggle('sel', k === id));
    if (!id) { card.hidden = true; return; }
    const info = get(id).userData.info;
    const visible = get(id).userData.opacity > 0.01;
    $('info-body').innerHTML = `
      <h4>${info.name}</h4>
      <div class="dims">${info.dims || ''}</div>
      <div style="margin:6px 0"><span class="tag ${info.src}">${info.src}</span> <span class="muted">${SRC_NAME[info.src] || ''}</span></div>
      <p style="margin:6px 0">${info.desc || ''}</p>
      ${visible ? '' : '<p class="muted">No visible en esta etapa.</p>'}
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button id="iso-btn">Aislar</button><button id="all-btn">Mostrar todo</button>
        ${info.part ? `<button id="plan-btn">Ver plano ${info.part}</button>` : ''}
      </div>`;
    card.hidden = false;
    $('iso-btn').onclick = () => isolate(id);
    $('all-btn').onclick = () => isolate(null);
    if (info.part) $('plan-btn').onclick = () => onShowPart(info.part);
  }
  function isolate(id) {
    for (const [k, { cb }] of compLabels) {
      const hide = id ? k !== id : false;
      get(k).userData.userHidden = hide;
      cb.checked = !hide;
    }
    // el grupo del soporte no debe ocultar sus hijos
    syncVisibility();
  }
  $('info-close').onclick = () => select(null);
  viewer.onPick((id) => select(id));

  // ---------- Navegación ----------
  function goStage(i, play = false) {
    S.stage = Math.max(0, Math.min(stages.length - 1, i));
    S.t = 0;
    S.step = -1;
    S.playing = play;
    S.dirty = true;
    viewer.flyTo(...stages[S.stage].cam);
    buildStageTree();
  }
  $('prev').onclick = () => goStage(S.stage - 1, true);
  $('next').onclick = () => goStage(S.stage + 1, true);
  $('restart').onclick = () => { S.t = 0; S.playing = true; S.dirty = true; };
  $('play').onclick = togglePlay;
  function togglePlay() {
    if (!S.playing && S.t >= stages[S.stage].dur) S.t = 0;
    S.playing = !S.playing;
    S.dirty = true;
  }
  $('scrub').oninput = (e) => { S.t = (e.target.value / 1000) * stages[S.stage].dur; S.playing = false; S.dirty = true; };
  $('device').onchange = (e) => { S.device = e.target.value; S.dirty = true; };
  $('jump-installed').onclick = () => { goStage(6); S.t = stages[6].dur; };
  $('jump-parts').onclick = () => { goStage(3); S.t = stages[3].dur; };
  document.querySelectorAll('.views button').forEach((b) => {
    b.onclick = () => (b.dataset.view === 'stage' ? viewer.flyTo(...stages[S.stage].cam) : viewer.view(b.dataset.view));
  });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea') || document.getElementById('page-viewer').hidden) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    if (e.code === 'ArrowRight') goStage(S.stage + 1, true);
    if (e.code === 'ArrowLeft') goStage(S.stage - 1, true);
  });
  $('toggle-left').onclick = () => $('left').classList.toggle('open');

  // ---------- Panel de comprobaciones (etapa 7) ----------
  const nOk = model.checks.filter((c) => c.ok).length;
  $('checks').innerHTML = `<details ${window.innerWidth > 820 ? 'open' : ''}><summary>Comprobaciones: ${nOk}/${model.checks.length} OK</summary><ul style="padding-left:18px">${model.checks
    .map((c) => `<li><span class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✔' : '✘'}</span> <b>${c.label}</b>: ${c.value} <span class="tag ${c.basis}">${c.basis}</span><br><span class="muted">${c.how}</span></li>`)
    .join('')}</ul><p class="muted" style="margin:8px 0 0">Cálculo aproximado con supuestos indicados. No reemplaza la prueba física descrita en Planos → Seguridad.</p></details>`;

  // ---------- Render ----------
  function render() {
    const st = stages[S.stage];
    applyState(stages, S.stage, S.t);
    if (S.device === 'keyboard') {
      setOpacity(get('keyboard'), get('laptop').userData.opacity);
      setOpacity(get('laptop'), 0);
    }
    syncVisibility();
    let step = 0;
    st.steps.forEach((sp, j) => { if (S.t >= sp.at) step = j; });
    if (step !== S.step) {
      const prev = S.step;
      S.step = step;
      if (S.playing && prev !== -1 && st.steps[step].cam) viewer.flyTo(...st.steps[step].cam);
      buildStageTree();
    }
    $('cap-stage').textContent = `Etapa ${S.stage} · ${st.title}`;
    $('cap-step').textContent = `paso ${step + 1}/${st.steps.length}`;
    $('cap-text').textContent = st.steps[step].text;
    $('scrub').value = Math.round((S.t / st.dur) * 1000);
    $('play').textContent = S.playing ? '⏸' : '▶';
    segFills.forEach(({ b, f }, i) => {
      b.classList.toggle('done', i < S.stage);
      f.style.width = i === S.stage ? `${(S.t / st.dur) * 100}%` : '0';
    });
    $('checks').hidden = S.stage !== 7;
  }

  let clock = 0;
  viewer.onFrame((dt) => {
    clock += dt;
    if (S.playing) {
      S.t += dt;
      if (S.t >= stages[S.stage].dur) { S.t = stages[S.stage].dur; S.playing = false; }
      S.dirty = true;
    }
    if (S.dirty) { S.dirty = false; render(); }
    highlight(clock);
  });

  function highlight(time) {
    const focus = new Set(stages[S.stage].steps[Math.max(S.step, 0)].focus || []);
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    for (const [id, meshes] of meshesById) {
      const o = get(id);
      let color = null, k = 0;
      if (id === S.selected) { color = 0x2f6fed; k = 0.55; }
      else if (focus.has(id) && !id.startsWith('Z')) { color = 0xf59e0b; k = 0.15 + 0.35 * pulse; }
      for (const m of meshes) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mt of mats) {
          if (!mt.emissive) continue;
          if (color === null) { mt.emissive.setHex(m.userData.baseEmissive); mt.emissiveIntensity = 1; }
          else { mt.emissive.setHex(color); mt.emissiveIntensity = k; }
        }
      }
      if (o.userData.pulse && o.visible) {
        o.traverse((m) => {
          if (!m.isMesh) return;
          m.material.opacity = (m.userData.baseOpacity ?? 1) * o.userData.opacity * (0.55 + 0.45 * pulse);
        });
      }
    }
  }

  goStage(0);
  return { goStage };
}
