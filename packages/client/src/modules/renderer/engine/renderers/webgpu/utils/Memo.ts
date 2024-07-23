type CreateFn<Key, Value> = (key: Key) => Value;
type DisposeFn<Value, Key> = (value: Value, key: Key) => void;

export class Memo<Key extends PropertyKey, Value> {
  readonly #create: CreateFn<Key, Value>;
  readonly #dispose?: DisposeFn<Value, Key>;
  #map = new Map<Key, Value>();

  constructor(create: CreateFn<Key, Value>, dispose?: DisposeFn<Value, Key>) {
    this.#create = create;
    this.#dispose = dispose;
  }

  static as<Key extends PropertyKey, Value>(
    create: CreateFn<Key, Value>,
    dispose?: DisposeFn<Value, Key>,
  ): Memo<Key, Value> {
    return new Memo(create, dispose);
  }

  get(key: Key): Value {
    let value = this.#map.get(key);
    if (value !== undefined) return value;

    value = this.#create(key);
    this.#map.set(key, value);
    return value;
  }

  set(key: Key, value: Value): this {
    this.#map.set(key, value);
    return this;
  }

  delete(key: Key): boolean {
    this.#dispose?.(this.#map.get(key)!, key);
    return this.#map.delete(key);
  }

  clear(): this {
    if (this.#dispose) {
      for (const [key, value] of this.#map) {
        this.#dispose(value, key);
      }
    }

    this.#map.clear();
    return this;
  }
}
