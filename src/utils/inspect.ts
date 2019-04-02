export const printValue = (...prefix: any[]) => <T>(arg: T) => {
  console.log(...prefix, arg);
  return arg;
};

export const printErrorAndRethrow = (...prefix: string[]) => <E>(error: E) => {
  console.error(...prefix, error);
  throw error;
};

export const printErrorAndIgnore = (...prefix: string[]) => <E>(error: E) => {
  console.error(prefix[0], `error`, ...prefix.slice(1), error);
  return undefined;
};

export const printPromiseRethrowError = (...prefix: string[]) => <T>(
  promise: Promise<T>,
) => promise.then(printValue(...prefix)).catch(printErrorAndRethrow(...prefix));

export const printPromiseIgnoreError = (...prefix: string[]) => <T>(
  promise: Promise<T>,
): Promise<T | undefined> =>
  promise.then(printValue(...prefix)).catch(printErrorAndIgnore(...prefix));
