import * as Engine from '@modules/renderer/engine/engine.js';
import {
  float,
  instanceIndex,
  MeshBasicNodeMaterial,
  NodeStack,
  storageObject,
  tslFn,
  uint,
  uv,
  vec3,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import StorageInstancedBufferAttribute from '@modules/renderer/engine/renderers/common/StorageInstancedBufferAttribute.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

// WebGPU Backend
init();

const dashboard = {
  renderMs: document.getElementById('render-ms')!,
  computeMs: document.getElementById('compute-ms')!,
  renderCalls: document.getElementById('render-calls')!,
  computeCalls: document.getElementById('compute-calls')!,
};

async function init() {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new Engine.OrthographicCamera(-aspect, aspect, 1, -1, 0, 2);
  camera.position.z = 1;

  const scene = new Engine.Scene();

  // texture

  const size = 1024; // non power of two buffer size is not well supported in WebGPU

  const type = ['float', 'vec2', 'vec3', 'vec4'];

  const arrayBufferNodes = [];

  for (let i = 0; i < type.length; i++) {
    const typeSize = i + 1;
    const array = new Array(size * typeSize).fill(0);

    const arrayBuffer = new StorageInstancedBufferAttribute(new Float32Array(array), typeSize);

    arrayBufferNodes.push(storageObject(arrayBuffer, type[i], size));
  }

  const computeInitOrder = tslFn(() => {
    for (let i = 0; i < type.length; i++) {
      arrayBufferNodes[i].element(instanceIndex).assign(instanceIndex);
    }
  });

  const computeInvertOrder = tslFn(() => {
    for (let i = 0; i < type.length; i++) {
      const invertIndex = arrayBufferNodes[i].element(uint(size).sub(instanceIndex));
      arrayBufferNodes[i].element(instanceIndex).assign(invertIndex);
    }
  });

  // compute

  const computeInit = computeInitOrder().compute(size);

  const compute = computeInvertOrder().compute(size);

  const material = new MeshBasicNodeMaterial({ color: 0x00ff00 });

  material.colorNode = tslFn(() => {
    const index = uint(uv().x.mul(size).floor()).toVar();

    NodeStack.if(index.greaterThanEqual(size), () => {
      index.assign(uint(size).sub(1));
    });

    const color = vec3(0, 0, 0).toVar();

    NodeStack.if(uv().y.greaterThan(0.0), () => {
      const indexValue = arrayBufferNodes[0].element(index).toVar();
      const value = float(indexValue).div(float(size)).mul(20).floor().div(20);

      color.assign(vec3(value, 0, 0));
    });

    NodeStack.if(uv().y.greaterThan(0.25), () => {
      const indexValue = arrayBufferNodes[1].element(index).toVar();
      const value = float(indexValue).div(float(size)).mul(20).floor().div(20);

      color.assign(vec3(0, value, 0));
    });

    NodeStack.if(uv().y.greaterThan(0.5), () => {
      const indexValue = arrayBufferNodes[2].element(index).toVar();
      const value = float(indexValue).div(float(size)).mul(20).floor().div(20);

      color.assign(vec3(0, 0, value));
    });

    NodeStack.if(uv().y.greaterThan(0.75), () => {
      const indexValue = arrayBufferNodes[3].element(index).toVar();
      const value = float(indexValue).div(float(size)).mul(20).floor().div(20);

      color.assign(vec3(value, value, value));
    });

    return color;
  })();

  // TODO: Add toAttribute() test

  //

  const plane = new Engine.Mesh(new Engine.PlaneGeometry(1, 1), material);
  scene.add(plane);

  const renderer = await Renderer.create({ trackTimestamp: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.parameters.canvas);
  renderer.parameters.canvas.style.height = '100%';

  scene.background = new Engine.Color(0x313131);

  // Init Positions
  renderer.computeAsync(computeInit);

  const stepAnimation = async () => {
    await renderer.computeAsync(compute);
    await renderer.renderAsync(scene, camera);

    const computeCalls = renderer.info?.compute?.computeCalls.toFixed(0);
    const renderCalls = renderer.info?.render?.drawCalls.toFixed(0);
    dashboard.computeCalls.innerHTML = computeCalls ?? 'N/A';
    dashboard.renderCalls.innerHTML = renderCalls ?? 'N/A';
    const computeMs = renderer.info?.compute?.timestamp.toFixed(6);
    const renderMs = renderer.info?.render?.timestamp.toFixed(6);
    dashboard.computeMs.innerHTML = computeMs ?? 'N/A';
    dashboard.renderMs.innerHTML = renderMs ?? 'N/A';

    setTimeout(stepAnimation, 1000);
  };

  stepAnimation();

  useWindowResizer(renderer, camera);
}
