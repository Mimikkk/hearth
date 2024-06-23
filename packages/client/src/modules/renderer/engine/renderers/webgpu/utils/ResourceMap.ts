type CreateFn<Value, Descriptor> = (descriptor: Descriptor) => Value;
type DisposeFn<Value> = (value: Value, label: string) => void;

export type LabelLess<T> = Omit<T, 'label'>;
export type Label<Key extends string, T> = LabelLess<T> & {
  /** Identifiers must be unique. */
  label: Key;
};

class ResourceMissingError extends Error {
  constructor(label: string) {
    super(`Resource not found: ${label}.`);
    this.name = 'ResourceNotFoundError';
  }
}

class ResourceUniqueError extends Error {
  constructor(label: string) {
    super(`Resource already exists: ${label}.`);
    this.name = 'ResourceAlreadyExistsError';
  }
}

export class ResourceMap<Value, Descriptor, Key extends string = string> {
  readonly create: CreateFn<Value, Label<Key, Descriptor>>;
  readonly #dispose?: DisposeFn<Value>;
  #map = new Map<Key, Value>();

  static as<Value, Descriptor, Key extends string>(
    create: CreateFn<Value, Label<Key, Descriptor>>,
    dispose?: DisposeFn<Value>,
  ): ResourceMap<Value, Descriptor, Key> {
    return new ResourceMap(create, dispose);
  }

  constructor(create: CreateFn<Value, Label<Key, Descriptor>>, dispose?: DisposeFn<Value>) {
    this.create = create;
    this.#dispose = dispose;
  }

  get<T extends Value>(label: Key, or?: (label: Key) => LabelLess<Descriptor>): T {
    const value = this.#map.get(label);
    if (value === undefined) {
      if (or !== undefined) {
        const descriptor = or(label) as Label<Key, Descriptor>;
        descriptor.label = label;

        return this.set(descriptor);
      }
      throw new ResourceMissingError(label);
    }

    return value as T;
  }

  set<T extends Value>(descriptor: Label<Key, Descriptor>): T {
    if (this.#map.has(descriptor.label)) throw new ResourceUniqueError(descriptor.label);

    const value = this.create(descriptor);
    this.#map.set(descriptor.label, value);
    return value as T;
  }

  delete(label: Key): void {
    const value = this.#map.get(label);
    if (value === undefined) throw Error(`Value not found: ${label}.`);

    this.#dispose?.(value, label);
    this.#map.delete(label);
  }

  remove(label: Key): void {
    const value = this.#map.get(label);
    if (value === undefined) return;

    this.#dispose?.(value, label);
    this.#map.delete(label);
  }

  clear(): this {
    if (this.#dispose) {
      for (const [label, value] of this.#map) {
        this.#dispose(value, label);
      }
    }

    this.#map.clear();
    return this;
  }
}
