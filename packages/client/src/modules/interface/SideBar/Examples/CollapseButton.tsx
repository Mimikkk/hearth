import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { useContent } from '@modules/managment/useContent.js';

export const CollapseButton = () => {
  const { isCollapsed, toggleCollapsed } = useContent();

  return (
    <ButtonIcon
      variant="text"
      cross={isCollapsed()}
      icon="BiRegularCategory"
      onClick={toggleCollapsed}
      title={isCollapsed() ? 'categorize examples' : 'collapse examples'}
    />
  );
};
