import * as THREE from 'three';
import { T } from '../anim/engine.js';
import { get, reg } from '../scene/registry.js';
import { cyl } from '../scene/geom.js';
import { mat } from '../scene/materials.js';
import { label, dimLine } from '../scene/overlays.js';
import { STAGING } from '../scene/support.js';

const add3 = (a, b) => a.map((v, i) => v + b[i]);

// Objetos propios del tutorial (goma del manubrio, cotas y rótulos de fabricación).
export function buildTutorialExtras(model) {
  const { p, g } = model;
  const out = [];
  const wraps = new THREE.Group();
  for (const s of [-1, 1]) {
    const w = cyl(g.r + p.wrap, p.t + 14, 'x', mat('rubber'));
    w.position.set(s * (g.xIn + p.t / 2), p.barY, 0);
    wraps.add(w);
  }
  out.push(reg('W1', wraps, { name: 'Goma en el manubrio', dims: `${p.wrap} mm, ${p.t + 14} mm de ancho por lado`, src: 'S', desc: 'Cámara de bicicleta vieja pegada o amarrada. Protege la pintura y amortigua.' }));

  const [sx, , sz] = STAGING;
  const [P1, P2, P3] = model.parts;
  const y = 30;
  out.push(label('F_P1', `<b>P1</b> ${P1.name}<br>${P1.L} × ${P1.W} × ${P1.T}`, [sx, 60, sz + 180], 'part'));
  out.push(label('F_P2', `<b>P2</b> ${P2.name} ×2<br>${P2.L} × ${Math.round(P2.W)} × ${P2.T}`, [sx + 485, 60, sz + 260], 'part'));
  out.push(label('F_P3', `<b>P3</b> ${P3.name} ×2<br>${P3.L} × ${P3.W} × ${P3.T}`, [sx, 60, sz + 590], 'part'));
  out.push(label('F_H', '<b>Herrajes</b><br>perno, mariposa, PVC,<br>tornillos, escuadras', [sx + 290, 60, sz - 520], 'part'));
  const W2 = p.trayW / 2;
  out.push(...dimLine('F_w', [sx - W2, y, sz + p.trayFront - 40], [sx + W2, y, sz + p.trayFront - 40], `${p.trayW}`));
  out.push(...dimLine('F_d', [sx - W2 - 40, y, sz + p.trayFront], [sx - W2 - 40, y, sz + g.trayBack], `${g.trayDepth}`));
  out.push(...dimLine('F_s', [sx - g.slotW / 2, y, sz + g.slotEnd + 25], [sx + g.slotW / 2, y, sz + g.slotEnd + 25], `ranura ${g.slotW} × ${g.slotEnd - p.trayFront}`, 0xf59e0b));
  return out;
}

export function buildStages(model, poses) {
  const { p, g } = model;
  const by = p.barY;
  const rodAsm = [0, by + g.rodY, g.rodZ];
  const show = (ids, at, dur = 0.6) => ids.map((id) => T(id, 'opacity', 1, at, dur));
  const hide = (ids, at, dur = 0.5) => ids.map((id) => T(id, 'opacity', 0, at, dur));
  const toAsm = (id, at, dur = 1.6) => [T(id, 'pos', poses[id].asm.pos, at, dur), T(id, 'rot', poses[id].asm.rot, at, dur)];
  const drop = (id, at, dur = 0.8) => [
    T(id, 'opacity', 1, at, dur * 0.6),
    T(id, 'pos', poses[id].layout.pos, at, dur, { from: add3(poses[id].layout.pos, [0, 160, 0]), ease: 'out' }),
  ];
  const conPos = get('console').position.toArray();
  const boltPos = get('consoleBolts').position.toArray();
  const [sx] = STAGING;

  const stages = [
    {
      title: 'Bicicleta original',
      dur: 6,
      cam: [[2000, 1700, 1900], [0, 650, 150]],
      steps: [
        { at: 0, text: 'LuckySports semirreclinada, tal como está hoy. Gira, acerca y haz clic en cualquier pieza para ver nombre y medidas.' },
        { at: 3, text: `La única medida confirmada de la bici es la altura del manubrio (${by} mm), que coincide con el punto más alto de la rodilla. El resto se estimó desde las fotos y el video.`, focus: ['bar'] },
      ],
      tracks: [T('crank', 'rot', [0.5 + Math.PI * 4, 0, 0], 0, 6, { ease: 'lin' })],
    },
    {
      title: 'Puntos de montaje',
      dur: 8,
      cam: [[900, 1250, 1050], [0, 930, 40]],
      steps: [
        { at: 0, text: 'Apoyo principal: el tubo central del manubrio, a ambos lados del mástil. Sin perforar ni cortar.', focus: ['bar', 'Z1'] },
        { at: 2.6, text: `Bloqueo antivuelco: ${-g.rodY} mm bajo el manubrio, un perno con funda de PVC apoyará por detrás del mástil.`, focus: ['mast', 'Z2'] },
        { at: 5.2, text: 'La punta del mástil atravesará la bandeja por una ranura y servirá de tope. La consola ocupa ese espacio: se retira.', focus: ['Z3', 'Z4', 'console'] },
      ],
      tracks: [...show(['Z1'], 0.2), ...show(['Z2'], 2.6), ...show(['Z3', 'Z4'], 5.2)],
    },
    {
      title: 'Preparación',
      dur: 11,
      cam: [[700, 1300, -900], [0, 1000, 30]],
      steps: [
        { at: 0, text: 'Retira los tornillos que unen la consola a la punta del mástil (en el video se ven 2; confirma cuántos son al desarmar).', focus: ['consoleBolts', 'console'] },
        { at: 2.6, text: 'Levanta la consola, desconecta su cable si lo tiene y guárdala con sus tornillos. El cambio es reversible: se vuelve a montar igual.', focus: ['console'] },
        { at: 6, text: `Forra el manubrio junto al mástil con goma (cámara de bici vieja), ${p.t + 14} mm por lado. Protege la pintura y absorbe vibraciones.`, focus: ['W1'], cam: [[650, 1150, 900], [0, 900, 0]] },
        { at: 8.8, text: 'Comprueba que la perilla de tensión gira libre y deja el asiento en tu posición habitual de pedaleo.', focus: ['knob'] },
      ],
      tracks: [
        ...hide(['Z1', 'Z2', 'Z3'], 0),
        T('consoleBolts', 'rot', [-0.45, 0, Math.PI * 6], 0.6, 1.6, { ease: 'lin' }),
        T('consoleBolts', 'pos', add3(boltPos, [0, 20, -60]), 0.6, 1.6),
        T('consoleBolts', 'opacity', 0, 2.1, 0.5),
        T('console', 'pos', add3(conPos, [0, 160, -120]), 2.6, 1.4),
        T('console', 'pos', add3(conPos, [450, 120, -500]), 4, 1.4),
        T('console', 'opacity', 0, 4.8, 0.8),
        T('Z4', 'opacity', 0, 4.8, 0.6),
        T('W1', 'opacity', 1, 6, 0.01),
        T('W1', 'scale', [1, 1, 1], 6, 1.6, { from: [0.02, 1, 1] }),
      ],
    },
    {
      title: 'Fabricación de piezas',
      dur: 12,
      cam: [[sx + 600, 1500, 1500], [sx + 150, 0, 60]],
      steps: [
        { at: 0, text: `P1 Bandeja ${model.parts[0].L} × ${model.parts[0].W} mm en melamina ${p.t} mm. Ranura delantera de ${g.slotW} × ${g.slotEnd - p.trayFront} mm para el mástil; esquinas traseras redondeadas.`, focus: ['P1'] },
        { at: 3.2, text: `P2 Cartelas ×2: ${model.parts[1].L} × ${Math.round(model.parts[1].W)} mm, con ranura horizontal de ${Math.round(g.notchH)} mm (el manubrio) y agujero Ø${p.rodD + 0.5} para el perno.`, focus: ['P2a', 'P2b'] },
        { at: 6.2, text: `P3 Topes ×2: ${model.parts[2].L} × ${p.stopH} mm. Van separados para dejar pasar la punta del mástil.`, focus: ['P3a', 'P3b'] },
        { at: 8.4, text: 'Herrajes: perno M10 con tuerca mariposa, funda de PVC, 6 tornillos 4 × 50, 4 escuadras, malla antideslizante. Todas las cotas están en la pestaña Planos.', focus: ['H1', 'H2', 'H4', 'H5', 'H6', 'H10'] },
      ],
      tracks: [
        ...drop('P1', 0), ...show(['F_P1', 'F_w', 'F_w_t', 'F_d', 'F_d_t', 'F_s', 'F_s_t'], 0.6),
        ...drop('P2a', 3.2), ...drop('P2b', 3.6), ...show(['F_P2'], 3.6),
        ...drop('P3a', 6.2), ...drop('P3b', 6.5), ...show(['F_P3'], 6.5),
        ...['H5', 'H6', 'H10', 'H1', 'H4', 'H2'].flatMap((id, i) => drop(id, 8.4 + i * 0.25)),
        ...show(['F_H'], 8.6),
      ],
    },
    {
      title: 'Ensamblaje',
      dur: 12,
      cam: [[sx + 1000, 1500, 1200], [sx, 820, 120]],
      steps: [
        { at: 0, text: 'Arma el soporte fuera de la bici. (En la mesa conviene trabajar con la bandeja boca abajo; aquí se ve en su posición final.)', focus: ['P1'] },
        { at: 2, text: `Atornilla las cartelas bajo la bandeja, separadas ${Math.round(2 * g.xIn)} mm entre caras interiores y alineadas con el borde delantero. Pre-perfora Ø3 los cantos.`, focus: ['P2a', 'P2b'] },
        { at: 5, text: '6 tornillos 4 × 50 avellanados desde arriba, en el centro del canto de cada cartela.', focus: ['H5'] },
        { at: 6.6, text: 'Escuadras 40 × 40 por la cara exterior: dejan la unión firme frente a la vibración.', focus: ['H6'] },
        { at: 8.2, text: 'Topes desde abajo con tornillos 4 × 35. Por último, la malla antideslizante.', focus: ['P3a', 'P3b', 'H10'] },
      ],
      tracks: [
        ...hide(['F_P1', 'F_P2', 'F_P3', 'F_H', 'F_w', 'F_w_t', 'F_d', 'F_d_t', 'F_s', 'F_s_t'], 0),
        ...toAsm('P1', 0.3, 1.8),
        ...toAsm('P2a', 2, 1.6), ...toAsm('P2b', 2.8, 1.6),
        ...toAsm('H5', 5, 1.2),
        ...toAsm('H6', 6.6, 1.2),
        ...toAsm('P3a', 8.2, 1.2), ...toAsm('P3b', 8.6, 1.2),
        ...toAsm('H10', 10, 1.2),
      ],
    },
    {
      title: 'Instalación en la bici',
      dur: 15,
      cam: [[1500, 1400, -1500], [250, 850, -250]],
      steps: [
        { at: 0, text: 'Lleva el soporte armado al frente de la bici, con la ranura de la bandeja mirando al mástil.', focus: ['P1'] },
        { at: 3.6, text: 'Deslízalo hacia el asiento: el manubrio entra en las ranuras de las cartelas y la punta del mástil en la ranura de la bandeja, hasta hacer tope.', focus: ['P2a', 'P2b', 'bar'] },
        { at: 6.6, text: 'Sostén la funda de PVC por detrás del mástil, bajo el manubrio, entre las dos cartelas.', focus: ['H4'], cam: [[700, 950, 800], [0, 860, 0]] },
        { at: 8.8, text: 'Pasa el perno M10 desde la izquierda: cartela, funda y cartela.', focus: ['H1'] },
        { at: 11.4, text: 'Arandela y tuerca mariposa: aprieta a mano. Para sacar el soporte se hace lo mismo al revés (≈ 30 s).', focus: ['H2'] },
      ],
      tracks: [
        T('support', 'pos', [sx, 0, -750], 0, 1.6),
        T('support', 'pos', [0, 0, -750], 1.6, 2),
        T('support', 'pos', [0, 0, 0], 3.6, 2.6),
        T('H4', 'pos', add3(rodAsm, [0, -220, 260]), 6.6, 1.2),
        T('H4', 'pos', rodAsm, 7.8, 1),
        T('H1', 'pos', add3(rodAsm, [-420, 0, 0]), 8.8, 1),
        T('H1', 'pos', rodAsm, 9.8, 1.4),
        T('H2', 'pos', add3(rodAsm, [260, 0, 0]), 11.4, 0.8),
        T('H2', 'pos', rodAsm, 12.2, 1),
        T('H2', 'rot', [Math.PI * 6, 0, 0], 12.2, 1.8, { ease: 'out' }),
      ],
    },
    {
      title: 'Resultado final',
      dur: 6,
      cam: [[1100, 1500, 1500], [0, 950, 200]],
      steps: [
        { at: 0, text: 'Notebook 14" apoyado con la bisagra contra los topes. La punta del mástil queda delante, sin tocar la pantalla.', focus: ['laptop'] },
        { at: 3, text: 'Para usar teclado y mouse, cambia el equipo con el selector "Equipo" de la barra inferior. No se usan a la vez.' },
      ],
      tracks: [T('laptop', 'opacity', 1, 0, 0.8), T('laptopLid', 'rot', [-0.26, 0, 0], 0.9, 1.6)],
    },
    {
      title: 'Verificación',
      dur: 11,
      cam: [[1900, 1150, 350], [0, 850, 200]],
      steps: [
        { at: 0, text: `Holgura rodilla ↔ bandeja: ${Math.round(g.kneeGap)} mm con la rodilla en su punto más alto (${p.kneeMaxY} mm). Las cartelas quedan entre las rodillas.`, focus: ['Z5'] },
        { at: 3.2, text: `Cargas de diseño: notebook ${p.laptopKg} kg + ${p.leanKg} kg de antebrazos en el borde. Momento de vuelco ≈ ${model.loads.M.toFixed(0)} N·m, que el perno transmite al mástil (≈ ${Math.round(model.loads.Frod)} N).`, focus: ['H1', 'H4'] },
        { at: 6.4, text: 'El peso descansa en el manubrio (verde, arriba); el perno impide el vuelco hacia ti y la ranura del mástil el vuelco hacia adelante.', focus: ['Z1', 'Z2'] },
        { at: 8.8, text: 'Revisa la lista de comprobaciones antes de usarlo. Esto es una estimación de cálculo: la prueba física es obligatoria.' },
      ],
      tracks: [
        ...show(['Z5', 'D_knee', 'D_knee_t'], 0.2),
        ...show(['L1', 'L1_a', 'L1_b', 'L1_c', 'L1_d'], 3.2),
        ...show(['Z1', 'Z2'], 6.4),
        ...show(['D_top', 'D_top_t'], 8.8),
      ],
    },
  ];
  for (const s of stages) s.tracks.sort((a, b) => a.at - b.at);
  return stages;
}

// Opacidad inicial (etapa 0) de todo lo que no es la bici.
export const HIDDEN_AT_START = [
  'Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'L1', 'L1_a', 'L1_b', 'L1_c', 'L1_d', 'D_knee', 'D_knee_t', 'D_top', 'D_top_t',
  'P1', 'P2a', 'P2b', 'P3a', 'P3b', 'H5', 'H6', 'H10', 'H1', 'H4', 'H2', 'W1',
  'F_P1', 'F_P2', 'F_P3', 'F_H', 'F_w', 'F_w_t', 'F_d', 'F_d_t', 'F_s', 'F_s_t',
  'laptop', 'keyboard',
];
