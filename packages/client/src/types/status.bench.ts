import { describe, bench } from 'vitest';
import { Status } from './status.js';
import { faker } from '@faker-js/faker';

describe('Types - status', () => {
  const statuses = faker.helpers.arrayElements([Status.Idle, Status.Error, Status.Pending, Status.Success], 1000);

  bench('sum', () => {
    Status.sum(statuses);
  });
});
