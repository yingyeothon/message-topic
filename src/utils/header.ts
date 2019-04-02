export const header = (headers: { [name: string]: string }, key: string) =>
  (
    headers[key] ||
    headers[key.toLowerCase()] ||
    headers[key.toUpperCase()] ||
    ''
  ).trim();
