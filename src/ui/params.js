import { PARAMS, overrides, saveOverrides } from '../data/params.js';

// Las 3 medidas que hay que confirmar en la bici antes de cortar: definen las ranuras.
const CRITICAS = ['barD', 'mastW', 'mastTipAboveBar'];

const input = (k) => {
  const o = overrides();
  const val = typeof o[k] === 'number' ? o[k] : PARAMS[k].v;
  return `<input type="number" step="any" data-k="${k}" value="${val}"> mm`;
};

// Formulario compacto. Las 3 críticas a la vista; el resto, plegado.
export function renderParamsInto(el) {
  const rest = Object.entries(PARAMS).filter(([k]) => !CRITICAS.includes(k));
  el.innerHTML = `
    <table class="compact">
      ${CRITICAS.map((k) => `<tr><td><b>${PARAMS[k].label}</b><br><span class="muted">${PARAMS[k].note || ''}</span></td><td class="num">${input(k)}</td></tr>`).join('')}
    </table>
    <details><summary class="muted">Ajustar el resto de las medidas</summary>
      <table class="compact">${rest.map(([k, q]) => `<tr><td>${q.label}</td><td class="num">${input(k)}</td></tr>`).join('')}</table>
    </details>
    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
      <button id="par-apply" class="active">Aplicar y recalcular</button>
      <button id="par-reset">Volver a los valores estimados</button>
    </div>`;

  el.querySelector('#par-apply').onclick = () => {
    const next = {};
    el.querySelectorAll('input[data-k]').forEach((i) => {
      const k = i.dataset.k, v = parseFloat(i.value);
      if (Number.isFinite(v) && v !== PARAMS[k].v) next[k] = v;
      // una medida que el usuario edita pasa a contar como medida en la bici
      if (Number.isFinite(v) && v !== PARAMS[k].v && PARAMS[k].src !== 'C') next[`${k}__src`] = 'C';
    });
    saveOverrides(next);
    location.reload();
  };
  el.querySelector('#par-reset').onclick = () => { saveOverrides({}); location.reload(); };
}

// Aplica las marcas de "medido" sobre el origen de cada parámetro.
export function applySourceOverrides() {
  const o = overrides();
  for (const k of Object.keys(PARAMS)) if (o[`${k}__src`]) PARAMS[k].src = o[`${k}__src`];
}

export const pendientes = () => CRITICAS.filter((k) => PARAMS[k].src !== 'C').map((k) => PARAMS[k].label);
