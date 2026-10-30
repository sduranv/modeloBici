import * as THREE from 'three';
import { mat } from './materials.js';
import { box, cyl, extrudeXZ, extrudeZY } from './geom.js';
import { reg } from './registry.js';

// Soporte desmontable. Las piezas se construyen desde los contornos de model.js
// (los mismos que dibujan los planos). Cada pieza tiene dos poses: 'asm' (armada,
// relativa al grupo del soporte) y 'layout' (sobre el piso, en la etapa de fabricación).

export const STAGING = [950, 0, 0]; // donde se fabrica/arma el soporte, al costado de la bici

export function buildSupport(model) {
  const { p, g } = model;
  const supportG = new THREE.Group();
  const poses = {};
  const by = p.barY;

  const melamine = [mat('melamine'), mat('edge')];
  const dims = (part) => `${part.L} × ${Math.round(part.W)} × ${part.T} mm`;
  const [P1, P2, P3] = model.parts;

  // P1 bandeja
  const tray = extrudeXZ(model.trayOutline, p.t, melamine);
  add('P1', tray, { name: P1.name, dims: dims(P1), src: 'S', desc: P1.desc, part: 'P1' },
    { pos: [0, g.trayTopY, 0], rot: [0, 0, 0] }, { pos: [0, p.t, 0], rot: [0, 0, 0] });

  // P2 cartelas
  for (const [i, s] of [[0, -1], [1, 1]]) {
    const c = extrudeZY(model.cartOutline, p.t, melamine, [model.rodHole]);
    const x0 = s < 0 ? -g.xIn : g.xOut;
    add(`P2${'ab'[i]}`, c, { name: `${P2.name} ${s < 0 ? 'izquierda' : 'derecha'}`, dims: dims(P2), src: 'S', desc: P2.desc, part: 'P2' },
      { pos: [x0, by, 0], rot: [0, 0, 0] }, { pos: [400 + i * 170, p.t, -60], rot: [0, 0, Math.PI / 2] });
  }

  // P3 topes
  for (const [i, s] of [[0, -1], [1, 1]]) {
    const b = box(g.stopLen, p.stopH, p.t, mat('melamine'));
    add(`P3${'ab'[i]}`, b, { name: `${P3.name} ${s < 0 ? 'izquierdo' : 'derecho'}`, dims: dims(P3), src: 'S', desc: P3.desc, part: 'P3' },
      { pos: [s * (g.stopX0 + g.stopLen / 2), g.trayTopY + p.stopH / 2, g.stopZ + p.t / 2], rot: [0, 0, 0] },
      { pos: [s * 125, p.t / 2, 520], rot: [Math.PI / 2, 0, 0] });
  }

  // H5 tornillos bandeja → cartelas
  const screws = new THREE.Group();
  for (const s of [-1, 1]) for (const z of g.screwZs) {
    const sc = cyl(4.5, 1.5, 'y', mat('zinc'), 16);
    sc.position.set(s * g.xScrew, g.trayTopY + 0.6, z);
    screws.add(sc);
  }
  add('H5', screws, { name: 'Tornillos 4 × 50 (bandeja → cartelas)', dims: '6 unidades, avellanados', src: 'S', desc: 'Pre-perforar Ø3 en el canto de la cartela para no rajar el aglomerado.' },
    { pos: [0, 0, 0], rot: [0, 0, 0] }, { pos: [0, -g.trayTopY + 2, -250], rot: [0, 0, 0] });

  // H6 escuadras (cara exterior de las cartelas)
  const brackets = new THREE.Group();
  for (const s of [-1, 1]) for (const z of [-5, 125]) {
    const v = box(2, 40, 40, mat('zinc'));
    v.position.set(s * (g.xOut + 1), g.trayBottomY - 20, z);
    const h = box(40, 2, 40, mat('zinc'));
    h.position.set(s * (g.xOut + 20), g.trayBottomY - 1, z);
    brackets.add(v, h);
  }
  add('H6', brackets, { name: 'Escuadras 40 × 40', dims: '4 unidades + 16 tornillos 3,5 × 16', src: 'S', desc: 'Rigidizan la unión bandeja–cartela.' },
    { pos: [0, 0, 0], rot: [0, 0, 0] }, { pos: [0, -g.trayBottomY + 40, -330], rot: [0, 0, 0] });

  // H10 malla antideslizante
  const matDepth = g.trayBack - g.devZ0 - 10;
  const anti = box(p.trayW - 40, 2, matDepth, mat('mat'));
  add('H10', anti, { name: 'Malla antideslizante', dims: `${p.trayW - 40} × ${Math.round(matDepth)} mm`, src: 'S', desc: 'Evita que el equipo se deslice con la vibración.' },
    { pos: [0, g.trayTopY + 1, g.devZ0 + 5 + matDepth / 2], rot: [0, 0, 0] }, { pos: [0, p.t + 1, g.devZ0 + 5 + matDepth / 2], rot: [0, 0, 0] });

  // Herrajes de cierre: grupos independientes (se instalan con el soporte ya en la bici)
  const rodY = by + g.rodY;
  const rodG = new THREE.Group();
  const headX = -(g.xOut + 2.5 + 3.5);
  const rod = cyl(p.rodD / 2, g.rodLen, 'x', mat('steel'), 20);
  rod.position.x = headX + 3.5 + g.rodLen / 2;
  const head = cyl(8.5, 7, 'x', mat('steel'), 6);
  head.position.x = headX;
  const wL = cyl(12, 2.5, 'x', mat('zinc'), 24);
  wL.position.x = -(g.xOut + 1.25);
  rodG.add(rod, head, wL);
  const nutG = new THREE.Group();
  const wR = cyl(12, 2.5, 'x', mat('zinc'), 24);
  wR.position.x = g.xOut + 1.25;
  const wing = new THREE.Group();
  wing.add(cyl(8, 10, 'x', mat('zinc'), 16));
  for (const s of [-1, 1]) { const w = box(8, 14, 22, mat('zinc')); w.position.set(0, 0, s * 16); wing.add(w); }
  wing.position.x = g.xOut + 2.5 + 5;
  nutG.add(wR, wing);
  const sleeve = cyl(p.sleeveD / 2, g.sleeveLen, 'x', mat('pvc'), 24);

  const rodPos = [0, rodY, g.rodZ];
  const hw = { pos: rodPos, rot: [0, 0, 0] };
  const world = [];
  world.push(reg('H1', rodG, { name: `Perno M${p.rodD} × ${g.rodLen}`, dims: `${g.rodLen} mm, cabeza hexagonal + arandela`, src: 'S', desc: 'Pasa por ambas cartelas, por detrás del mástil y bajo el manubrio.' }));
  world.push(reg('H4', sleeve, { name: 'Funda PVC del perno', dims: `Ø${p.sleeveD} × ${g.sleeveLen} mm`, src: 'S', desc: 'El mástil apoya sobre el PVC: no se raya la pintura.' }));
  world.push(reg('H2', nutG, { name: `Tuerca mariposa M${p.rodD} + arandela`, dims: 'apriete a mano', src: 'S', desc: 'Única pieza que se suelta para sacar el soporte.' }));
  const stg = (dx, dz, dy = 0) => ({ pos: [STAGING[0] + dx, dy + 12, STAGING[2] + dz], rot: [0, 0, 0] });
  poses.H1 = { asm: hw, layout: stg(250, -420) };
  poses.H4 = { asm: hw, layout: stg(250, -470) };
  poses.H2 = { asm: hw, layout: stg(330, -420) };
  for (const o of world) {
    const ps = poses[o.userData.id].layout;
    o.position.fromArray(ps.pos);
    o.userData.base.pos = ps.pos;
  }

  supportG.position.fromArray(STAGING);
  reg('support', supportG);

  return { supportG, world, poses };

  function add(id, obj, info, asm, layout) {
    obj.position.fromArray(layout.pos);
    obj.rotation.set(...layout.rot);
    supportG.add(obj);
    reg(id, obj, info);
    poses[id] = { asm, layout };
  }
}
