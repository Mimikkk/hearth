import { createContext } from '@logic/createContext.js';
import { createSearchString } from '@logic/Search/createSearchString.js';
import { Example } from '@modules/managment/example.js';

export const [useContent, ContentProvider] = createContext(
  () => {
    const [selected, select] = createSearchString(Example.Search.SelectedId);

    return {
      selected,
      select,
    };
  },
  {
    selected: () => '',
    select: () => {},
  },
);
