export type Ok<T> = {
  ok: true;
  value: T;
};

export type Err<E> = {
  ok: false;
  error: E;
};

export type Result<T, E> = Ok<T> | Err<E>;

export namespace Result {
  export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
  export const err = <E>(error: E): Err<E> => ({ ok: false, error });

  export const map = <T, E, R>(result: Result<T, E>, fn: (value: T) => R) =>
    result.ok ? ok(fn(result.value)) : err(result.error);

  export const amap = async <T, E, R>(result: Promise<Result<T, E>>, fn: (value: T) => R) => map(await result, fn);
}
