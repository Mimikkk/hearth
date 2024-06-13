import { createMemo, JSXElement, ParentProps } from 'solid-js';
import cx from 'clsx';

const Key = (props: ParentProps<{ border?: boolean }>) => (
  <span class={cx('select-none uppercase', props.border && `lowercase border rounded-sm px-0.5`)}>
    {props.children}
  </span>
);

const createTitle = (elements: JSXElement[]) =>
  createMemo(
    () =>
      `shortcut: ${elements
        .map(element => {
          const item = (element as unknown as () => HTMLSpanElement)();

          return item.textContent?.toLowerCase() ?? '';
        })
        .join(' + ')}`,
  );

export const Shortcut = (props: ParentProps<{ class?: string }>) => {
  const elements = props.children as JSXElement[];
  const title = createTitle(elements);

  return (
    <span class={cx(props.class, 'text-xs')} title={title()}>
      {elements.map((element, index) => (
        <>
          {element}
          {index < elements.length - 1 && <span class="select-none opacity-80">+</span>}
        </>
      ))}
    </span>
  );
};
Shortcut.Key = Key;
