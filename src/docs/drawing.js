// Mini generador de dibujos técnicos SVG. Coordenadas en mm con y hacia arriba.
export class Dwg {
  constructor(fs = 9) {
    this.fs = fs;
    this.els = [];
    this.box = [Infinity, Infinity, -Infinity, -Infinity];
  }
  _p(x, y) {
    const b = this.box;
    b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], -y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], -y);
    return `${f(x)},${f(-y)}`;
  }
  line(x1, y1, x2, y2, cls = 'o') {
    const a = this._p(x1, y1).split(','), b = this._p(x2, y2).split(',');
    this.els.push(`<line class="${cls}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`);
    return this;
  }
  poly(pts, cls = 'o f', closed = true) {
    const d = pts.map(([x, y]) => this._p(x, y)).join(' ');
    this.els.push(`<${closed ? 'polygon' : 'polyline'} class="${cls}" points="${d}"/>`);
    return this;
  }
  rect(x0, y0, x1, y1, cls = 'o f') {
    return this.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], cls);
  }
  circle(cx, cy, r, cls = 'o f') {
    this._p(cx - r, cy - r); this._p(cx + r, cy + r);
    this.els.push(`<circle class="${cls}" cx="${f(cx)}" cy="${f(-cy)}" r="${f(r)}"/>`);
    return this;
  }
  text(x, y, str, { anchor = 'middle', size = this.fs, rot = 0, cls = 't', bold = false } = {}) {
    const w = String(str).length * size * 0.56;
    const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    if (rot) this._p(x, y);
    else { this._p(x0, y - size * 0.3); this._p(x0 + w, y + size); }
    const tr = rot ? ` transform="rotate(${f(rot)} ${f(x)} ${f(-y)})"` : '';
    this.els.push(`<text class="${cls}" x="${f(x)}" y="${f(-y)}" font-size="${f(size)}" text-anchor="${anchor}"${bold ? ' font-weight="700"' : ''}${tr}>${esc(str)}</text>`);
    return this;
  }
  // Cota alineada entre dos puntos, desplazada 'off' hacia la normal izquierda de (p1→p2).
  dim(x1, y1, x2, y2, off, label, cls = 'd') {
    const L = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const nx = -uy, ny = ux;
    const a = [x1 + nx * off, y1 + ny * off], b = [x2 + nx * off, y2 + ny * off];
    const ext = Math.sign(off) * this.fs * 0.4;
    this.line(x1 + nx * ext * 0.3, y1 + ny * ext * 0.3, a[0] + nx * ext, a[1] + ny * ext, `${cls} ext`);
    this.line(x2 + nx * ext * 0.3, y2 + ny * ext * 0.3, b[0] + nx * ext, b[1] + ny * ext, `${cls} ext`);
    this.line(a[0], a[1], b[0], b[1], cls);
    const tk = this.fs * 0.35;
    for (const p of [a, b]) this.line(p[0] - (ux + nx) * tk, p[1] - (uy + ny) * tk, p[0] + (ux + nx) * tk, p[1] + (uy + ny) * tk, cls);
    let ang = (-Math.atan2(uy, ux) * 180) / Math.PI;
    let tn = 1;
    if (ang > 90.01 || ang < -89.99) { ang += 180; tn = -1; }
    const side = Math.sign(off) || 1;
    const tx = (a[0] + b[0]) / 2 + nx * this.fs * 0.35 * side * (tn > 0 ? 1 : 1);
    const ty = (a[1] + b[1]) / 2 + ny * this.fs * 0.35 * side;
    this.text(tx, ty, label ?? fmt(L), { rot: ang, cls: `t ${cls}t` });
    return this;
  }
  svg(pad = 20, title = '') {
    const [x0, y0, x1, y1] = this.box;
    const w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(x0 - pad)} ${f(y0 - pad)} ${f(w)} ${f(h)}" font-family="Segoe UI, Roboto, Arial, sans-serif">
<title>${esc(title)}</title>
<style>
.o{stroke:#111;stroke-width:1.3px;vector-effect:non-scaling-stroke;fill:none}
.f{fill:#f3efe6}
.f2{fill:#e7e2d6}
.bk{fill:#d9dce1;stroke:#7b828c;stroke-width:1px;vector-effect:non-scaling-stroke}
.h{stroke:#555;stroke-width:1px;stroke-dasharray:6 4;vector-effect:non-scaling-stroke;fill:none}
.c{stroke:#999;stroke-width:0.8px;stroke-dasharray:14 4 2 4;vector-effect:non-scaling-stroke;fill:none}
.d{stroke:#1d4ed8;stroke-width:0.9px;vector-effect:non-scaling-stroke;fill:none}
.d.ext{stroke-width:0.6px}
.r{stroke:#dc2626;stroke-width:1.2px;stroke-dasharray:8 4;vector-effect:non-scaling-stroke;fill:none}
.rd{stroke:#dc2626;stroke-width:0.9px;vector-effect:non-scaling-stroke;fill:none}
.st{fill:#9aa0a6;stroke:#333;stroke-width:1px;vector-effect:non-scaling-stroke}
.t{fill:#111}
.dt{fill:#1d4ed8}
.rdt{fill:#dc2626}
.mt{fill:#555}
</style>
${this.els.join('\n')}
</svg>`;
  }
}

const f = (n) => (Math.round(n * 100) / 100).toString();
export const fmt = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
