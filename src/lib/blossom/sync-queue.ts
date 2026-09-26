export type AsyncTask = () => Promise<void>;

export function createSerialQueue() {
  let tail: Promise<void> = Promise.resolve();

  return {
    enqueue(task: AsyncTask): Promise<void> {
      const run = tail.then(task);
      tail = run.catch(() => undefined);
      return run;
    },
  };
}
