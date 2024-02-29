import { SearchStorage } from '@logic/SearchStorage/SearchStorage.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { Example } from '@modules/managment/example.js';

export const CollapseButton = () => {
  const [isCollapsed, , toggleCollapsed] = SearchStorage.bool(Example.Search.CollapseId, 'example-collapse', false);

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
