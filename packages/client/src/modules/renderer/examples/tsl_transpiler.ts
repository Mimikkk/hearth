import Transpiler from '@modules/renderer/threejs/transpiler/Transpiler.js';
import GLSLDecoder from '@modules/renderer/threejs/transpiler/GLSLDecoder.js';
import TSLEncoder from '@modules/renderer/threejs/transpiler/TSLEncoder.js';
import * as monaco from 'monaco-editor';
import initialCode from './tsl_transpiler.code.glsl?raw';
import './tsl_transpiler.css';

const createContainers = () => {
  const container = document.createElement('div');
  container.id = 'container';
  const source = document.createElement('div');
  source.id = 'source';
  const result = document.createElement('div');
  result.id = 'result';

  container.append(source, result);
  document.body.append(container);
  return { container, source, result };
};

const { source, result } = createContainers();

const editorView = monaco.editor.create(source, {
  value: initialCode,
  language: 'glsl',
  theme: 'vs-dark',
  automaticLayout: true,
  minimap: { enabled: false },
});
const resultView = monaco.editor.create(result, {
  value: '',
  language: 'javascript',
  theme: 'vs-dark',
  automaticLayout: true,
  readOnly: true,
  minimap: { enabled: false },
});

const showCode = (code: string) => resultView.setValue(code);
const build = () => showCode(new Transpiler(new GLSLDecoder(), new TSLEncoder()).parse(editorView.getValue()));

build();
editorView.getModel()?.onDidChangeContent(build);
