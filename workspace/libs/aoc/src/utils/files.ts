import { Result } from "../types/result.ts";
import { Str } from "./str.ns.ts";

const FileError = "Failed to fetch file: File does not exist.";
const HtmlError = "Failed to fetch file: File is HTML.";

export namespace Files {
  const htmlRe = /<!DOCTYPE html>/;

  export const text = async (url: URL): Promise<Result<string, string>> => {
    const response = await fetch(url);

    if (!response.ok) return Result.err(FileError);

    const text = await response.text();
    if (htmlRe.test(text)) return Result.err(HtmlError);

    return Result.ok(text);
  };

  export const lines = (url: URL): Promise<Result<string[], string>> => Result.amap(Files.text(url), Str.lines);
}
