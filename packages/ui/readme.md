# @mimi/ui - lil-gui wrapper

This package is a wrapper around the [lil-gui](https://https://github.com/georgealways/lil-gui).
It provides a builder pattern to build around all the components provided by lil-gui.

## Usage

```ts
import { UI } from '@mimi/ui';

const initialState = {
  path: {
    to: {
      value1: 'Hello',
      value2: 42,
      enum: 'a' as 'a' | 'b',
    },
  },
};

const ui = UI
  .create('Title', initialState)
  .shortcut("key", "Shortcut description", () => {
    console.info('Shortcut clicked!');
  })
  .text('Label', 'Description')
  .text('Label', (state) => `${state.path.to.value1} Dynamic Label`)
  .folder('Sub folder title')
  .string('path.to.value1', 'Label', (value) => {
    console.info('String change:', value);
  })
  .number('path.to.value2', 'Label', () => {
    console.info('Number change:', value);
  })
  .options('path.to.enum', 'Label', {
    a: 'Option A',
    b: 'Option B',
  }, (value) => {
    console.info('Option change:', value);
  })
  .action('Button action', () => {
    console.info('Button clicked!');
  });

document.addEventListener('resize', () => {
    // exposed update method to update the UI based on external changes
    ui.update();
});
;
```
