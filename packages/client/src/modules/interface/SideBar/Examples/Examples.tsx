import { TextField } from '@components/forms/TextField/TextField.js';
import { onCleanup } from 'solid-js';
import { Search } from '@logic/Search/Search.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { SearchStorage } from '@logic/SearchStorage/SearchStorage.js';

const QueryId = 'query';
const ModeId = 'mode';
const PreviewId = 'preview';
const CollapseId = 'collapse';

const CollapseButton = () => {
  const [isCollapsed, , toggleCollapsed] = SearchStorage.bool(CollapseId, 'example-collapse', false);

  return (
    <ButtonIcon
      variant="text"
      cross={isCollapsed()}
      icon="BiRegularCategory"
      onClick={toggleCollapsed}
      title={isCollapsed() ? 'show all examples' : 'collapse examples'}
    />
  );
};

const PreviewButton = () => {
  const [isPreview, , togglePreview] = SearchStorage.bool(PreviewId, 'example-preview', true);

  return (
    <ButtonIcon
      variant="text"
      cross={isPreview()}
      icon="HiSolidViewfinderCircle"
      onClick={togglePreview}
      title={isPreview() ? 'hide preview image' : 'show preview image'}
    />
  );
};

export const Examples = () => {
  onCleanup(() => {
    Search.clear(QueryId);
    Search.clear(ModeId);
    Search.clear(PreviewId);
    Search.clear(CollapseId);
  });

  return (
    <div class="flex flex-col gap-1">
      <TextField searchId={QueryId} icon="FaSolidMagnifyingGlass" label="search..." />
      <div class="flex ml-auto gap-2">
        <CollapseButton />
        <PreviewButton />
      </div>
    </div>
  );
};
