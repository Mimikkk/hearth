import { Controller, GUI } from 'lil-gui';
import { Path } from 'a-path';

type Handler<S, K extends Path<S>> = {
  key: K;
  title: string;
  onChange?: (value: Path.At<S, K>, state: S) => void;
} & (Path.At<S, K> extends number ? { min: number; max: number; step: number } : {});

export class UI<S extends {}> {
  #controllers: Controller[] = [];
  #ui: GUI;

  constructor(
    title: string,
    private state: S,
    ui: GUI = new GUI({ title }),
  ) {
    this.#ui = ui;
  }

  static create<S extends {}>(title: string, state: S) {
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
    const controller = this.#ui
      .add(
        {
          handler: () => {
            handler(this.state);
            this.#update();
          },
        },
        'handler',
      )
      .name(title);

    this.#controllers.push(controller);
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
    const controller = this.#ui.add(Path.get(this.state, parentPath) ?? this.state, last, labels);
    controller.name(title);

    controller.onChange((label: string) => {
      const value = inverted[label] as Path.At<S, K>;
      Path.set(this.state, key, value);

      onChange?.(value, this.state);
      this.#update();
    });

    controller.$widget.getElementsByClassName('display').item(0)?.setAttribute('style', 'width: 100%');
    this.#controllers.push(controller);

    return this;
  }

  folder(title: string): UI<S> {
    return new UI(title, this.state, this.#ui.addFolder(title));
  }

  #addValue<K extends Path<S>>(options: Handler<S, K>): this {
    const { key, title, onChange } = options;
    const parent = key.split('.');
    let last = parent.pop()!;
    const parentPath = parent.join('.') as Path<S>;

    const controller = this.#ui.add(Path.get(this.state, parentPath) ?? this.state, last);
    if ('min' in options) controller.min(options.min).max(options.max).step(options.step);
    if (title) controller.name(title);

    controller.onChange((value: Path.At<S, K>) => {
      Path.set(this.state, key, value);
      onChange?.(value, this.state);
      this.#update();
    });

    this.#controllers.push(controller);

    return this;
  }

  #update() {
    for (const controller of this.#controllers) controller.updateDisplay();
  }
}
