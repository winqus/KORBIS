export const isLocalEnv = () => Deno.env.get("SUPABASE_URL") === "http://kong:8000";

export const correctLocalPublicUrl = (url: string) => url.replace("http://kong:8000", "http://127.0.0.1:54321");

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
