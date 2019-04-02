export const inspect = (...prefix: any[]) => <T>(arg: T) => {
  console.log(...prefix, arg);
  return arg;
};

export const inspectError = (...prefix: string[]) => <E>(error: E) => {
  console.error(...prefix, error);
  throw error;
};
