import { createSearchSignal } from '@logic/Search/createSearchSignal.js';
import { identity } from '@utils/identity.js';

export const createSearchString = (param: string, fallback: string) =>
  createSearchSignal(param, fallback, identity, identity);
