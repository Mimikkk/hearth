export enum Status {
  Idle = 'idle',
  Error = 'error',
  Pending = 'pending',
  Success = 'success',
}

export namespace Status {
  export const isIdle = (statuses: Status[]) => statuses.some(status => status === Status.Idle);
  export const isError = (statuses: Status[]) => statuses.some(status => status === Status.Error);
  export const isPending = (statuses: Status[]) => statuses.some(status => status === Status.Pending);
  export const isSuccess = (statuses: Status[]) => statuses.every(status => status === Status.Success);

  export const sum = (statuses: Status[]) =>
    isError(statuses)
      ? Status.Error
      : isPending(statuses)
      ? Status.Pending
      : isSuccess(statuses)
      ? Status.Success
      : Status.Idle;
}
