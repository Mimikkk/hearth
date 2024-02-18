export namespace Storage {
  export const read = <T>(key: string, fallback: T): T => {
    const value = localStorage.getItem(key);

    return value === null || value === undefined || value === 'undefined' ? fallback : JSON.parse(value);
  };

  export const set = <T>(key: string, value: T): void => localStorage.setItem(key, JSON.stringify(value));

  export const clear = (key: string): void => localStorage.removeItem(key);
}
