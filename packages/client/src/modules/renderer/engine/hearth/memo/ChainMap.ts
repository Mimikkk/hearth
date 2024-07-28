export type WeakChain<K extends WeakKey, V> = WeakMap<K, WeakChain<K, V> | V>;

/** @deprecated To remove, why */
export default class ChainMap<K extends WeakKey, V extends {}> {
  weakMap: WeakChain<K, V>;

  constructor() {
    this.weakMap = new WeakMap();
  }

  get(keys: K[]): V | undefined {
    let map = this.weakMap;

    for (let i = 0; i < keys.length; i++) {
      map = map.get(keys[i]) as typeof map;

      if (map === undefined) return undefined;
    }

    return map.get(keys[keys.length - 1]) as V | undefined;
  }

  set(keys: K[], value: V) {
    let map = this.weakMap;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (map.has(key) === false) map.set(key, new WeakMap());

      map = map.get(key) as typeof map;
    }

    return map.set(keys[keys.length - 1], value);
  }

  delete(keys: K[]) {
    let map = this.weakMap;

    for (let i = 0; i < keys.length; i++) {
      map = map.get(keys[i]) as typeof map;

      if (map === undefined) return false;
    }

    return map.delete(keys[keys.length - 1]);
  }

  dispose() {
    this.weakMap = new WeakMap();
  }
}
