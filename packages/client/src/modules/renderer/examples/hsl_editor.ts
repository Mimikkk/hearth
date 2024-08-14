import { NodeMaterial, vec4 } from '@modules/renderer/engine/nodes/nodes.js';
import { GUI } from 'lil-gui';
import initialCode from './hsl_editor.code.ts?raw';
import monaco from './utilities/monaco-vite.js';
import { Color, ColorSpace, Mesh, PerspectiveCamera, PlaneGeometry, Scene } from '@modules/renderer/engine/engine.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import './hsl_editor.css';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
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
scene.background = Color.new(0x222222);

const material = new NodeMaterial();
material.fragmentNode = vec4(0, 0, 0, 1);

const mesh = new Mesh(new PlaneGeometry({ width: 1, height: 1 }), material);
scene.add(mesh);

const options: {
  stage: 'vertex' | 'fragment';
  colorSpace: ColorSpace;
  preview: boolean;
} = {
  stage: 'fragment',
  colorSpace: ColorSpace.SRGB,
  preview: true,
};

const hearth = await Hearth.as({
  async animate() {
    await hearth.render(scene, camera);
  },
  autoinsert: false,
});
hearth.setSize(renderable.clientWidth, renderable.clientHeight);
renderable.appendChild(hearth.parameters.canvas);

let builder: NodeBuilder | null = null;

const refreshEditorView = async () => {
  const code = editorView.getValue();
  material.fragmentNode = await resolveScript(code);
  material.useUpdate = true;

  builder = new NodeBuilder(mesh, hearth, scene).build();

  refreshResultView();
};
const refreshResultView = () => {
  if (!builder) return;
  resultView.setValue(builder.fragmentShader);
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

const gui = new GUI();
gui.add(options, 'stage', ['vertex', 'fragment']).onChange(refreshResultView);
gui.add(options, 'preview').onChange((value: boolean) => renderable.style.setProperty('display', value ? '' : 'none'));
