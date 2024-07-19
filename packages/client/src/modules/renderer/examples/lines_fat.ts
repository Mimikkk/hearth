import * as Engine from '@modules/renderer/engine/engine.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import Stats from 'stats-js';

import { GUI } from 'lil-gui';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import {
  color,
  Line2NodeMaterial,
  LineBasicNodeMaterial,
  LineDashedNodeMaterial,
} from '@modules/renderer/engine/nodes/Nodes.js';
import { Line2 } from '@modules/renderer/engine/lines/Line2.js';
import { LineGeometry } from '@modules/renderer/engine/lines/LineGeometry.js';
import * as GeometryUtils from '@modules/renderer/engine/utils/GeometryUtils.js';
import { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ColorSpace,
  Float32BufferAttribute,
  Line,
  PerspectiveCamera,
  Scene,
  Vec3,
} from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let insetWidth = window.innerHeight / 4;
let insetHeight = window.innerHeight / 4;

const stats = new Stats();
document.body.appendChild(stats.dom);

const scene = new Scene();

const camera = new PerspectiveCamera(120, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(-500000000, 1500000, 1000000);

const camera2 = new PerspectiveCamera(40, 1, 1, 100);
camera2.position.set(0, 0, 0);

const renderer = await Renderer.create({
  animate() {
    renderer.updateSize(window.innerWidth, window.innerHeight);
    stats.update();
    controls.update();

    renderer.parameters.autoClear = true;

    scene.backgroundNode = null;

    renderer.render(scene, camera);
    renderer.clear(false, true, true); // important!

    renderer.scissor.set(200, 200, insetWidth, insetHeight);
    renderer.viewport.set(200, 200, insetWidth, insetHeight);

    // camera2.position.from(camera.position);
    // camera.quaternion.from(camera2.quaternion);

    renderer.parameters.autoClear = false;

    scene.backgroundNode = backgroundNode;
    renderer.render(scene, camera2);
  },
});
renderer._clearColor.a = 0;

const controls = new OrbitControls(camera, renderer.parameters.canvas);
controls.enableDamping = true;
controls.minDistance = 10;
controls.maxDistance = 500;

const backgroundNode = color(0x222222);

const positions: number[] = [];
const colors: number[] = [];

const points = GeometryUtils.hilbert3D(new Vec3(0, 0, 0), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7);

const spline = new CatmullRomCurve3(points);
const divisions = Math.round(12 * points.length);
const point = new Vec3();
const lineColor = new Color();

for (let i = 0, l = divisions; i < l; i++) {
  const t = i / l;

  spline.getPoint(t, point);
  positions.push(point.x, point.y, point.z);

  lineColor.setHSL(t, 1.0, 0.5, ColorSpace.SRGB);
  colors.push(lineColor.r, lineColor.g, lineColor.b);
}

const geometry = new LineGeometry();
geometry.setPositions(positions);
geometry.setColors(colors);
geometry.instanceCount = positions.length / 3 - 1;

const matLine = new Line2NodeMaterial({
  color: 0xffffff,
  linewidth: 5, // in world units with size attenuation, pixels otherwise
  vertexColors: true,
  dashed: false,
  alphaToCoverage: true,
});

geometry.computeLineDistances();
const line = new Line2(geometry, matLine);
line.scale.set(1, 1, 1);
scene.add(line);

const geo = new BufferGeometry();
geo.attributes.position = new Float32BufferAttribute(positions, 3);
geo.attributes.color = new Float32BufferAttribute(colors, 3);

const matLineBasic = new LineBasicNodeMaterial({ vertexColors: true });
const matLineDashed = new LineDashedNodeMaterial({ vertexColors: true, scale: 2, dashSize: 1, gapSize: 1 });

const line1 = new Line(geo, matLineBasic);
line1.computeLineDistances();
line1.visible = false;
scene.add(line1);

//

useWindowResizer(renderer, camera, () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  insetWidth = window.innerHeight / 4; // square
  insetHeight = window.innerHeight / 4;

  camera2.aspect = insetWidth / insetHeight;
  camera2.updateProjectionMatrix();
});

initGui();

function initGui() {
  const gui = new GUI();

  const param = {
    'line type': 0,
    'world units': false,
    width: 5,
    alphaToCoverage: true,
    dashed: false,
    'dash offset': 0,
    'dash scale': 1,
    'dash / gap': 1,
  };

  gui.add(param, 'line type', { LineGeometry: 0, '"line-strip"': 1 }).onChange(function (val) {
    switch (val) {
      case 0:
        line.visible = true;

        line1.visible = false;

        break;

      case 1:
        line.visible = false;

        line1.visible = true;

        break;
    }
  });

  gui.add(param, 'world units').onChange(function (val) {
    matLine.worldUnits = val;
    matLine.needsUpdate = true;
  });

  gui.add(param, 'width', 1, 10).onChange(function (val) {
    matLine.linewidth = val;
  });

  gui.add(param, 'alphaToCoverage').onChange(function (val) {
    matLine.alphaToCoverage = val;
  });

  gui.add(param, 'dashed').onChange(function (val) {
    matLine.dashed = val;
    line1.material = val ? matLineDashed : matLineBasic;
  });

  gui.add(param, 'dash scale', 0.5, 2, 0.1).onChange(function (val) {
    matLine.scale = val;
    matLineDashed.scale = val;
  });

  gui.add(param, 'dash offset', 0, 5, 0.1).onChange(function (val) {
    matLine.dashOffset = val;
    matLineDashed.dashOffset = val;
  });

  gui.add(param, 'dash / gap', { '2 : 1': 0, '1 : 1': 1, '1 : 2': 2 }).onChange(function (val) {
    switch (val) {
      case 0:
        matLine.dashSize = 2;
        matLine.gapSize = 1;

        matLineDashed.dashSize = 2;
        matLineDashed.gapSize = 1;

        break;

      case 1:
        matLine.dashSize = 1;
        matLine.gapSize = 1;

        matLineDashed.dashSize = 1;
        matLineDashed.gapSize = 1;

        break;

      case 2:
        matLine.dashSize = 1;
        matLine.gapSize = 2;

        matLineDashed.dashSize = 1;
        matLineDashed.gapSize = 2;

        break;
    }
  });
}
