import * as Engine from '@modules/renderer/engine/engine.js';
import {
  attribute,
  checker,
  color,
  LineBasicNodeMaterial,
  MeshBasicNodeMaterial,
  mix,
  normalLocal,
  oscSine,
  PointsNodeMaterial,
  positionLocal,
  texture,
  timerLocal,
  uv,
  vec2,
} from '@modules/renderer/engine/nodes/nodes.js';

import { KTX2Loader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/KTX2Loader.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { TextureFormat } from '@modules/renderer/engine/engine.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Random } from '@modules/renderer/engine/math/random.js';

let camera, scene, hearth;

let box;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
  camera.position.z = 4;

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x222222);

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  const textureLoader = new TextureLoader();
  const uvTexture = await textureLoader.loadAsync('resources/textures/uv_grid_opengl.jpg');
  uvTexture.wrapS = Engine.Wrapping.Repeat;
  uvTexture.wrapT = Engine.Wrapping.Repeat;
  uvTexture.name = 'uv_grid';

  const textureDisplace = await textureLoader.loadAsync('resources/textures/transition/transition1.png');
  textureDisplace.wrapS = Engine.Wrapping.Repeat;
  textureDisplace.wrapT = Engine.Wrapping.Repeat;

  const ktxLoader = await new KTX2Loader().detectSupportAsync(hearth);

  const ktxTexture = await ktxLoader.loadAsync('resources/textures/compressed/sample_uastc_zstd.ktx2');

  const geometryBox = new Engine.BoxGeometry();
  const materialBox = new MeshBasicNodeMaterial();

  const timerScaleNode = timerLocal().mul(vec2(-0.5, 0.1));
  const animateUV = uv().add(timerScaleNode);

  const textureNode = texture(uvTexture, animateUV);

  materialBox.colorNode = mix(textureNode, checker(animateUV), 0.5);

  //geometryBox.setAttribute( 'uv1', geometryBox.getAttribute( 'uv' ) );
  //materialBox.colorNode = texture( uvTexture, uv( 1 ) );

  box = new Engine.Mesh(geometryBox, materialBox);
  box.position.set(0, 1, 0);
  scene.add(box);

  const geometrySphere = new Engine.SphereGeometry(0.5, 64, 64);
  const materialSphere = new MeshBasicNodeMaterial();

  const displaceY = texture(textureDisplace).x.mul(0.25);

  const displace = normalLocal.mul(displaceY);

  materialSphere.colorNode = displaceY;
  materialSphere.positionNode = positionLocal.add(displace);

  const sphere = new Engine.Mesh(geometrySphere, materialSphere);
  sphere.position.set(-2, -1, 0);
  scene.add(sphere);

  const geometryPlane = new Engine.PlaneGeometry();
  const materialPlane = new MeshBasicNodeMaterial();
  materialPlane.colorNode = texture(createDataTexture()).add(color(0x0000ff));
  materialPlane.transparent = true;

  const plane = new Engine.Mesh(geometryPlane, materialPlane);
  plane.position.set(0, -1, 0);
  scene.add(plane);

  const materialCompressed = new MeshBasicNodeMaterial();
  materialCompressed.colorNode = texture(ktxTexture);
  materialCompressed.emissiveNode = oscSine().mix(color(0x663300), color(0x0000ff));
  materialCompressed.alphaTestNode = oscSine();
  materialCompressed.transparent = true;

  const geo = flipY(new Engine.PlaneGeometry());
  const planeCompressed = new Engine.Mesh(geo, materialCompressed);
  planeCompressed.position.set(-2, 1, 0);
  scene.add(planeCompressed);

  const points = [];

  for (let i = 0; i < 1000; i++) {
    const point = Random.vec3().subScalar(0.5);
    points.push(point);
  }

  const geometryPoints = new Engine.Geometry().setFromPoints(points);
  const materialPoints = new PointsNodeMaterial();

  materialPoints.colorNode = positionLocal.mul(3);

  const pointCloud = new Engine.Points(geometryPoints, materialPoints);
  pointCloud.position.set(2, -1, 0);
  scene.add(pointCloud);

  const geometryLine = new Engine.Geometry().setFromPoints([
    new Engine.Vec3(-0.5, -0.5, 0),
    new Engine.Vec3(0.5, -0.5, 0),
    new Engine.Vec3(0.5, 0.5, 0),
    new Engine.Vec3(-0.5, 0.5, 0),
    new Engine.Vec3(-0.5, -0.5, 0),
  ]);

  geometryLine.setAttribute('color', geometryLine.attributes.position);

  const materialLine = new LineBasicNodeMaterial();
  materialLine.colorNode = attribute('color');

  const line = new Engine.Line(geometryLine, materialLine);
  line.position.set(2, 1, 0);
  scene.add(line);

  useWindowResizer(hearth, camera);
}

function animate() {
  if (box) {
    box.rotateX(0.01);
    box.rotateY(0.02);
  }

  hearth.render(scene, camera);
}

function createDataTexture() {
  const color = new Engine.Color(0xff0000);

  const width = 512;
  const height = 512;

  const size = width * height;
  const data = new Uint8Array(4 * size);

  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);

  for (let i = 0; i < size; i++) {
    const stride = i * 4;

    data[stride] = r;
    data[stride + 1] = g;
    data[stride + 2] = b;
    data[stride + 3] = 255;
  }

  const texture = new Engine.DataTexture(data, width, height, Engine.TextureFormat.RGBA);
  texture.needsUpdate = true;
  return texture;
}

function flipY(geometry) {
  const uv = geometry.attributes.uv;

  for (let i = 0; i < uv.count; i++) {
    uv.setY(i, 1 - uv.getY(i));
  }

  return geometry;
}
