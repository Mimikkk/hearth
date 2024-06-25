import * as Nodes from '@modules/renderer/engine/nodes/Nodes.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import initialCode from './tsl_editor.code.ts?raw';
import { GUI } from 'lil-gui';
import * as monaco from 'monaco-editor';
import { Color, ColorSpace, Mesh, PerspectiveCamera, PlaneGeometry, Scene } from '@modules/renderer/engine/engine.js';
import './tsl_editor.css';
import './utilities/monaco-vite.js';
import WGSLNodeBuilder from '@modules/renderer/engine/renderers/webgpu/nodes/WGSLNodeBuilder.js';
import { resolveScript } from '@modules/renderer/examples/utilities/resolveScript.js';

const createContainers = () => {
  const container = document.createElement('div');
  container.id = 'container';
  const source = document.createElement('div');
  source.id = 'source';
  const result = document.createElement('div');
  result.id = 'result';
  const renderable = document.createElement('div');
  renderable.id = 'renderable';

  container.append(source, result, renderable);
  document.body.append(container);

  return { container, source, result, renderable };
};

const { source, result, renderable } = createContainers();

const camera = new PerspectiveCamera(70, 1, 0.1, 10);
camera.position.z = 0.72;
camera.lookAt(0, 0, 0);

const scene = new Scene();
scene.background = new Color(0x222222);

const material = new Nodes.NodeMaterial();
material.fragmentNode = Nodes.vec4(0, 0, 0, 1);

const mesh = new Mesh(new PlaneGeometry(1, 1), material);
scene.add(mesh);

// editor

const options: {
  stage: 'vertex' | 'fragment';
  colorSpace: ColorSpace;
  preview: boolean;
} = {
  stage: 'fragment',
  colorSpace: ColorSpace.SRGB,
  preview: true,
};

let builder: WGSLNodeBuilder | null = null;

const renderer = new Renderer();
renderer.outputColorSpace = ColorSpace.LinearSRGB;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setAnimationLoop(() => renderer.render(scene, camera));
renderer.setSize(renderable.clientWidth, renderable.clientHeight);
renderable.appendChild(renderer.parameters.canvas);

const refreshEditorView = async () => {
  const code = editorView.getValue();
  mesh.material.fragmentNode = await resolveScript(code);
  mesh.material.needsUpdate = true;

  builder = new WGSLNodeBuilder(mesh, renderer).build();

  refreshResultView();
};
const refreshResultView = () => {
  if (!builder) return;

  const code = (builder as unknown as Record<string, string>)[options.stage + 'Shader'];

  resultView.setValue(code);
};

const editorView = monaco.editor.create(source, {
  value: initialCode,
  language: 'typescript',
  theme: 'vs-dark',
  automaticLayout: true,
  minimap: { enabled: false },
});
const resultView = monaco.editor.create(result, {
  language: 'wgsl',
  theme: 'vs-dark',
  automaticLayout: true,
  readOnly: true,
  minimap: { enabled: false },
});
editorView.getModel()?.onDidChangeContent(refreshEditorView);
refreshEditorView();

// gui
const gui = new GUI();
gui.add(options, 'stage', ['vertex', 'fragment']).onChange(refreshResultView);
gui.add(options, 'colorSpace', [ColorSpace.LinearSRGB, ColorSpace.SRGB]).onChange(async (value: ColorSpace) => {
  renderer.outputColorSpace = value;
  await refreshEditorView();
});
gui.add(options, 'preview').onChange((value: boolean) => {
  renderable.style.setProperty('display', value ? '' : 'none');
});
