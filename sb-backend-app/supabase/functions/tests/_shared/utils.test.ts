import { assertEquals, assertThrows, assertMatch } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import {
  throwIfMissing,
  randomUUID,
  flatten,
  base64StringToArrayBuffer,
  generateUUID5,
  isDefined,
  VisualCode,
  isLocalEnv,
  correctLocalPublicUrl
} from "../../_shared/utils.ts";

Deno.test("isLocalEnv - should return true for local environment", () => {
  const originalUrl = Deno.env.get("SUPABASE_URL");
  Deno.env.set("SUPABASE_URL", "http://kong:8000");
  assertEquals(isLocalEnv(), true);
  if (originalUrl) {
    Deno.env.set("SUPABASE_URL", originalUrl);
  } else {
    Deno.env.delete("SUPABASE_URL");
  }
});

Deno.test("isLocalEnv - should return false for production environment", () => {
  const originalUrl = Deno.env.get("SUPABASE_URL");
  Deno.env.set("SUPABASE_URL", "https://production.com");
  assertEquals(isLocalEnv(), false);
  if (originalUrl) {
    Deno.env.set("SUPABASE_URL", originalUrl);
  } else {
    Deno.env.delete("SUPABASE_URL");
  }
});

Deno.test("correctLocalPublicUrl - should replace kong:8000 with localhost", () => {
  const url = "http://kong:8000/storage/v1/object/public/test.jpg";
  const expected = "http://127.0.0.1:54321/storage/v1/object/public/test.jpg";
  assertEquals(correctLocalPublicUrl(url), expected);
});

Deno.test("throwIfMissing - should throw error for missing required fields", () => {
  const obj = { a: 1, b: "", c: null, d: undefined };
  const keys = ["a", "b", "c", "d", "e"];
  
  assertThrows(
    () => throwIfMissing("test", obj, keys),
    Error,
    "Missing required test: b, c, d, e"
  );
});

Deno.test("throwIfMissing - should not throw error when all fields present", () => {
  const obj = { a: 1, b: "test", c: true };
  const keys = ["a", "b", "c"];
  
  throwIfMissing("test", obj, keys);
});

Deno.test("randomUUID - should generate valid UUID", () => {
  const uuid = randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assertMatch(uuid, uuidRegex);
});

Deno.test("flatten - should flatten nested object", () => {
  const input = {
    a: 1,
    b: {
      c: 2,
      d: {
        e: 3
      }
    },
    f: [4, 5, { g: 6 }]
  };

  const expected = {
    "a": 1,
    "b.c": 2,
    "b.d.e": 3,
    "f[0]": 4,
    "f[1]": 5,
    "f[2].g": 6
  };

  assertEquals(flatten(input), expected);
});

Deno.test("flatten - should handle circular references", () => {
  const obj: any = { a: 1 };
  obj.self = obj;

  const flattened = flatten(obj) as Record<string, unknown>;
  assertEquals(flattened["a"], 1);
  assertEquals(flattened["self"], "[Circular (this)]");
});

Deno.test("flatten - should handle null and undefined values", () => {
  const input = {
    a: null,
    b: undefined,
    c: {
      d: null,
      e: undefined
    }
  };

  const expected = {
    "a": null,
    "b": null,
    "c.d": null,
    "c.e": null
  };

  assertEquals(flatten(input), expected);
});

Deno.test("flatten - should handle empty arrays and objects", () => {
  const input = {
    a: [],
    b: {},
    c: [[], {}]
  };

  const expected = {
    "a[]": null,
    "b.": null,
    "c[0][]": null,
    "c[1].": null
  };

  assertEquals(flatten(input), expected);
});

Deno.test("base64StringToArrayBuffer - should decode base64 string", () => {
  const base64 = "SGVsbG8gV29ybGQ=";
  const buffer = base64StringToArrayBuffer(base64);
  const text = new TextDecoder().decode(buffer);
  assertEquals(text, "Hello World");
});

Deno.test("generateUUID5 - should generate consistent UUID for same input", () => {
  const namespace = "test-namespace";
  const identifier = "test-identifier";
  
  const uuid1 = generateUUID5(identifier, namespace);
  const uuid2 = generateUUID5(identifier, namespace);
  
  assertEquals(uuid1, uuid2);
  assertMatch(uuid1, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

Deno.test("isDefined - should return false for null and undefined", () => {
  assertEquals(isDefined(null), false);
  assertEquals(isDefined(undefined), false);
});

Deno.test("isDefined - should return true for defined values", () => {
  assertEquals(isDefined(0), true);
  assertEquals(isDefined(""), true);
  assertEquals(isDefined(false), true);
  assertEquals(isDefined({}), true);
  assertEquals(isDefined([]), true);
});

Deno.test("VisualCode.generateRandomDigits - should generate string of correct length", () => {
  const length = 4;
  const digits = VisualCode.generateRandomDigits(length);
  assertEquals(digits.length, length);
  
  for (const char of digits) {
    assertEquals(VisualCode.ALLOWED_CHARS.includes(char), true);
  }
});

Deno.test("VisualCode.generateChecksum - should generate consistent checksum", () => {
  const prefix = "KX";
  const digits = "ABCD";
  
  const checksum1 = VisualCode.generateChecksum(prefix, digits);
  const checksum2 = VisualCode.generateChecksum(prefix, digits);
  
  assertEquals(checksum1, checksum2);
  assertEquals(VisualCode.ALLOWED_CHARS.includes(checksum1), true);
});

Deno.test("VisualCode.generateRandomVisualCode - should generate valid code", () => {
  const code = VisualCode.generateRandomVisualCode();
  const pattern = /^[A-Z]{2}-[347ACDEFHKMNPRTUVWXY]{4}-[347ACDEFHKMNPRTUVWXY]$/;
  assertMatch(code, pattern);
});

Deno.test("VisualCode.generateRandomVisualCode - should use custom prefix", () => {
  const prefix = "XX";
  const code = VisualCode.generateRandomVisualCode(prefix);
  assertEquals(code.startsWith(prefix), true);
  assertEquals(code.length, 9);
}); 