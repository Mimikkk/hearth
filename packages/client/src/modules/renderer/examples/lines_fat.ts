import * as Engine from '@modules/renderer/engine/engine.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { GUI } from 'lil-gui';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import {
  color,
  Line2NodeMaterial,
  LineBasicNodeMaterial,
  LineDashedNodeMaterial,
} from '@modules/renderer/engine/nodes/nodes.js';
import { Line2 } from '@modules/renderer/engine/entities/lines/Line2.js';
import { LineGeometry } from '@modules/renderer/engine/entities/lines/LineGeometry.js';
import * as GeometryUtils from '@modules/renderer/engine/utils/GeometryUtils.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Attribute, Color } from '@modules/renderer/engine/engine.js';

let line, hearth, scene, camera, camera2, controls, backgroundNode;
let line1;
let matLine, matLineBasic, matLineDashed;
let gui;

let insetWidth;
let insetHeight;

init();

async function init() {
  const points = GeometryUtils.generateHilbert(new Engine.Vec3(0, 0, 0), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7);

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth._clearColor = Color.new(0x000000);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  scene = new Engine.Scene();

  camera = new Engine.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(-40, 0, 60);

  camera2 = new Engine.PerspectiveCamera(40, 1, 1, 1000);
  camera2.position.from(camera.position);

  controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.enableDamping = true;
  controls.minDistance = 10;
  controls.maxDistance = 500;

  backgroundNode = color(0x222222);

  const positions = [];
  const colors = [];

  const spline = new Engine.Curves.CatmullRomCurve3(points);
  const divisions = Math.round(12 * points.length);
  const point = new Engine.Vec3();
  const lineColor = new Engine.Color();

  for (let i = 0, l = divisions; i < l; i++) {
    const t = i / l;

    spline.getPoint(t, point);
    positions.push(point.x, point.y, point.z);

    lineColor.setHSL(t, 1.0, 0.5, Engine.ColorSpace.SRGB);
    colors.push(lineColor.r, lineColor.g, lineColor.b);
  }

  const geometry = new LineGeometry();
  geometry.setPositions(positions);
  geometry.setColors(colors);

  matLine = new Line2NodeMaterial({
    color: 0xffffff,
    linewidth: 5,
    vertexColors: true,
    dashed: false,
    alphaToCoverage: true,
  });

  line = new Line2(geometry, matLine);
  line.computeLineDistances();
  line.scale.set(1, 1, 1);
  scene.add(line);
  line.count = positions.length / 3 - 1;

  const geo = new Engine.Geometry();
  geo.setAttribute('position', new Attribute(new Float32Array(positions), 3));
  geo.setAttribute('color', new Attribute(new Float32Array(colors), 3));

  matLineBasic = new LineBasicNodeMaterial({ vertexColors: true });
  matLineDashed = new LineDashedNodeMaterial({ vertexColors: true, scale: 2, dashSize: 1, gapSize: 1 });

  line1 = new Engine.Line(geo, matLineBasic);
  line1.computeLineDistances();
  line1.visible = false;
  scene.add(line1);

  useWindowResizer(hearth, camera, () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    hearth.setSize(window.innerWidth, window.innerHeight);

    insetWidth = window.innerHeight / 4;
    insetHeight = window.innerHeight / 4;

    camera2.aspect = insetWidth / insetHeight;
    camera2.updateProjectionMatrix();
  });

  initGui();
}

function animate() {
  hearth._clearColor = Color.new(0x000000);

  hearth.viewport.set(0, 0, window.innerWidth, window.innerHeight);

  controls.update();

  hearth.parameters.autoClear = true;

  scene.backgroundNode = null;
  hearth.render(scene, camera);

  hearth.clear(false, true, false);

  hearth.useScissor = true;

  hearth.scissor.set(20, 20, insetWidth, insetHeight);
  hearth.viewport.set(20, 20, window.innerWidth, window.innerHeight);

  camera2.position.from(camera.position);
  camera2.quaternion.from(camera.quaternion);

  hearth.parameters.autoClear = false;

  scene.backgroundNode = backgroundNode;
  hearth.render(scene, camera2);

  hearth.useScissor = false;
}

function initGui() {
  gui = new GUI();

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
    matLine.useUpdate = true;
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
