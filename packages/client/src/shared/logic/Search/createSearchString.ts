import { createSearchSignal } from '@logic/Search/createSearchSignal.js';
import { identity } from '@utils/identity.js';

export const createSearchString = <const T extends string>(param: string, fallback: T = '' as T) =>
  createSearchSignal<T>(param, fallback, identity, identity<T>);
