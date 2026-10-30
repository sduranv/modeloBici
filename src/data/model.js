// Geometría derivada del soporte. Todo sale de params.js; el visor 3D, los planos,
// la lista de cortes y las verificaciones leen exclusivamente este objeto.
//
// Sistema de coordenadas (mm): x = lateral (+ derecha del ciclista), y = altura desde el piso,
// z = horizontal hacia el asiento. El origen está en el piso, bajo el centro del manubrio.

const G = 9.81;
const ceil5 = (n) => Math.ceil(n / 5) * 5;
const round1 = (n) => Math.round(n * 10) / 10;

export function buildModel(p) {
  const A = (p.mastAngle * Math.PI) / 180;
  const tanA = Math.tan(A);
  const mastHalfZ = p.mastW / 2 / Math.sin(A); // semiespesor horizontal del mástil inclinado
  // y relativo al centro del manubrio → z del eje / caras del mástil
  const mastZ = (y) => y / tanA;
  const mastRearZ = (y) => mastZ(y) + mastHalfZ;
  const mastFrontZ = (y) => mastZ(y) - mastHalfZ;

  const r = p.barD / 2;
  // Cara inferior de la bandeja: lo más baja posible respetando rodilla y material sobre la ranura
  const yU = Math.max(r + p.wrap + p.jaw, p.kneeMaxY + p.kneeClear - p.barY);
  const trayBottomY = p.barY + yU;
  const trayTopY = trayBottomY + p.t;

  const xIn = p.mastW / 2 + p.sideClear; // cara interior de cada cartela
  const xOut = xIn + p.t;

  const slotW = p.mastW + 2 * p.slotClear;
  const slotEnd = ceil5(mastRearZ(yU + p.t) + 6);

  const stubTopZ = mastRearZ(p.mastTipAboveBar);
  const stopZ = ceil5(Math.max(stubTopZ + p.stopGap, slotEnd + 10)); // cara delantera de los topes
  const devZ0 = stopZ + p.t; // inicio de la zona de equipos
  const devDepth = Math.max(p.laptopD, p.kbD);
  const trayBack = ceil5(devZ0 + devDepth + p.deviceMargin);
  const trayDepth = trayBack - p.trayFront;
  const trayR = 30;

  const notchH = p.barD + 2 * p.wrap + 1; // alto de la ranura horizontal de la cartela
  const rodY = p.rodY;
  const rodZ = Math.ceil(mastRearZ(rodY) + p.sleeveD / 2 + 1);
  const cartBottom = rodY - 22;
  const cartRearBottom = rodZ + 30;
  const cartLen = p.cartRearTop - p.trayFront;
  const cartH = yU - cartBottom;

  const stopX0 = slotW / 2 + 15;
  const stopX1 = p.trayW / 2 - 10;
  const stopLen = stopX1 - stopX0;

  const rodLen = Math.ceil((2 * xOut + 2 * 2.5 + 8 + 15) / 10) * 10;
  const sleeveLen = 2 * xIn - 4;

  // --- Contornos 2D ---
  // Bandeja, vista superior (x, z)
  const trayOutline = [];
  {
    const W2 = p.trayW / 2, zf = p.trayFront, zb = trayBack, s2 = slotW / 2;
    trayOutline.push([-W2, zf], [-s2, zf], [-s2, slotEnd], [s2, slotEnd], [s2, zf], [W2, zf]);
    arc(trayOutline, W2 - trayR, zb - trayR, trayR, 0, 90);
    arc(trayOutline, -W2 + trayR, zb - trayR, trayR, 90, 180);
  }
  // Cartela, vista lateral (z, y relativo al manubrio). Ranura abierta hacia adelante.
  const cartOutline = [];
  {
    const zF = p.trayFront, h2 = notchH / 2;
    cartOutline.push([zF, yU], [p.cartRearTop, yU], [cartRearBottom, cartBottom], [zF, cartBottom], [zF, -h2]);
    arc(cartOutline, 0, 0, h2, -90, 90);
    cartOutline.push([zF, h2]);
  }
  const rodHole = { c: [rodZ, rodY], r: (p.rodD + 0.5) / 2 };

  // Tornillos bandeja → cartelas (desde arriba, centrados en el canto de la cartela)
  const xScrew = xIn + p.t / 2;
  const screwZs = [p.trayFront + 30, (p.trayFront + p.cartRearTop) / 2, p.cartRearTop - 30].map(Math.round);
  // Tornillos bandeja → topes (desde abajo)
  const stopScrewXs = [stopX0 + 40, stopX1 - 40].map(Math.round);

  // --- Piezas ---
  const parts = [
    {
      id: 'P1', name: 'Bandeja', qty: 1, mat: `Melamina ${p.t} mm`, L: p.trayW, W: trayDepth, T: p.t,
      desc: 'Superficie de trabajo. La ranura delantera deja pasar la punta del mástil.',
      ops: [
        `Cortar rectángulo ${p.trayW} × ${trayDepth} mm.`,
        `Ranura centrada en el borde delantero: ${slotW} mm de ancho × ${slotEnd - p.trayFront} mm de profundidad (caladora).`,
        `Redondear las dos esquinas traseras (lado usuario) con radio ${trayR} mm.`,
        `Perforar 6 agujeros Ø4 avellanados para unir las cartelas: x = ±${round1(xScrew)} mm, a ${screwZs.map((z) => z - p.trayFront).join(' / ')} mm del borde delantero.`,
        'Pegar tapacanto en todo el contorno, incluida la ranura.',
      ],
    },
    {
      id: 'P2', name: 'Cartela lateral', qty: 2, mat: `Melamina ${p.t} mm`, L: cartLen, W: cartH, T: p.t,
      desc: 'Apoya la bandeja sobre el manubrio y abraza el mástil. Ranura horizontal abierta hacia adelante.',
      ops: [
        `Cortar rectángulo ${cartLen} × ${round1(cartH)} mm.`,
        `Cortar la diagonal trasera: desde la esquina superior trasera hasta ${round1(cartRearBottom - p.trayFront)} mm del borde delantero en el canto inferior.`,
        `Ranura horizontal: alto ${round1(notchH)} mm, centro a ${round1(yU)} mm bajo el canto superior, profundidad ${-p.trayFront} mm con fondo semicircular.`,
        `Agujero Ø${p.rodD + 0.5} para el perno: a ${round1(rodZ - p.trayFront)} mm del borde delantero y ${round1(yU - rodY)} mm bajo el canto superior.`,
        'Forrar la ranura con goma (cámara de bicicleta) pegada con contacto.',
      ],
    },
    {
      id: 'P3', name: 'Tope delantero', qty: 2, mat: `Melamina ${p.t} mm`, L: Math.round(stopLen), W: p.stopH, T: p.t,
      desc: 'Evita que el notebook o el teclado se deslicen hacia el mástil. Separados para dejar pasar la punta del mástil.',
      ops: [`Cortar ${Math.round(stopLen)} × ${p.stopH} mm.`, 'Tapacanto en el canto superior.', 'Atornillar desde abajo de la bandeja, de canto.'],
    },
  ];

  const hardware = [
    { id: 'H1', name: `Perno hexagonal M${p.rodD} × ${rodLen} mm`, qty: 1, use: 'Perno de cierre: traba la bandeja contra el mástil.' },
    { id: 'H2', name: `Tuerca mariposa M${p.rodD}`, qty: 1, use: 'Cierre sin herramientas.' },
    { id: 'H3', name: `Arandela ancha M${p.rodD}`, qty: 2, use: 'Reparte la presión sobre la melamina.' },
    { id: 'H4', name: `Tubo PVC Ø${p.sleeveD} mm, largo ${sleeveLen} mm`, qty: 1, use: 'Funda del perno: el mástil apoya sobre PVC, no sobre la rosca.' },
    { id: 'H5', name: 'Tornillo para aglomerado 4 × 50 mm cabeza avellanada', qty: 6, use: 'Bandeja → cartelas (desde arriba).' },
    { id: 'H6', name: 'Escuadra metálica 40 × 40 mm', qty: 4, use: 'Refuerzo bandeja ↔ cartela (cara exterior).' },
    { id: 'H7', name: 'Tornillo 3,5 × 16 mm', qty: 16, use: 'Fijación de las escuadras.' },
    { id: 'H8', name: 'Tornillo para aglomerado 4 × 35 mm', qty: 4, use: 'Bandeja → topes (desde abajo).' },
    { id: 'H9', name: 'Goma 1,5 mm (cámara de bicicleta vieja) + adhesivo de contacto', qty: 1, use: 'Forro de las ranuras y del manubrio: evita rayas y vibración.' },
    { id: 'H10', name: `Malla antideslizante ${p.trayW - 40} × ${trayBack - devZ0} mm`, qty: 1, use: 'Sujeta el equipo sobre la bandeja.' },
    { id: 'H11', name: 'Tapacanto melamina 22 mm (termoadhesivo)', qty: 1, use: `≈ ${Math.ceil(edgeLength() / 100) / 10} m en total.` },
  ];

  function edgeLength() {
    const tray = 2 * p.trayW + 2 * trayDepth + 2 * (slotEnd - p.trayFront);
    const cart = 2 * (cartLen + cartH + Math.hypot(p.cartRearTop - cartRearBottom, cartH));
    const stops = 2 * stopLen;
    return tray + cart + stops;
  }

  const tools = [
    'Sierra caladora (ranuras y diagonal) o cortes encargados en la tienda',
    'Taladro + brocas 3, 4 y 10,5 mm + avellanador',
    'Destornillador / puntas Phillips',
    'Huincha, escuadra, lápiz',
    'Lija grano 120',
    'Plancha (para el tapacanto) y cuchillo cartonero',
    'Llave allen o destornillador para retirar la consola (según sus tornillos)',
  ];

  // --- Cargas (estimación, no reemplaza una prueba física) ---
  const density = 650; // kg/m³ aglomerado melamínico
  const trayKg = (p.trayW * trayDepth * p.t * density) / 1e9;
  const zTray = (p.trayFront + trayBack) / 2;
  const zLaptop = devZ0 + p.laptopD / 2;
  const M = (G * (trayKg * zTray + p.laptopKg * zLaptop + p.leanKg * trayBack)) / 1000; // N·m (vuelco hacia el usuario)
  const Frod = M / (Math.abs(rodY) / 1000); // N
  const fh = 50 * Math.pow(p.rodD, -0.6) * Math.pow(p.t, 0.2); // MPa, aplastamiento del aglomerado (EN 1995)
  const sBearing = Frod / (2 * p.t * p.rodD);
  const span = 2 * xIn + p.t;
  const dc = 0.82 * p.rodD;
  const sRod = ((Frod * span) / 8) / ((Math.PI * dc ** 3) / 32);
  const E = 2500, MOR = 11; // MPa, aglomerado melamínico (valores conservadores)
  const Lc = p.trayW / 2 - xOut; // voladizo lateral
  const Pside = (G * p.leanKg) / 2; // un antebrazo en la punta
  const Iside = (trayDepth * p.t ** 3) / 12;
  const dSide = (Pside * Lc ** 3) / (3 * E * Iside);
  const sSide = (Pside * Lc) / ((trayDepth * p.t ** 2) / 6);
  const Wtot = G * (trayKg + p.laptopKg + p.leanKg);

  const loads = { trayKg, M, Frod, fh, sBearing, sRod, dSide, sSide, Wtot, zLaptop, Lc };

  const kneeGap = trayBottomY - p.kneeMaxY;
  const knobTop = -p.knobBelowBar + p.knobD / 2;
  const rodBarGap = Math.hypot(rodZ, rodY) - r - p.sleeveD / 2;

  // Apertura de pantalla antes de tocar la punta del mástil (la bisagra queda junto a los topes)
  const hingeZ = devZ0 + 5 + 4;
  const tipAboveHinge = p.mastTipAboveBar - (yU + p.t) - 2 - (p.laptopH + 3);
  const maxOpen = tipAboveHinge <= 0 ? 180 : 90 + (Math.atan2(hingeZ - stubTopZ, tipAboveHinge) * 180) / Math.PI;

  const checks = [
    { id: 'C1', label: 'Holgura rodilla ↔ bandeja', value: `${round1(kneeGap)} mm`, ok: kneeGap >= 40, basis: 'C', how: 'Pedalea lento con la bandeja montada y sin equipo: la rodilla no debe rozar.' },
    { id: 'C2', label: 'Cartelas fuera de la zona de rodillas', value: `cartela hasta x = ±${round1(xOut)} mm; rodilla desde ±${p.kneeXin} mm`, ok: xOut < p.kneeXin, basis: 'S', how: 'Comprobar con el pedaleo real: las cartelas quedan entre las rodillas.' },
    { id: 'C3', label: 'Perilla de tensión libre', value: `${round1(cartBottom - knobTop)} mm de separación`, ok: cartBottom - knobTop >= 5, basis: 'E', how: 'Gira la perilla con la bandeja montada. Si roza, recorta la esquina inferior delantera de la cartela.' },
    { id: 'C4', label: 'Ranura de la bandeja ↔ mástil', value: `${slotW - p.mastW} mm de juego total`, ok: slotW - p.mastW >= 10, basis: 'E', how: 'Antes de cortar, mide el ancho real del mástil a la altura de la bandeja.' },
    { id: 'C5', label: 'Perno ↔ manubrio', value: `${round1(rodBarGap)} mm libres`, ok: rodBarGap >= 8, basis: 'E', how: 'El perno debe entrar sin forzar por detrás del mástil.' },
    { id: 'C6', label: 'Notebook 14" cabe', value: `${p.laptopW} × ${p.laptopD} en ${p.trayW - 20} × ${trayBack - devZ0}`, ok: p.laptopW <= p.trayW - 20 && p.laptopD <= trayBack - devZ0, basis: 'E', how: 'Confirma las medidas de tu notebook.' },
    { id: 'C11', label: 'Apertura de la pantalla sin tocar el mástil', value: `hasta ≈ ${Math.round(maxOpen)}°`, ok: maxOpen >= 110, basis: 'E', how: 'Abre la pantalla al ángulo que usas: si toca la punta del mástil, sube "Separación entre la punta del mástil y los topes" en Medidas.' },
    { id: 'C7', label: 'Teclado + mouse caben', value: `${p.kbW} × ${p.kbD} en ${p.trayW} × ${trayBack - devZ0}`, ok: p.kbW <= p.trayW && p.kbD <= trayBack - devZ0, basis: 'C', how: '—' },
    { id: 'C8', label: 'Aplastamiento de la melamina en el perno', value: `${round1(sBearing)} MPa (admisible ≈ ${round1(fh / 3)})`, ok: sBearing <= fh / 3, basis: 'S', how: 'Si el agujero se ovaliza con el uso, cambiar la cartela o usar terciado.' },
    { id: 'C9', label: `Flexión del perno M${p.rodD}`, value: `${Math.round(sRod)} MPa (fluencia 4.8 ≈ 320)`, ok: sRod <= 320 / 1.5, basis: 'S', how: 'Usar perno de acero (no varilla de bronce ni aluminio).' },
    { id: 'C10', label: 'Voladizo lateral de la bandeja', value: `flecha ≈ ${round1(dSide)} mm, tensión ${round1(sSide)} MPa`, ok: dSide <= 3 && sSide <= MOR / 3, basis: 'S', how: 'Apoya el antebrazo en una punta: no debe hundirse a simple vista.' },
  ];

  const g = {
    tanA, mastHalfZ, mastZ, mastRearZ, mastFrontZ, r, yU, trayBottomY, trayTopY, xIn, xOut, slotW, slotEnd,
    stubTopZ, stopZ, devZ0, trayBack, trayDepth, trayR, notchH, rodY, rodZ, cartBottom, cartRearBottom, cartLen, cartH,
    stopX0, stopX1, stopLen, rodLen, sleeveLen, xScrew, screwZs, stopScrewXs, kneeGap,
  };

  return { p, g, trayOutline, cartOutline, rodHole, parts, hardware, tools, loads, checks };
}

function arc(out, cx, cy, r, a0, a1) {
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
}
