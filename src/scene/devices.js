import * as THREE from 'three';
import { mat } from './materials.js';
import { box } from './geom.js';
import { reg } from './registry.js';

// Equipos a escala sobre la bandeja: notebook 14" (medidas típicas) y teclado + mouse (500 × 160, confirmado).
export function buildDevices(model) {
  const { p, g } = model;
  const y0 = g.trayTopY + 2;

  const laptop = new THREE.Group();
  const base = box(p.laptopW, p.laptopH, p.laptopD, mat('laptop'));
  base.position.set(0, p.laptopH / 2, p.laptopD / 2);
  const deck = box(p.laptopW - 30, 1, p.laptopD * 0.45, mat('kb'));
  deck.position.set(0, p.laptopH + 0.5, p.laptopD * 0.32);
  const pad = box(100, 1, 60, mat('silver'));
  pad.position.set(0, p.laptopH + 0.5, p.laptopD * 0.78);
  laptop.add(base, deck, pad);

  const lid = new THREE.Group();
  const screenH = p.laptopD - 8;
  const shell = box(p.laptopW, screenH, 6, mat('laptop'));
  shell.position.set(0, screenH / 2, 0);
  const panel = box(p.laptopW - 20, screenH - 25, 1, mat('screen'));
  panel.position.set(0, screenH / 2 + 4, 3.5);
  lid.add(shell, panel);
  lid.position.set(0, p.laptopH + 3, 4);
  lid.rotation.x = Math.PI / 2; // cerrado
  laptop.add(lid);
  laptop.position.set(0, y0, g.devZ0 + 5);
  reg('laptop', laptop, { name: 'Notebook 14"', dims: `${p.laptopW} × ${p.laptopD} × ${p.laptopH} mm (típico)`, src: 'E', desc: 'Medidas típicas de un 14". Se apoya con la bisagra contra los topes.' });
  reg('laptopLid', lid);

  const kb = new THREE.Group();
  const kbW = p.kbW - 75;
  const board = box(kbW, 22, p.kbD - 20, mat('kb'));
  board.position.set(-p.kbW / 2 + kbW / 2, 11, 0);
  const keys = box(kbW - 20, 3, p.kbD - 45, mat('laptop'));
  keys.position.set(board.position.x, 23, 0);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat('kb'));
  mouse.scale.set(32, 20, 55);
  mouse.position.set(p.kbW / 2 - 35, 12, 0);
  kb.add(board, keys, mouse);
  kb.position.set(0, y0, g.trayBack - p.deviceMargin - p.kbD / 2);
  reg('keyboard', kb, { name: 'Teclado + mouse', dims: `${p.kbW} × ${p.kbD} mm (confirmado)`, src: 'C', desc: 'Uso alternativo al notebook: no se usan a la vez.' });

  return [laptop, kb];
}
