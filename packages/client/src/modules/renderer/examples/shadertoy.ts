import * as Engine from '@modules/renderer/engine/engine.js';
import * as Nodes from '@modules/renderer/engine/nodes/Nodes.js';

import Transpiler from '@modules/renderer/engine/transpiler/Transpiler.js';
import ShaderToyDecoder from '@modules/renderer/engine/transpiler/ShaderToyDecoder.js';
import TSLEncoder from '@modules/renderer/engine/transpiler/TSLEncoder.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

class ShaderToyNode extends Nodes.Node {
  constructor() {
    super('vec4');

    this.mainImage = null;
  }

  transpile(glsl, iife = false) {
    const decoder = new ShaderToyDecoder();

    const encoder = new TSLEncoder();
    encoder.iife = iife;
    encoder.uniqueNames = true;

    const jsCode = new Transpiler(decoder, encoder).parse(glsl);

    return jsCode;
  }

  parse(glsl) {
    const jsCode = this.transpile(glsl, true);

    const { mainImage } = eval(jsCode)(Nodes);

    this.mainImage = mainImage;
  }

  async parseAsync(glsl) {
    const jsCode = this.transpile(glsl);

    const { mainImage } = await import(`data:text/javascript,${encodeURIComponent(jsCode)}`);

    this.mainImage = mainImage;
  }

  setup(builder) {
    if (this.mainImage === null) {
      throw new Error('ShaderToyNode: .parse() must be called first.');
    }

    return this.mainImage();
  }
}

let renderer, camera, scene;
const dpr = window.devicePixelRatio;

init();

function init() {
  //

  const example1Code = document.getElementById('example1').textContent;
  const example2Code = document.getElementById('example2').textContent;

  const shaderToy1Node = new ShaderToyNode();
  shaderToy1Node.parse(example1Code);

  const shaderToy2Node = new ShaderToyNode();
  shaderToy2Node.parse(example2Code);

  //

  camera = new Engine.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene = new Engine.Scene();

  const geometry = new Engine.PlaneGeometry(2, 2);

  const material = new Nodes.MeshBasicNodeMaterial();
  material.colorNode = Nodes.oscSine(Nodes.timerLocal(0.3)).mix(shaderToy1Node, shaderToy2Node);

  const quad = new Engine.Mesh(geometry, material);
  scene.add(quad);

  //

  renderer = new Renderer();
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.outputColorSpace = Engine.ColorSpace.LinearSRGB;
  document.body.appendChild(renderer.domElement);

  useWindowResizer(renderer, camera);
}

function animate() {
  renderer.render(scene, camera);
}
