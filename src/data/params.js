// Única fuente de medidas del proyecto (mm, kg, grados).
// src: 'C' confirmado por el usuario · 'E' estimado desde fotos/video · 'S' supuesto o decisión de diseño.
// Todo lo demás (piezas 3D, planos, lista de cortes, verificaciones) se deriva de aquí en model.js.

export const PARAMS = {
  // --- Bicicleta ---
  barY:            { v: 900, src: 'C', group: 'Bicicleta', label: 'Altura del manubrio (centro del tubo)', note: 'Indicada por el usuario: coincide con la altura máxima de la rodilla.' },
  kneeMaxY:        { v: 900, src: 'C', group: 'Bicicleta', label: 'Altura máxima de la rodilla al pedalear' },
  barD:            { v: 32,  src: 'E', group: 'Bicicleta', label: 'Diámetro del manubrio junto al mástil', note: 'Medir: perímetro con hilo ÷ 3,14. Define la ranura de las cartelas.' },
  barWidth:        { v: 580, src: 'E', group: 'Bicicleta', label: 'Ancho total del manubrio' },
  gripLen:         { v: 200, src: 'E', group: 'Bicicleta', label: 'Largo de cada puño de espuma' },
  gripD:           { v: 40,  src: 'E', group: 'Bicicleta', label: 'Diámetro de los puños de espuma' },
  mastW:           { v: 50,  src: 'E', group: 'Bicicleta', label: 'Ancho del mástil', note: 'Define el ancho de la ranura de la bandeja y la separación de las cartelas.' },
  mastAngle:       { v: 62,  src: 'E', group: 'Bicicleta', label: 'Inclinación del mástil respecto del piso (°)' },
  mastTipAboveBar: { v: 170, src: 'E', group: 'Bicicleta', label: 'Altura de la punta del mástil sobre el manubrio (sin consola)' },
  knobBelowBar:    { v: 130, src: 'E', group: 'Bicicleta', label: 'Centro de la perilla de tensión bajo el manubrio' },
  knobD:           { v: 105, src: 'E', group: 'Bicicleta', label: 'Diámetro de la perilla de tensión' },
  seatZ:           { v: 800, src: 'E', group: 'Bicicleta', label: 'Distancia horizontal manubrio → centro del asiento' },
  seatY:           { v: 560, src: 'E', group: 'Bicicleta', label: 'Altura del cojín del asiento' },

  // --- Usuario (zona de rodillas) ---
  kneeZmin:        { v: 150, src: 'S', group: 'Usuario', label: 'Inicio de la zona de rodillas (desde el manubrio hacia el asiento)' },
  kneeZmax:        { v: 450, src: 'S', group: 'Usuario', label: 'Fin de la zona de rodillas' },
  kneeXin:         { v: 70,  src: 'S', group: 'Usuario', label: 'Borde interior de la rodilla respecto del eje' },
  kneeXout:        { v: 200, src: 'S', group: 'Usuario', label: 'Borde exterior de la rodilla respecto del eje' },

  // --- Equipos ---
  laptopW:         { v: 323, src: 'E', group: 'Equipos', label: 'Notebook 14": ancho', note: 'Valor típico de un 14". Si tu equipo es más grande, súbelo aquí.' },
  laptopD:         { v: 225, src: 'E', group: 'Equipos', label: 'Notebook 14": fondo' },
  laptopH:         { v: 18,  src: 'E', group: 'Equipos', label: 'Notebook 14": espesor' },
  laptopKg:        { v: 1.6, src: 'S', group: 'Equipos', label: 'Notebook: peso (kg)' },
  kbW:             { v: 500, src: 'C', group: 'Equipos', label: 'Teclado + mouse: largo total' },
  kbD:             { v: 160, src: 'C', group: 'Equipos', label: 'Teclado + mouse: ancho (fondo)' },

  // --- Diseño del soporte ---
  t:               { v: 18,  src: 'S', group: 'Soporte', label: 'Espesor de la melamina' },
  kneeClear:       { v: 45,  src: 'S', group: 'Soporte', label: 'Holgura mínima entre rodilla y bandeja' },
  jaw:             { v: 25,  src: 'S', group: 'Soporte', label: 'Material mínimo sobre la ranura de la cartela' },
  sideClear:       { v: 6,   src: 'S', group: 'Soporte', label: 'Holgura lateral cartela ↔ mástil' },
  slotClear:       { v: 8,   src: 'S', group: 'Soporte', label: 'Holgura lateral de la ranura de la bandeja' },
  wrap:            { v: 1.5, src: 'S', group: 'Soporte', label: 'Espesor de la goma que forra el manubrio' },
  trayW:           { v: 540, src: 'S', group: 'Soporte', label: 'Ancho de la bandeja', note: 'Teclado+mouse (500) + 20 mm por lado.' },
  trayFront:       { v: -45, src: 'S', group: 'Soporte', label: 'Borde delantero de la bandeja (negativo = delante del manubrio)' },
  deviceMargin:    { v: 15,  src: 'S', group: 'Soporte', label: 'Margen detrás del equipo' },
  stopGap:         { v: 20,  src: 'S', group: 'Soporte', label: 'Separación entre la punta del mástil y los topes', note: 'Súbelo si quieres abrir más la pantalla (la bandeja crece hacia atrás).' },
  stopH:         { v: 30,  src: 'S', group: 'Soporte', label: 'Altura de los topes delanteros' },
  cartRearTop:     { v: 200, src: 'S', group: 'Soporte', label: 'Largo superior de la cartela hacia el usuario' },
  rodD:            { v: 10,  src: 'S', group: 'Soporte', label: 'Diámetro del perno de cierre (M10)' },
  sleeveD:         { v: 20,  src: 'S', group: 'Soporte', label: 'Diámetro del tubo PVC que protege el mástil' },
  rodY:            { v: -45, src: 'S', group: 'Soporte', label: 'Altura del perno respecto del centro del manubrio' },
  leanKg:          { v: 10,  src: 'S', group: 'Soporte', label: 'Carga de diseño: antebrazos apoyados en el borde (kg)' },
};

const STORE_KEY = 'modeloBici.params';

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
}

export function saveOverrides(obj) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch { /* sin almacenamiento: se usan los valores por defecto */ }
}

export function overrides() { return loadOverrides(); }

// Valores efectivos: por defecto + medidas que el usuario cargó en el panel de parámetros.
export function values() {
  const o = loadOverrides();
  const v = {};
  for (const [k, p] of Object.entries(PARAMS)) v[k] = typeof o[k] === 'number' ? o[k] : p.v;
  return v;
}
