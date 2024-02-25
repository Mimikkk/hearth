import { TextField } from '@components/forms/TextField/TextField.js';
import { onCleanup } from 'solid-js';
import { Search } from '@logic/Search/Search.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { SearchStorage } from '@logic/SearchStorage/SearchStorage.js';

const QueryId = 'query';
const ModeId = 'mode';
const PreviewId = 'preview';
const CollapseId = 'collapse';
export const Examples = () => {
  onCleanup(() => {
    Search.clear(QueryId);
    Search.clear(ModeId);
    Search.clear(PreviewId);
    Search.clear(CollapseId);
  });

  const [isPreview, , togglePreview] = SearchStorage.bool(PreviewId, 'example-preview', true);
  const [isCollapsed, , toggleCollapse] = SearchStorage.bool(CollapseId, 'example-collapse', false);

  return (
    <div>
      <TextField searchId={QueryId} icon="FaSolidMagnifyingGlass" label="search..." />
      <div class="flex ml-auto">
        <ButtonIcon crossed={isCollapsed()} icon="BiRegularChevronDown" onClick={toggleCollapse} />
        <ButtonIcon crossed={isPreview()} icon="BiRegularCategory" onClick={togglePreview} />
      </div>
    </div>
  );
};
