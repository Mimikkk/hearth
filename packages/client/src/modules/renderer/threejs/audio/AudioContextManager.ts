let _context: AudioContext | undefined = undefined;

export class AudioContextManager {
  static getContext(): AudioContext {
    if (_context === undefined) _context = new window.AudioContext();
    return _context;
  }

  static setContext(value: AudioContext): void {
    _context = value;
  }
}
