export namespace AudioContextManager {
  let _context: AudioContext | undefined | null;

  export function get(): AudioContext {
    if (!_context) _context = new window.AudioContext();
    return _context;
  }
}
