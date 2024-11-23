export namespace Str {
  const lineRe = /\r\n|\r|\n/;

  export const trim = (value: string): string => value.trim();
  export const lines = (value: string): string[] => value.split(lineRe).map(trim);
}
