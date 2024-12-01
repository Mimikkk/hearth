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

  export const amap = async <T, E, R>(result: Promise<Result<T, E>>, fn: (value: T) => R) => {
    const r = await result;
    return r.ok ? ok(await fn(r.value)) : err(r.error);
  };

  export const val = <T, E>(result: Result<T, E>): T | undefined => result.ok ? result.value : undefined;
  export const aval = async <T, E>(result: Promise<Result<T, E>>): Promise<T | undefined> => val(await result);
}
