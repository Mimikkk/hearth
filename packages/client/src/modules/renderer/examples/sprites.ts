import * as Engine from '@modules/renderer/engine/engine.js';
import { color, rangeFog, SpriteNodeMaterial, texture, userData, uv } from '@modules/renderer/engine/nodes/Nodes.js';

import { WebGPURenderer } from '@modules/renderer/engine/renderers/webgpu/WebGPURenderer.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

let map;

let group;

let imageWidth = 1,
  imageHeight = 1;

init();

async function init() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera = new Engine.PerspectiveCamera(60, width / height, 1, 2100);
  camera.position.z = 1500;

  scene = new Engine.Scene();
  scene.fogNode = rangeFog(color(0x0000ff), 1500, 2100);

  // create sprites

  const amount = 200;
  const radius = 500;

  const textureLoader = new TextureLoader();

  map = await textureLoader.loadAsync('resources/textures/sprite.png');
  imageWidth = map.image.width;
  imageHeight = map.image.height;

  group = new Engine.Group();

  const textureNode = texture(map);

  const material = new SpriteNodeMaterial();
  material.colorNode = textureNode.mul(uv()).mul(2);
  material.opacityNode = textureNode.a;
  material.rotationNode = userData('rotation', 'float'); // get value of: sprite.userData.rotation
  material.transparent = true;

  for (let a = 0; a < amount; a++) {
    const x = Math.random() - 0.5;
    const y = Math.random() - 0.5;
    const z = Math.random() - 0.5;

    const sprite = new Engine.Sprite(material);

    sprite.position.set(x, y, z);
    sprite.position.normalize();
    sprite.position.multiplyScalar(radius);

    // individual rotation per sprite
    sprite.userData.rotation = 0;

    group.add(sprite);
  }

  scene.add(group);

  //

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(render);
  document.body.appendChild(renderer.domElement);

  useWindowResizer(renderer, camera);
  render();
}

function render() {
  const time = Date.now() / 1000;

  for (let i = 0, l = group.children.length; i < l; i++) {
    const sprite = group.children[i];
    const scale = Math.sin(time + sprite.position.x * 0.01) * 0.3 + 1.0;

    sprite.userData.rotation += 0.1 * (i / l);
    sprite.scale.set(scale * imageWidth, scale * imageHeight, 1.0);
  }

  group.rotation.x = time * 0.5;
  group.rotation.y = time * 0.75;
  group.rotation.z = time * 1.0;

  renderer.render(scene, camera);
}
