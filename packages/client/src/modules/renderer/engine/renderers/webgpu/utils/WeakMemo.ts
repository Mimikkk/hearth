type CreateFn<Key extends WeakKey, Value> = (key: Key) => Value;

export class WeakMemo<Key extends WeakKey, Value> {
  readonly #create: CreateFn<Key, Value>;
  #map = new WeakMap<Key, Value>();

  constructor(create: CreateFn<Key, Value>) {
    this.#create = create;
  }

  static as<Key extends WeakKey, Value>(create: CreateFn<Key, Value>): WeakMemo<Key, Value> {
    return new WeakMemo(create);
  }

  get(key: Key): Value {
    let value = this.#map.get(key);
    if (value) return value;

    value = this.#create(key);
    this.set(key, value);
    return value;
  }

  set(key: Key, value: Value): this {
    this.#map.set(key, value);
    return this;
  }

  delete(key: Key): boolean {
    return this.#map.delete(key);
  }
}
