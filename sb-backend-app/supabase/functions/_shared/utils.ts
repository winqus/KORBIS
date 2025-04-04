export const isLocalEnv = () =>
  Deno.env.get("SUPABASE_URL") === "http://kong:8000";

export const correctLocalPublicUrl = (url: string) =>
  url.replace("http://kong:8000", "http://127.0.0.1:54321");

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

export function randomUUID() {
  return crypto.randomUUID();
}

/**
 * Flattens a nested object structure into a single-level object.
 * Handles circular references by marking them in the output.
 *
 * @param {Object} obj - The object to flatten
 * @returns {Object} A flattened representation of the input object
 */
export function flatten(obj: any) {
  const result = {};
  const seenObjects: any[] = [];
  const seenPaths: any[] = [];

  /**
   * Recursively processes each value in the object tree
   *
   * @param {string} path - Current path in the object tree
   * @param {*} value - Value at the current path
   */
  const processValue = (path: any, value: any) => {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      if (path === "") return;
      (result as any)[path] = null;
      return;
    }

    // Handle primitive values
    if (typeof value !== "object") {
      (result as any)[path] = value;
      return;
    }

    // Check for circular references
    const circularIndex = seenObjects.indexOf(value);
    if (circularIndex >= 0) {
      const referencePath = seenPaths[circularIndex] || "this";
      (result as any)[path] = `[Circular (${referencePath})]`;
      return;
    }

    // Track object to detect circular references
    seenObjects.push(value);
    seenPaths.push(path);

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        processValue(`${path}[]`, null);
      } else {
        for (let i = 0; i < value.length; i++) {
          processValue(`${path}[${i}]`, value[i]);
        }
      }
      return;
    }

    // Handle objects
    const keys = Object.keys(value);
    const prefix = path ? `${path}.` : "";

    if (keys.length === 0) {
      processValue(prefix, null);
    } else {
      for (const key of keys) {
        processValue(`${prefix}${key}`, value[key]);
      }
    }
  };

  processValue("", obj);

  return result;
}
