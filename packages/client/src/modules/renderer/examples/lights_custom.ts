import * as Engine from '@modules/renderer/engine/engine.js';
import {
  color,
  lights,
  MeshStandardNodeMaterial,
  PointsNodeMaterial,
  toneMapping,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Random } from '@modules/renderer/engine/math/random.js';
import { LightModel } from '@modules/renderer/engine/nodes/functions/LightModel.js';

class CustomLightingModel extends LightModel {
  direct({ lightColor, reflectedLight }, stack) {
    reflectedLight.directDiffuse.addAssign(lightColor);
  }
}

let camera, scene, renderer;

let light1, light2, light3;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
  camera.position.z = 2;

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x222222);

  const sphereGeometry = new Engine.SphereGeometry(0.02, 16, 8);

  const addLight = (hexColor, intensity = 2, distance = 1) => {
    const material = new MeshStandardNodeMaterial();
    material.colorNode = color(hexColor);
    material.lightsNode = lights();

    const mesh = new Engine.Mesh(sphereGeometry, material);

    const light = new Engine.PointLight(hexColor, intensity, distance);
    light.add(mesh);

    scene.add(light);

    return light;
  };

  light1 = addLight(0xffaa00);
  light2 = addLight(0x0040ff);
  light3 = addLight(0x80ff80);

  //light nodes ( selective lights )

  const allLightsNode = lights([light1, light2, light3]);

  const points = [];

  for (let i = 0; i < 3000; i++) {
    const point = Random.vec3().subScalar(0.5).scale(2);
    points.push(point);
  }

  const geometryPoints = new Engine.Geometry().setFromPoints(points);
  const materialPoints = new PointsNodeMaterial();

  const lightingModel = new CustomLightingModel();
  const lightingModelContext = allLightsNode.context({ lightingModel });

  materialPoints.lightsNode = lightingModelContext;

  const pointCloud = new Engine.Points(geometryPoints, materialPoints);
  scene.add(pointCloud);

  renderer = await Hearth.as();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = animate;
  renderer.parameters.toneMappingNode = toneMapping(Engine.ToneMapping.Linear, 1);
  document.body.appendChild(renderer.parameters.canvas);

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 0;
  controls.maxDistance = 4;

  useWindowResizer(renderer, camera);
}

function animate() {
  const time = Date.now() * 0.0005;
  const scale = 0.5;

  light1.position.x = Math.sin(time * 0.7) * scale;
  light1.position.y = Math.cos(time * 0.5) * scale;
  light1.position.z = Math.cos(time * 0.3) * scale;

  light2.position.x = Math.cos(time * 0.3) * scale;
  light2.position.y = Math.sin(time * 0.5) * scale;
  light2.position.z = Math.sin(time * 0.7) * scale;

  light3.position.x = Math.sin(time * 0.7) * scale;
  light3.position.y = Math.cos(time * 0.3) * scale;
  light3.position.z = Math.sin(time * 0.5) * scale;

  renderer.render(scene, camera);
}
