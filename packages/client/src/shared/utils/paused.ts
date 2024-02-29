export const paused =
  <T extends Event>(fn: (event: T) => void) =>
  (event: T) => {
    event.stopPropagation();
    event.preventDefault();
    fn(event);
  };
