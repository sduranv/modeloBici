import { all, get, setOpacity } from '../scene/registry.js';

// Motor de animación determinista: el estado de la escena se calcula a partir de (etapa, tiempo).
// Por eso se puede pausar, retroceder, arrastrar la barra o saltar a cualquier etapa sin acumular errores.

export const EASE = {
  lin: (t) => t,
  io: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
};

const PROPS = {
  pos: { get: (o) => o.position.toArray(), set: (o, v) => o.position.fromArray(v) },
  rot: { get: (o) => [o.rotation.x, o.rotation.y, o.rotation.z], set: (o, v) => o.rotation.set(v[0], v[1], v[2]) },
  scale: { get: (o) => o.scale.toArray(), set: (o, v) => o.scale.fromArray(v) },
  opacity: { get: (o) => o.userData.opacity, set: (o, v) => setOpacity(o, v) },
};

const lerp = (a, b, k) => (Array.isArray(a) ? a.map((x, i) => x + (b[i] - x) * k) : a + (b - a) * k);

// Atajo para declarar pistas: T('P1', 'pos', [0, 900, 0], 1.5, 2)
export function T(id, prop, to, at, dur = 1, opts = {}) {
  return { id, prop, to, at, dur, ease: opts.ease || 'io', from: opts.from };
}

export function resetScene() {
  for (const o of all().values()) {
    const b = o.userData.base;
    o.position.fromArray(b.pos);
    o.rotation.set(...b.rot);
    o.scale.fromArray(b.scale);
    setOpacity(o, b.opacity);
  }
}

function applyTracks(tracks, t) {
  for (const tr of tracks) {
    const o = get(tr.id);
    if (!o) continue;
    const P = PROPS[tr.prop];
    const from = tr.from ?? P.get(o);
    const k = tr.dur <= 0 ? (t >= tr.at ? 1 : 0) : Math.min(Math.max((t - tr.at) / tr.dur, 0), 1);
    if (k === 0 && tr.from === undefined) continue;
    P.set(o, lerp(from, tr.to, EASE[tr.ease](k)));
  }
}

export function applyState(stages, index, t) {
  resetScene();
  for (let s = 0; s < index; s++) applyTracks(stages[s].tracks, Infinity);
  applyTracks(stages[index].tracks, t);
}
