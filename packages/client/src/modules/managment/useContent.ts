import { createContext } from '@logic/createContext.js';
import { createSearchString } from '@logic/Search/createSearchString.js';
import { ExampleNs } from '@modules/managment/exampleNs.js';
import { Example } from '@modules/renderer/examples/examples.js';

const createExampleSearch = () => createSearchString<Example | ''>(ExampleNs.Search.SelectedId);

export const [useContent, ContentProvider] = createContext(() => {
  const [selectedExample, selectExample] = createExampleSearch();

  return { selectedExample, selectExample };
});
