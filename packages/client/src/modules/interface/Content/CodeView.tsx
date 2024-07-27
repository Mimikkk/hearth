import { createEffect } from 'solid-js';
import { editor } from 'monaco-editor';
import '../../renderer/examples/utilities/monaco-vite.js';

const readCodeFile = async (src: string) => {
  const result = await fetch(src);

  let code = await result.text();
  const [, string] = code.match(/export default "(.*)";/) || [];
  if (string) code = string;

  code = code.replace(/\\r?\\n/g, '\n');
  code = code.replace(/\/\/#.*$/, '');

  return code;
};

export const CodeView = (props: { src: string }) => {
  let ref!: HTMLDivElement;
  const element = <div ref={ref} class="w-full h-full rounded-sm overflow-hidden" />;

  createEffect(async () => monitor.setValue(await readCodeFile(`${props.src}?src`)));

  const monitor = editor.create(ref, {
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    domReadOnly: true,
    readOnly: true,
    'semanticHighlighting.enabled': true,
  });

  return element;
};
