export const debounce = <This, Func extends (this: This, ...args: any) => any>(fn: Func, ms: number) => {
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  let lastCallMs = 0;
  let args: Parameters<Func>;
  let context: This;

  const run = () => {
    const now = Date.now();
    const differenceMs = lastCallMs + ms - now;

    if (differenceMs <= 0) {
      timeoutId = undefined;
      fn.apply(context, args);
      return;
    }
    timeoutId = setTimeout(run, differenceMs);
  };

  return function(this: This, ...passed: Parameters<Func>) {
    args = passed;
    context = this;

    lastCallMs = Date.now();
    if (timeoutId !== undefined) return;
    timeoutId = setTimeout(run, ms);
  };
};
