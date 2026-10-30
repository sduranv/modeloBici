import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ghost } from './materials.js';
import { cyl, box } from './geom.js';
import { reg } from './registry.js';

export function label(id, html, pos, cls = '') {
  const el = document.createElement('div');
  el.className = `lbl ${cls}`;
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.fromArray(pos);
  reg(id, o);
  return o;
}

// Cota 3D: línea con remates + etiqueta en el centro.
export function dimLine(id, a, b, text, color = 0x2f6fed) {
  const g = new THREE.Group();
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const geo = new THREE.BufferGeometry().setFromPoints([A, B]);
  g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color, depthTest: false })));
  for (const P of [A, B]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), new THREE.MeshBasicMaterial({ color, depthTest: false }));
    s.position.copy(P);
    g.add(s);
  }
  g.renderOrder = 10;
  reg(id, g);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const l = label(`${id}_t`, text, mid.toArray(), 'dim');
  return [g, l];
}

export function buildOverlays(model) {
  const { p, g } = model;
  const by = p.barY;
  const out = [];
  const tilt = ((90 - p.mastAngle) * Math.PI) / 180;
  const alongMast = (y0, y1, rPad, color, id, info) => {
    const len = (y1 - y0) / Math.sin((p.mastAngle * Math.PI) / 180);
    const m = cyl(p.mastW / 2 + rPad, len, 'y', ghost(color, 0.45), 24);
    const ym = (y0 + y1) / 2;
    m.position.set(0, by + ym, g.mastZ(ym));
    m.rotation.x = tilt;
    m.userData.pulse = true;
    out.push(reg(id, m, info));
  };

  // Etapa 1: zonas de montaje
  const z1 = new THREE.Group();
  for (const s of [-1, 1]) {
    const c = cyl(g.r + 5, p.t + 16, 'x', ghost(0x22c55e, 0.5));
    c.position.set(s * (g.xIn + p.t / 2), by, 0);
    z1.add(c);
  }
  z1.userData.pulse = true;
  out.push(reg('Z1', z1, { name: 'Zona de apoyo en el manubrio', dims: `a ±${Math.round(g.xIn)}…${Math.round(g.xOut)} mm del eje`, src: 'S', desc: 'Las cartelas se apoyan aquí, junto al mástil. Sin perforar.' }));
  alongMast(g.rodY - 20, g.rodY + 15, 4, 0x22c55e, 'Z2', { name: 'Zona de contacto del perno', dims: `${-g.rodY} mm bajo el manubrio`, src: 'S', desc: 'El perno con funda PVC apoya por detrás del mástil y bloquea el vuelco.' });
  alongMast(g.yU, p.mastTipAboveBar, 4, 0xf59e0b, 'Z3', { name: 'Punta del mástil (pasa por la ranura)', dims: `sobresale ≈ ${p.mastTipAboveBar} mm sobre el manubrio`, src: 'E', desc: 'Atraviesa la ranura de la bandeja y sirve de tope delantero.' });

  const con = box(290, 330, 90, ghost(0xef4444, 0.3));
  const tipY = by + p.mastTipAboveBar;
  con.position.set(0, tipY + 105, g.mastZ(p.mastTipAboveBar) - 10);
  con.rotation.x = -0.45;
  con.userData.pulse = true;
  out.push(reg('Z4', con, { name: 'Consola (se retira)', dims: '—', src: 'E', desc: 'Ocupa el espacio de la bandeja: se desmonta y se guarda.' }));

  // Etapa 7: volumen de rodillas
  const knees = new THREE.Group();
  for (const s of [-1, 1]) {
    const k = box(p.kneeXout - p.kneeXin, 300, p.kneeZmax - p.kneeZmin, ghost(0xef4444, 0.18));
    k.position.set(s * (p.kneeXin + p.kneeXout) / 2, p.kneeMaxY - 150, (p.kneeZmin + p.kneeZmax) / 2);
    knees.add(k);
    const top = box(p.kneeXout - p.kneeXin, 2, p.kneeZmax - p.kneeZmin, ghost(0xef4444, 0.6));
    top.position.set(k.position.x, p.kneeMaxY, k.position.z);
    knees.add(top);
  }
  out.push(reg('Z5', knees, { name: 'Volumen de rodillas', dims: `techo ${p.kneeMaxY} mm (confirmado)`, src: 'C', desc: 'Altura confirmada; el ancho y la profundidad son supuestos.' }));

  // Cargas
  const loads = new THREE.Group();
  const arrow = (dir, origin, len, color) => new THREE.ArrowHelper(new THREE.Vector3(...dir).normalize(), new THREE.Vector3(...origin), len, color, 30, 18);
  loads.add(arrow([0, -1, 0], [0, g.trayTopY + 180, model.loads.zLaptop], 160, 0x2f6fed));
  loads.add(arrow([0, -1, 0], [200, g.trayTopY + 230, g.trayBack - 15], 210, 0xef4444));
  loads.add(arrow([0, 1, 0], [0, by - 260, -2], 200, 0x16a34a));
  loads.add(arrow([0, 0, 1], [0, by + g.rodY, g.rodZ - 230], 210, 0x16a34a));
  out.push(reg('L1', loads));

  out.push(label('L1_a', `Notebook ≈ ${p.laptopKg} kg`, [0, g.trayTopY + 200, model.loads.zLaptop], 'load'));
  out.push(label('L1_b', `Antebrazos ${p.leanKg} kg (diseño)`, [200, g.trayTopY + 260, g.trayBack - 15], 'load warn'));
  out.push(label('L1_c', `Manubrio: ≈ ${Math.round(model.loads.Wtot)} N`, [0, by - 280, 0], 'load ok'));
  out.push(label('L1_d', `Perno ↔ mástil: ≈ ${Math.round(model.loads.Frod)} N`, [0, by + g.rodY - 30, g.rodZ - 250], 'load ok'));

  // Cotas de verificación
  out.push(...dimLine('D_knee', [p.kneeXin + 60, p.kneeMaxY, 300], [p.kneeXin + 60, g.trayBottomY, 300], `${Math.round(g.kneeGap)} mm libres`, 0xef4444));
  out.push(...dimLine('D_top', [-p.trayW / 2 - 40, 0, g.trayBack], [-p.trayW / 2 - 40, g.trayTopY, g.trayBack], `Superficie a ${Math.round(g.trayTopY)} mm`));

  return out;
}
