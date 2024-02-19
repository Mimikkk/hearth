import { createContext } from '@logic/createContext.js';

export const [useContent, ContentProvider] = createContext(() => {
  return {};
});
