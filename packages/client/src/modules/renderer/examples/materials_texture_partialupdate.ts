import {
  Color,
  ColorSpace,
  DataTexture,
  GPUFilterModeType,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vec2,
} from '@modules/renderer/engine/engine.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Random } from '@modules/renderer/engine/math/random.js';
import { ColorMap } from '@modules/renderer/engine/math/Color.js';

const createCamera = () => {
  const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
  camera.position.z = 2;
  return camera;
};

const loadCarbon = async () => {
  const diffuse = await TextureLoader.loadAsync('resources/textures/carbon/Carbon.png');
  diffuse.colorSpace = ColorSpace.SRGB;
  diffuse.minFilter = GPUFilterModeType.Linear;
  diffuse.useMipmap = false;

  return new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial({ map: diffuse }));
};

const carbon = await loadCarbon();
const scene = new Scene().add(carbon);

const camera = createCamera();
const hearth = await Hearth.as({
  async animate() {
    await hearth.render(scene, camera);

    randomizePosition(position);
    regenerateDataTexture(texture);
    hearth.patchTextureAt(carbon.material.map!, texture, position);
  },
});

useWindowResizer(hearth, camera);

const position = Vec2.new();
function randomizePosition(into: Vec2): void {
  into.set(Random.integer(0, 15), Random.integer(0, 15)).scale(32);
}

const color = Color.new();
const texture = new DataTexture({ data: new Uint8Array(32 * 32 * 4), width: 32, height: 32 });
function regenerateDataTexture(into: DataTexture): void {
  const { data } = into.image;
  Random.color(ColorMap.white, ColorMap.black, color).scale(255);

  for (let offset = 0; offset < data.length; offset += 4) {
    color.intoArray(data, offset);
  }

  into.useUpdate = true;
}
