import { assert, assertEquals, assertExists } from "jsr:@std/assert";
import { WeaviateV2ItemsRepository } from "../../../_shared/repositories/WeaviateV2ItemsRepository.ts";
import { createWeaviateClientV2 } from "../../../_shared/drivers/weaviateDriver.ts";

const client = createWeaviateClientV2({
  scheme: "http",
  host: "localhost:8080",
  apiKey: "xxxxxxxxxxxxxxxx_myapikey_xxxxxxxxxxxxxxxx",
});

Deno.test("Creates WeaviateV2ItemsRepository", () => {
  const repo = new WeaviateV2ItemsRepository(client);
  assertExists(repo);
});

Deno.test(
  "Creates new item",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    const repo = new WeaviateV2ItemsRepository(client);
    const item = await repo.create({
      name: "Test Item",
      description: "This is a test item",
    });
    assert(item.id, "Item's ID should be defined");
    assertEquals(item.name, "Test Item", "Item name should match");
    assertEquals(
      item.description,
      "This is a test item",
      "Item description should match",
    );
  },
);
