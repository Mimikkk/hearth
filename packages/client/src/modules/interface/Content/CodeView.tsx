import { createEffect } from 'solid-js';
import { editor } from 'monaco-editor';
import '../../renderer/examples/utilities/monaco-vite.js';

export const CodeView = (props: { src: string }) => {
  let ref!: HTMLDivElement;
  const element = <div ref={ref} class="w-full h-full rounded-sm overflow-hidden" />;

  createEffect(async () => {
    const res = await fetch(props.src);
    const code = await res.text();

    monitor.setValue(code);
  });

  const monitor = editor.create(ref, {
    value: 'loading...',
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    'semanticHighlighting.enabled': true,
    readOnly: true,
    readOnlyMessage: { value: 'Preview only' },
  });

  return element;
};
