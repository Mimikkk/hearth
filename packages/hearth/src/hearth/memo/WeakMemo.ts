type CreateFn<Key extends WeakKey, Value> = (key: Key, memo: WeakMemo<Key, Value>) => Value;

export class WeakMemo<Key extends WeakKey, Value> {
  readonly #create: CreateFn<Key, Value>;
  #map = new WeakMap<Key, Value>();

  constructor(create: CreateFn<Key, Value>) {
    this.#create = create;
  }

  static as<Key extends WeakKey, Value>(create: CreateFn<Key, Value>): WeakMemo<Key, Value> {
    return new WeakMemo(create);
  }

  get<V = Value>(key: Key): V {
    let value = this.#map.get(key);
    if (value) return value as V;

    value = this.#create(key, this);
    this.set(key, value);
    return value as never as V;
  }

  set(key: Key, value: Value): this {
    this.#map.set(key, value);
    return this;
  }

  has(key: Key): boolean {
    return this.#map.has(key);
  }

  delete(key: Key): boolean {
    return this.#map.delete(key);
  }
}
