import { createUniqueId, type Ref, Show } from 'solid-js';
import cx from 'clsx';
import s from './TextField.module.scss';
import { createSearchString } from '@logic/Search/createSearchString.js';

type ChangeEvent = Event & { currentTarget?: HTMLInputElement; target?: HTMLInputElement };
export interface TextFieldProps {
  label?: string;
  value?: string;
  onChange?: (value: string, event: ChangeEvent) => void;
  class?: string;
  ref?: Ref<HTMLInputElement>;
  searchId: string;
}

export const TextField = (props: TextFieldProps) => {
  const id = createUniqueId();
  const [value, setValue, clear] = createSearchString(props.searchId, props.value ?? '');

  return (
    <div class={cx(s.field, props.class)}>
      <Show when={props.label}>
        <label for={id} class={s.label}>
          {props.label}
        </label>
      </Show>
      <input
        id={id}
        ref={props.ref}
        class={s.input}
        placeholder=" "
        value={value()}
        onInput={event => {
          const { value } = event.currentTarget;

          setValue(value.trim());
          if (value.trim() === '') clear();
          props.onChange?.(value, event);
        }}
      />
    </div>
  );
};
