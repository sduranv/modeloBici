import { values } from './data/params.js';
import { buildModel } from './data/model.js';
import { createViewer } from './scene/viewer.js';
import { buildBike } from './scene/bike.js';
import { buildSupport } from './scene/support.js';
import { buildDevices } from './scene/devices.js';
import { buildOverlays } from './scene/overlays.js';
import { buildStages, buildTutorialExtras, HIDDEN_AT_START } from './tutorial/stages.js';
import { get } from './scene/registry.js';
import { initUI } from './ui/controls.js';
import { renderDocs } from './docs/plans.js';
import { applySourceOverrides } from './ui/params.js';

applySourceOverrides();
const model = buildModel(values());

const viewer = createViewer(document.getElementById('viewport'));
viewer.scene.add(buildBike(model));
const { supportG, world, poses } = buildSupport(model);
viewer.scene.add(supportG, ...world);
viewer.scene.add(...buildDevices(model));
viewer.scene.add(...buildOverlays(model));
viewer.scene.add(...buildTutorialExtras(model));
for (const id of HIDDEN_AT_START) get(id).userData.base.opacity = 0;

const stages = buildStages(model, poses);

const pages = { viewer: 'page-viewer', docs: 'page-docs' };
function showPage(name) {
  for (const [k, id] of Object.entries(pages)) document.getElementById(id).hidden = k !== name;
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.page === name));
}
document.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => showPage(b.dataset.page)));

renderDocs(document.getElementById('page-docs'), model);

initUI({
  viewer, model, stages,
  onShowPart: (id) => {
    showPage('docs');
    document.getElementById(`part-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  },
});

// Acceso para depuración desde la consola
window.__bici = { model, viewer, stages };
