import { spy, stub } from "https://deno.land/std@0.181.0/testing/mock.ts";
import {
  assertEquals,
  assertExists,
  assertRejects,
} from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { WeaviateV2ItemsRepository } from "../../../_shared/repositories/WeaviateV2ItemsRepository.ts";
import { Item } from "../../../_shared/entities/Item.ts";
import { File } from "../../../_shared/entities/File.ts";
import { DocumentNotFoundError } from "../../../_shared/errors/DocumentNotFoundError.ts";

Deno.test("WeaviateV2ItemsRepository", async (t) => {
  await t.step("should create repository instance", () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);
    assertExists(repo);
  });

  await t.step("should create an item", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    const newItem = await repo.create({
      name: "Test Item",
      description: "Test Description",
      ownerId: "user123",
      quantity: 1,
    });

    assertEquals(newItem.id, "test-id");
    assertEquals(newItem.name, "Test Item");
    assertEquals(newItem.description, "Test Description");
    assertEquals(newItem.type, "item");
  });

  await t.step("should create an item with image", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    const newItem = await repo.createWithImage({
      name: "Test Item with Image",
      description: "Test Description",
      ownerId: "user123",
      quantity: 1,
    }, "base64image");

    assertEquals(newItem.id, "test-id");
    assertEquals(newItem.name, "Test Item");
    assertEquals(newItem.imageId, "test-uuid");
  });

  await t.step(
    "should handle class not found error during createWithImage",
    async () => {
      const mockClient = createMockWeaviateClient();
      const repo = new WeaviateV2ItemsRepository(mockClient as any);

      let initCalled = false;
      stub(
        mockClient.data.creator().withClassName().withProperties(),
        "do",
        () => {
          if (!initCalled) {
            initCalled = true;
            return Promise.reject(
              new Error(
                'Error: usage error (422): {"error":[{"message":"invalid object: class \\"Item\\" not found in schema"}]}',
              ),
            );
          }
          return Promise.resolve({
            id: "test-id",
            properties: {
              name: "Test Item with Image",
              description: "Test Description",
              ownerId: "user123",
              type: "item",
              imageId: "test-uuid",
            },
          });
        },
      );

      let initializeClassCalled = false;
      stub(repo, "initializeClass" as any, async () => {
        initializeClassCalled = true;
        return Promise.resolve();
      });

      const newItem = await repo.createWithImage({
        name: "Test Item with Image",
        description: "Test Description",
        ownerId: "user123",
        quantity: 1,
      }, "base64image");

      assertEquals(newItem.id, "test-id");
      assertEquals(newItem.name, "Test Item");
      assertEquals(initializeClassCalled, false);
    },
  );

  await t.step("should find an item by id", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    const item = await repo.findById("test-id");

    assertExists(item);
    assertEquals(item!.id, "test-id");
    assertEquals(item!.name, "Test Item");
  });

  await t.step("should paginate items", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    const items = await repo.paginate({ ownerId: "user123" });

    assertEquals(items.length, 2);
    assertEquals(items[0].id, "test-id-1");
    assertEquals(items[1].id, "test-id-2");
  });

  await t.step("should paginate items with parentId filter", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    // Fix the mock graphql chain to correctly implement all required methods
    const mockGraphqlChain = {
      withClassName: () => mockGraphqlChain,
      withFields: () => mockGraphqlChain,
      withLimit: () => mockGraphqlChain,
      withOffset: () => mockGraphqlChain,
      withSort: () => mockGraphqlChain,
      withWhere: () => mockGraphqlChain,
      withHybrid: () => mockGraphqlChain,
      withNearImage: () => mockGraphqlChain,
      do: () =>
        Promise.resolve({
          data: {
            Get: {
              Item: [
                {
                  id: "test-id-1",
                  properties: {
                    name: "Test Item 1",
                    description: "Test Description 1",
                    ownerId: "user123",
                    type: "item",
                    quantity: 1,
                  },
                  _additional: {
                    id: "test-id-1",
                    creationTimeUnix: 1678901234,
                  },
                },
                {
                  id: "test-id-2",
                  properties: {
                    name: "Test Item 2",
                    description: "Test Description 2",
                    ownerId: "user123",
                    type: "item",
                    quantity: 2,
                  },
                  _additional: {
                    id: "test-id-2",
                    creationTimeUnix: 1678901233,
                  },
                },
              ],
            },
          },
        }),
    };

    stub(mockClient.graphql, "get", () => mockGraphqlChain as any);
    const withWhereSpy = spy(mockGraphqlChain, "withWhere");

    await repo.paginate({ ownerId: "user123", parentId: "parent123" });

    assertEquals(withWhereSpy.calls.length, 2);

    withWhereSpy.restore();
  });

  await t.step("should handle errors in paginate", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    // Create a mock query chain that throws an error
    const mockGraphqlChain = {
      withClassName: () => mockGraphqlChain,
      withFields: () => mockGraphqlChain,
      withLimit: () => mockGraphqlChain,
      withOffset: () => mockGraphqlChain,
      withSort: () => mockGraphqlChain,
      withWhere: () => mockGraphqlChain,
      withHybrid: () => mockGraphqlChain,
      withNearImage: () => mockGraphqlChain,
      do: () => Promise.reject(new Error("Graphql error")),
    };

    stub(mockClient.graphql, "get", () => mockGraphqlChain);

    const errorLogSpy = spy(console, "error");

    const items = await repo.paginate({ ownerId: "user123" });

    assertEquals(items.length, 0);
    assertEquals(errorLogSpy.calls.length > 0, true);

    errorLogSpy.restore();
  });

  await t.step("should find all items", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    // Create a mock query chain for findAll
    const mockFindAllQuery = {
      withClassName: () => mockFindAllQuery,
      withFields: () => mockFindAllQuery,
      withLimit: () => mockFindAllQuery,
      withOffset: () => mockFindAllQuery,
      do: () =>
        Promise.resolve({
          data: {
            Get: {
              Item: [
                {
                  id: "test-id-1",
                  properties: {
                    name: "Test Item 1",
                    description: "Test Description 1",
                    ownerId: "user123",
                    type: "item",
                    quantity: 1,
                  },
                  _additional: {
                    id: "test-id-1",
                  },
                },
                {
                  id: "test-id-2",
                  properties: {
                    name: "Test Item 2",
                    description: "Test Description 2",
                    ownerId: "user123",
                    type: "item",
                    quantity: 2,
                  },
                  _additional: {
                    id: "test-id-2",
                  },
                },
              ],
            },
          },
        }),
    };

    stub(mockClient.graphql, "get", () => mockFindAllQuery as any);

    const items = await repo.findAll();

    assertEquals(items.length, 2);
    assertEquals(items[0].id, "test-id-1");
    assertEquals(items[1].id, "test-id-2");
  });

  await t.step("should search items by text", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    // Build a complete mock for the graphql query chain for text search
    const mockSearchTextChain = {
      withClassName: () => mockSearchTextChain,
      withFields: () => mockSearchTextChain,
      withHybrid: () => mockSearchTextChain,
      withLimit: () => mockSearchTextChain,
      withWhere: () => mockSearchTextChain,
      do: () =>
        Promise.resolve({
          data: {
            Get: {
              Item: [
                {
                  id: "test-id-1",
                  properties: {
                    name: "Test Item 1",
                    description: "Test Description 1",
                    ownerId: "user123",
                    type: "item",
                    quantity: 1,
                  },
                  _additional: {
                    id: "test-id-1",
                    score: 0.9,
                  },
                },
                {
                  id: "test-id-2",
                  properties: {
                    name: "Test Item 2",
                    description: "Test Description 2",
                    ownerId: "user123",
                    type: "item",
                    quantity: 2,
                  },
                  _additional: {
                    id: "test-id-2",
                    score: 0.8,
                  },
                },
              ],
            },
          },
        }),
    };

    stub(mockClient.graphql, "get", () => mockSearchTextChain as any);

    const items = await repo.search({ queryText: "test", ownerId: "user123" });

    assertEquals(items.length, 2);
    assertEquals(items[0].id, "test-id-1");
    assertEquals(items[0].score, 0.9);
    assertEquals(items[1].id, "test-id-2");
    assertEquals(items[1].score, 0.8);
  });

  await t.step("should search items by image", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    // Build a complete mock for the graphql query chain for image search
    const mockSearchImageChain = {
      withClassName: () => mockSearchImageChain,
      withFields: () => mockSearchImageChain,
      withNearImage: () => mockSearchImageChain,
      withLimit: () => mockSearchImageChain,
      withWhere: () => mockSearchImageChain,
      do: () =>
        Promise.resolve({
          data: {
            Get: {
              Item: [
                {
                  id: "test-id-1",
                  properties: {
                    name: "Test Item 1",
                    description: "Test Description 1",
                    ownerId: "user123",
                    type: "item",
                    quantity: 1,
                  },
                  _additional: {
                    id: "test-id-1",
                    distance: 0.2,
                  },
                },
              ],
            },
          },
        }),
    };

    stub(mockClient.graphql, "get", () => mockSearchImageChain as any);

    const items = await repo.search({
      queryImageBase64: "base64image",
      ownerId: "user123",
    });

    assertEquals(items.length, 1);
    assertEquals(items[0].id, "test-id-1");
    assertEquals(items[0].score, 0.8); // 1 - distance
  });

  await t.step("should search items by text and image", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    let searchType = "";

    // Create a combined mock for both text and image search
    const mockCombinedSearchChain = {
      withClassName: () => mockCombinedSearchChain,
      withFields: () => mockCombinedSearchChain,
      withHybrid: () => {
        searchType = "text";
        return mockCombinedSearchChain;
      },
      withNearImage: () => {
        searchType = "image";
        return mockCombinedSearchChain;
      },
      withLimit: () => mockCombinedSearchChain,
      withWhere: () => mockCombinedSearchChain,
      do: () => {
        if (searchType === "text") {
          return Promise.resolve({
            data: {
              Get: {
                Item: [
                  {
                    id: "test-id-1",
                    properties: {
                      name: "Test Item 1",
                      description: "Test Description 1",
                      ownerId: "user123",
                      type: "item",
                      quantity: 1,
                    },
                    _additional: {
                      id: "test-id-1",
                      score: 0.9,
                    },
                  },
                  {
                    id: "test-id-2",
                    properties: {
                      name: "Test Item 2",
                      description: "Test Description 2",
                      ownerId: "user123",
                      type: "item",
                      quantity: 2,
                    },
                    _additional: {
                      id: "test-id-2",
                      score: 0.8,
                    },
                  },
                ],
              },
            },
          });
        } else {
          return Promise.resolve({
            data: {
              Get: {
                Item: [
                  {
                    id: "test-id-1",
                    properties: {
                      name: "Test Item 1",
                      description: "Test Description 1",
                      ownerId: "user123",
                      type: "item",
                      quantity: 1,
                    },
                    _additional: {
                      id: "test-id-1",
                      distance: 0.2,
                    },
                  },
                ],
              },
            },
          });
        }
      },
    };

    stub(mockClient.graphql, "get", () => mockCombinedSearchChain as any);

    const items = await repo.search({
      queryText: "test",
      queryImageBase64: "base64image",
      ownerId: "user123",
    });

    assertEquals(items.length, 2);
    assertEquals(items[0].id, "test-id-1");
    assertEquals(items[0].score, 0.9);
  });

  await t.step("should throw error when search has no query", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    await assertRejects(
      async () => await repo.search({} as any),
      Error,
      "Either queryText or queryImageBase64 must be provided",
    );
  });

  await t.step("should add a file to an item", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    stub(repo, "findById", () =>
      Promise.resolve({
        id: "test-id",
        name: "Test Item",
        description: "Test Description",
        ownerId: "user123",
        type: "item" as const,
        quantity: 1,
        files: [],
      } as Item));

    const fileData = {
      id: "file-id",
      name: "test.txt",
      originalName: "test.txt",
      fileUrl: "https://example.com/test.txt",
      mimeType: "text/plain",
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    const file = await repo.addFile("test-id", fileData);

    assertEquals(file.id, "file-id");
    assertEquals(file.name, "test.txt");
    assertEquals(file.fileUrl, "https://example.com/test.txt");
  });

  await t.step(
    "should throw DocumentNotFoundError when item not found during addFile",
    async () => {
      const mockClient = createMockWeaviateClient();
      const repo = new WeaviateV2ItemsRepository(mockClient as any);

      stub(repo, "findById", () => Promise.resolve(null));

      const fileData = {
        id: "file-id",
        name: "test.txt",
        originalName: "test.txt",
        fileUrl: "https://example.com/test.txt",
        mimeType: "text/plain",
        size: 1024,
        createdAt: new Date().toISOString(),
      };

      await assertRejects(
        async () => await repo.addFile("non-existent-id", fileData),
        DocumentNotFoundError,
      );
    },
  );

  await t.step("should delete a file from an item", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    const fileToDelete = {
      id: "file-id",
      name: "test.txt",
      originalName: "test.txt",
      fileUrl: "https://example.com/test.txt",
      mimeType: "text/plain",
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    stub(repo, "findById", () =>
      Promise.resolve({
        id: "test-id",
        name: "Test Item",
        description: "Test Description",
        ownerId: "user123",
        type: "item" as const,
        quantity: 1,
        files: [fileToDelete as File],
      } as Item));

    await repo.deleteFile("test-id", "file-id");
  });

  await t.step(
    "should throw DocumentNotFoundError when file not found during deleteFile",
    async () => {
      const mockClient = createMockWeaviateClient();
      const repo = new WeaviateV2ItemsRepository(mockClient as any);

      stub(repo, "findById", () =>
        Promise.resolve({
          id: "test-id",
          name: "Test Item",
          description: "Test Description",
          ownerId: "user123",
          type: "item" as const,
          quantity: 1,
          files: [],
        } as Item));

      await assertRejects(
        async () => await repo.deleteFile("test-id", "non-existent-file-id"),
        DocumentNotFoundError,
      );
    },
  );

  await t.step(
    "should throw DocumentNotFoundError when file undefined during deleteFile",
    async () => {
      const mockClient = createMockWeaviateClient();
      const repo = new WeaviateV2ItemsRepository(mockClient as any);

      stub(repo, "findById", () => Promise.resolve(undefined as any));

      await assertRejects(
        async () => await repo.deleteFile("test-id", "non-existent-file-id"),
        DocumentNotFoundError,
      );
    },
  );

  await t.step("should get files from an item", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ItemsRepository(mockClient as any);

    const files = [
      {
        id: "file-id-1",
        name: "test1.txt",
        originalName: "test1.txt",
        fileUrl: "https://example.com/test1.txt",
        mimeType: "text/plain",
        size: 1024,
        createdAt: new Date().toISOString(),
      },
      {
        id: "file-id-2",
        name: "test2.txt",
        originalName: "test2.txt",
        fileUrl: "https://example.com/test2.txt",
        mimeType: "text/plain",
        size: 2048,
        createdAt: new Date().toISOString(),
      },
    ] as File[];

    stub(repo, "findById", () =>
      Promise.resolve({
        id: "test-id",
        name: "Test Item",
        description: "Test Description",
        ownerId: "user123",
        type: "item" as const,
        quantity: 1,
        files: files,
      } as Item));

    const retrievedFiles = await repo.getFiles("test-id");

    assertEquals(retrievedFiles.length, 2);
    assertEquals(retrievedFiles[0].id, "file-id-1");
    assertEquals(retrievedFiles[1].id, "file-id-2");
  });

  await t.step(
    "should throw DocumentNotFoundError when item not found during getFiles",
    async () => {
      const mockClient = createMockWeaviateClient();
      const repo = new WeaviateV2ItemsRepository(mockClient as any);

      stub(repo, "findById", () => Promise.resolve(null));

      await assertRejects(
        async () => await repo.getFiles("non-existent-id"),
        DocumentNotFoundError,
      );
    },
  );
});

function createMockWeaviateClient() {
  const mockHybridQuery = {
    withFields: () => ({
      withLimit: () => ({
        withWhere: () => ({
          do: () =>
            Promise.resolve({
              data: {
                Get: {
                  Item: [
                    {
                      id: "test-id-1",
                      properties: {
                        name: "Test Item 1",
                        description: "Test Description 1",
                        ownerId: "user123",
                        type: "item",
                        quantity: 1,
                      },
                      _additional: {
                        id: "test-id-1",
                        score: 0.9,
                      },
                    },
                    {
                      id: "test-id-2",
                      properties: {
                        name: "Test Item 2",
                        description: "Test Description 2",
                        ownerId: "user123",
                        type: "item",
                        quantity: 2,
                      },
                      _additional: {
                        id: "test-id-2",
                        score: 0.8,
                      },
                    },
                  ],
                },
              },
            }),
        }),
      }),
    }),
  };

  const mockNearImageQuery = {
    withFields: () => ({
      withLimit: () => ({
        withWhere: () => ({
          do: () =>
            Promise.resolve({
              data: {
                Get: {
                  Item: [
                    {
                      id: "test-id-1",
                      properties: {
                        name: "Test Item 1",
                        description: "Test Description 1",
                        ownerId: "user123",
                        type: "item",
                        quantity: 1,
                      },
                      _additional: {
                        id: "test-id-1",
                        distance: 0.2,
                      },
                    },
                  ],
                },
              },
            }),
        }),
      }),
    }),
  };

  const mockGraphqlQuery = {
    withClassName: () => ({
      withFields: () => ({
        withLimit: () => ({
          withOffset: () => ({
            withSort: () => ({
              withWhere: () => ({
                do: () =>
                  Promise.resolve({
                    data: {
                      Get: {
                        Item: [
                          {
                            id: "test-id-1",
                            properties: {
                              name: "Test Item 1",
                              description: "Test Description 1",
                              ownerId: "user123",
                              type: "item",
                              quantity: 1,
                            },
                            _additional: {
                              id: "test-id-1",
                              score: 0.9,
                              distance: 0.2,
                              creationTimeUnix: 1678901234,
                            },
                          },
                          {
                            id: "test-id-2",
                            properties: {
                              name: "Test Item 2",
                              description: "Test Description 2",
                              ownerId: "user123",
                              type: "item",
                              quantity: 2,
                            },
                            _additional: {
                              id: "test-id-2",
                              score: 0.8,
                              distance: 0.3,
                              creationTimeUnix: 1678901233,
                            },
                          },
                        ],
                      },
                    },
                  }),
              }),
            }),
          }),
        }),
      }),
      withHybrid: () => mockHybridQuery,
      withNearImage: () => mockNearImageQuery,
    }),
    withHybrid: () => mockHybridQuery,
    withNearImage: () => mockNearImageQuery,
  };

  return {
    data: {
      creator: () => ({
        withClassName: () => ({
          withProperties: () => ({
            do: () =>
              Promise.resolve({
                id: "test-id",
                properties: {
                  name: "Test Item",
                  description: "Test Description",
                  ownerId: "user123",
                  type: "item",
                  imageId: "test-uuid",
                },
              }),
          }),
        }),
      }),
      getterById: () => ({
        withClassName: () => ({
          withId: () => ({
            do: () =>
              Promise.resolve({
                id: "test-id",
                properties: {
                  name: "Test Item",
                  description: "Test Description",
                  ownerId: "user123",
                  type: "item",
                  quantity: 1,
                },
              }),
          }),
        }),
      }),
      merger: () => ({
        withClassName: () => ({
          withId: () => ({
            withProperties: () => ({
              do: () => Promise.resolve({}),
            }),
          }),
        }),
        withId: () => ({
          withClassName: () => ({
            withProperties: () => ({
              do: () => Promise.resolve({}),
            }),
          }),
        }),
      }),
      deleter: () => ({
        withClassName: () => ({
          withId: () => ({
            do: () => Promise.resolve({}),
          }),
        }),
      }),
    },
    graphql: {
      get: () => mockGraphqlQuery,
    },
    schema: {
      classCreator: () => ({
        withClass: () => ({
          do: () => Promise.resolve({}),
        }),
      }),
    },
  };
}
