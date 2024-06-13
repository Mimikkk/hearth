export namespace Cache {
  type Key = PropertyKey;
  type Value = any;
  type FileMap = Map<Key, Value>;

  const files: FileMap = new Map();
  let enabled = false;

  export function add(key: Key, file: Value): FileMap {
    if (!enabled) return files;

    files.set(key, file);

    return files;
  }

  export function get(key: Key): Value | undefined {
    return enabled ? files.get(key) : undefined;
  }

  export function remove(key: Key): FileMap {
    files.delete(key);
    return files;
  }

  export function clear(): FileMap {
    files.clear();
    return files;
  }
}
