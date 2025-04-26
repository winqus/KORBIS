import { stub, spy } from "https://deno.land/std@0.181.0/testing/mock.ts";
import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { WeaviateV2BaseRepository } from "../../../_shared/repositories/WeaviateV2BaseRepository.ts";

class TestEntity {
  id!: string;
  name!: string;
  description?: string;
}

const testSchema = {
  class: "TestClass",
  properties: [
    {
      name: "name",
      dataType: ["string"],
    },
    {
      name: "description",
      dataType: ["string"],
    },
  ],
};

class TestRepository extends WeaviateV2BaseRepository<TestEntity> {
  constructor(client: any) {
    super(client, "TestClass", testSchema, TestEntity);
  }

  public testFlattenAndFilterProperties(item: any) {
    return this.flattenAndFilterProperties(item);
  }

  public testMapObject2Entity(data: any) {
    return this.mapObject2Entity(data);
  }

  public testMapObjects2Entities(data: any[]) {
    return this.mapObjects2Entities(data);
  }

  public testFindMany(options: any) {
    return this.findMany(options);
  }

  public testInitializeClass() {
    return this.initializeClass();
  }

  public testIsClassNotFoundInSchemaError(error: any) {
    return this.isClassNotFoundInSchemaError(error);
  }

  public testIsItemNotFoundError(error: any) {
    return this.isItemNotFoundError(error);
  }
}

Deno.test("WeaviateV2BaseRepository", async (t) => {
  await t.step("should create repository instance", () => {
    const mockClient = {
      data: {
        creator: () => ({
          withClassName: () => ({
            withProperties: () => ({
              do: () => Promise.resolve({
                id: "test-id",
                properties: {
                  name: "Test Entity",
                  description: "Test Description",
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
                  name: "Test Entity",
                  description: "Test Description",
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
        get: () => ({
          withClassName: () => ({
            withFields: () => ({
              withLimit: () => ({
                withOffset: () => ({
                  do: () => Promise.resolve({
                    data: {
                      Get: {
                        TestClass: [
                          {
                            id: "test-id-1",
                            properties: {
                              name: "Test Entity 1",
                              description: "Test Description 1",
                            },
                          },
                          {
                            id: "test-id-2",
                            properties: {
                              name: "Test Entity 2",
                              description: "Test Description 2",
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
      },
      schema: {
        classCreator: () => ({
          withClass: () => ({
            do: () => Promise.resolve({}),
          }),
        }),
      },
    };
    
    const repo = new TestRepository(mockClient);
    assertExists(repo);
  });

  await t.step("should create an entity", async () => {
    const mockClient = {
      data: {
        creator: () => ({
          withClassName: () => ({
            withProperties: () => ({
              do: () => Promise.resolve({
                id: "test-id",
                properties: {
                  name: "Test Entity",
                  description: "Test Description",
                },
              }),
            }),
          }),
        }),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const entity = await repo.create({
      name: "Test Entity",
      description: "Test Description",
    });
    
    assertEquals(entity.id, "test-id");
    assertEquals(entity.name, "Test Entity");
    assertEquals(entity.description, "Test Description");
  });

  await t.step("should handle class not found error during creation", async () => {
    let initCalled = false;
    let initClassCalled = false;
    
    const mockClient = {
      data: {
        creator: () => ({
          withClassName: () => ({
            withProperties: () => ({
              do: () => {
                if (!initCalled) {
                  initCalled = true;
                  return Promise.reject(new Error('Error: usage error (422): {"error":[{"message":"invalid object: class \\"TestClass\\" not found in schema"}]}'));
                }
                return Promise.resolve({
                  id: "test-id",
                  properties: {
                    name: "Test Entity",
                    description: "Test Description",
                  },
                });
              },
            }),
          }),
        }),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: {
        classCreator: () => ({
          withClass: () => ({
            do: () => {
              initClassCalled = true;
              return Promise.resolve({});
            },
          }),
        }),
      },
    };
    
    const repo = new TestRepository(mockClient);
    repo.testInitializeClass = async () => {
      initClassCalled = true;
      return Promise.resolve() as any;
    };
    
    const entity = await repo.create({
      name: "Test Entity",
      description: "Test Description",
    });
    
    assertEquals(entity.id, "test-id");
    assertEquals(entity.name, "Test Entity");
    assertEquals(entity.description, "Test Description");
    assertEquals(initClassCalled, true, "initializeClass should have been called");
  });

  await t.step("should find an entity by id", async () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({
          withClassName: () => ({
            withId: () => ({
              do: () => Promise.resolve({
                id: "test-id",
                properties: {
                  name: "Test Entity",
                  description: "Test Description",
                },
              }),
            }),
          }),
        }),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const entity = await repo.findById("test-id");
    
    assertExists(entity);
    assertEquals(entity!.id, "test-id");
    assertEquals(entity!.name, "Test Entity");
    assertEquals(entity!.description, "Test Description");
  });

  await t.step("should return null when finding entity with empty id", async () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const entity = await repo.findById("");
    
    assertEquals(entity, null);
  });

  await t.step("should handle item not found error", async () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({
          withClassName: () => ({
            withId: () => ({
              do: () => {
                return Promise.reject(new Error('Error: usage error (404)'));
              },
            }),
          }),
        }),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    const entity = await repo.findById("non-existent-id");
    
    assertEquals(entity, null);
  });

  await t.step("should handle other errors when finding by id", async () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({
          withClassName: () => ({
            withId: () => ({
              do: () => {
                return Promise.reject(new Error('Some other error'));
              },
            }),
          }),
        }),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    await assertRejects(
      async () => await repo.findById("test-id"),
      Error,
      "Some other error"
    );
  });

  await t.step("should update an entity", async () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({
          withClassName: () => ({
            withId: () => ({
              withProperties: () => ({
                do: () => Promise.resolve({}),
              }),
            }),
          }),
        }),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const updatedEntity = {
      id: "test-id",
      name: "Updated Entity",
      description: "Updated Description",
    };
    
    stub(repo, "findById", () => Promise.resolve(updatedEntity as TestEntity));
    
    const updatedResult = await repo.update("test-id", {
      name: "Updated Entity",
      description: "Updated Description",
    });
    
    assertExists(updatedResult);
    assertEquals(updatedResult!.id, "test-id");
    assertEquals(updatedResult!.name, "Updated Entity");
    assertEquals(updatedResult!.description, "Updated Description");
    
    (repo.findById as any).restore();
  });

  await t.step("should return null when updating with empty id", async () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const entity = await repo.update("", { name: "Updated Entity" });
    
    assertEquals(entity, null);
  });

  await t.step("should handle item not found error when updating", async () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({
          withClassName: () => ({
            withId: () => ({
              do: () => Promise.resolve(null),
            }),
          }),
        }),
        merger: () => ({
          withClassName: () => ({
            withId: () => ({
              withProperties: () => ({
                do: () => {
                  return Promise.reject(new Error('Error: usage error (404)'));
                },
              }),
            }),
          }),
        }),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    const originalError = console.error;
    const errorMessages: any[] = [];
    console.error = (...args: any[]) => {
      errorMessages.push(args);
    };
    
    const entity = await repo.update("non-existent-id", { name: "Updated Entity" });
    
    assertEquals(entity, null);
    assertEquals(errorMessages.length, 2);
    
    console.error = originalError;
  });

  await t.step("should delete an entity", async () => {
    let deleteMethodCalled = false;
    
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({
          withClassName: () => ({
            withId: () => ({
              do: () => {
                deleteMethodCalled = true;
                return Promise.resolve({});
              },
            }),
          }),
        }),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    await repo.delete("test-id");
    
    assertEquals(deleteMethodCalled, true);
  });

  await t.step("should handle item not found error when deleting", async () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({
          withClassName: () => ({
            withId: () => ({
              do: () => {
                return Promise.reject(new Error('Error: usage error (404)'));
              },
            }),
          }),
        }),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    const originalError = console.error;
    const errorMessages: any[] = [];
    console.error = (...args: any[]) => {
      errorMessages.push(args);
    };
    
    await repo.delete("non-existent-id");
    
    assertEquals(errorMessages.length, 1);
    
    console.error = originalError;
  });

  await t.step("should find many entities", async () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: {
        get: () => ({
          withClassName: () => ({
            withFields: () => ({
              withLimit: () => ({
                withOffset: () => ({
                  do: () => Promise.resolve({
                    data: {
                      Get: {
                        TestClass: [
                          {
                            id: "test-id-1",
                            properties: {
                              name: "Test Entity 1",
                              description: "Test Description 1",
                            },
                          },
                          {
                            id: "test-id-2",
                            properties: {
                              name: "Test Entity 2",
                              description: "Test Description 2",
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
      },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const entities = await repo.testFindMany({ limit: 10, offset: 0 });
    
    assertEquals(entities.length, 2);
    assertEquals(entities[0].id, "test-id-1");
    assertEquals(entities[0].name, "Test Entity 1");
    assertEquals(entities[1].id, "test-id-2");
    assertEquals(entities[1].name, "Test Entity 2");
  });

  await t.step("should handle errors when finding many entities", async () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: {
        get: () => ({
          withClassName: () => ({
            withFields: () => ({
              withLimit: () => ({
                withOffset: () => ({
                  do: () => {
                    return Promise.reject(new Error('Graphql error'));
                  },
                }),
              }),
            }),
          }),
        }),
      },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    const originalError = console.error;
    const errorMessages: any[] = [];
    console.error = (...args: any[]) => {
      errorMessages.push(args);
    };
    
    const entities = await repo.testFindMany({ limit: 10, offset: 0 });
    
    assertEquals(entities.length, 0);
    assertEquals(errorMessages.length, 1);
    
    console.error = originalError;
  });

  await t.step("should correctly flatten and filter properties", () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const testItem = {
      id: "test-id",
      properties: {
        name: "Test Entity",
        description: "Test Description",
        extraProperty: "Extra Value",
      },
      _additional: {
        id: "test-id",
        extraAdditional: "Extra Additional",
      },
      extraField: "Extra Field",
    };
    
    const flattened = repo.testFlattenAndFilterProperties(testItem);
    
    assertEquals(flattened.id, "test-id");
    assertEquals(flattened.name, "Test Entity");
    assertEquals(flattened.description, "Test Description");
    assertEquals("extraProperty" in flattened, false);
    assertEquals("extraAdditional" in flattened, false);
    assertEquals("extraField" in flattened, false);
  });

  await t.step("should correctly map object to entity", () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const testObject = {
      id: "test-id",
      properties: {
        name: "Test Entity",
        description: "Test Description",
      },
    };
    
    const entity = repo.testMapObject2Entity(testObject);
    
    assertExists(entity);
    assertEquals(entity.id, "test-id");
    assertEquals(entity.name, "Test Entity");
    assertEquals(entity.description, "Test Description");
  });

  await t.step("should correctly map objects to entities", () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const testObjects = [
      {
        id: "test-id-1",
        properties: {
          name: "Test Entity 1",
          description: "Test Description 1",
        },
      },
      {
        id: "test-id-2",
        properties: {
          name: "Test Entity 2",
          description: "Test Description 2",
        },
      },
    ];
    
    const entities = repo.testMapObjects2Entities(testObjects);
    
    assertEquals(entities.length, 2);
    assertEquals(entities[0].id, "test-id-1");
    assertEquals(entities[0].name, "Test Entity 1");
    assertEquals(entities[1].id, "test-id-2");
    assertEquals(entities[1].name, "Test Entity 2");
  });

  await t.step("should detect class not found in schema error", () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const error = new Error('Error: usage error (422): {"error":[{"message":"invalid object: class \\"TestClass\\" not found in schema"}]}');
    const result = repo.testIsClassNotFoundInSchemaError(error);
    
    assertEquals(result, true);
  });

  await t.step("should detect item not found error", () => {
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: { classCreator: () => ({}) },
    };
    
    const repo = new TestRepository(mockClient);
    
    const error = new Error('Error: usage error (404)');
    const result = repo.testIsItemNotFoundError(error);
    
    assertEquals(result, true);
  });

  await t.step("should initialize class schema", async () => {
    let classCreatorCalled = false;
    
    const mockClient = {
      data: {
        creator: () => ({}),
        getterById: () => ({}),
        merger: () => ({}),
        deleter: () => ({}),
      },
      graphql: { get: () => ({}) },
      schema: {
        classCreator: () => ({
          withClass: () => ({
            do: () => {
              classCreatorCalled = true;
              return Promise.resolve({});
            },
          }),
        }),
      },
    };
    
    const repo = new TestRepository(mockClient);
    await repo.testInitializeClass();
    
    assertEquals(classCreatorCalled, true);
  });
}); 