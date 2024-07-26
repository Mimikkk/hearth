import * as Engine from '@modules/renderer/engine/engine.js';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/objects/controls/OrbitControls.js';
import { HDRCubeTextureLoader } from '@modules/renderer/engine/loaders/textures/HDRCubeTextureLoader/HDRCubeTextureLoader.js';

import { FlakesTexture } from '@modules/renderer/engine/objects/textures/FlakesTexture.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let container;

let camera, scene, renderer;

let particleLight;
let group;

init();

async function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.25, 50);
  camera.position.z = 10;

  scene = new Engine.Scene();

  group = new Engine.Group();
  scene.add(group);

  new HDRCubeTextureLoader()
    .loadAsync([
      'resources/textures/cube/pisaHDR/px.hdr',
      'resources/textures/cube/pisaHDR/nx.hdr',
      'resources/textures/cube/pisaHDR/py.hdr',
      'resources/textures/cube/pisaHDR/ny.hdr',
      'resources/textures/cube/pisaHDR/pz.hdr',
      'resources/textures/cube/pisaHDR/nz.hdr',
    ])
    .then(async texture => {
      const geometry = new Engine.SphereGeometry(0.8, 64, 32);

      const textureLoader = new TextureLoader();

      const diffuse = await textureLoader.loadAsync('resources/textures/carbon/Carbon.png');
      diffuse.colorSpace = Engine.from.SRGB;
      diffuse.wrapS = Engine.Wrapping.Repeat;
      diffuse.wrapT = Engine.Wrapping.Repeat;
      diffuse.repeat.x = 10;
      diffuse.repeat.y = 10;

      const normalMap = await textureLoader.loadAsync('resources/textures/carbon/Carbon_Normal.png');
      normalMap.wrapS = Engine.Wrapping.Repeat;
      normalMap.wrapT = Engine.Wrapping.Repeat;
      normalMap.repeat.x = 10;
      normalMap.repeat.y = 10;

      const normalMap2 = await textureLoader.loadAsync('resources/textures/water/Water_1_M_Normal.jpg');

      const normalMap3 = new Engine.CanvasTexture(new FlakesTexture());
      normalMap3.wrapS = Engine.Wrapping.Repeat;
      normalMap3.wrapT = Engine.Wrapping.Repeat;
      normalMap3.repeat.x = 10;
      normalMap3.repeat.y = 6;
      normalMap3.anisotropy = 16;

      const normalMap4 = await textureLoader.loadAsync('resources/textures/golfball.jpg');

      const clearcoatNormalMap = await textureLoader.loadAsync(
        'resources/textures/pbr/Scratched_gold/Scratched_gold_01_1K_Normal.png',
      );

      // car paint

      let material = new Engine.MeshPhysicalMaterial({
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        metalness: 0.9,
        roughness: 0.5,
        color: 0x0000ff,
        normalMap: normalMap3,
        normalScale: new Engine.Vec2(0.15, 0.15),
      });
      let mesh = new Engine.Mesh(geometry, material);
      mesh.position.x = -1;
      mesh.position.y = 1;
      group.add(mesh);

      // fibers

      material = new Engine.MeshPhysicalMaterial({
        roughness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        map: diffuse,
        normalMap: normalMap,
      });
      mesh = new Engine.Mesh(geometry, material);
      mesh.position.x = 1;
      mesh.position.y = 1;
      group.add(mesh);

      // golf

      material = new Engine.MeshPhysicalMaterial({
        metalness: 0.0,
        roughness: 0.1,
        clearcoat: 1.0,
        normalMap: normalMap4,
        clearcoatNormalMap: clearcoatNormalMap,

        // y scale is negated to compensate for normal map handedness.
        clearcoatNormalScale: new Engine.Vec2(2.0, -2.0),
      });
      mesh = new Engine.Mesh(geometry, material);
      mesh.position.x = -1;
      mesh.position.y = -1;
      group.add(mesh);

      // clearcoat + normalmap

      material = new Engine.MeshPhysicalMaterial({
        clearcoat: 1.0,
        metalness: 1.0,
        color: 0xff0000,
        normalMap: normalMap2,
        normalScale: new Engine.Vec2(0.15, 0.15),
        clearcoatNormalMap: clearcoatNormalMap,

        // y scale is negated to compensate for normal map handedness.
        clearcoatNormalScale: new Engine.Vec2(2.0, -2.0),
      });
      mesh = new Engine.Mesh(geometry, material);
      mesh.position.x = 1;
      mesh.position.y = -1;
      group.add(mesh);

      //

      scene.background = texture;
      scene.environment = texture;
    });

  // LIGHTS

  particleLight = new Engine.Mesh(
    new Engine.SphereGeometry(0.05, 8, 8),
    new Engine.MeshBasicMaterial({ color: 0xffffff }),
  );
  scene.add(particleLight);

  particleLight.add(new Engine.PointLight(0xffffff, 30));

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = animate;
  container.appendChild(renderer.parameters.canvas);

  //

  renderer.parameters.toneMapping = Engine.ToneMapping.ACESFilmic;
  renderer.parameters.toneMappingExposure = 1.25;

  //

  // EVENTS

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 3;
  controls.maxDistance = 30;

  useWindowResizer(renderer, camera);
}

function animate() {
  render();
}

function render() {
  const timer = Date.now() * 0.00025;

  particleLight.position.x = Math.sin(timer * 7) * 3;
  particleLight.position.y = Math.cos(timer * 5) * 4;
  particleLight.position.z = Math.cos(timer * 3) * 3;

  for (let i = 0; i < group.children.length; i++) {
    const child = group.children[i];
    child.rotateY(0.005);
  }

  renderer.render(scene, camera);
}
