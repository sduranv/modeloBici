import { Dwg, fmt } from './drawing.js';
import { renderParamsInto, pendientes } from '../ui/params.js';

// Planos y documentación generados desde el mismo modelo que usa el visor 3D.

export function drawings(model) {
  const { p, g } = model;
  const by = p.barY;
  const out = {};

  // ---------- Plano general: corte lateral por el eje (z, y absolutos) ----------
  {
    const d = new Dwg(11);
    const yTop = by + p.mastTipAboveBar;
    const yLow = by + g.cartBottom - 110;
    // mástil (banda inclinada)
    const m = (y) => [g.mastFrontZ(y - by), g.mastRearZ(y - by)];
    const [f0, r0] = m(yLow), [f1, r1] = m(yTop);
    d.poly([[f0, yLow], [r0, yLow], [r1, yTop], [f1, yTop]], 'bk');
    d.line(g.mastZ(yLow - by) , yLow, g.mastZ(yTop - by), yTop, 'c');
    // perilla (de perfil: eje lateral)
    const ky = by - p.knobBelowBar;
    d.circle(g.mastZ(-p.knobBelowBar), ky, p.knobD / 2, 'h');
    d.text(g.mastZ(-p.knobBelowBar) - p.knobD / 2 - 8, ky, 'perilla (lateral)', { anchor: 'end', cls: 't mt', size: 9 });
    // manubrio
    d.circle(0, by, g.r, 'bk');
    d.circle(0, by, g.r + p.wrap, 'h');
    // cartela
    d.poly(model.cartOutline.map(([z, y]) => [z, y + by]), 'o f2');
    d.circle(g.rodZ, by + g.rodY, model.rodHole.r, 'o');
    d.circle(g.rodZ, by + g.rodY, p.sleeveD / 2, 'h');
    // bandeja y tope
    d.rect(p.trayFront, g.trayBottomY, g.trayBack, g.trayTopY, 'o f');
    d.line(g.slotEnd, g.trayBottomY, g.slotEnd, g.trayTopY, 'h');
    d.rect(g.stopZ, g.trayTopY, g.stopZ + p.t, g.trayTopY + p.stopH, 'o f');
    // notebook (punteado)
    const lz = g.devZ0 + 5, ly = g.trayTopY + 2;
    d.rect(lz, ly, lz + p.laptopD, ly + p.laptopH, 'h');
    const a = (-15 * Math.PI) / 180;
    d.line(lz + 4, ly + p.laptopH, lz + 4 + Math.sin(a) * (p.laptopD - 8), ly + p.laptopH + Math.cos(a) * (p.laptopD - 8), 'h');
    // rodilla
    d.line(p.kneeZmin - 60, p.kneeMaxY, p.kneeZmax, p.kneeMaxY, 'r');
    d.text(p.kneeZmax + 6, p.kneeMaxY - 4, `rodilla máx. ${p.kneeMaxY}`, { anchor: 'start', cls: 't rdt', size: 10 });
    // cotas
    d.dim(g.trayBack, g.trayTopY, p.trayFront, g.trayTopY, -26 - p.laptopD * 0.95, `${g.trayDepth}`);
    d.dim(p.trayFront, g.trayBottomY, 0, g.trayBottomY, -18 - g.yU - 70, `${-p.trayFront}`);
    d.dim(g.trayBack + 30, p.kneeMaxY, g.trayBack + 30, g.trayBottomY, -1, `${fmt(g.kneeGap)} libres`, 'rd');
    d.dim(g.trayBack, g.trayBottomY, g.trayBack, g.trayTopY, -60, `${p.t}`);
    d.dim(0, by, 0, by + g.rodY, -130, `${-g.rodY}`);
    d.dim(0, by + g.rodY, g.rodZ, by + g.rodY, -70, `${g.rodZ}`);
    d.dim(p.trayFront, g.trayTopY, g.stopZ, g.trayTopY, 40 + p.stopH, `${g.stopZ - p.trayFront}`);
    d.text(p.trayFront - 8, g.trayTopY + 4, `↑ ${fmt(g.trayTopY)} desde el piso`, { anchor: 'end', size: 10, bold: true });
    d.text(p.trayFront - 8, g.trayBottomY - 12, `cara inferior ${fmt(g.trayBottomY)}`, { anchor: 'end', size: 9 });
    d.text(-g.r - 6, by - 4, `manubrio ${by}`, { anchor: 'end', size: 9 });
    d.text(g.rodZ + 16, by + g.rodY - 4, `perno M${p.rodD} + PVC`, { anchor: 'start', size: 9 });
    d.text(g.mastZ(yTop - by) + 30, yTop - 10, 'mástil', { anchor: 'start', cls: 't mt', size: 9 });
    d.text((g.devZ0 + g.trayBack) / 2, ly + p.laptopH + 70, 'notebook', { cls: 't mt', size: 9 });
    d.text(-110, yLow + 10, '← adelante', { anchor: 'start', cls: 't mt', size: 9 });
    d.text(g.trayBack, yLow + 10, 'asiento →', { anchor: 'end', cls: 't mt', size: 9 });
    out.general = { title: 'Plano general — corte lateral por el eje de la bici', svg: d.svg(30, 'Plano general') };
  }

  // ---------- Vista frontal del soporte (x, y) ----------
  {
    const d = new Dwg(11);
    const W2 = p.trayW / 2;
    d.rect(-W2, g.trayBottomY, W2, g.trayTopY);
    for (const s of [-1, 1]) {
      d.rect(s * g.xIn, by + g.cartBottom, s * g.xOut, g.trayBottomY, 'o f2');
      d.rect(s * g.stopX0, g.trayTopY, s * g.stopX1, g.trayTopY + p.stopH);
    }
    d.rect(-(p.barWidth / 2), by - g.r, p.barWidth / 2, by + g.r, 'h');
    d.rect(-p.mastW / 2, by + g.cartBottom - 60, p.mastW / 2, by + p.mastTipAboveBar, 'h');
    d.rect(-(g.xOut + 6), by + g.rodY - p.rodD / 2, g.xOut + 15, by + g.rodY + p.rodD / 2, 'st');
    d.dim(-W2, g.trayTopY + p.stopH, W2, g.trayTopY + p.stopH, 34, `${p.trayW}`);
    d.dim(-g.xIn, by + g.cartBottom, g.xIn, by + g.cartBottom, -26, `${fmt(2 * g.xIn)}`);
    d.dim(-g.xOut, by + g.cartBottom, g.xOut, by + g.cartBottom, -52, `${fmt(2 * g.xOut)}`);
    d.dim(g.stopX0, g.trayTopY + p.stopH, g.stopX1, g.trayTopY + p.stopH, 14, `${fmt(g.stopLen)}`);
    d.dim(W2, by + g.cartBottom, W2, g.trayTopY, 30, `${fmt(g.trayTopY - by - g.cartBottom)}`);
    d.text(0, by + g.cartBottom - 100, 'mástil y manubrio en línea de trazos', { cls: 't mt', size: 9 });
    out.front = { title: 'Vista frontal del soporte (desde delante de la bici)', svg: d.svg(30, 'Vista frontal') };
  }

  // ---------- Vista superior (x, z): z hacia abajo en el dibujo (usuario abajo) ----------
  const topView = (onlyTray) => {
    const d = new Dwg(15);
    const T = (pts) => pts.map(([x, z]) => [x, -z]);
    d.poly(T(model.trayOutline));
    for (const s of [-1, 1]) for (const z of g.screwZs) d.circle(s * g.xScrew, -z, 2, 'o');
    if (!onlyTray) {
      for (const s of [-1, 1]) {
        d.rect(s * g.xIn, -p.trayFront, s * g.xOut, -p.cartRearTop, 'h');
        d.rect(s * g.stopX0, -g.stopZ, s * g.stopX1, -(g.stopZ + p.t), 'o f2');
      }
      d.rect(-(p.trayW / 2 - 20), -(g.devZ0 + 5), p.trayW / 2 - 20, -(g.trayBack - 5), 'h');
      d.text(0, -(g.devZ0 + g.trayBack) / 2, 'malla antideslizante / zona del equipo', { cls: 't mt', size: 10 });
    }
    const W2 = p.trayW / 2;
    d.dim(-W2, -p.trayFront, W2, -p.trayFront, 30, `${p.trayW}`);
    d.dim(-W2, -g.trayBack, -W2, -p.trayFront, 30, `${g.trayDepth}`);
    d.dim(-g.slotW / 2, -g.slotEnd, g.slotW / 2, -g.slotEnd, -16, `${g.slotW}`);
    d.dim(g.slotW / 2, -p.trayFront, g.slotW / 2, -g.slotEnd, 34, `${g.slotEnd - p.trayFront}`);
    d.dim(W2, -g.trayBack, W2, -p.trayFront, -30, null);
    if (onlyTray) {
      d.dim(g.xScrew, -p.trayFront, g.xScrew, -g.screwZs[0], 120, `${g.screwZs[0] - p.trayFront}`);
      d.dim(g.xScrew, -g.screwZs[0], g.xScrew, -g.screwZs[1], 120, `${g.screwZs[1] - g.screwZs[0]}`);
      d.dim(g.xScrew, -g.screwZs[1], g.xScrew, -g.screwZs[2], 120, `${g.screwZs[2] - g.screwZs[1]}`);
      d.dim(-g.xScrew, -g.screwZs[2] - 20, g.xScrew, -g.screwZs[2] - 20, -10, `${fmt(2 * g.xScrew)}`);
      d.text(0, -g.trayBack + 40, `6 agujeros Ø4 avellanados · esquinas traseras R${g.trayR}`, { size: 10 });
    } else {
      d.dim(-W2, -p.trayFront, -W2, -g.stopZ, -60, `${g.stopZ - p.trayFront}`);
    }
    d.text(0, -p.trayFront + 22, 'BORDE DELANTERO (mástil)', { size: 9, cls: 't mt' });
    d.text(0, -g.trayBack - 32, 'LADO USUARIO', { size: 9, cls: 't mt' });
    return d;
  };
  out.top = { title: 'Vista superior del soporte (usuario abajo)', svg: topView(false).svg(30, 'Vista superior') };
  out.P1 = { title: 'P1 — Bandeja', svg: topView(true).svg(30, 'P1 Bandeja') };

  // ---------- P2 cartela ----------
  {
    const d = new Dwg(8);
    const yTopRel = g.yU;
    const Z = (z) => z - p.trayFront; // cotas desde el borde delantero
    const pts = model.cartOutline.map(([z, y]) => [Z(z), y - g.cartBottom]);
    d.poly(pts, 'o f2');
    const hc = [Z(g.rodZ), g.rodY - g.cartBottom];
    d.circle(hc[0], hc[1], model.rodHole.r, 'o');
    d.line(hc[0] - 12, hc[1], hc[0] + 12, hc[1], 'c').line(hc[0], hc[1] - 12, hc[0], hc[1] + 12, 'c');
    const H = g.cartH, yb = -g.cartBottom; // y del centro de la ranura medido desde el canto inferior
    d.dim(0, H, Z(p.cartRearTop), H, 18, `${g.cartLen}`);
    d.dim(0, 0, 0, H, 22, `${fmt(H)}`);
    d.dim(0, 0, Z(g.cartRearBottom), 0, -16, `${fmt(Z(g.cartRearBottom))}`);
    d.dim(0, yb + g.notchH / 2, Z(0), yb + g.notchH / 2, 10, `${-p.trayFront}`);
    d.dim(Z(0) + 2, yb - g.notchH / 2, Z(0) + 2, yb + g.notchH / 2, -14, `${fmt(g.notchH)}`);
    d.dim(Z(p.cartRearTop) , yb, Z(p.cartRearTop), H, -26, `${fmt(yTopRel)}`);
    d.dim(hc[0], hc[1], hc[0], 0, -14, `${fmt(hc[1])}`);
    d.text(hc[0] + 14, hc[1] + 10, `Ø${p.rodD + 0.5} → a ${fmt(hc[0])} del borde`, { anchor: 'start', size: 7.5 });
    d.text(Z(0) + 20, yb - 3, `fondo R${fmt(g.notchH / 2)}`, { anchor: 'start', size: 7.5 });
    d.line(Z(p.cartRearTop) - 30, yb, Z(p.cartRearTop) + 4, yb, 'c');
    d.text(Z(p.cartRearTop) + 6, yb - 3, 'eje manubrio', { anchor: 'start', size: 7, cls: 't mt' });
    out.P2 = { title: 'P2 — Cartela lateral (×2, iguales) · borde delantero a la izquierda', svg: d.svg(24, 'P2 Cartela') };
  }

  // ---------- P3 tope ----------
  {
    const d = new Dwg(8);
    d.rect(0, 0, g.stopLen, p.stopH);
    for (const x of g.stopScrewXs) d.line(x - g.stopX0, -4, x - g.stopX0, 6, 'c');
    d.dim(0, p.stopH, g.stopLen, p.stopH, 12, `${fmt(g.stopLen)}`);
    d.dim(g.stopLen, 0, g.stopLen, p.stopH, -12, `${p.stopH}`);
    d.text(g.stopLen / 2, -14, `espesor ${p.t} · 2 tornillos 4×35 desde abajo, a 40 mm de cada extremo`, { size: 7 });
    out.P3 = { title: 'P3 — Tope delantero (×2)', svg: d.svg(18, 'P3 Tope') };
  }

  // ---------- Despiece axonométrico ----------
  {
    const d = new Dwg(34);
    const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
    const P = (x, y, z) => [(x - z) * c, y + (x + z) * s * 0.9];
    const prism = (outline2, toXYZ, thick, dir, off, cls) => {
      const a = outline2.map((q) => toXYZ(q, 0)), b = outline2.map((q) => toXYZ(q, thick));
      const sh = (v) => [v[0] + off[0], v[1] + off[1], v[2] + off[2]];
      d.poly(b.map((v) => P(...sh(v))), cls);
      d.poly(a.map((v) => P(...sh(v))), cls);
    };
    const EX = 140;
    // cartelas (abajo)
    for (const sgn of [-1, 1]) {
      const x0 = sgn < 0 ? -g.xIn : g.xOut;
      prism(model.cartOutline, ([z, y], w) => [x0 - w * p.t, y, z], p.t, 0, [sgn * 120, -EX, 0], 'o f2');
    }
    // bandeja
    prism(model.trayOutline, ([x, z], w) => [x, g.yU + p.t - w * p.t, z], p.t, 0, [0, 0, 0], 'o f');
    // topes (arriba)
    for (const sgn of [-1, 1]) {
      const rect = [[sgn * g.stopX0, 0], [sgn * g.stopX1, 0], [sgn * g.stopX1, p.stopH], [sgn * g.stopX0, p.stopH]];
      prism(rect, ([x, y], w) => [x, g.yU + p.t + y + EX, g.stopZ + w], p.t, 0, [0, 0, 0], 'o f2');
    }
    // perno y mariposa
    const yRod = g.rodY - EX - 130;
    const r0 = P(-g.xOut - 300, yRod, g.rodZ), r1 = P(-g.xOut - 300 + g.rodLen, yRod, g.rodZ);
    d.line(r0[0], r0[1], r1[0], r1[1], 'o');
    const n0 = P(g.xOut + 280, yRod, g.rodZ);
    d.circle(n0[0], n0[1], 12, 'o');
    // rótulos al final, fuera de las piezas, con línea guía
    const tag = (from, to, txt, anchor) => {
      d.line(from[0], from[1], to[0], to[1], 'd ext');
      d.text(to[0] + (anchor === 'start' ? 14 : -14), to[1] - 10, txt, { anchor, bold: true });
    };
    const far = d.box[2] + 120;
    tag(P(p.trayW / 2 - 60, g.yU + p.t, g.trayBack - 120), [far, P(0, g.yU, g.trayBack)[1]], 'P1 bandeja', 'start');
    tag(P(g.xOut + 120, g.cartBottom - EX + 40, 60), [far, P(0, g.cartBottom - EX, 0)[1]], 'P2 cartela ×2', 'start');
    tag(P(g.stopX1 - 60, g.yU + p.t + EX + p.stopH / 2, g.stopZ), [far, P(0, g.yU + EX + 120, 0)[1]], 'P3 tope ×2', 'start');
    d.text(r0[0] - 16, r0[1] - 10, 'H1 perno M10', { anchor: 'end', bold: true });
    d.text(n0[0] + 22, n0[1] - 10, 'H2 mariposa', { anchor: 'start', bold: true });
    out.explode = { title: 'Despiece explotado (axonometría)', svg: d.svg(30, 'Despiece') };
  }
  return out;
}

// ---------- Página de documentación ----------
// ---------- Hoja de taller ----------
export function renderDocs(el, model) {
  const { p, g } = model;
  const D = drawings(model);
  const fig = (key, cap) => `<figure id="fig-${key}"><div>${D[key].svg}</div><figcaption><span>${cap ?? D[key].title}</span><button data-svg="${key}">SVG</button></figcaption></figure>`;
  const area = model.parts.reduce((a, pt) => a + (pt.L * pt.W * pt.qty) / 1e6, 0);
  const falta = pendientes();

  el.innerHTML = `<div class="doc">
  <div class="toolbar">
    <button id="doc-print" class="active">Imprimir / PDF</button>
    <button id="doc-csv">Lista de cortes (CSV)</button>
  </div>

  <h1 style="margin:6px 0 2px">Soporte para notebook — hoja de taller</h1>
  <p class="muted">Bandeja de melamina que se calza sobre el manubrio de una bicicleta estática. No se perfora ni se corta nada de la bicicleta. Se pone y se saca a mano en ~30 segundos.</p>

  ${falta.length ? `<div class="warnbox"><b>Confirmar en la bicicleta antes de cortar:</b> ${falta.join(' · ')}. Están estimadas desde fotos y definen las ranuras.</div>` : ''}

  <h2>1. Cómo se sujeta</h2>
  <div class="grid2" style="align-items:start">
    ${fig('general', 'Corte lateral — cotas en mm')}
    <ol class="big">
      <li><b>Apoyo:</b> las dos cartelas (P2) se calzan sobre el tubo del manubrio por su ranura, una a cada lado del mástil.</li>
      <li><b>Centrado:</b> la punta del mástil sube por la ranura delantera de la bandeja (P1) y hace de tope.</li>
      <li><b>Cierre:</b> un perno M10 con funda de PVC pasa por las dos cartelas, por detrás del mástil. La tuerca mariposa se aprieta a mano y es lo que impide que la bandeja se vuelque hacia el usuario.</li>
      <li><b>Altura final de la superficie:</b> ${fmt(g.trayTopY)} mm desde el piso.</li>
    </ol>
  </div>

  <h2>2. Piezas y cortes</h2>
  <table><tr><th>Pieza</th><th>Cant.</th><th class="num">Largo</th><th class="num">Ancho</th><th class="num">Esp.</th></tr>
  ${model.parts.map((pt) => `<tr><td><b>${pt.id}</b> ${pt.name}</td><td>${pt.qty}</td><td class="num">${fmt(pt.L)}</td><td class="num">${fmt(pt.W)}</td><td class="num">${pt.T}</td></tr>`).join('')}
  </table>
  <p>Melamina de ${p.t} mm, ≈ ${area.toFixed(2).replace('.', ',')} m². Los <b>rectángulos</b> se pueden encargar cortados; las ranuras, la diagonal y los agujeros van con caladora y taladro.</p>

  <div class="grid2">
    ${fig('P1', `P1 Bandeja · ${fmt(model.parts[0].L)} × ${fmt(model.parts[0].W)}`)}
    <div>
      ${fig('P2', `P2 Cartela ×2 · ${fmt(model.parts[1].L)} × ${fmt(model.parts[1].W)}`)}
      <div style="height:12px"></div>
      ${fig('P3', `P3 Tope ×2 · ${fmt(model.parts[2].L)} × ${p.stopH}`)}
    </div>
  </div>
  ${model.parts.map((pt) => `<h3 id="part-${pt.id}">${pt.id} · ${pt.name}${pt.qty > 1 ? ` ×${pt.qty}` : ''}</h3><ol>${pt.ops.map((o) => `<li>${o}</li>`).join('')}</ol>`).join('')}

  <h2>3. Herrajes</h2>
  <table><tr><th>Elemento</th><th>Cant.</th><th>Para qué</th></tr>
  ${model.hardware.map((h) => `<tr><td>${h.name}</td><td>${h.qty}</td><td>${h.use}</td></tr>`).join('')}</table>
  <p class="muted">Herramientas: ${model.tools.join(' · ')}.</p>

  <h2>4. Armado e instalación</h2>
  <div class="grid2" style="align-items:start">
    ${fig('explode', 'Despiece')}
    <ol class="big">
      <li>Marca las <b>dos cartelas juntas</b>, con prensas, y corta la diagonal, la ranura y el agujero del perno de una vez: así quedan idénticas.</li>
      <li>En la bandeja, taladra Ø10 en las dos esquinas del fondo de la ranura y termina el corte con caladora.</li>
      <li>Lija, pega tapacanto y forra con goma la ranura de cada cartela.</li>
      <li>Atornilla las cartelas bajo la bandeja (6 tornillos 4 × 50 desde arriba, pre-perforar Ø3) y agrega las 4 escuadras por fuera.</li>
      <li>Atornilla los dos topes desde abajo y pega la malla antideslizante.</li>
      <li>En la bicicleta: retira la consola con sus tornillos y guárdala. Forra con goma el manubrio a ambos lados del mástil.</li>
      <li>Calza el soporte desde adelante hasta el tope, pasa la funda de PVC por detrás del mástil y luego el perno. Aprieta la mariposa a mano.</li>
    </ol>
  </div>

  <h2>5. Antes de usarlo</h2>
  <ul class="big">
    <li>Sin equipo encima, apoya los dos antebrazos con fuerza en el borde durante 10 segundos: no debe girar, crujir ni moverse.</li>
    <li>Pedalea 2 minutos con algo pesado sobre la bandeja: no debe desplazarse, y la rodilla no debe rozar (quedan ${Math.round(g.kneeGap)} mm libres).</li>
    <li>Comprueba que la perilla de tensión gire libre.</li>
    <li>Aprieta la mariposa al empezar cada sesión. No uses el soporte como apoyo para subir o bajar de la bicicleta.</li>
  </ul>

  <details class="tech"><summary>Detalle técnico y medidas (opcional)</summary>
    <h3>Medidas del proyecto</h3>
    <p class="muted">Al aplicar un cambio se recalculan el modelo 3D, los planos y la lista de cortes.</p>
    <div id="par-box"></div>
    <h3>Cargas estimadas</h3>
    <p>Supuestos: notebook ${p.laptopKg} kg y ${p.leanKg} kg de antebrazos en el borde trasero. Momento de vuelco ≈ ${model.loads.M.toFixed(0)} N·m, que el perno transmite al mástil (≈ ${Math.round(model.loads.Frod)} N). Es una estimación de cálculo, no una validación estructural: la prueba de la sección 5 es obligatoria.</p>
    <table><tr><th>Comprobación</th><th>Resultado</th><th>Cómo verificar</th></tr>
    ${model.checks.map((c) => `<tr><td><span class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✔' : '✘'}</span> ${c.label}</td><td>${c.value}</td><td>${c.how}</td></tr>`).join('')}</table>
  </details>
  </div>`;

  renderParamsInto(el.querySelector('#par-box'));
  el.querySelectorAll('[data-svg]').forEach((b) => {
    b.onclick = () => download(`${b.dataset.svg}.svg`, D[b.dataset.svg].svg, 'image/svg+xml');
  });
  el.querySelector('#doc-print').onclick = () => {
    const prev = el.hidden;
    el.hidden = false;
    window.print();
    el.hidden = prev;
  };
  el.querySelector('#doc-csv').onclick = () => {
    const rows = [['Pieza', 'Nombre', 'Cantidad', 'Largo mm', 'Ancho mm', 'Espesor mm', 'Material']];
    for (const pt of model.parts) rows.push([pt.id, pt.name, pt.qty, fmt(pt.L), fmt(pt.W), pt.T, pt.mat]);
    rows.push([]);
    rows.push(['Herraje', 'Cantidad', 'Uso']);
    for (const h of model.hardware) rows.push([h.name, h.qty, h.use]);
    download('lista-de-cortes.csv', '\ufeff' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv');
  };
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
