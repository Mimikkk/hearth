import { createContext } from '@logic/createContext.js';
import { createSearchString } from '@logic/Search/createSearchString.js';
import { ExampleNs } from '@modules/managment/exampleNs.js';
import { ExampleName } from '@modules/renderer/examples/examples.js';
import { SearchStorage } from '@logic/SearchStorage/SearchStorage.js';

const createExampleSearch = () => createSearchString<ExampleName | ''>(ExampleNs.Search.SelectedId);

export const [useContent, ContentProvider] = createContext(() => {
  const [selectedExample, selectExample] = createExampleSearch();
  const [isCollapsed, , toggleCollapsed] = SearchStorage.bool(ExampleNs.Search.CollapseId, 'example-collapse', false);
  const [showCode, , toggleCode] = SearchStorage.bool(ExampleNs.Search.PreviewId, 'show-code', false);

  return {
    selectedExample,
    selectExample,
    isCollapsed,
    toggleCollapsed,
    showCode,
    toggleCode,
  };
});
