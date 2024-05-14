export class DataMap<K extends WeakKey, V extends {}> {
  data: WeakMap<K, V> = new WeakMap();

  get<T extends V>(object: K): T {
    let map = this.data.get(object);

    if (map === undefined) {
      map = {} as V;

      this.data.set(object, map);
    }

    return map as T;
  }

  delete<T extends V>(object: K): T | undefined {
    let map;

    if (this.data.has(object)) {
      map = this.data.get(object);

      this.data.delete(object);
    }

    return map as T | undefined;
  }

  has(object: K): boolean {
    return this.data.has(object);
  }

  dispose(): void {
    this.data = new WeakMap();
  }
}

export default DataMap;
