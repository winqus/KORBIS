export function throwIfMissing(
  subject: string,
  obj: Record<string, any>,
  keys: string[],
) {
  const missing = [];
  for (let key of keys) {
    if (!(key in obj) || !obj[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required ${subject}: ${missing.join(", ")}`);
  }
}
