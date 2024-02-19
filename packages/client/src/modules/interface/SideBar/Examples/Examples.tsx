import { TextField } from '@components/forms/TextField/TextField.js';
import { onCleanup } from 'solid-js';
import { Search } from '@logic/Search/Search.js';

const SearchId = 'docs-search';
export const Examples = () => {
  onCleanup(() => Search.clear(SearchId));

  return (
    <div>
      <TextField searchId={SearchId} label="search..." />
    </div>
  );
};
