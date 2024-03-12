const countTokens = (string: string): number => {
  let count = 0;

  for (let i = 0, len = string.length; i < len; ++i) if (string[i] !== ' ') ++count;

  return count;
};
export const normalize = (value: string): number => Math.round((1 / Math.sqrt(countTokens(value))) * 1000) / 1000;
export const isStringArray = (values: unknown[]): values is string[] => typeof values[0] === 'string';
