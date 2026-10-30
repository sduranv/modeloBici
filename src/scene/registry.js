// Registro de objetos animables / seleccionables. El motor de animación y la UI
// sólo hablan con objetos a través de su id.
const objects = new Map();

export function reg(id, obj, info) {
  obj.name = id;
  obj.userData.id = id;
  if (info) obj.userData.info = { id, ...info };
  obj.traverse((o) => {
    if (!o.isMesh && !o.isLine && !o.isLineSegments) return;
    if (Array.isArray(o.material)) o.material = o.material.map((m) => m.clone());
    else o.material = o.material.clone();
    const m0 = Array.isArray(o.material) ? o.material[0] : o.material;
    o.userData.baseOpacity = m0.opacity;
    if (info && o.isMesh) {
      o.userData.pickId = id;
      o.userData.baseEmissive = m0.emissive ? m0.emissive.getHex() : 0;
    }
  });
  obj.userData.base = {
    pos: obj.position.toArray(),
    rot: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
    scale: obj.scale.toArray(),
    opacity: obj.userData.baseOpacityAll ?? 1,
  };
  obj.userData.opacity = obj.userData.base.opacity;
  obj.userData.userHidden = false;
  objects.set(id, obj);
  return obj;
}

export const get = (id) => objects.get(id);
export const all = () => objects;

export function setOpacity(obj, a) {
  obj.userData.opacity = a;
  if (obj.isCSS2DObject) {
    obj.element.style.opacity = a;
    return;
  }
  obj.traverse((o) => {
    if (o.isCSS2DObject) { o.element.style.opacity = a; return; }
    if (!o.isMesh && !o.isLine && !o.isLineSegments) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      const b = o.userData.baseOpacity ?? 1;
      m.opacity = b * a;
      m.transparent = m.opacity < 0.999 || o.userData.alwaysTransparent;
      m.depthWrite = !m.transparent || a > 0.95;
    }
  });
}

// Visibilidad final = visible por animación y no oculto por el usuario.
export function syncVisibility() {
  for (const obj of objects.values()) {
    obj.visible = obj.userData.opacity > 0.01 && !obj.userData.userHidden;
  }
}
