import { type Ref, Show } from 'solid-js';
import cx from 'clsx';
import s from './TextField.module.scss';
import { createSearchString } from '@logic/Search/createSearchString.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { IconName } from '@components/buttons/Icon/Icon.js';

type ChangeEvent = Event & { currentTarget?: HTMLInputElement; target?: HTMLInputElement };
export interface TextFieldProps {
  label?: string;
  value?: string;
  onChange?: (value: string, event: ChangeEvent) => void;
  class?: string;
  ref?: Ref<HTMLInputElement>;
  searchId: string;
  icon?: IconName;
  onIconClick?: (event: MouseEvent) => void;
}

export const TextField = (props: TextFieldProps) => {
  const [value, setValue, clear] = createSearchString(props.searchId, props.value ?? '');
  let ref: HTMLInputElement;

  return (
    <div class={cx(s.field, props.icon && s.withIcon, props.class)}>
      <Show when={props.label}>
        <label for={props.searchId} class={s.label}>
          {props.label}
        </label>
      </Show>
      <Show when={props.icon}>
        <ButtonIcon
          class="absolute"
          variant="text"
          size="xs"
          icon={props.icon!}
          onClick={event => {
            event.stopPropagation();
            event.preventDefault();
            if (props.onIconClick) {
              props.onIconClick?.(event);
            } else {
              if (value()) {
                clear();
                props.onChange?.('', new Event('change') as ChangeEvent);
              }
              ref?.focus();
            }
          }}
        />
      </Show>
      <input
        id={props.searchId}
        ref={element => {
          ref = element;
          props.ref = element;
        }}
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
