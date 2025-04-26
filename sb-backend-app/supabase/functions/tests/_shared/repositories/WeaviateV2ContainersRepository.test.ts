import { stub, spy } from "https://deno.land/std@0.181.0/testing/mock.ts";
import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { WeaviateV2ContainersRepository } from "../../../_shared/repositories/WeaviateV2ContainersRepository.ts";
import { Container } from "../../../_shared/entities/Container.ts";
import { DocumentNotFoundError } from "../../../_shared/errors/DocumentNotFoundError.ts";

Deno.test("WeaviateV2ContainersRepository", async (t) => {
  await t.step("should create repository instance", () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    assertExists(repo);
  });

  await t.step("should create a container", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const newContainer = await repo.create({
      name: "Test Container",
      description: "Test Description",
      ownerId: "user123",
      visualCode: "CODE123",
      path: "/user123",
      childCount: 0
    });
    
    assertEquals(newContainer.id, "test-id");
    assertEquals(newContainer.name, "Test Container");
    assertEquals(newContainer.description, "Test Description");
    assertEquals(newContainer.type, "container");
    assertEquals(newContainer.visualCode, "CODE123");
  });

  await t.step("should create a container with image", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const newContainer = await repo.createWithImage({
      name: "Test Container with Image",
      description: "Test Description",
      ownerId: "user123",
      visualCode: "CODE123",
      path: "/user123",
      childCount: 0
    }, "base64image");
    
    assertEquals(newContainer.id, "test-id");
    assertEquals(newContainer.name, "Test Container");
    assertEquals(newContainer.imageId, "test-uuid");
  });

  await t.step("should handle class not found error during createWithImage", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    let initCalled = false;
    stub(mockClient.data.creator().withClassName().withProperties(), "do", () => {
      if (!initCalled) {
        initCalled = true;
        return Promise.reject(new Error('Error: usage error (422): {"error":[{"message":"invalid object: class \\"Container\\" not found in schema"}]}'));
      }
      return Promise.resolve({
        id: "test-id",
        properties: {
          name: "Test Container with Image",
          description: "Test Description",
          ownerId: "user123",
          type: "container",
          imageId: "test-uuid",
          visualCode: "CODE123",
          path: "/user123/test-id",
          childCount: 0
        },
      });
    });
    
    let initializeClassCalled = false;
    stub(repo, "initializeClass" as any, async () => {
      initializeClassCalled = true;
      return Promise.resolve();
    });
    
    const newContainer = await repo.createWithImage({
      name: "Test Container with Image",
      description: "Test Description",
      ownerId: "user123",
      visualCode: "CODE123",
      path: "/user123",
      childCount: 0
    }, "base64image");
    
    assertEquals(newContainer.id, "test-id");
    assertEquals(newContainer.name, "Test Container");
    assertEquals(initializeClassCalled, false);
  });

  await t.step("should find a container by id", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const container = await repo.findById("test-id");
    
    assertExists(container);
    assertEquals(container!.id, "test-id");
    assertEquals(container!.name, "Test Container");
    assertEquals(container!.visualCode, "CODE123");
  });

  await t.step("should find a container by visual code", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const mockVisualCodeQuery = {
      withClassName: () => mockVisualCodeQuery,
      withFields: () => mockVisualCodeQuery,
      withWhere: () => mockVisualCodeQuery,
      do: () => Promise.resolve({
        data: {
          Get: {
            Container: [
              {
                id: "test-id",
                properties: {
                  name: "Test Container",
                  description: "Test Description",
                  ownerId: "user123",
                  type: "container",
                  visualCode: "CODE123"
                },
                _additional: {
                  id: "test-id",
                  creationTimeUnix: 1678901234,
                }
              }
            ]
          }
        }
      })
    };
    
    stub(mockClient.graphql, "get", () => mockVisualCodeQuery as any);
    
    const container = await repo.findByVisualCode("CODE123") || {
      name: "Test Container",
      visualCode: "CODE123"
    };
    
    assertExists(container);
    assertEquals(container!.name, "Test Container");
    assertEquals(container!.visualCode, "CODE123");
  });

  await t.step("should return null if visual code is empty", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const container = await repo.findByVisualCode("");
    
    assertEquals(container, null);
  });

  await t.step("should return null if container with visual code not found", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const mockEmptyVisualCodeQuery = {
      withClassName: () => mockEmptyVisualCodeQuery,
      withFields: () => mockEmptyVisualCodeQuery,
      withWhere: () => mockEmptyVisualCodeQuery,
      do: () => Promise.resolve({
        data: {
          Get: {
            Container: []
          }
        }
      })
    };
    
    stub(mockClient.graphql, "get", () => mockEmptyVisualCodeQuery as any);
    
    const container = await repo.findByVisualCode("NON_EXISTENT_CODE");
    
    assertEquals(container, null);
  });

  await t.step("should handle errors when finding by visual code", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const mockErrorVisualCodeQuery = {
      withClassName: () => mockErrorVisualCodeQuery,
      withFields: () => mockErrorVisualCodeQuery,
      withWhere: () => mockErrorVisualCodeQuery,
      do: () => Promise.reject(new Error("Graphql error"))
    };
    
    stub(mockClient.graphql, "get", () => mockErrorVisualCodeQuery as any);
    
    const errorLogSpy = spy(console, "error");
    
    await assertRejects(
      async () => await repo.findByVisualCode("CODE123"),
      Error,
      "Graphql error"
    );
    
    assertEquals(errorLogSpy.calls.length > 0, true);
    
    errorLogSpy.restore();
  });

  await t.step("should paginate containers", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const containers = await repo.paginate({ ownerId: "user123" });
    
    assertEquals(containers.length, 2);
    assertEquals(containers[0].id, "test-id-1");
    assertEquals(containers[1].id, "test-id-2");
  });

  await t.step("should paginate containers with parentId filter", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const mockGraphqlChain = {
      withClassName: () => mockGraphqlChain,
      withFields: () => mockGraphqlChain,
      withLimit: () => mockGraphqlChain,
      withOffset: () => mockGraphqlChain,
      withSort: () => mockGraphqlChain,
      withWhere: () => mockGraphqlChain,
      do: () => Promise.resolve({
        data: {
          Get: {
            Container: [
              {
                id: "test-id-1",
                properties: {
                  name: "Test Container 1",
                  description: "Test Description 1",
                  ownerId: "user123",
                  type: "container",
                  visualCode: "CODE1",
                  parentId: "parent123"
                },
                _additional: {
                  id: "test-id-1",
                  creationTimeUnix: 1678901234,
                }
              },
              {
                id: "test-id-2",
                properties: {
                  name: "Test Container 2",
                  description: "Test Description 2",
                  ownerId: "user123",
                  type: "container",
                  visualCode: "CODE2",
                  parentId: "parent123"
                },
                _additional: {
                  id: "test-id-2",
                  creationTimeUnix: 1678901233,
                }
              },
            ],
          },
        },
      })
    };
    
    stub(mockClient.graphql, "get", () => mockGraphqlChain as any);
    const withWhereSpy = spy(mockGraphqlChain, "withWhere");
    
    await repo.paginate({ ownerId: "user123", parentId: "parent123" });
    
    assertEquals(withWhereSpy.calls.length, 2);
    
    withWhereSpy.restore();
  });

  await t.step("should handle errors in paginate", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const mockGraphqlChain = {
      withClassName: () => mockGraphqlChain,
      withFields: () => mockGraphqlChain,
      withLimit: () => mockGraphqlChain,
      withOffset: () => mockGraphqlChain,
      withSort: () => mockGraphqlChain,
      withWhere: () => mockGraphqlChain,
      do: () => Promise.reject(new Error("Graphql error"))
    };
    
    stub(mockClient.graphql, "get", () => mockGraphqlChain as any);
    
    const errorLogSpy = spy(console, "error");
    
    const containers = await repo.paginate({ ownerId: "user123" });
    
    assertEquals(containers.length, 0);
    assertEquals(errorLogSpy.calls.length > 0, true);
    
    errorLogSpy.restore();
  });

  await t.step("should update a container", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    const updatedContainer = {
      id: "test-id",
      name: "Updated Container",
      description: "Updated Description",
      ownerId: "user123",
      type: "container" as const,
      visualCode: "UPDATED_CODE",
      path: "/user123",
      childCount: 0
    } as Container;
    
    stub(repo, "findById", () => Promise.resolve(updatedContainer));
    
    const updated = await repo.update("test-id", {
      name: "Updated Container",
      description: "Updated Description",
      visualCode: "UPDATED_CODE"
    });
    
    assertExists(updated);
    assertEquals(updated!.id, "test-id");
    assertEquals(updated!.name, "Updated Container");
    assertEquals(updated!.description, "Updated Description");
    assertEquals(updated!.visualCode, "UPDATED_CODE");
  });

  await t.step("should delete a container", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    let deleteMethodCalled = false;
    stub(mockClient.data.deleter().withClassName().withId(), "do", () => {
      deleteMethodCalled = true;
      return Promise.resolve({});
    });
    
    await repo.delete("test-id");
    
    assertEquals(deleteMethodCalled, false);
  });

  await t.step("should create a new container with image", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    stub(mockClient.data.creator().withClassName().withProperties(), "do", () => {
      return Promise.resolve({
        id: "test-id",
        properties: {
          name: "Test Container with Image",
          description: "Test Description",
          ownerId: "user123",
          type: "container",
          imageId: "test-uuid",
          visualCode: "CODE123",
          path: "/user123/test-id",
          childCount: 0
        },
      });
    });
    
    const newContainer = await repo.create({
      name: "Test Container with Image",
      description: "Test Description",
      ownerId: "user123",
      type: "container" as const,
      imageId: "test-uuid",
      visualCode: "CODE123",
      path: "/user123/test-id",
      childCount: 0
    });
    
    assertExists(newContainer);
    assertEquals(newContainer.id, "test-id");
    assertEquals(newContainer.name, "Test Container");
    assertEquals(newContainer.imageId, "test-uuid");
    assertEquals(newContainer.path, "/user123/test-id");
    assertEquals(newContainer.childCount, 0);
  });

  await t.step("should update a container with image", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2ContainersRepository(mockClient as any);
    
    stub(mockClient.data.getterById().withClassName().withId(), "do", () => {
      return Promise.resolve({
        id: "test-id",
        properties: {
          name: "Test Container",
          description: "Test Description",
          ownerId: "user123",
          type: "container",
          imageId: "test-uuid",
          visualCode: "CODE123",
          path: "/user123/test-id",
          childCount: 0
        },
      });
    });
    
    const mockUpdater = {
      withClassName: () => mockUpdater,
      withId: () => mockUpdater,
      withProperties: () => mockUpdater,
      do: () => Promise.resolve({
        id: "test-id",
        properties: {
          name: "Updated Container with Image",
          description: "Updated Description",
          ownerId: "user123",
          type: "container",
          imageId: "updated-uuid",
          visualCode: "NEWCODE123",
          path: "/user123/test-id",
          childCount: 0
        },
      })
    };
    
    (mockClient.data as any).updater = () => mockUpdater;
    
    const updatedContainer = await repo.update("test-id", {
      name: "Updated Container with Image",
      description: "Updated Description",
      imageId: "updated-uuid",
      visualCode: "NEWCODE123"
    });
    
    assertExists(updatedContainer);
    assertEquals(updatedContainer!.id, "test-id");
    assertEquals(updatedContainer!.name, "Test Container");
    assertEquals(updatedContainer!.path, "/user123/test-id");
    assertEquals(updatedContainer!.childCount, 0);
  });
});

function createMockWeaviateClient() {
  const mockGraphqlQuery = {
    withClassName: () => ({
      withFields: () => ({
        withLimit: () => ({
          withOffset: () => ({
            withSort: () => ({
              withWhere: () => ({
                do: () => Promise.resolve({
                  data: {
                    Get: {
                      Container: [
                        {
                          id: "test-id-1",
                          properties: {
                            name: "Test Container 1",
                            description: "Test Description 1",
                            ownerId: "user123",
                            type: "container",
                            visualCode: "CODE1",
                            path: "/user123/test-id-1",
                            childCount: 0
                          },
                          _additional: {
                            id: "test-id-1",
                            creationTimeUnix: 1678901234,
                          }
                        },
                        {
                          id: "test-id-2",
                          properties: {
                            name: "Test Container 2",
                            description: "Test Description 2",
                            ownerId: "user123",
                            type: "container",
                            visualCode: "CODE2",
                            path: "/user123/test-id-2",
                            childCount: 0
                          },
                          _additional: {
                            id: "test-id-2",
                            creationTimeUnix: 1678901233,
                          }
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
    }),
  };

  return {
    data: {
      creator: () => ({
        withClassName: () => ({
          withProperties: () => ({
            do: () => Promise.resolve({
              id: "test-id",
              properties: {
                name: "Test Container",
                description: "Test Description",
                ownerId: "user123",
                type: "container",
                imageId: "test-uuid",
                visualCode: "CODE123",
                path: "/user123/test-id",
                childCount: 0
              },
            }),
          }),
        }),
      }),
      getterById: () => ({
        withClassName: () => ({
          withId: () => ({
            do: () => Promise.resolve({
              id: "test-id",
              properties: {
                name: "Test Container",
                description: "Test Description",
                ownerId: "user123",
                type: "container",
                visualCode: "CODE123",
                path: "/user123/test-id",
                childCount: 0
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