window.addEventListener('unhandledrejection', e => {
  if (e.reason.stack.includes('_EditorSimpleWorker.loadForeignModule')) {
    e.preventDefault();
  }
});

window.addEventListener('error', e => {
  if (e.message.includes('_EditorSimpleWorker.loadForeignModule')) {
    e.preventDefault();
  }
});

import 'monaco-editor/esm/vs/basic-languages/css/css.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';

import * as monaco from 'monaco-editor';

self.MonacoEnvironment = {
  getWorker(_, label) {
    switch (label) {
      case 'json':
        return new JsonWorker();
      case 'css':
      case 'scss':
      case 'less':
        return new CssWorker();
      case 'html':
      case 'handlebars':
      case 'razor':
        return new HtmlWorker();
      case 'typescript':
      case 'javascript':
        return new TsWorker();
      default:
        return new EditorWorker();
    }
  },
};

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  allowNonTsExtensions: true,
  allowJs: true,
  checkJs: true,
  strict: true,
  noLib: true,
});
monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

export default monaco;
