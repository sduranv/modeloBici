import * as THREE from 'three';

// Cada objeto recibe su propio material (clonado) para poder animar opacidad y resaltado por pieza.
const base = {
  frame: { color: 0x4b5057, metalness: 0.45, roughness: 0.45 },
  plastic: { color: 0x17181a, metalness: 0.1, roughness: 0.55 },
  foam: { color: 0x202124, metalness: 0, roughness: 0.95 },
  orange: { color: 0xf07c1e, metalness: 0.1, roughness: 0.5 },
  chrome: { color: 0xc9ccd1, metalness: 0.9, roughness: 0.25 },
  seat: { color: 0x121212, metalness: 0.05, roughness: 0.7 },
  lcd: { color: 0x9fb39a, metalness: 0, roughness: 0.4, emissive: 0x1b2418 },
  silver: { color: 0xb8bcc2, metalness: 0.5, roughness: 0.4 },
  melamine: { color: 0xe9e3d6, metalness: 0, roughness: 0.75 },
  edge: { color: 0xd8d0bf, metalness: 0, roughness: 0.8 },
  steel: { color: 0x9aa0a6, metalness: 0.85, roughness: 0.3 },
  zinc: { color: 0xc0c6cc, metalness: 0.8, roughness: 0.35 },
  pvc: { color: 0xf2f2f2, metalness: 0, roughness: 0.6 },
  rubber: { color: 0x0b0b0b, metalness: 0, roughness: 0.95 },
  mat: { color: 0x2f3236, metalness: 0, roughness: 1 },
  laptop: { color: 0x5d6168, metalness: 0.6, roughness: 0.35 },
  screen: { color: 0x0e1726, metalness: 0.2, roughness: 0.2, emissive: 0x0b1a33 },
  kb: { color: 0x26282c, metalness: 0.2, roughness: 0.6 },
};

export function mat(kind, extra = {}) {
  return new THREE.MeshStandardMaterial({ ...base[kind], ...extra });
}

export function ghost(color, opacity = 0.35) {
  return new THREE.MeshStandardMaterial({ color, transparent: true, opacity, depthWrite: false, emissive: color, emissiveIntensity: 0.4 });
}
