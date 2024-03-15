import { createContext } from '@logic/createContext.js';
import { createSearchString } from '@logic/Search/createSearchString.js';
import { ExampleNs } from '@modules/managment/exampleNs.js';
import { Example } from '@modules/renderer/examples/examples.js';

export const [useContent, ContentProvider] = createContext(() => {
  const [selected, select] = createSearchString<Example>(ExampleNs.Search.SelectedId);

  return {
    selected,
    select,
  };
});
