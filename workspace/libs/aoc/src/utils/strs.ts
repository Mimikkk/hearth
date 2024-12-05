export namespace Str {
  const newlineRe = /\r\n|\r|\n/;
  const startNewlineRe = /^\r\n|\r|\n/;
  export const trim = (value: string): string => value.trim();
  export const lines = (value: string): string[] => {
    const lines = value.split(newlineRe);
    if (lines[lines.length - 1] === "") lines.pop();
    return lines;
  };

  export const trimlines = (strings: TemplateStringsArray, ...values: unknown[]): string => {
    const str = String.raw({ raw: strings }, ...values).replace(startNewlineRe, "");
    const lines = Str.lines(str);

    let leftOffset = 0;
    for (let i = 0; i < lines.length; ++i) {
      const line = lines[i];

      const spaces = line.length - line.trimStart().length;
      if (spaces > leftOffset) leftOffset = spaces;
    }

    return lines
      .map((line) => line.trimEnd().substring(leftOffset))
      .join("\n")
      .trimEnd();
  };
}
