import * as THREE from 'three';
import { mat } from './materials.js';
import { box, cyl, extrudeZY, roundedRect, group, at } from './geom.js';
import { reg } from './registry.js';

// Reconstrucción de la LuckySports semirreclinada a partir de fotos y video.
// Medidas confirmadas: altura del manubrio. El resto es estimación visual (se indica en cada pieza).
const EST = 'E';

export function buildBike(model) {
  const { p, g } = model;
  const root = new THREE.Group();
  const by = p.barY;

  // --- Carcasa del volante de inercia ---
  const housingZ = [-620, -40];
  const housing = extrudeZY(roundedRect(housingZ[0], 110, housingZ[1], 540, 170), 150, mat('plastic'));
  housing.position.x = 75;
  const logoL = cyl(55, 6, 'x', mat('orange'), 40);
  const logoHoleL = cyl(38, 7, 'x', mat('plastic'), 40);
  const logos = group(at(logoL, 76, 300, -330), at(logoHoleL, 77, 300, -330));
  const logoR = logos.clone(); logoR.scale.x = -1;
  const housingG = group(housing, logos, logoR);
  root.add(reg('housing', housingG, { name: 'Carcasa del volante de inercia', dims: '≈ 580 × 430 × 150 mm', src: EST, desc: 'Contiene el volante magnético y el eje de pedalier (logo naranjo).' }));

  // --- Pedalier ---
  const crank = new THREE.Group();
  for (const s of [-1, 1]) {
    const arm = box(16, 170, 36, mat('chrome'));
    arm.position.set(s * 88, s * 85, 0);
    const pedal = box(95, 28, 110, mat('plastic'));
    pedal.position.set(s * 150, s * 170, 0);
    const strap = box(90, 40, 8, mat('plastic'));
    strap.position.set(s * 150, s * 170 + 26 * s, 30);
    crank.add(arm, pedal, strap);
  }
  crank.add(cyl(12, 200, 'x', mat('chrome')));
  crank.position.set(0, 300, -330);
  crank.rotation.x = 0.5;
  root.add(reg('crank', crank, { name: 'Pedalier y pedales', dims: 'biela ≈ 170 mm', src: EST, desc: 'Pedales con correa.' }));

  // --- Mástil (tubo curvo + tramo recto inclinado) ---
  const L = (Y) => new THREE.Vector3(0, Y, g.mastZ(Y - by));
  const tipY = by + p.mastTipAboveBar;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 420, -330), new THREE.Vector3(0, 520, -285), new THREE.Vector3(0, 580, -230),
    L(650), L(760), L(by), L(tipY),
  ], false, 'centripetal');
  const mast = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, p.mastW / 2, 24, false), mat('frame'));
  mast.castShadow = true;
  const cap = new THREE.Mesh(new THREE.CircleGeometry(p.mastW / 2, 24), mat('frame'));
  cap.position.copy(L(tipY));
  cap.lookAt(L(tipY + 100));
  root.add(reg('mast', group(mast, cap), { name: 'Mástil', dims: `Ø ≈ ${p.mastW} mm, inclinación ≈ ${p.mastAngle}°`, src: EST, desc: 'Tubo curvo que sale de la carcasa. Simplificado como tubo redondo (la sección real puede ser ovalada).' }));

  // --- Manubrio ---
  const bar = cyl(g.r, p.barWidth - 2 * p.gripLen, 'x', mat('frame'));
  bar.position.set(0, by, 0);
  root.add(reg('bar', bar, { name: 'Manubrio (tubo central)', dims: `Ø ≈ ${p.barD} mm · altura ${by} mm (confirmada)`, src: 'C', desc: 'Punto de apoyo principal del soporte. Altura confirmada por el usuario.' }));
  const grips = new THREE.Group();
  for (const s of [-1, 1]) {
    const grip = cyl(p.gripD / 2, p.gripLen, 'x', mat('foam'));
    grip.position.set(s * (p.barWidth / 2 - p.gripLen / 2), by, 0);
    const end = new THREE.Mesh(new THREE.SphereGeometry(p.gripD / 2, 24, 12), mat('foam'));
    end.position.set(s * p.barWidth / 2, by, 0);
    end.scale.x = 0.5;
    grips.add(grip, end);
  }
  root.add(reg('grips', grips, { name: 'Puños de espuma', dims: `${p.gripLen} mm c/u · ancho total ≈ ${p.barWidth} mm`, src: EST, desc: 'No se tocan.' }));

  // --- Consola (se retira) ---
  const tip = L(tipY);
  const consoleG = new THREE.Group();
  const body = box(260, 300, 60, mat('plastic'));
  const face = box(220, 250, 4, mat('silver'));
  face.position.z = 31;
  const lcd = box(120, 60, 3, mat('lcd'));
  lcd.position.set(0, 60, 33);
  const btn = box(50, 22, 6, mat('orange'));
  btn.position.set(0, -80, 33);
  const shelf = box(200, 18, 30, mat('plastic'));
  shelf.position.set(0, -40, 40);
  consoleG.add(body, face, lcd, btn, shelf);
  consoleG.position.set(0, tip.y + 105, tip.z - 10);
  consoleG.rotation.x = -0.45;
  root.add(reg('console', consoleG, { name: 'Consola', dims: '≈ 260 × 300 × 60 mm', src: EST, desc: 'Se retira para instalar el soporte. Se guarda con sus tornillos y puede volver a montarse.' }));
  const bolts = new THREE.Group();
  for (const s of [-1, 1]) {
    const b = cyl(6, 14, 'z', mat('chrome'), 12);
    b.position.set(s * 14, tip.y - 6, tip.z - 2);
    b.rotation.x = -0.45;
    bolts.add(b);
  }
  root.add(reg('consoleBolts', bolts, { name: 'Tornillos de la consola', dims: '2 visibles en el video', src: EST, desc: 'Confirmar cantidad y tipo al desmontar.' }));

  // --- Perilla de tensión (lateral derecho del mástil) ---
  const ky = by - p.knobBelowBar;
  const kz = g.mastZ(ky - by);
  const knobHousing = box(72, 85, 70, mat('plastic'));
  knobHousing.position.set(0, ky - 10, kz);
  const knob = cyl(p.knobD / 2, 40, 'x', mat('plastic'), 12);
  knob.position.set(p.mastW / 2 + 32, ky, kz);
  const knobFace = cyl(p.knobD / 2 - 12, 2, 'x', mat('silver'), 32);
  knobFace.position.set(p.mastW / 2 + 53, ky, kz);
  root.add(reg('knob', group(knobHousing, knob, knobFace), { name: 'Perilla de tensión', dims: `Ø ≈ ${p.knobD} mm, ${p.knobBelowBar} mm bajo el manubrio`, src: EST, desc: 'Debe quedar accesible con el soporte instalado.' }));

  // --- Bastidor, estabilizadores y asiento ---
  const frame = new THREE.Group();
  const beam = box(60, 60, 1250, mat('frame'));
  beam.position.set(0, 190, 430);
  const front = cyl(32, 520, 'x', mat('frame'));
  front.position.set(0, 45, -560);
  const frontLink = box(60, 60, 260, mat('frame'));
  frontLink.position.set(0, 110, -470);
  frontLink.rotation.x = -0.45;
  const rear = cyl(32, 520, 'x', mat('frame'));
  rear.position.set(0, 45, 1080);
  const rearLink = box(60, 150, 60, mat('frame'));
  rearLink.position.set(0, 110, 1050);
  const caps = new THREE.Group();
  for (const z of [-560, 1080]) for (const s of [-1, 1]) {
    const c = cyl(34, 50, 'x', mat('plastic'));
    c.position.set(s * 280, 45, z);
    caps.add(c);
  }
  frame.add(beam, front, frontLink, rear, rearLink, caps);
  root.add(reg('frame', frame, { name: 'Bastidor y estabilizadores', dims: 'largo total ≈ 1700 mm', src: EST, desc: 'Simplificado: tubos rectos.' }));

  const seat = new THREE.Group();
  const post = box(60, p.seatY - 230, 60, mat('frame'));
  post.position.set(0, (p.seatY + 150) / 2, p.seatZ);
  const rail = box(70, 40, 360, mat('frame'));
  rail.position.set(0, p.seatY - 70, p.seatZ + 60);
  const cushion = box(380, 80, 330, mat('seat'));
  cushion.position.set(0, p.seatY, p.seatZ);
  const back = box(380, 470, 70, mat('seat'));
  back.position.set(0, p.seatY + 270, p.seatZ + 220);
  back.rotation.x = 0.26;
  seat.add(post, rail, cushion, back);
  root.add(reg('seat', seat, { name: 'Asiento con respaldo', dims: `cojín a ≈ ${p.seatY} mm del piso`, src: EST, desc: 'Regulable sobre su riel; no se modifica.' }));

  return root;
}
