export interface Cloneable<T> {
  clone(): T;
}

export namespace Cloneable {
  export const is = <T>(value: T): value is T & Cloneable<T> =>
    typeof value === 'object' && value !== null && 'clone' in value;
}
