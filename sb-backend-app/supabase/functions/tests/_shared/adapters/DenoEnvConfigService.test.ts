import { stub } from "https://deno.land/std@0.181.0/testing/mock.ts";
import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { DenoEnvConfigService } from "../../../_shared/adapters/DenoEnvConfigService.ts";
import { MissingEnvVariableError } from "../../../_shared/errors/index.ts";

Deno.test("DenoEnvConfigService", async (t) => {
  await t.step("should create an instance", () => {
    const configService = new DenoEnvConfigService();
    assertExists(configService);
  });

  await t.step("get() should return value from environment", () => {
    const configService = new DenoEnvConfigService();
    const envStub = stub(Deno.env, "get", (key: string) => {
      if (key === "TEST_KEY") {
        return "test-value";
      }
      return undefined;
    });

    try {
      const value = configService.get("TEST_KEY");
      assertEquals(value, "test-value");
    } finally {
      envStub.restore();
    }
  });

  await t.step("get() should return null for non-existent key", () => {
    const configService = new DenoEnvConfigService();
    const envStub = stub(Deno.env, "get", () => undefined);

    try {
      const value = configService.get("NON_EXISTENT_KEY");
      assertEquals(value, null);
    } finally {
      envStub.restore();
    }
  });

  await t.step("get() should return null for empty string value", () => {
    const configService = new DenoEnvConfigService();
    const envStub = stub(Deno.env, "get", () => "");

    try {
      const value = configService.get("EMPTY_KEY");
      assertEquals(value, null);
    } finally {
      envStub.restore();
    }
  });

  await t.step("getOrThrow() should return value from environment", () => {
    const configService = new DenoEnvConfigService();
    const envStub = stub(Deno.env, "get", (key: string) => {
      if (key === "REQUIRED_KEY") {
        return "required-value";
      }
      return undefined;
    });

    try {
      const value = configService.getOrThrow("REQUIRED_KEY");
      assertEquals(value, "required-value");
    } finally {
      envStub.restore();
    }
  });

  await t.step("getOrThrow() should throw MissingEnvVariableError for non-existent key", () => {
    const configService = new DenoEnvConfigService();
    const envStub = stub(Deno.env, "get", () => undefined);

    try {
      try {
        configService.getOrThrow("MISSING_KEY");
        assertEquals(true, false, "Expected function to throw but it did not");
      } catch (error: unknown) {
        assertEquals(error instanceof MissingEnvVariableError, true);
        assertEquals((error as MissingEnvVariableError).message, "Missing environment variable: MISSING_KEY");
      }
    } finally {
      envStub.restore();
    }
  });

  await t.step("getOrThrow() should throw MissingEnvVariableError for empty string value", () => {
    const configService = new DenoEnvConfigService();
    const envStub = stub(Deno.env, "get", () => "");

    try {
      try {
        configService.getOrThrow("EMPTY_REQUIRED_KEY");
        assertEquals(true, false, "Expected function to throw but it did not");
      } catch (error: unknown) {
        assertEquals(error instanceof MissingEnvVariableError, true);
        assertEquals((error as MissingEnvVariableError).message, "Missing environment variable: EMPTY_REQUIRED_KEY");
      }
    } finally {
      envStub.restore();
    }
  });

  await t.step("multiple environment variables should work correctly", () => {
    const configService = new DenoEnvConfigService();
    const mockEnv: Record<string, string> = {
      "API_KEY": "secret-api-key",
      "DATABASE_URL": "postgres://user:pass@localhost:5432/db",
      "PORT": "3000",
      "DEBUG": "true",
      "EMPTY_VAR": ""
    };

    const envStub = stub(Deno.env, "get", (key: string) => mockEnv[key]);

    try {
      assertEquals(configService.get("API_KEY"), "secret-api-key");
      assertEquals(configService.get("DATABASE_URL"), "postgres://user:pass@localhost:5432/db");
      assertEquals(configService.get("PORT"), "3000");
      assertEquals(configService.get("DEBUG"), "true");
      assertEquals(configService.get("EMPTY_VAR"), null);
      assertEquals(configService.get("NON_EXISTENT"), null);

      assertEquals(configService.getOrThrow("API_KEY"), "secret-api-key");
      assertEquals(configService.getOrThrow("DATABASE_URL"), "postgres://user:pass@localhost:5432/db");
    } finally {
      envStub.restore();
    }
  });

  await t.step("should handle sequential calls consistently", () => {
    const configService = new DenoEnvConfigService();
    const envStub = stub(Deno.env, "get", (key: string) => {
      if (key === "SEQUENTIAL_KEY") {
        return "sequential-value";
      }
      return undefined;
    });

    try {
      assertEquals(configService.get("SEQUENTIAL_KEY"), "sequential-value");
      assertEquals(configService.get("SEQUENTIAL_KEY"), "sequential-value");
      assertEquals(configService.getOrThrow("SEQUENTIAL_KEY"), "sequential-value");
    } finally {
      envStub.restore();
    }
  });
}); 