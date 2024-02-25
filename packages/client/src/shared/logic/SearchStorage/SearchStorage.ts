import { createSearchStorageBoolean } from '@logic/SearchStorage/createSearchStorageBoolean.js';
import { createSearchStorageString } from '@logic/SearchStorage/createSearchStorageString.js';

export namespace SearchStorage {
  export const bool = createSearchStorageBoolean;
  export const text = createSearchStorageString;
}
