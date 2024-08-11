import { Mesh, OrthographicCamera, PlaneGeometry, Scene, Texture } from '@modules/renderer/engine/engine.js';
import {
  f32,
  hsl,
  instanceIndex,
  MeshBasicNodeMaterial,
  oscSine,
  texture,
  textureStore,
  timerLocal,
  uvec2,
  vec4,
} from '@modules/renderer/engine/nodes/nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { StorageTexture } from '@modules/renderer/engine/entities/textures/StorageTexture.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

const createCamera = () => {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new OrthographicCamera(-aspect, aspect, 1, -1, 0, 2);
  camera.position.z = 1;

  return camera;
};
const createComputeTexture = () => {
  const width = 512;
  const height = 512;
  const texture = new StorageTexture({ width, height });

  const timer = timerLocal();
  const update = hsl(({ texture }) => {
    const posX = instanceIndex.remainder(width);
    const posY = instanceIndex.div(width);
    const indexUV = uvec2(posX, posY);

    const x = f32(posX).div(50.0);
    const y = f32(posY).div(50.0);

    const v1 = oscSine(timer);
    const v2 = oscSine(timer).add(x.mul(0.1));
    const v3 = x.add(y).sin();
    const v4 = x.mul(x).add(y.mul(y)).sqrt().add(5.0).sin();
    const v = v1.add(v2, v3, v4);

    const r = v.sin();
    const g = v.add(Math.PI).sin();
    const b = v.add(Math.PI).sub(0.5).sin();

    textureStore(texture, indexUV, vec4(r, g, b, 1));
  })({ texture }).compute(width * height);

  return [texture, update] as const;
};
const createTexturedPlane = (storageTexture: Texture) => {
  const material = new MeshBasicNodeMaterial({ color: 0x00ff00 });
  material.colorNode = texture(storageTexture);

  return new Mesh(new PlaneGeometry(1, 1), material);
};

const [storageTexture, updateTexture] = createComputeTexture();
const plane = createTexturedPlane(storageTexture);
const scene = Scene.of(plane);
const camera = createCamera();

const hearth = await Hearth.as({
  async animate() {
    await hearth.compute(updateTexture);
    await hearth.render(scene, camera);
  },
});
await hearth.compute(updateTexture);

useWindowResizer(hearth, camera, async () => {
  hearth.setSize(window.innerWidth, window.innerHeight);
  const aspect = window.innerWidth / window.innerHeight;
  const frustumHeight = camera.top - camera.bottom;

  camera.left = (-frustumHeight * aspect) / 2;
  camera.right = (frustumHeight * aspect) / 2;

  camera.updateProjectionMatrix();
  await render();
});

async function render() {
  await hearth.render(scene, camera);
}

await render();
