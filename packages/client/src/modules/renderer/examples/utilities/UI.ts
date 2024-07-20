import { Controller, GUI } from 'lil-gui';
import { Path } from 'a-path';

type Handler<S, K extends Path<S>> = {
  key: K;
  title: string;
  onChange?: (value: Path.At<S, K>, state: S) => void;
} & (Path.At<S, K> extends number ? { min: number; max: number; step: number } : {});

export class UI<S extends {} = {}> {
  shortcutsFolder: UI<S> | null = null;
  shortcutsShown: Set<() => void>;
  shortcuts: Shortcut[];
  controllers: Controller[];
  updaters: Map<Controller, (state: S) => void> = new Map();
  ui: GUI;

  constructor(
    title: string,
    private state: S,
    ui: GUI = new GUI({ title }),
  ) {
    this.controllers = [];
    this.shortcutsShown = new Set();
    this.shortcuts = [];

    this.ui = ui;
    this.ui.domElement.style.borderRadius = '0.125rem';
    this.ui.domElement.style.overflow = 'hidden';
  }

  static create<S extends {}>(title: string, state: S = {} as S) {
    return new this(title, state);
  }

  number<V extends number, K extends Path.Of<S, V> = Path.Of<S, V>>(
    key: K,
    title: string,
    min: number,
    max: number,
    step: number,
    onChange?: (value: V, state: S) => void,
  ): this {
    return this.#addValue({ key, title, min, max, step, onChange });
  }

  string<V extends string, K extends Path.Of<S, V> = Path.Of<S, V>>(
    key: K,
    title: string,
    onChange?: (value: V, state: S) => void,
  ): this {
    return this.#addValue({ key, title, onChange } as any);
  }

  boolean(key: Path.Of<S, boolean>, title: string, onChange?: (value: boolean, state: S) => void): this {
    return this.#addValue({ key, title, onChange } as any);
  }

  action(title: string, handler: (state: S) => void): this {
    const handle = () => {
      handler(this.state);
      this.update();
    };
    const controller = this.ui.add({ handle }, 'handle').name(title);

    this.controllers.push(controller);
    this.update();

    return this;
  }

  option<V extends PropertyKey, K extends Path.Of<S, V> = Path.Of<S, V>>(
    key: K,
    title: string,
    options: Record<V, string>,
    onChange?: (value: V, state: S) => void,
  ): this {
    const parent = key.split('.');
    const last = parent.pop()!;
    const parentPath = parent.join('.') as Path<S>;

    const labels = Object.values(options);
    const inverted = Object.fromEntries(Object.entries(options).map(([k, v]) => [v, k]));
    const controller = this.ui.add(Path.get(this.state, parentPath) ?? this.state, last, labels);
    controller.name(title);

    controller.onChange((label: string) => {
      const value = inverted[label] as Path.At<S, K>;
      Path.set(this.state, key, value);

      onChange?.(value, this.state);
      this.update();
    });

    controller.$widget.getElementsByClassName('display').item(0)?.setAttribute('style', 'width: 100%');
    this.controllers.push(controller);
    this.update();

    return this;
  }

  folder(title: string, update: boolean = true): UI<S> {
    const ui = new UI(title, this.state, this.ui.addFolder(title));
    if (update) this.update();
    return ui;
  }

  shortcut(key: ShortcutKey, description: string, handler: (state: S) => void): this {
    const useControl = typeof key === 'string' ? undefined : key.control;
    const useShift = typeof key === 'string' ? undefined : key.shift;
    const keyName = typeof key === 'string' ? key : key.key;

    const handle = (event: KeyboardEvent) => {
      const validControl = useControl === undefined || event.ctrlKey === useControl;
      const validShift = useShift === undefined || event.shiftKey === useShift;
      const validKey = event.key === keyName;

      if (!validControl || !validShift || !validKey) return;
      handler(this.state);
      this.update();
    };

    window.addEventListener('keydown', handle);
    const unsubscribe = () => window.removeEventListener('keydown', handle);

    this.shortcuts.push({ key, description, unsubscribe });
    this.update();

    return this;
  }

  text(key: string, fn: string | ((state: S) => string | number | null | undefined)) {
    const description = `${typeof fn === 'string' ? fn : fn(this.state)}`;

    const controller = this.ui.add({ [key]: description }, key).name(key);

    controller.$widget.children[0].remove();

    const text = document.createElement('span');
    text.textContent = description;
    text.style.display = 'block';
    text.style.width = '100%';
    text.style.overflow = 'hidden';
    text.style.textOverflow = 'ellipsis';
    text.style.whiteSpace = 'nowrap';
    text.style.overflowWrap = 'anywhere';

    controller.$widget.append(text);
    controller.$widget.style.overflow = 'hidden';
    controller.$widget.addEventListener('mouseenter', () => {
      controller.$widget.style.overflow = 'visible';
      text.style.whiteSpace = 'normal';
    });
    controller.$widget.addEventListener('mouseleave', () => {
      controller.$widget.style.overflow = 'hidden';
      text.style.whiteSpace = 'nowrap';
    });
    controller.domElement.title = description;

    if (typeof fn !== 'string') {
      this.controllers.push(controller);
      this.updaters.set(controller, () => {
        text.textContent = `${fn(this.state) ?? 'None'}`;
      });
      this.update();
    }

    return this;
  }

  update() {
    this.#updateShortcuts();
    this.#updateControllers();
  }

  #addValue<K extends Path<S>>(options: Handler<S, K>): this {
    const { key, title, onChange } = options;
    const parent = key.split('.');
    let last = parent.pop()!;
    const parentPath = parent.join('.') as Path<S>;

    const controller = this.ui.add(Path.get(this.state, parentPath) ?? this.state, last);
    if ('min' in options) controller.min(options.min).max(options.max).step(options.step);
    if (title) controller.name(title);

    controller.onChange((value: Path.At<S, K>) => {
      Path.set(this.state, key, value);
      onChange?.(value, this.state);
      this.update();
    });

    this.controllers.push(controller);
    this.update();

    return this;
  }

  #maybeCreateShortcuts() {
    if (this.shortcutsFolder || this.shortcuts.length === 0) return;
    this.shortcutsFolder = this.folder('Shortcut descriptions', false);
  }

  #maybePlaceLastShortcuts() {
    if (!this.shortcutsFolder) return;
    const index = this.ui.folders.findIndex(folder => folder._title === 'Shortcut descriptions');
    if (index !== this.ui.folders.length - 1) {
      const folder = this.ui.folders.splice(index, 1)[0];
      this.ui.folders.push(folder);

      const child = this.ui.children.splice(index, 1)[0];
      this.ui.children.push(child);

      const dom = this.ui.$children;
      dom.removeChild(folder.domElement);
      dom.appendChild(folder.domElement);
    }
  }

  #updateShortcuts() {
    this.#maybeCreateShortcuts();

    for (const { key, description, unsubscribe } of this.shortcuts) {
      if (this.shortcutsShown.has(unsubscribe)) continue;
      this.shortcutsShown.add(unsubscribe);

      const title =
        typeof key === 'object'
          ? [key.control ? 'Ctrl' : '', key.shift ? 'Shift' : '', key.key.toUpperCase()].join('+')
          : key.toUpperCase();

      this.shortcutsFolder!.text(`Key: ${title}`, description);
    }

    this.#maybePlaceLastShortcuts();
  }

  #updateControllers() {
    for (const controller of this.ui.controllersRecursive()) {
      controller.updateDisplay();
      this.updaters.get(controller)?.(this.state);
    }
  }
}

type Shortcut = { key: ShortcutKey; description: string; unsubscribe: () => void };
type ShortcutKey = { control?: boolean; shift?: boolean; key: string } | string;
