import { describe, expect, it } from 'vitest';
import { WorkerPool } from './WorkerPool.ts';

describe('WorkerPool', () => {
  it('should create a WorkerPool', () => {
    const pool = new WorkerPool(() => new Worker('', { type: 'module' }), 4);

    expect(pool).toBeDefined();
    expect(pool.queue).toEqual([]);
    expect(pool.workers).toEqual([]);
    expect(pool.resolvers).toEqual([]);
    expect(pool.status).toBe(0);

    for (let i = 0; i < 4; ++i) {
      pool._toggleStatus(i);
      expect(pool.isWorkerIdle(i)).toBe(false);
      pool._toggleStatus(i);
      expect(pool.isWorkerIdle(i)).toBe(true);

      pool._toggleStatus(i);
      expect(pool.isWorkerIdle(i)).toBe(false);
      pool._toggleStatus(i);
      expect(pool.isWorkerIdle(i)).toBe(true);
    }
  });
});
