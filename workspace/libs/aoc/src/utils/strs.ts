export namespace Str {
  const lineRe = /\r\n|\r|\n/;

  export const trim = (value: string): string => value.trim();
  export const lines = (value: string): string[] => {
    const lines = value.split(lineRe);
    if (lines[lines.length - 1] === "") lines.pop();
    return lines;
  };
}
