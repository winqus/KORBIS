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

export function duplicateElements<T extends Record<string, any>>(
  arr: T[],
  numberOfRepetitions: number,
  keyPropertyName: keyof T,
): T[] {
  return arr
    .flatMap((element) =>
      Array.from({ length: numberOfRepetitions }, () => element),
    )
    .map((element, index) => ({
      ...element,
      [keyPropertyName]: `${element[keyPropertyName]}-${index}`,
    }));
}
