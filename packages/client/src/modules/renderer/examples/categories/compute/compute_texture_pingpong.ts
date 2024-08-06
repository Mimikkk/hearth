import * as Engine from '@modules/renderer/engine/engine.js';
import { texture, textureStore, wgsl, instanceIndex, uniform } from '@modules/renderer/engine/nodes/Nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { StorageTexture } from '@modules/renderer/engine/entities/textures/StorageTexture.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;
let computeInitNode, computeToPing, computeToPong;
let pingTexture, pongTexture;
let material;
let phase = true;
let lastUpdate = -1;

const seed = uniform(new Engine.Vec2());

await init();
render();

async function init() {
  const aspect = window.innerWidth / window.innerHeight;
  camera = new Engine.OrthographicCamera(-aspect, aspect, 1, -1, 0, 2);
  camera.position.z = 1;

  scene = new Engine.Scene();

  const hdr = true;
  const width = 512,
    height = 512;

  pingTexture = new StorageTexture(width, height);
  pongTexture = new StorageTexture(width, height);

  if (hdr) {
    pingTexture.type = Engine.TextureDataType.HalfFloat;
    pongTexture.type = Engine.TextureDataType.HalfFloat;
  }

  const wgslFormat = hdr ? 'rgba16float' : 'rgba8unorm';

  const rand2 = wgsl(`
					fn rand2( n: vec2f ) -> f32 {

						return fract( sin( dot( n, vec2f( 12.9898, 4.1414 ) ) ) * 43758.5453 );

					}

					fn blur( image : texture_2d<f32>, uv : vec2i ) -> vec4f {

						var color = vec4f( 0.0 );

						color += textureLoad( image, uv + vec2i( - 1, 1 ), 0 );
						color += textureLoad( image, uv + vec2i( - 1, - 1 ), 0 );
						color += textureLoad( image, uv + vec2i( 0, 0 ), 0 );
						color += textureLoad( image, uv + vec2i( 1, - 1 ), 0 );
						color += textureLoad( image, uv + vec2i( 1, 1 ), 0 );

						return color / 5.0; 
					}

					fn getUV( posX: u32, posY: u32 ) -> vec2f {

						let uv = vec2f( f32( posX ) / ${width}.0, f32( posY ) / ${height}.0 );

						return uv;

					}
				`);

  const computeInitWGSL = wgsl(
    `
					fn computeInitWGSL( writeTex: texture_storage_2d<${wgslFormat}, write>, index: u32, seed: vec2f ) -> void {

						let posX = index % ${width};
						let posY = index / ${width};
						let indexUV = vec2u( posX, posY );
						let uv = getUV( posX, posY );

						let r = rand2( uv + seed * 100 ) - rand2( uv + seed * 300 );
						let g = rand2( uv + seed * 200 ) - rand2( uv + seed * 300 );
						let b = rand2( uv + seed * 200 ) - rand2( uv + seed * 100 );

						textureStore( writeTex, indexUV, vec4( r, g, b, 1 ) );

					}
				`,
    [rand2],
  );

  computeInitNode = computeInitWGSL({
    writeTex: textureStore(pingTexture),
    index: instanceIndex,
    seed,
  }).compute(width * height);

  const computePingPongWGSL = wgsl(
    `
					fn computePingPongWGSL( readTex: texture_2d<f32>, writeTex: texture_storage_2d<${wgslFormat}, write>, index: u32 ) -> void {

						let posX = index % ${width};
						let posY = index / ${width};
						let indexUV = vec2i( i32( posX ), i32( posY ) );

						let color = blur( readTex, indexUV ).rgb;

						textureStore( writeTex, indexUV, vec4f( color * 1.05, 1 ) );

					}
				`,
    [rand2],
  );

  computeToPong = computePingPongWGSL({
    readTex: texture(pingTexture),
    writeTex: textureStore(pongTexture),
    index: instanceIndex,
  }).compute(width * height);
  computeToPing = computePingPongWGSL({
    readTex: texture(pongTexture),
    writeTex: textureStore(pingTexture),
    index: instanceIndex,
  }).compute(width * height);

  material = new Engine.MeshBasicMaterial({ color: 0xffffff, map: pongTexture });

  const plane = new Engine.Mesh(new Engine.PlaneGeometry(1, 1), material);
  scene.add(plane);

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = render;
  document.body.appendChild(hearth.parameters.canvas);

  useWindowResizer(hearth, camera, () => {
    hearth.setSize(window.innerWidth, window.innerHeight);

    const aspect = window.innerWidth / window.innerHeight;

    const frustumHeight = camera.top - camera.bottom;

    camera.left = (-frustumHeight * aspect) / 2;
    camera.right = (frustumHeight * aspect) / 2;

    camera.updateProjectionMatrix();

    render();
  });

  hearth.compute(computeInitNode);
}

function render() {
  const time = performance.now();
  const seconds = Math.floor(time / 1000);

  if (phase && seconds !== lastUpdate) {
    seed.value.set(Math.random(), Math.random());

    hearth.compute(computeInitNode);

    lastUpdate = seconds;
  }

  hearth.compute(phase ? computeToPong : computeToPing);

  material.map = phase ? pongTexture : pingTexture;

  phase = !phase;

  hearth.render(scene, camera);
}
