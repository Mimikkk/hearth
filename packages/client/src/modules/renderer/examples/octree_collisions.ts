import Stats from 'stats-js';
import { Clock } from '@modules/renderer/engine/core/Clock.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Fog } from '@modules/renderer/engine/scenes/Fog.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { HemisphereLight } from '@modules/renderer/engine/lights/HemisphereLight.js';
import { DirectionalLight } from '@modules/renderer/engine/lights/DirectionalLight.js';
import { IcosahedronGeometry } from '@modules/renderer/engine/geometries/IcosahedronGeometry.js';
import { MeshLambertMaterial } from '@modules/renderer/engine/materials/MeshLambertMaterial.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { Sphere } from '@modules/renderer/engine/math/Sphere.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Octree } from '@modules/renderer/engine/math/Octree.js';
import { Capsule } from '@modules/renderer/engine/math/Capsule.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { OctreeHelper } from '@modules/renderer/engine/helpers/OctreeHelper.js';
import { ToneMapping } from '@modules/renderer/engine/constants.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { Euler } from '@modules/renderer/engine/math/Euler.js';
import { UI } from '@mimi/ui';

const clock = new Clock();
const scene = new Scene();
scene.background = new Color(0x88ccee);
scene.fog = new Fog(0x88ccee, 0, 50);

const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

const fillLight1 = new HemisphereLight(0x8dc1de, 0x00668d, 1.5);
fillLight1.position.set(2, 1, 1);
scene.add(fillLight1);

const directionalLight = new DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(-5, 25, -1);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.mapSize.x = 1024;
directionalLight.shadow.mapSize.y = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = -0.00006;
scene.add(directionalLight);

const container = document.getElementById('container') as HTMLDivElement;

const GRAVITY = 30;

const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.2;

const STEPS_PER_FRAME = 5;

const sphereGeometry = new IcosahedronGeometry(SPHERE_RADIUS, 5);
const sphereMaterial = new MeshLambertMaterial({ color: 0xdede8d });

const spheres: {
  mesh: Mesh;
  collider: Sphere;
  velocity: Vec3;
}[] = [];
let sphereIdx = 0;

for (let i = 0; i < NUM_SPHERES; i++) {
  const sphere = new Mesh(sphereGeometry, sphereMaterial);
  sphere.castShadow = true;
  sphere.receiveShadow = true;

  scene.add(sphere);

  spheres.push({
    mesh: sphere,
    collider: new Sphere(new Vec3(0, -100, 0), SPHERE_RADIUS),
    velocity: new Vec3(),
  });
}

const worldOctree = new Octree();

const playerCollider = new Capsule(new Vec3(0, 0.35, 0), new Vec3(0, 1, 0), 0.35);

const playerVelocity = new Vec3();
const playerDirection = new Vec3();

let playerOnFloor = false;
let mouseTime = 0;

const keyStates: Record<string, boolean> = {};

const vector1 = new Vec3();
const vec2 = new Vec3();
const vec3 = new Vec3();

const renderer = await Renderer.create({ antialias: true });
renderer._animation.animationLoop = animate;
renderer.parameters.toneMapping = ToneMapping.ACESFilmic;
container.appendChild(renderer.parameters.canvas);

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild(stats.domElement);

document.addEventListener('keydown', event => {
  keyStates[event.code] = true;
});

document.addEventListener('keyup', event => {
  keyStates[event.code] = false;
});

container.addEventListener('mousedown', () => {
  document.body.requestPointerLock();

  mouseTime = performance.now();
});

document.addEventListener('mouseup', () => {
  if (document.pointerLockElement !== null) throwBall();
});

const rotation = new Euler(0, 0, 0, 'YXZ');
document.body.addEventListener('mousemove', event => {
  if (document.pointerLockElement === document.body) {
    rotation.y -= event.movementX / 500;
    rotation.x -= event.movementY / 500;

    camera.setRotationFromEuler(rotation);
  }
});

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function throwBall() {
  const sphere = spheres[sphereIdx];

  camera.getWorldDirection(playerDirection);

  sphere.collider.center.from(playerCollider.end).addScaled(playerDirection, playerCollider.radius * 1.5);

  // throw the ball with more force if we hold the button longer, and if we move forward

  const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));

  sphere.velocity.from(playerDirection).scale(impulse);
  sphere.velocity.addScaled(playerVelocity, 2);

  sphereIdx = (sphereIdx + 1) % spheres.length;
}

function playerCollisions() {
  const result = worldOctree.capsuleIntersect(playerCollider);

  playerOnFloor = false;

  if (result) {
    playerOnFloor = result.normal.y > 0;

    if (!playerOnFloor) {
      playerVelocity.addScaled(result.normal, -result.normal.dot(playerVelocity));
    }

    if (result.depth >= 1e-10) {
      result.normal.scale(result.depth);
      playerCollider.translate(result.normal);
    }
  }
}

function updatePlayer(deltaTime: number) {
  let damping = Math.exp(-4 * deltaTime) - 1;

  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * deltaTime;

    // small air resistance
    damping *= 0.1;
  }

  playerVelocity.addScaled(playerVelocity, damping);

  const deltaPosition = playerVelocity.clone().scale(deltaTime);
  playerCollider.translate(deltaPosition);

  playerCollisions();

  camera.position.from(playerCollider.end);
}

function playerSphereCollision(sphere: { collider: Sphere; velocity: Vec3 }) {
  const center = vector1.from(playerCollider.start).add(playerCollider.end).scale(0.5);

  const sphere_center = sphere.collider.center;

  const r = playerCollider.radius + sphere.collider.radius;
  const r2 = r * r;

  // approximation: player = 3 spheres

  for (const point of [playerCollider.start, playerCollider.end, center]) {
    const d2 = point.distanceSqTo(sphere_center);

    if (d2 < r2) {
      const normal = vector1.from(point).sub(sphere_center).normalize();
      const v1 = vec2.from(normal).scale(normal.dot(playerVelocity));
      const v2 = vec3.from(normal).scale(normal.dot(sphere.velocity));

      playerVelocity.add(v2).sub(v1);
      sphere.velocity.add(v1).sub(v2);

      const d = (r - Math.sqrt(d2)) / 2;
      sphere_center.addScaled(normal, -d);
    }
  }
}

function spheresCollisions() {
  for (let i = 0, length = spheres.length; i < length; i++) {
    const s1 = spheres[i];

    for (let j = i + 1; j < length; j++) {
      const s2 = spheres[j];

      const d2 = s1.collider.center.distanceSqTo(s2.collider.center);
      const r = s1.collider.radius + s2.collider.radius;
      const r2 = r * r;

      if (d2 < r2) {
        const normal = vector1.from(s1.collider.center).sub(s2.collider.center).normalize();
        const v1 = vec2.from(normal).scale(normal.dot(s1.velocity));
        const v2 = vec3.from(normal).scale(normal.dot(s2.velocity));

        s1.velocity.add(v2).sub(v1);
        s2.velocity.add(v1).sub(v2);

        const d = (r - Math.sqrt(d2)) / 2;

        s1.collider.center.addScaled(normal, d);
        s2.collider.center.addScaled(normal, -d);
      }
    }
  }
}

function updateSpheres(deltaTime: number) {
  spheres.forEach(sphere => {
    sphere.collider.center.addScaled(sphere.velocity, deltaTime);

    const result = worldOctree.sphereIntersect(sphere.collider);

    if (result) {
      sphere.velocity.addScaled(result.normal, -result.normal.dot(sphere.velocity) * 1.5);

      result.normal.scale(result.depth);
      sphere.collider.center.add(result.normal);
    } else {
      sphere.velocity.y -= GRAVITY * deltaTime;
    }

    const damping = Math.exp(-1.5 * deltaTime) - 1;
    sphere.velocity.addScaled(sphere.velocity, damping);

    playerSphereCollision(sphere);
  });

  spheresCollisions();

  for (const sphere of spheres) {
    sphere.mesh.position.from(sphere.collider.center);
  }
}

function getForwardVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;
  playerDirection.normalize();

  return playerDirection;
}

function getSideVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;
  playerDirection.normalize();
  playerDirection.cross(camera.up);

  return playerDirection;
}

function controls(deltaTime: number) {
  // gives a bit of air control
  const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);

  if (keyStates['KeyW']) {
    playerVelocity.add(getForwardVector().scale(speedDelta));
  }

  if (keyStates['KeyS']) {
    playerVelocity.add(getForwardVector().scale(-speedDelta));
  }

  if (keyStates['KeyA']) {
    playerVelocity.add(getSideVector().scale(-speedDelta));
  }

  if (keyStates['KeyD']) {
    playerVelocity.add(getSideVector().scale(speedDelta));
  }

  if (playerOnFloor) {
    if (keyStates['Space']) {
      playerVelocity.y = 15;
    }
  }
}

const gltf = await GLTFLoader.loadAsync('resources/models/gltf/collision-world.glb');

scene.add(gltf.scene);

worldOctree.fromGraphNode(gltf.scene);

gltf.scene.traverse((child: any) => {
  if (child.isMesh) {
    child.castShadow = true;
    child.receiveShadow = true;

    if (child.material.map) {
      child.material.map.anisotropy = 4;
    }
  }
});

const helper = new OctreeHelper(worldOctree);
helper.visible = false;
scene.add(helper);

UI.create('Controls', { debug: false }).boolean('debug', 'Debug', value => {
  helper.visible = value;
});

function teleportPlayerIfOob() {
  if (camera.position.y <= -25) {
    playerCollider.start.set(0, 0.35, 0);
    playerCollider.end.set(0, 1, 0);
    playerCollider.radius = 0.35;
    camera.position.from(playerCollider.end);
    camera.setRotationFromEuler(new Euler(0, 0, 0));
  }
}

function animate() {
  const deltaTime = Math.min(0.05, clock.delta()) / STEPS_PER_FRAME;

  // we look for collisions in substeps to mitigate the risk of
  // an object traversing another too quickly for detection.

  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    controls(deltaTime);

    updatePlayer(deltaTime);

    updateSpheres(deltaTime);

    teleportPlayerIfOob();
  }

  renderer.render(scene, camera);

  stats.update();
}
