export const createImage = async (src: string): Promise<HTMLImageElement> => {
  const image = document.createElement('img');

  const wait = new Promise<HTMLImageElement>((resolve, reject) => {
    function clearListeners() {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
    }

    function onLoad() {
      clearListeners();
      resolve(image);
    }

    function onError(event: ErrorEvent) {
      clearListeners();
      reject(event);
      throw Error(`Failed to load image: '${src}'`);
    }

    image.addEventListener('load', onLoad);
    image.addEventListener('error', onError);
  });
  image.src = src;

  return wait;
};
