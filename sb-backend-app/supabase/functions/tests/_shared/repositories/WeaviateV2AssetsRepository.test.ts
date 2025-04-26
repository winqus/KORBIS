import { stub, spy } from "https://deno.land/std@0.181.0/testing/mock.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { WeaviateV2AssetsRepository } from "../../../_shared/repositories/WeaviateV2AssetsRepository.ts";
import { Container } from "../../../_shared/entities/Container.ts";
import { Item } from "../../../_shared/entities/Item.ts";
import { AssetTypeEnum } from "../../../_shared/core/index.ts";

Deno.test("WeaviateV2AssetsRepository", async (t) => {
  await t.step("should create repository instance", () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2AssetsRepository(mockClient as any);
    assertExists(repo);
  });

  await t.step("should get assets by parent ID with default options", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2AssetsRepository(mockClient as any);
    
    const assets = await repo.getAssetsByParentId({
      ownerId: "user123"
    });
    
    assertEquals(assets.length, 3);
    assertEquals(assets[0].id, "item-id-1");
    assertEquals(assets[0].type, "item");
    assertEquals(assets[1].id, "container-id-1");
    assertEquals(assets[1].type, "container");
  });

  await t.step("should get assets by parent ID with pagination", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2AssetsRepository(mockClient as any);
    
    const graphqlSpy = spy(mockClient.graphql, "get");
    
    const assets = await repo.getAssetsByParentId({
      ownerId: "user123",
      limit: 5,
      skip: 10
    });
    
    assertEquals(graphqlSpy.calls.length, 2);
    assertEquals(assets.length, 3);
  });

  await t.step("should get assets with specific parent ID and type", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2AssetsRepository(mockClient as any);
    
    const mockGraphqlChain = {
      withClassName: () => mockGraphqlChain,
      withFields: () => mockGraphqlChain,
      withWhere: () => mockGraphqlChain,
      withLimit: () => mockGraphqlChain,
      withOffset: () => mockGraphqlChain,
      withSort: () => mockGraphqlChain,
      do: () => Promise.resolve({
        data: {
          Get: {
            Item: [
              {
                id: "item-id-container",
                properties: {
                  name: "Item in Container",
                  description: "Item that belongs to a container",
                  ownerId: "user123",
                  type: "item",
                  parentId: "container-parent",
                  parentType: "container",
                  quantity: 1
                },
                _additional: {
                  id: "item-id-container",
                  creationTimeUnix: 1678901234,
                }
              }
            ],
            Container: [
              {
                id: "container-id-nested",
                properties: {
                  name: "Nested Container",
                  description: "Container inside another container",
                  ownerId: "user123",
                  type: "container",
                  parentId: "container-parent",
                  parentType: "container",
                  childCount: 0,
                  path: "/user123/container-parent/container-id-nested",
                  visualCode: "NESTED"
                },
                _additional: {
                  id: "container-id-nested",
                  creationTimeUnix: 1678901234,
                }
              }
            ]
          }
        }
      })
    };
    
    stub(mockClient.graphql, "get", () => mockGraphqlChain as any);
    
    const assets = await repo.getAssetsByParentId({
      ownerId: "user123",
      parentId: "container-parent",
      parentType: AssetTypeEnum.CONTAINER
    });
    
    assertEquals(assets.length, 2);
    assertEquals(assets[0].id, "item-id-container");
    assertEquals(assets[0].parentId, "container-parent");
    assertEquals(assets[0].parentType, "container");
    assertEquals(assets[1].id, "container-id-nested");
    assertEquals(assets[1].parentId, "container-parent");
    assertEquals(assets[1].parentType, "container");
  });

  await t.step("should throw error for invalid parent type", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2AssetsRepository(mockClient as any);
    
    let error: Error | null = null;
    try {
      await repo.getAssetsByParentId({
        ownerId: "user123",
        parentType: "invalid_type" as any
      });
    } catch (e) {
      error = e as Error;
    }
    
    assertExists(error);
    assertEquals(error?.message.includes("Invalid parent type"), true);
  });

  await t.step("should handle graphql query errors gracefully", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2AssetsRepository(mockClient as any);
    
    const mockErrorGraphqlChain = {
      withClassName: () => mockErrorGraphqlChain,
      withFields: () => mockErrorGraphqlChain,
      withWhere: () => mockErrorGraphqlChain,
      withLimit: () => mockErrorGraphqlChain,
      withOffset: () => mockErrorGraphqlChain,
      withSort: () => mockErrorGraphqlChain,
      do: () => Promise.reject(new Error("GraphQL error"))
    };
    
    stub(mockClient.graphql, "get", () => mockErrorGraphqlChain as any);
    
    const errorLogSpy = spy(console, "error");
    
    const assets = await repo.getAssetsByParentId({
      ownerId: "user123"
    });
    
    assertEquals(assets.length, 0);
    assertEquals(errorLogSpy.calls.length > 0, true);
    
    errorLogSpy.restore();
  });

  await t.step("should sort assets by creation time", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2AssetsRepository(mockClient as any);
    
    const mockResponse = {
      data: {
        Get: {
          Item: [
            {
              id: "item-newer",
              properties: {
                name: "Newer Item",
                description: "Created more recently",
                ownerId: "user123",
                type: "item",
                quantity: 1
              },
              _additional: {
                id: "item-newer",
                creationTimeUnix: 1678901300,
              }
            },
            {
              id: "item-older",
              properties: {
                name: "Older Item",
                description: "Created earlier",
                ownerId: "user123",
                type: "item",
                quantity: 1
              },
              _additional: {
                id: "item-older",
                creationTimeUnix: 1678901200,
              }
            }
          ],
          Container: [
            {
              id: "container-middle",
              properties: {
                name: "Middle Container",
                description: "Created in the middle",
                ownerId: "user123",
                type: "container",
                childCount: 0,
                path: "/user123/container-middle"
              },
              _additional: {
                id: "container-middle",
                creationTimeUnix: 1678901250,
              }
            }
          ]
        }
      }
    };
    
    const mockGraphqlChain = {
      withClassName: () => mockGraphqlChain,
      withFields: () => mockGraphqlChain,
      withWhere: () => mockGraphqlChain,
      withLimit: () => mockGraphqlChain,
      withOffset: () => mockGraphqlChain,
      withSort: () => mockGraphqlChain,
      do: () => Promise.resolve(mockResponse)
    };
    
    stub(mockClient.graphql, "get", () => mockGraphqlChain as any);
    
    const assets = await repo.getAssetsByParentId({
      ownerId: "user123"
    });

    (repo as any).log("getAssetsByParentId", assets);
    
    assertEquals(assets.length, 3);
    assertEquals(assets[0].id, "item-newer");
    assertEquals(assets[1].id, "container-middle");
    assertEquals(assets[2].id, "item-older");
  });

  await t.step("should convert Weaviate entities to domain entities properly", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2AssetsRepository(mockClient as any);
    
    const mockItemResponse = {
      id: "test-item",
      properties: {
        name: "Test Item",
        description: "Test item description",
        ownerId: "user123",
        type: "item",
        parentId: "parent123",
        parentType: "container",
        parentName: "Parent Container",
        quantity: 5,
        imageId: "image123"
      },
      _additional: {
        id: "test-item",
        creationTimeUnix: 1678901234,
      }
    };
    
    const mockContainerResponse = {
      id: "test-container",
      properties: {
        name: "Test Container",
        description: "Test container description",
        ownerId: "user123",
        type: "container",
        parentId: "user123",
        parentType: "root",
        parentName: "Root",
        childCount: 3,
        path: "/user123/test-container",
        visualCode: "TEST123",
        imageId: "image456"
      },
      _additional: {
        id: "test-container",
        creationTimeUnix: 1678901235,
      }
    };
    
    const item = repo["mapItemObject2Entity"](mockItemResponse);
    const container = repo["mapContainerObject2Entity"](mockContainerResponse);
    
    assertEquals(item instanceof Item, true);
    assertEquals(item.id, "test-item");
    assertEquals(item.name, "Test Item");
    assertEquals(item.type, "item");
    assertEquals(item.quantity, 5);
    assertEquals(item.parentId, "parent123");
    assertEquals(item.parentType, "container");
    
    assertEquals(container instanceof Container, true);
    assertEquals(container.id, "test-container");
    assertEquals(container.name, "Test Container");
    assertEquals(container.type, "container");
    assertEquals(container.childCount, 3);
    assertEquals(container.path, "/user123/test-container");
    assertEquals(container.visualCode, "TEST123");
  });

  await t.step("should handle the flattenAndFilterProperties utility correctly", async () => {
    const mockClient = createMockWeaviateClient();
    const repo = new WeaviateV2AssetsRepository(mockClient as any);
    
    const mockResponse = {
      id: "test-id",
      properties: {
        name: "Test Name",
        description: "Test Description"
      },
      _additional: {
        id: "test-id",
        creationTimeUnix: 1678901234
      },
      extraProperty: "should be filtered out",
      anotherExtra: "should also be filtered"
    };
    
    const itemEntity = new Item();
    const filteredItem = repo["flattenAndFilterProperties"](mockResponse, Item);
    
    assertEquals(filteredItem.id, "test-id");
    assertEquals(filteredItem.name, "Test Name");
    assertEquals(filteredItem.description, "Test Description");
    assertEquals(filteredItem.extraProperty, undefined);
    assertEquals(filteredItem.anotherExtra, undefined);
  });
});

function createMockWeaviateClient() {
  const mockGraphqlQuery = {
    withClassName: () => ({
      withFields: () => ({
        withWhere: () => ({
          withLimit: () => ({
            withOffset: () => ({
              withSort: () => ({
                do: () => Promise.resolve({
                  data: {
                    Get: {
                      Item: [
                        {
                          id: "item-id-1",
                          properties: {
                            name: "Test Item 1",
                            description: "Item Description 1",
                            ownerId: "user123",
                            type: "item",
                            parentId: "parent123",
                            parentType: "container",
                            quantity: 1
                          },
                          _additional: {
                            id: "item-id-1",
                            creationTimeUnix: 1678901234,
                          }
                        },
                        {
                          id: "item-id-2",
                          properties: {
                            name: "Test Item 2",
                            description: "Item Description 2",
                            ownerId: "user123",
                            type: "item",
                            parentId: "parent123",
                            parentType: "container",
                            quantity: 2
                          },
                          _additional: {
                            id: "item-id-2",
                            creationTimeUnix: 1678901232,
                          }
                        },
                      ],
                      Container: [
                        {
                          id: "container-id-1",
                          properties: {
                            name: "Test Container 1",
                            description: "Container Description 1",
                            ownerId: "user123",
                            type: "container",
                            parentId: "parent123",
                            parentType: "container",
                            childCount: 0,
                            path: "/user123/parent123/container-id-1",
                            visualCode: "CODE1"
                          },
                          _additional: {
                            id: "container-id-1",
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
    graphql: {
      get: () => mockGraphqlQuery,
    },
  };
} 