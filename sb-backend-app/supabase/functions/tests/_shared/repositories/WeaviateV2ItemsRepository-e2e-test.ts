import {
  assert,
  assertEquals,
  assertExists,
  assertGreater,
} from "jsr:@std/assert";
import { WeaviateV2ItemsRepository } from "../../../_shared/repositories/WeaviateV2ItemsRepository.ts";
import { createWeaviateClientV2 } from "../../../_shared/drivers/weaviateDriver.ts";
import { generateUuid5 } from "weaviate-ts-client";

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
      ownerId: generateUuid5("test-owner-id"), 
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

Deno.test(
  "Finds item by ID",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    const repo = new WeaviateV2ItemsRepository(client);
    const item = await repo.create({
      ownerId: generateUuid5("test-owner-id"),
      name: "Test Item",
      description: "This is a test item",
    });
    const foundItem = await repo.findById(item.id);
    assert(foundItem, "Item should be found");
    assertEquals(foundItem.id, item.id, "Item ID should match");
    assertGreater(foundItem.name.length, 0, "Item name should not be empty");
    assertGreater(
      foundItem.description.length,
      0,
      "Item description should not be empty",
    );
  },
);

Deno.test(
  "Updates item by ID",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    const repo = new WeaviateV2ItemsRepository(client);
    const item = await repo.create({
      ownerId: generateUuid5("test-owner-id"),
      name: "Test Item",
      description: "This is a test item",
    });
    const updatedItem = await repo.update(item.id, {
      name: "Updated Test Item",
      description: "This is an updated test item",
    });
    assert(updatedItem, "Item should be updated");
    assertEquals(
      updatedItem.name,
      "Updated Test Item",
      "Item name should match",
    );
    assertEquals(
      updatedItem.description,
      "This is an updated test item",
      "Item description should match",
    );
  },
);

Deno.test("Gets paginated items", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const repo = new WeaviateV2ItemsRepository(client);
  const items = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      repo.create({
        ownerId: generateUuid5("test-owner-id"),
        name: `Test Item ${i}`,
        description: `This is test item ${i}`,
      })),
  );

  const paginatedItems = await repo.paginate({
    limit: 3,
    skip: 0,
  });
  const paginatedItemsIds = paginatedItems.map((item) => item.id);

  const paginatedItems2 = await repo.paginate({
    limit: 3,
    skip: 3,
  });
  const paginatedItems2Ids = paginatedItems2.map((item) => item.id);

  const allIds = new Set([...paginatedItemsIds, ...paginatedItems2Ids]);

  assertEquals(paginatedItems.length, 3, "Should return 3 items");
  assert(allIds.size === items.length, "Should return 6 unique items");
});

Deno.test("Deletes item by ID", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const repo = new WeaviateV2ItemsRepository(client);
  const item = await repo.create({
    ownerId: generateUuid5("test-owner-id"),
    name: "Test Item for deletion",
    description: "This is a test item",
  });
  await repo.delete(item.id);

  const foundItem = await repo.findById(item.id);

  assert(!foundItem, "Item should be deleted");
});
