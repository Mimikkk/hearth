import { WindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import {
  BoxGeometry,
  DirectionalLight,
  Geometry,
  Hearth,
  Mesh,
  MeshPhongMaterial,
  OrbitControls,
  PerspectiveCamera,
  Scene,
  VideoTexture,
} from '@mimi/hearth';

const createLight = () => {
  const light = new DirectionalLight(0xffffff, 7);
  light.position.set(0.5, 1, 1).normalize();
  return light;
};
const createCamera = () => {
  const camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 500;
  return camera;
};
const createVideoTexture = () => {
  const video = document.getElementById('video');
  video.play();
  video.muted = true;

  return new VideoTexture({ video });
};
const createBoxes = (texture: VideoTexture) => {
  const materials = [];
  const meshes = [];

  const xgrid = 20;
  const ygrid = 10;
  const ux = 1 / xgrid;
  const uy = 1 / ygrid;
  const xsize = 480 / xgrid;
  const ysize = 204 / ygrid;

  let index = 0;
  for (let i = 0; i < xgrid; i++) {
    for (let j = 0; j < ygrid; j++) {
      const geometry = new BoxGeometry(xsize, ysize, xsize);
      updateUV(geometry, ux, uy, i, j);

      const material = new MeshPhongMaterial({ color: 0xffffff, map: texture });
      material.hue = i / xgrid;
      material.saturation = 1 - j / ygrid;
      material.color.setHSL(material.hue, material.saturation, 0.5);

      const mesh = new Mesh(geometry, material);
      mesh.position.x = (i - xgrid / 2) * xsize;
      mesh.position.y = (j - ygrid / 2) * ysize;
      mesh.position.z = 0;
      mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;

      mesh.dx = 0.001 * (0.5 - Math.random());
      mesh.dy = 0.001 * (0.5 - Math.random());

      materials[index] = material;
      meshes[index] = mesh;
      ++index;
    }
  }
  return [meshes, materials] as const;
};

const texture = createVideoTexture();
const [meshes, materials] = createBoxes(texture);

const camera = createCamera();
const light = createLight();
const scene = Scene.of(light, ...meshes);

const hearth = await Hearth.as({
  async animate(_, frame, clock) {
    for (let material of materials) {
      const hue = ((360 * (material.hue + clock.total)) % 360) / 360;
      material.color.setHSL(hue, material.saturation, 0.5);
    }

    if (frame % 1000 > 200) {
      for (const mesh of meshes) {
        mesh.rotateX(10 * mesh.dx);
        mesh.rotateY(10 * mesh.dy);
        mesh.position.x -= 150 * mesh.dx;
        mesh.position.y += 150 * mesh.dy;
        mesh.position.z += 300 * mesh.dx;
      }
    }
    if (frame % 1000 === 0) {
      for (const mesh of meshes) {
        mesh.dx *= -1;
        mesh.dy *= -1;
      }
    }

    await hearth.render(scene, camera);
  },
});

OrbitControls.attach(hearth, camera);
WindowResizer.attach(hearth, camera);

function updateUV(geometry: Geometry, unitx: number, unity: number, offsetx: number, offsety: number): void {
  const uvs = geometry.attributes.uv.array;

  for (let i = 0; i < uvs.length; i += 2) {
    uvs[i] = (uvs[i] + offsetx) * unitx;
    uvs[i + 1] = (uvs[i + 1] + offsety) * unity;
  }
}
