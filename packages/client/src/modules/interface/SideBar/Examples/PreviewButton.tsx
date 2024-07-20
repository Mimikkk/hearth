import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { SearchStorage } from '@logic/SearchStorage/SearchStorage.js';
import { ExampleNs } from '@modules/managment/exampleNs.js';

export const PreviewButton = () => {
  const [isPreview, , togglePreview] = SearchStorage.bool(ExampleNs.Search.PreviewId, 'example-preview', true);

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
