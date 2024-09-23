import {
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Texture,
  TextureDataType,
  Vec2,
} from '@mimi/hearth';
import { instanceIndex, texture, textureStore, uniform, wgsl } from '@mimi/hearth';
import { Hearth } from '@mimi/hearth';
import { StorageTexture } from '@mimi/hearth';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

const createCamera = () => {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new OrthographicCamera(-aspect, aspect, 1, -1, 0, 2);
  camera.position.z = 1;

  return camera;
};
const createStorageTexture = () => {
  const width = 512;
  const height = 512;
  const texture = new StorageTexture({ width, height });
  texture.type = TextureDataType.HalfFloat;

  return texture;
};
const createPlane = (texture: Texture): Mesh => {
  const geometry = new PlaneGeometry({ width: 1, height: 1 });
  const material = new MeshBasicMaterial({ color: 0xffffff, map: texture });

  return new Mesh(geometry, material);
};

const width = 512;
const height = 512;
const pingTexture = createStorageTexture();
const pongTexture = createStorageTexture();
const seed = uniform(Vec2.new());

const common = wgsl(
  `
  fn random(n: vec2f) -> f32 {
    return fract(sin(dot(n, vec2f(12.9898, 4.1414))) * 43758.5453);
  }

  fn blur(image: texture_2d<f32>, uv: vec2i) -> vec4f {
    var color = vec4f( 0.0 );

    color += textureLoad(image, uv + vec2i( - 1, 1 ), 0);
    color += textureLoad(image, uv + vec2i( - 1, - 1 ), 0);
    color += textureLoad(image, uv + vec2i( 0, 0 ), 0);
    color += textureLoad(image, uv + vec2i( 1, - 1 ), 0);
    color += textureLoad(image, uv + vec2i( 1, 1 ), 0);

    return color / 5.0; 
  }

  fn getUV(posX: u32, posY: u32) -> vec2f {
    return vec2f(f32(posX)/ ${width}.0, f32(posY) / ${height}.0);
  }
  `,
);

const reset = wgsl(
  `
  fn reset(writeTex: texture_storage_2d<rgba16float, write>, index: u32, seed: vec2f) -> void {
    let posX = index % ${width};
    let posY = index / ${width};
    let indexUV = vec2u(posX, posY);
    let uv = getUV(posX, posY);

    let r = random(uv + seed * 100) - random(uv + seed * 300);
    let g = random(uv + seed * 200) - random(uv + seed * 300);
    let b = random(uv + seed * 200) - random(uv + seed * 100);

    textureStore(writeTex, indexUV, vec4(r, g, b, 1));
  }
  `,
  [common],
)({
  writeTex: textureStore(pingTexture),
  index: instanceIndex,
  seed,
}).compute(width * height);

const pingpong = wgsl(
  `
  fn pingpong(readTex: texture_2d<f32>, writeTex: texture_storage_2d<rgba16float, write>, index: u32) -> void {
    let posX = index % ${width};
    let posY = index / ${width};
    let indexUV = vec2i(i32(posX), i32(posY));
    let color = blur(readTex, indexUV).rgb;
    
    textureStore(writeTex, indexUV, vec4f(color * 1.05, 1));
  }
  `,
  [common],
);

const pong = pingpong({
  readTex: texture(pingTexture),
  writeTex: textureStore(pongTexture),
  index: instanceIndex,
}).compute(width * height);
const ping = pingpong({
  readTex: texture(pongTexture),
  writeTex: textureStore(pingTexture),
  index: instanceIndex,
}).compute(width * height);

const plane = createPlane(pongTexture);
const scene = Scene.of(plane);

let phase = true;
let lastUpdate = -1;
const camera = createCamera();
const hearth = await Hearth.as({
  async animate() {
    const time = performance.now();
    const seconds = Math.floor(time / 1000);

    if (phase && seconds !== lastUpdate) {
      seed.value.set(Math.random(), Math.random());
      await hearth.compute(reset);

      lastUpdate = seconds;
    }

    await hearth.compute(phase ? pong : ping);

    (plane.material as MeshBasicMaterial).map = phase ? pongTexture : pingTexture;

    phase = !phase;

    await hearth.render(scene, camera);
  },
});
useWindowResizer(hearth, camera, () => {
  hearth.setSize(window.innerWidth, window.innerHeight);

  const aspect = window.innerWidth / window.innerHeight;

  const frustumHeight = camera.top - camera.bottom;

  camera.left = (-frustumHeight * aspect) / 2;
  camera.right = (frustumHeight * aspect) / 2;

  camera.updateProjectionMatrix();
});

await hearth.compute(reset);
