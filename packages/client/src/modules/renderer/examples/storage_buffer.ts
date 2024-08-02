import * as Engine from '@modules/renderer/engine/engine.js';
import { Attribute, Buffer } from '@modules/renderer/engine/engine.js';
import {
  f32,
  instanceIndex,
  MeshBasicNodeMaterial,
  NodeStack,
  storageObject,
  hsl,
  u32,
  uv,
  vec3,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { GPUBufferBindingTypeType, BufferStep } from '@modules/renderer/engine/hearth/constants.js';

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

  const size = 1024;

  const type = ['f32', 'vec2', 'vec3', 'vec4'];

  const arrayBufferNodes = [];

  for (let i = 0; i < type.length; i++) {
    const typeSize = i + 1;

    const buffer = Buffer.f32(size * typeSize, typeSize, BufferStep.Instance);
    const arrayBuffer = new Attribute(buffer, typeSize, 0, undefined, GPUBufferBindingTypeType.Storage);

    arrayBufferNodes.push(storageObject(arrayBuffer, type[i], size));
  }

  const computeInitOrder = hsl(() => {
    for (let i = 0; i < type.length; i++) {
      arrayBufferNodes[i].element(instanceIndex).assign(instanceIndex);
    }
  });

  const computeInvertOrder = hsl(() => {
    for (let i = 0; i < type.length; i++) {
      const invertIndex = arrayBufferNodes[i].element(u32(size).sub(instanceIndex));
      arrayBufferNodes[i].element(instanceIndex).assign(invertIndex);
    }
  });

  const computeInit = computeInitOrder().compute(size);

  const compute = computeInvertOrder().compute(size);

  const material = new MeshBasicNodeMaterial({ color: 0x00ff00 });

  material.colorNode = hsl(() => {
    const index = u32(uv().x.mul(size).floor()).toVar();

    NodeStack.if(index.greaterThanEqual(size), () => {
      index.assign(u32(size).sub(1));
    });

    const color = vec3(0, 0, 0).toVar();

    NodeStack.if(uv().y.greaterThan(0.0), () => {
      const indexValue = arrayBufferNodes[0].element(index).toVar();
      const value = f32(indexValue).div(f32(size)).mul(20).floor().div(20);

      color.assign(vec3(value, 0, 0));
    });

    NodeStack.if(uv().y.greaterThan(0.25), () => {
      const indexValue = arrayBufferNodes[1].element(index).toVar();
      const value = f32(indexValue).div(f32(size)).mul(20).floor().div(20);

      color.assign(vec3(0, value, 0));
    });

    NodeStack.if(uv().y.greaterThan(0.5), () => {
      const indexValue = arrayBufferNodes[2].element(index).toVar();
      const value = f32(indexValue).div(f32(size)).mul(20).floor().div(20);

      color.assign(vec3(0, 0, value));
    });

    NodeStack.if(uv().y.greaterThan(0.75), () => {
      const indexValue = arrayBufferNodes[3].element(index).toVar();
      const value = f32(indexValue).div(f32(size)).mul(20).floor().div(20);

      color.assign(vec3(value, value, value));
    });

    return color;
  })();

  const plane = new Engine.Mesh(new Engine.PlaneGeometry(1, 1), material);
  scene.add(plane);

  const hearth = await Hearth.as({ trackTimestamp: true });
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(hearth.parameters.canvas);
  hearth.parameters.canvas.style.height = '100%';

  scene.background = new Engine.Color(0x313131);

  hearth.compute(computeInit);

  const stepAnimation = async () => {
    await hearth.compute(compute);
    await hearth.render(scene, camera);

    const computeCalls = hearth.stats?.compute?.calls.toFixed(0);
    const renderCalls = hearth.stats?.render?.calls.toFixed(0);
    dashboard.computeCalls.innerHTML = computeCalls ?? 'N/A';
    dashboard.renderCalls.innerHTML = renderCalls ?? 'N/A';
    const computeMs = hearth.stats?.compute?.timestampTime.toFixed(6);
    const renderMs = hearth.stats?.render?.timestampTime.toFixed(6);
    dashboard.computeMs.innerHTML = computeMs ?? 'N/A';
    dashboard.renderMs.innerHTML = renderMs ?? 'N/A';

    setTimeout(stepAnimation, 1000);
  };

  stepAnimation();

  useWindowResizer(hearth, camera);
}
