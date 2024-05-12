declare module '*?raw' {
  const content: string;
  export default content;
}

declare module '*?worker' {
  const content: new () => Worker;
  export default content;
}

declare module '*?arraybuffer' {
  const content: ArrayBuffer;
  export default content;
}
