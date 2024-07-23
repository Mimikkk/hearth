import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { Geometry } from '@modules/renderer/engine/core/geometry/Geometry.js';
import { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Clock } from '@modules/renderer/engine/core/Clock.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
type Vector = { x: number; y: number; z: number };

export interface RapierPhysicsObject {
  addScene: (scene: Entity) => void;
  addMesh: (mesh: Mesh, mass?: number, restitution?: number) => void;
  setMeshPosition: (mesh: Mesh, position: Vector, index?: number) => void;
  setMeshVelocity: (mesh: Mesh, velocity: Vector, index?: number) => void;
}

const RAPIER_PATH = 'https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2';

const frameRate = 60;

const _scale = Vec3.new(1, 1, 1);
const ZERO = Vec3.new();

//@ts-expect-error
let RAPIER = null;

function getCollider(geometry: Geometry) {
  const parameters = geometry.parameters!;

  // TODO change type to is*

  if (geometry.type === 'BoxGeometry') {
    const sx = parameters.width !== undefined ? parameters.width / 2 : 0.5;
    const sy = parameters.height !== undefined ? parameters.height / 2 : 0.5;
    const sz = parameters.depth !== undefined ? parameters.depth / 2 : 0.5;

    //@ts-expect-error
    return RAPIER.ColliderDesc.cuboid(sx, sy, sz);
  } else if (geometry.type === 'SphereGeometry' || geometry.type === 'IcosahedronGeometry') {
    const radius = parameters.radius !== undefined ? parameters.radius : 1;
    //@ts-expect-error
    return RAPIER.ColliderDesc.ball(radius);
  }

  return null;
}

export async function RapierPhysics(): Promise<RapierPhysicsObject> {
  //@ts-expect-error
  if (RAPIER === null) {
    RAPIER = await import(RAPIER_PATH);
    await RAPIER.init();
  }

  // Docs: https://rapier.rs/docs/api/javascript/JavaScript3D/

  const gravity = Vec3.new(0.0, -9.81, 0.0);
  //@ts-expect-error
  const world = new RAPIER.World(gravity);

  const meshes: Mesh[] = [];
  const meshMap = new WeakMap();

  const _vector = Vec3.new();
  const _quaternion = Quaternion.new();
  const _matrix = new Mat4();

  function addScene(scene: Scene) {
    scene.traverse(function (child) {
      //@ts-expect-error
      if (child.isMesh) {
        const physics = child.userData.physics;

        if (physics) {
          //@ts-expect-error
          addMesh(child, physics.mass, physics.restitution);
        }
      }
    });
  }

  function addMesh(mesh: Mesh, mass: number = 0, restitution: number = 0) {
    const shape = getCollider(mesh.geometry);

    if (shape === null) return;

    shape.setMass(mass);
    shape.setRestitution(restitution);

    //@ts-expect-error
    const body = mesh.isInstancedMesh
      ? createInstancedBody(mesh, mass, shape)
      : createBody(mesh.position, mesh.quaternion, mass, shape);

    if (mass > 0) {
      meshes.push(mesh);
      meshMap.set(mesh, body);
    }
  }

  function createInstancedBody(mesh: Mesh, mass: number, shape: any) {
    //@ts-expect-error
    const array = mesh.instanceMatrix.array;

    const bodies = [];

    //@ts-expect-error
    for (let i = 0; i < mesh.count; i++) {
      const position = _vector.fromArray(array, i * 16 + 12);
      bodies.push(createBody(position, null, mass, shape));
    }

    return bodies;
  }

  //@ts-expect-error
  function createBody(position, quaternion, mass, shape) {
    //@ts-expect-error
    const desc = mass > 0 ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed();
    desc.setTranslation(...position);
    if (quaternion !== null) desc.setRotation(quaternion);

    const body = world.createRigidBody(desc);
    world.createCollider(shape, body);

    return body;
  }

  //@ts-expect-error
  function setMeshPosition(mesh, position, index = 0) {
    let body = meshMap.get(mesh);

    if (mesh.isInstancedMesh) {
      body = body[index];
    }

    body.setAngvel(ZERO);
    body.setLinvel(ZERO);
    body.setTranslation(position);
  }

  //@ts-expect-error
  function setMeshVelocity(mesh, velocity, index = 0) {
    let body = meshMap.get(mesh);

    if (mesh.isInstancedMesh) {
      body = body[index];
    }

    body.setLinvel(velocity);
  }

  //

  const clock = new Clock();

  function step() {
    world.timestep = clock.tick();
    world.step();

    //

    for (let i = 0, l = meshes.length; i < l; i++) {
      const mesh = meshes[i];

      //@ts-expect-error
      if (mesh.isInstancedMesh) {
        //@ts-expect-error
        const array = mesh.instanceMatrix.array;
        const bodies = meshMap.get(mesh);

        for (let j = 0; j < bodies.length; j++) {
          const body = bodies[j];

          const position = body.translation();
          _quaternion.from(body.rotation());

          _matrix.compose(position, _quaternion, _scale).intoArray(array, j * 16);
        }

        //@ts-expect-error
        mesh.instanceMatrix.needsUpdate = true;
        //@ts-expect-error
        mesh.computeBoundingSphere();
      } else {
        const body = meshMap.get(mesh);

        mesh.position.from(body.translation());
        mesh.quaternion.from(body.rotation());
      }
    }
  }

  // animate

  setInterval(step, 1000 / frameRate);

  return {
    addScene: addScene,
    addMesh: addMesh,
    setMeshPosition: setMeshPosition,
    setMeshVelocity: setMeshVelocity,
  };
}
