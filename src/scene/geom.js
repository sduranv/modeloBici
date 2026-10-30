import * as THREE from 'three';

export function box(w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

// Cilindro con eje en 'x', 'y' o 'z', centrado en el origen.
export function cyl(r, len, axis, material, seg = 32, r2 = r) {
  const g = new THREE.CylinderGeometry(r2, r, len, seg);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export function shapeFrom(points, holes = []) {
  const s = new THREE.Shape(points.map(([a, b]) => new THREE.Vector2(a, b)));
  for (const h of holes) {
    const p = new THREE.Path();
    p.absarc(h.c[0], h.c[1], h.r, 0, Math.PI * 2, true);
    s.holes.push(p);
  }
  return s;
}

// Contorno en el plano (x, z) extruido hacia -y desde y = 0 (cara superior en el origen).
export function extrudeXZ(points, thickness, material, holes = []) {
  const g = new THREE.ExtrudeGeometry(shapeFrom(points, holes), { depth: thickness, bevelEnabled: false, curveSegments: 24 });
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

// Contorno en el plano (z, y) extruido hacia -x desde x = 0.
export function extrudeZY(points, thickness, material, holes = []) {
  const g = new THREE.ExtrudeGeometry(shapeFrom(points, holes), { depth: thickness, bevelEnabled: false, curveSegments: 24 });
  g.rotateY(-Math.PI / 2);
  const m = new THREE.Mesh(g, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export function roundedRect(z0, y0, z1, y1, r) {
  const pts = [];
  const corner = (cz, cy, a0) => {
    for (let i = 0; i <= 8; i++) {
      const a = ((a0 + (90 * i) / 8) * Math.PI) / 180;
      pts.push([cz + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  corner(z1 - r, y0 + r, -90);
  corner(z1 - r, y1 - r, 0);
  corner(z0 + r, y1 - r, 90);
  corner(z0 + r, y0 + r, 180);
  return pts;
}

export function group(...children) {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

export function at(obj, x, y, z) {
  obj.position.set(x, y, z);
  return obj;
}
