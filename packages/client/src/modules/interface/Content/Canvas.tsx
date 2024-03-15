import { Example, ExampleName } from '@modules/renderer/examples/examples.js';
import { createEffect } from 'solid-js';
import { useContent } from '@modules/managment/useContent.js';

export const Canvas = () => {
  const { selected } = useContent();
  // const example = useGpu(s => s.example);
  // const [[object, parent], setRef] = useStateRef(
  //   useCallback((node: HTMLObjectElement) => [node, node?.parentElement ?? null] as const, []),
  //   [],
  // );

  // const resize = useCallback(() => {
  //   if (!object || !parent) return;
  //   const { width, height } = parent.getBoundingClientRect();
  //   object.style.height = `${Math.ceil(height)}px`;
  //   object.style.width = `${Math.ceil(width)}px`;
  // }, [object, parent]);
  //
  // useEffect(resize, [parent]);
  // useEvent('resize', resize);

  let ref: HTMLObjectElement | undefined = undefined;

  return <object ref={ref} type="text/html" data={`src/modules/renderer/examples/${selected()}.html`} />;
};
