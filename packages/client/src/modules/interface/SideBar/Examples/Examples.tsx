import { TextField } from '@components/forms/TextField/TextField.js';
import { onCleanup } from 'solid-js';
import { Search } from '@logic/Search/Search.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { Icon } from '@components/buttons/Icon/Icon.js';
import { createSearchStorageString } from '@logic/SearchStorage/createSearchStorageString.js';

const QueryId = 'query';
const ModeId = 'mode';
export const Examples = () => {
  onCleanup(() => {
    Search.clear(QueryId);
    Search.clear(ModeId);
  });

  const [mode, setMode] = createSearchStorageString(ModeId, 'example-mode', 'none');

  return (
    <div>
      <TextField searchId={QueryId} icon="FaSolidMagnifyingGlass" label="search..." />
      <div class="flex ml-auto">
        <ButtonIcon icon="BiRegularChevronDown" />
        <div class="relative flex">
          <Icon class="absolute left-1/4 self-center text-accent-2 pointer-events-none" name="FaSolidX" />
          <ButtonIcon icon="BiRegularCategory" onClick={() => {}} />
        </div>
      </div>
    </div>
  );
};
