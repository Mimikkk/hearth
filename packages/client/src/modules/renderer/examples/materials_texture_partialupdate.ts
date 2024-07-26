import {
  Clock,
  Color,
  from,
  DataTexture,
  Mesh,
  MeshBasicMaterial,
  MinificationTextureFilter,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vec2,
} from '@modules/renderer/engine/engine.js';
import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Random } from '@modules/renderer/engine/math/random.js';
import { ColorMap } from '@modules/renderer/engine/math/Color.js';

let last = 0;

const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
camera.position.z = 2;

const scene = new Scene();
const clock = new Clock();

const diffuseMap = await TextureLoader.loadAsync('resources/textures/carbon/Carbon.png');
diffuseMap.colorSpace = from.SRGB;
diffuseMap.minFilter = MinificationTextureFilter.Linear;
diffuseMap.generateMipmaps = false;

const mesh = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial({ map: diffuseMap }));
scene.add(mesh);

const renderer = await Renderer.create({
  async animate() {
    clock.tick();

    await renderer.render(scene, camera);

    const { total } = clock;
    if (total - last <= 0.5) return;
    randomizePosition(position);
    regenerateDataTexture(texture);
    renderer.patchTextureAt(diffuseMap, texture, position);
  },
});

useWindowResizer(renderer, camera);

const position = Vec2.new();

function randomizePosition(into: Vec2): void {
  into.set(Random.integer(0, 15), Random.integer(0, 15)).scale(32);
}

const color = Color.new();
const texture = new DataTexture(new Uint8Array(32 * 32 * 4), 32, 32);

function regenerateDataTexture(into: DataTexture): void {
  const { data } = into.image;
  Random.color(ColorMap.white, ColorMap.black, color).scale(255);

  for (let offset = 0; offset < data.length; offset += 4) {
    color.intoArray(data, offset);
  }

  into.needsUpdate = true;
}
