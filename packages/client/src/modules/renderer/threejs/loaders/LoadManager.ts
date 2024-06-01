import type { Loader } from './Loader.js';

export class LoadManager {
  onStart?: LoadManager.OnStart;
  isLoading: boolean = false;
  loaded: number = 0;
  total: number = 0;
  urlModifier: LoadManager.UrlModifier | undefined;
  loaders = new Map<RegExp, Loader>();

  constructor(
    public onLoad?: LoadManager.OnLoad,
    public onProgress?: LoadManager.OnProgress,
    public onError?: LoadManager.OnError,
  ) {
    this.onStart = undefined;
  }

  itemStart(url: string): void {
    this.total++;
    if (!this.isLoading) this.onStart?.(url, this.loaded, this.total);
    this.isLoading = true;
  }

  itemEnd(url: string): void {
    ++this.loaded;

    this.onProgress?.(url, this.loaded, this.total);

    if (this.loaded === this.total) {
      this.isLoading = false;

      this.onLoad?.();
    }
  }

  itemError(url: string): void {
    this.onError?.(url);
  }

  setURLModifier(modifier?: LoadManager.UrlModifier): this {
    this.urlModifier = modifier;

    return this;
  }

  resolveURL(url: string): string {
    return this.urlModifier?.(url) ?? url;
  }

  addHandler(regex: RegExp, loader: Loader): this {
    this.loaders.set(regex, loader);
    return this;
  }

  removeHandler(regex: RegExp): this {
    if (this.loaders.has(regex)) this.loaders.delete(regex);
    return this;
  }

  getHandler(content: string): Loader | null {
    for (const [regex, loader] of this.loaders.entries()) {
      if (regex.test(content)) return loader;
    }

    return null;
  }
}

export namespace LoadManager {
  export type UrlModifier = (url: string) => string;
  export type OnError = (url: string) => void;
  export type OnProgress = (url: string, loaded: number, total: number) => void;
  export type OnStart = OnProgress;
  export type OnLoad = () => void;
}

export const loadManager = new LoadManager();
