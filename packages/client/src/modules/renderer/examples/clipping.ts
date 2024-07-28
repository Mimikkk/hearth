import * as Engine from '@modules/renderer/engine/engine.js';
import { MeshPhongNodeMaterial } from '@modules/renderer/engine/nodes/Nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { GUI } from 'lil-gui';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { Side } from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer, startTime, object;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.25, 16);

  camera.position.set(0, 1.3, 3);

  scene = new Engine.Scene();



  scene.add(new Engine.AmbientLight(0xcccccc));

  const spotLight = new Engine.SpotLight(0xffffff, 60);
  spotLight.angle = Math.PI / 5;
  spotLight.penumbra = 0.2;
  spotLight.position.set(2, 3, 3);
  spotLight.castShadow = true;
  spotLight.shadow.camera.near = 3;
  spotLight.shadow.camera.far = 10;
  spotLight.shadow.mapSize.width = 2048;
  spotLight.shadow.mapSize.height = 2048;
  spotLight.shadow.bias = -0.002;
  spotLight.shadow.radius = 4;
  scene.add(spotLight);

  const dirLight = new Engine.DirectionalLight(0x55505a, 3);
  dirLight.position.set(0, 3, 0);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 10;

  dirLight.shadow.camera.right = 1;
  dirLight.shadow.camera.left = -1;
  dirLight.shadow.camera.top = 1;
  dirLight.shadow.camera.bottom = -1;

  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);



  const localPlane = new Engine.Plane(new Engine.Vec3(0, -1, 0), 0.8);
  const localPlane2 = new Engine.Plane(new Engine.Vec3(0, 0, -1), 0.1);
  const globalPlane = new Engine.Plane(new Engine.Vec3(-1, 0, 0), 0.1);



  const material = new MeshPhongNodeMaterial({
    color: 0x80ee10,
    shininess: 0,
    side: Engine.Side.Double,


    clippingPlanes: [localPlane, localPlane2],
    clipShadows: true,
    alphaToCoverage: true,
    clipIntersection: true,
  });

  const geometry = new Engine.TorusKnotGeometry(0.4, 0.08, 95, 20);

  object = new Engine.Mesh(geometry, material);
  object.castShadow = true;
  scene.add(object);

  const ground = new Engine.Mesh(
    new Engine.PlaneGeometry(9, 9, 1, 1),
    new MeshPhongNodeMaterial({ color: 0xa0adaf, shininess: 150 }),
  );

  ground.setRotationX(-Math.PI / 2);
  ground.receiveShadow = true;
  scene.add(ground);





  renderer = await Hearth.as();

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = animate;
  document.body.appendChild(renderer.parameters.canvas);


  const globalPlanes = [globalPlane];
  const Empty = Object.freeze([]);

  renderer.parameters.clippingPlanes = Empty;
  renderer.parameters.localClippingEnabled = true;


  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.target.set(0, 1, 0);
  controls.update();



  const gui = new GUI(),
    props = {
      alphaToCoverage: true,
    },
    folderLocal = gui.addFolder('Local Clipping'),
    propsLocal = {
      get Enabled() {
        return renderer.localClippingEnabled;
      },
      set Enabled(v) {
        renderer.localClippingEnabled = v;
      },

      get Shadows() {
        return material.clipShadows;
      },
      set Shadows(v) {
        material.clipShadows = v;
      },

      get Intersection() {
        return material.clipIntersection;
      },

      set Intersection(v) {
        material.clipIntersection = v;
      },

      get Plane() {
        return localPlane.constant;
      },
      set Plane(v) {
        localPlane.constant = v;
      },
    },
    folderGlobal = gui.addFolder('Global Clipping'),
    propsGlobal = {
      get Enabled() {
        return renderer.clippingPlanes !== Empty;
      },
      set Enabled(v) {
        renderer.clippingPlanes = v ? globalPlanes : Empty;
      },

      get Plane() {
        return globalPlane.constant;
      },
      set Plane(v) {
        globalPlane.constant = v;
      },
    };

  gui.add(props, 'alphaToCoverage').onChange(function (value) {
    ground.material.alphaToCoverage = value;
    ground.material.needsUpdate = true;

    material.alphaToCoverage = value;
    material.needsUpdate = true;
  });

  folderLocal.add(propsLocal, 'Enabled');
  folderLocal.add(propsLocal, 'Shadows');
  folderLocal.add(propsLocal, 'Intersection');
  folderLocal.add(propsLocal, 'Plane', 0.3, 1.25);

  folderGlobal.add(propsGlobal, 'Enabled');
  folderGlobal.add(propsGlobal, 'Plane', -0.4, 3);



  useWindowResizer(renderer, camera);
  startTime = Date.now();
}

function animate(currentTime) {
  const time = (currentTime - startTime) / 1000;

  object.position.y = 0.8;
  object.setRotationX(time * 0.5);
  object.setRotationY(time * 0.2);
  object.scale.setScalar(Math.cos(time) * 0.125 + 0.875);

  renderer.render(scene, camera);
}
