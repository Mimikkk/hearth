import * as Engine from '@modules/renderer/engine/engine.js';
import { color, rangeFog, SpriteNodeMaterial, texture, extra, uv } from '@modules/renderer/engine/nodes/nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;

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
  material.rotationNode = extra('rotation', 'f32');
  material.transparent = true;

  for (let a = 0; a < amount; a++) {
    const x = Math.random() - 0.5;
    const y = Math.random() - 0.5;
    const z = Math.random() - 0.5;

    const sprite = new Engine.Sprite(material);

    sprite.position.set(x, y, z);
    sprite.position.normalize();
    sprite.position.scale(radius);

    sprite.extra.rotation = 0;

    group.add(sprite);
  }

  scene.add(group);

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = render;
  document.body.appendChild(hearth.parameters.canvas);

  useWindowResizer(hearth, camera);
  render();
}

function render() {
  const time = Date.now() / 1000;

  for (let i = 0, l = group.children.length; i < l; i++) {
    const sprite = group.children[i];
    const scale = Math.sin(time + sprite.position.x * 0.01) * 0.3 + 1.0;

    sprite.extra.rotation += 0.1 * (i / l);
    sprite.scale.set(scale * imageWidth, scale * imageHeight, 1.0);
  }

  group.setRotationX(time * 0.5);
  group.setRotationY(time * 0.75);
  group.setRotationZ(time * 1.0);

  hearth.render(scene, camera);
}
