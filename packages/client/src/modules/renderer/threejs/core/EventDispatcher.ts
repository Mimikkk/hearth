export interface Event<Type, Target> {
  readonly type: Type;
  target: Target;
}

export type EventListener<Content, Type, Target = unknown> = (event: Readonly<Event<Type, Target> & Content>) => void;

export class EventDispatcher<EventMap extends {}> {
  listeners = new Map<PropertyKey, EventListener<EventMap[keyof EventMap], keyof EventMap>[]>();

  add<T extends keyof EventMap>(type: T, listener: EventListener<EventMap[T], T>): void {
    const listeners = this.listeners.get(type);

    if (listeners === undefined) {
      this.listeners.set(type, [listener]);
    } else if (!listeners.includes(listener)) {
      listeners.push(listener);
    }
  }

  has<T extends keyof EventMap>(type: T, listener: EventListener<EventMap[T], T>): boolean {
    return this.listeners.get(type)?.includes(listener) ?? false;
  }

  remove<T extends keyof EventMap>(type: T, listener: EventListener<EventMap[T], T>): void {
    const listeners = this.listeners.get(type);
    if (listeners === undefined) return;

    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  }

  dispatch<T extends keyof EventMap, Target>(
    event: Omit<Event<T, Target>, 'target'> & EventMap[T],
    target: Target,
  ): void {
    const listeners = this.listeners.get(event.type);
    if (listeners === undefined) return;

    (event as unknown as Event<T, Target>).target = target;
    const array = listeners.slice(0);
    for (let i = 0, it = array.length; i < it; ++i) array[i].call(this, event);
    (event as unknown as Event<T, Target>).target = null!;
  }
}
