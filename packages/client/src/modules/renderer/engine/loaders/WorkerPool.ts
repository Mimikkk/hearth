export class WorkerPool<
  Signal extends {
    message: any;
    response: any;
    transfers?: Transferable[];
  },
> {
  queue: {
    resolve: (message: MessageEvent<Signal['response']>) => void;
    message: Signal['message'];
    transfers: Signal['transfers'];
  }[];
  workers: Worker[];
  resolvers: ((message: Signal['message']) => void)[];
  status: number;

  post<S extends Signal>(message: S['message'], transfers?: S['transfers']): Promise<S['response']> {
    return new Promise(resolve => {
      const workerId = this.#findIdleWorkerId();

      if (workerId === undefined) {
        this.queue.push({ resolve, message, transfers });
        return;
      }

      this.#initializeWorker(workerId);
      this.#toggleStatus(workerId);
      this.resolvers[workerId] = resolve;
      this.workers[workerId].postMessage(message, transfers!);
    });
  }

  isWorkerIdle(workerId: number): boolean {
    return !(this.status & (1 << workerId));
  }

  constructor(
    public createWorker: () => Worker,
    public maxPoolId: number,
  ) {
    this.queue = [];
    this.workers = [];
    this.resolvers = [];
    this.status = 0;
  }

  #toggleStatus(workerId: number) {
    this.status ^= 1 << workerId;
  }

  #initializeWorker(workerId: number) {
    if (this.workers[workerId]) return;
    const worker = this.createWorker();

    worker.addEventListener('message', (message: MessageEvent) => {
      this.resolvers[workerId]?.(message);

      if (this.queue.length) {
        const { resolve, message, transfers } = this.queue.shift()!;
        this.resolvers[workerId] = resolve;
        this.workers[workerId].postMessage(message, transfers!);
        return;
      }

      this.#toggleStatus(workerId);
    });

    this.workers[workerId] = worker;
  }

  #findIdleWorkerId(): number | undefined {
    for (let id = 0; id < this.maxPoolId; ++id) if (this.isWorkerIdle(id)) return id;
    return undefined;
  }

  dispose() {
    this.workers.forEach(worker => worker.terminate());
    this.resolvers.length = 0;
    this.workers.length = 0;
    this.queue.length = 0;
    this.status = 0;
  }
}
