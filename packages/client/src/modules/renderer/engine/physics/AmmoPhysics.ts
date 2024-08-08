import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { Entity } from '../core/Entity.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import * as Ammo from 'ammojs3';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { InstancedMesh } from '@modules/renderer/engine/entities/InstancedMesh.js';
import { NumberArray } from '@modules/renderer/engine/math/MathUtils.js';
import { BoxGeometry } from '@modules/renderer/engine/entities/geometries/BoxGeometry.js';
import { SphereGeometry } from '@modules/renderer/engine/entities/geometries/SphereGeometry.js';
import { IcosahedronGeometry } from '@modules/renderer/engine/entities/geometries/IcosahedronGeometry.js';

export interface AmmoPhysicsObject {
  addScene: (scene: Entity) => void;
  addMesh: (mesh: Mesh, mass?: number) => void;
  setMeshPosition: (mesh: Mesh, position: Vec3, index?: number) => void;
}

export async function AmmoPhysics(): Promise<AmmoPhysicsObject> {
  const AmmoLib = await Ammo.bind(window)();

  const frameRate = 60;

  const collisionConfiguration = new AmmoLib.btDefaultCollisionConfiguration();
  const dispatcher = new AmmoLib.btCollisionDispatcher(collisionConfiguration);
  const broadphase = new AmmoLib.btDbvtBroadphase();
  const solver = new AmmoLib.btSequentialImpulseConstraintSolver();
  const world = new AmmoLib.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
  world.setGravity(new AmmoLib.btVector3(0, -9.8, 0));

  const worldTransform = new AmmoLib.btTransform();

  function getShape(geometry: Geometry) {
    const parameters = geometry.parameters!;
    if (BoxGeometry.is(geometry)) {
      const sx = parameters.width !== undefined ? parameters.width / 2 : 0.5;
      const sy = parameters.height !== undefined ? parameters.height / 2 : 0.5;
      const sz = parameters.depth !== undefined ? parameters.depth / 2 : 0.5;

      const shape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(sx, sy, sz));
      shape.setMargin(0.05);

      return shape;
    } else if (SphereGeometry.is(geometry) || IcosahedronGeometry.is(geometry)) {
      const radius = parameters.radius !== undefined ? parameters.radius : 1;

      const shape = new AmmoLib.btSphereShape(radius);
      shape.setMargin(0.05);

      return shape;
    }

    return null;
  }

  const meshes: Mesh[] = [];
  const meshMap = new WeakMap();

  function addScene(scene: Scene) {
    scene.traverse(child => {
      if (!Mesh.is(child)) return;
      const physics = child.userData.physics;
      if (physics) addMesh(child, physics.mass);
    });
  }

  function addMesh(mesh: Mesh, mass: number = 0) {
    const shape = getShape(mesh.geometry);

    if (shape === null) return;
    if (InstancedMesh.is(mesh)) {
      handleInstancedMesh(mesh, mass, shape);
    } else if (Mesh.is(mesh)) {
      handleMesh(mesh, mass, shape);
    }
  }

  function handleMesh(mesh: Mesh, mass: number, shape: Ammo.btCollisionShape) {
    const position = mesh.position;
    const quaternion = mesh.quaternion;

    const transform = new AmmoLib.btTransform();
    transform.setIdentity();
    transform.setOrigin(new AmmoLib.btVector3(position.x, position.y, position.z));
    transform.setRotation(new AmmoLib.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));

    const motionState = new AmmoLib.btDefaultMotionState(transform);

    const localInertia = new AmmoLib.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);

    const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);

    const body = new AmmoLib.btRigidBody(rbInfo);
    world.addRigidBody(body);

    if (mass > 0) {
      meshes.push(mesh);
      meshMap.set(mesh, body);
    }
  }

  function handleInstancedMesh(mesh: InstancedMesh, mass: number, shape: Ammo.btCollisionShape) {
    const array = mesh.instanceMatrix.array;

    const bodies = [];

    for (let i = 0; i < mesh.count; i++) {
      const index = i * 16;

      const transform = new AmmoLib.btTransform();
      transform.setFromOpenGLMatrix(array.slice(index, index + 16) as unknown as readonly number[]);

      const motionState = new AmmoLib.btDefaultMotionState(transform);

      const localInertia = new AmmoLib.btVector3(0, 0, 0);
      shape.calculateLocalInertia(mass, localInertia);

      const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);

      const body = new AmmoLib.btRigidBody(rbInfo);
      world.addRigidBody(body);

      bodies.push(body);
    }

    if (mass > 0) {
      meshes.push(mesh);

      meshMap.set(mesh, bodies);
    }
  }

  function setMeshPosition(mesh: Mesh, position: Vec3, index: number = 0) {
    //@ts-expect-error
    if (mesh.isInstancedMesh) {
      const bodies = meshMap.get(mesh);
      const body = bodies[index];

      body.setAngularVelocity(new AmmoLib.btVector3(0, 0, 0));
      body.setLinearVelocity(new AmmoLib.btVector3(0, 0, 0));

      worldTransform.setIdentity();
      worldTransform.setOrigin(new AmmoLib.btVector3(position.x, position.y, position.z));
      body.setWorldTransform(worldTransform);
    } else if (mesh.isMesh) {
      const body = meshMap.get(mesh);

      body.setAngularVelocity(new AmmoLib.btVector3(0, 0, 0));
      body.setLinearVelocity(new AmmoLib.btVector3(0, 0, 0));

      worldTransform.setIdentity();
      worldTransform.setOrigin(new AmmoLib.btVector3(position.x, position.y, position.z));
      body.setWorldTransform(worldTransform);
    }
  }

  let lastTime = 0;

  function step() {
    const time = performance.now();

    if (lastTime > 0) {
      const delta = (time - lastTime) / 1000;

      world.stepSimulation(delta, 10);

      for (let i = 0, l = meshes.length; i < l; i++) {
        const mesh = meshes[i];

        if (InstancedMesh.is(mesh)) {
          const array = mesh.instanceMatrix.array;
          const bodies = meshMap.get(mesh);

          for (let j = 0; j < bodies.length; j++) {
            const body = bodies[j];

            const motionState = body.getMotionState();
            motionState.getWorldTransform(worldTransform);

            const position = worldTransform.getOrigin();
            const quaternion = worldTransform.getRotation();

            compose(position, quaternion, array, j * 16);
          }

          mesh.instanceMatrix.needsUpdate = true;
          mesh.computeBoundingSphere();
        } else if (mesh.isMesh) {
          const body = meshMap.get(mesh);

          const motionState = body.getMotionState();
          motionState.getWorldTransform(worldTransform);

          const position = worldTransform.getOrigin();
          const quaternion = worldTransform.getRotation();
          mesh.position.set(position.x(), position.y(), position.z());
          mesh.quaternion.set(quaternion.x(), quaternion.y(), quaternion.z(), quaternion.w());
        }
      }
    }

    lastTime = time;
  }

  setInterval(step, 1000 / frameRate);

  return { addScene, addMesh, setMeshPosition };
}

function compose(position: Ammo.btVector3, quaternion: Ammo.btQuaternion, array: NumberArray, index: number) {
  const x = quaternion.x(),
    y = quaternion.y(),
    z = quaternion.z(),
    w = quaternion.w();
  const x2 = x + x,
    y2 = y + y,
    z2 = z + z;
  const xx = x * x2,
    xy = x * y2,
    xz = x * z2;
  const yy = y * y2,
    yz = y * z2,
    zz = z * z2;
  const wx = w * x2,
    wy = w * y2,
    wz = w * z2;

  array[index + 0] = 1 - (yy + zz);
  array[index + 1] = xy + wz;
  array[index + 2] = xz - wy;
  array[index + 3] = 0;

  array[index + 4] = xy - wz;
  array[index + 5] = 1 - (xx + zz);
  array[index + 6] = yz + wx;
  array[index + 7] = 0;

  array[index + 8] = xz + wy;
  array[index + 9] = yz - wx;
  array[index + 10] = 1 - (xx + yy);
  array[index + 11] = 0;

  array[index + 12] = position.x();
  array[index + 13] = position.y();
  array[index + 14] = position.z();
  array[index + 15] = 1;
}
