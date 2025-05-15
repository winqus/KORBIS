import { assertEquals, assertRejects  } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { returnsNext, spy, stub } from "https://deno.land/std@0.181.0/testing/mock.ts";
import { ItemsController } from "../../../_shared/controllers/ItemsController.ts";
import { 
  CreateItem, 
  GetItem, 
  GetItems, 
  DeleteItem, 
  AddFileForItem, 
  DeleteFileForItem, 
  GetItemFiles, 
  UpdateItem,
  SearchItems,
} from "../../../_shared/usecases/index.ts";

class MockRequest {
  body: Record<string, any> = {};
  params: Record<string, string> = {};
  query: Record<string, any> = {};
  userId?: string;

  constructor(options: {
    body?: Record<string, any>;
    params?: Record<string, string>;
    query?: Record<string, any>;
    userId?: string;
  } = {}) {
    this.body = options.body || {};
    this.params = options.params || {};
    this.query = options.query || {};
    this.userId = options.userId;
  }
}

class MockResponse {
  statusCode: number = 200;
  body: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: any) {
    this.body = data;
    return this;
  }

  send() {
    return this;
  }
}

function createMockUsecase<T>(result: any = {}) {
  return {
    execute: spy((cmd: any) => Promise.resolve(result))
  } as unknown as T;
}

function createErrorMockUsecase<T>(error: Error) {
  return {
    execute: spy(() => Promise.reject(error))
  } as unknown as T;
}

const nextFunctionMock = spy();

Deno.test("ItemsController.create - should create an item successfully", async () => {
  const expectedResult = { id: "item-id", name: "Test Item" };
  const createItemMock = createMockUsecase<CreateItem>(expectedResult);
  
  const controller = new ItemsController(
    createItemMock,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  
  const req = new MockRequest({
    body: {
      name: "Test Item",
      description: "Description",
      imageBase64: "data:image/png;base64,abc123",
      parentId: "550e8400-e29b-41d4-a716-446655440000",
      parentType: "container",
      quantity: 1
    },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  
  await controller.create(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 201);
  assertEquals(res.body, expectedResult);
  assertEquals((createItemMock.execute as any).calls.length, 1);
});

Deno.test("ItemsController.create - should handle errors", async () => {
  const error = new Error("Test error");
  const createItemMock = createErrorMockUsecase<CreateItem>(error);
  const controller = new ItemsController(
    createItemMock,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    body: {
      name: "Test Item",
      description: "Description",
    },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  const nextSpy = spy();
  
  await controller.create(req as any, res as any, nextSpy as any);
  console.log(res);

  assertEquals(res.statusCode, 400);
  assertEquals(res.body, { error: "Bad Request", details: { imageBase64: "Image base64 data is required" } });
});

Deno.test("ItemsController.get - should get an item by id", async () => {
  const expectedResult = { id: "item-id", name: "Test Item" };
  const getItemMock = createMockUsecase<GetItem>(expectedResult);
  const controller = new ItemsController(
    {} as CreateItem,
    getItemMock,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.get(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 200);
  assertEquals(res.body, expectedResult);
  assertEquals((getItemMock.execute as any).calls.length, 1);
});

Deno.test("ItemsController.get - should return 400 on invalid input", async () => {
  const getItemMock = createMockUsecase<GetItem>(undefined);
  const controller = new ItemsController(
    {} as CreateItem,
    getItemMock,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    params: { id: "invalid-uuid" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.get(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 400);
});

Deno.test("ItemsController.getPaginated - should get paginated items", async () => {
  const expectedResult = { 
    items: [{ id: "item-id", name: "Test Item" }], 
    total: 1 
  };
  const getItemsMock = createMockUsecase<GetItems>(expectedResult);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    getItemsMock,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    query: { limit: "10", skip: "0", parentId: "550e8400-e29b-41d4-a716-446655440000" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.getPaginated(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 200);
  assertEquals(res.body, expectedResult);
  assertEquals((getItemsMock.execute as any).calls.length, 1);
});

Deno.test("ItemsController.getPaginated - should return 400 on invalid input", async () => {
  const getItemsMock = createMockUsecase<GetItems>(undefined);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    getItemsMock,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    query: { limit: "0", skip: "0", parentId: "invalid-uuid" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.getPaginated(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 400);
});

Deno.test("ItemsController.update - should update an item", async () => {
  const expectedResult = { id: "550e8400-e29b-41d4-a716-446655440000", name: "Updated Item" };
  const updateItemMock = createMockUsecase<UpdateItem>(expectedResult);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    updateItemMock,
    {} as SearchItems,
  );
  const req = new MockRequest({
    params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    body: {
      name: "Updated Item",
      description: "Updated Description",
      quantity: 2,
      parentId: "550e8400-e29b-41d4-a716-446655440000",
      parentType: "container"
    },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.update(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 200);
  assertEquals(res.body, expectedResult);
  assertEquals((updateItemMock.execute as any).calls.length, 1);
});



Deno.test("ItemsController.update - should handle parent as root", async () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";
  const expectedResult = { id: "550e8400-e29b-41d4-a716-446655440000", name: "Updated Item" };
  const updateItemMock = createMockUsecase<UpdateItem>(expectedResult);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    updateItemMock,
    {} as SearchItems,
  );
  const req = new MockRequest({
    params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    body: {
      name: "Updated Item",
      description: "Updated Description",
      quantity: 2,
      parentId: null,
      parentType: "root"
    },
    userId
  });
  const res = new MockResponse();
  
  await controller.update(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 200);
  assertEquals(res.body, expectedResult);
  assertEquals((updateItemMock.execute as any).calls.length, 1);
});

Deno.test("ItemsController.update - should return 400 on invalid input", async () => {
  const updateItemMock = createMockUsecase<UpdateItem>(undefined);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    updateItemMock,
    {} as SearchItems,
  );
  const req = new MockRequest({
    params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    body: {
      name: "Updated Item",
      description: "Updated Description",
      quantity: 2,
      parentId: null,
      parentType: "roots-incorrect"
    },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.update(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 400);
});



Deno.test("ItemsController.delete - should delete an item", async () => {
  const deleteItemMock = createMockUsecase<DeleteItem>(undefined);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    deleteItemMock,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.delete(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 204);
  assertEquals((deleteItemMock.execute as any).calls.length, 1);
});

Deno.test("ItemsController.delete - should return 400 on invalid input", async () => {
  const deleteItemMock = createMockUsecase<DeleteItem>(undefined);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    deleteItemMock,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    params: { id: "invalid-uuid" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse(); 
  
  await controller.delete(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 400);
});



Deno.test("ItemsController.getFiles - should get files for an item", async () => {
  const expectedResult = [
    { id: "file-1", name: "file1.txt" },
    { id: "file-2", name: "file2.pdf" }
  ];
  const getItemFilesMock = createMockUsecase<GetItemFiles>(expectedResult);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    getItemFilesMock,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    params: { itemId: "550e8400-e29b-41d4-a716-446655440000" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.getFiles(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 200);
  assertEquals(res.body, expectedResult);
  assertEquals((getItemFilesMock.execute as any).calls.length, 1);
});

Deno.test("ItemsController.getFiles - should return 400 on invalid input", async () => {
  const getItemFilesMock = createMockUsecase<GetItemFiles>(undefined);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    {} as DeleteFileForItem,
    getItemFilesMock,
    {} as UpdateItem,
    {} as SearchItems,
  );  
  const req = new MockRequest({
    params: { itemId: "invalid-uuid" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.getFiles(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 400);
});


Deno.test("ItemsController.addFile - should add a file to an item", async () => {
  const expectedResult = { 
    id: "550e8400-e29b-41d4-a716-446655440000", 
    name: "test.txt", 
    originalName: "test.txt", 
    path: "/path/to/file", 
    mimeType: "text/plain", 
    size: 1024 
  };
  const addFileForItemMock = createMockUsecase<AddFileForItem>(expectedResult);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    addFileForItemMock,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    body: {
      itemId: "550e8400-e29b-41d4-a716-446655440000",
      name: "test.txt",
      originalName: "test.txt",
      path: "/path/to/file",
      mimeType: "text/plain",
      size: 1024
    },
    userId: "user-123"
  });
  const res = new MockResponse();
  
  await controller.addFile(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 201);
  assertEquals(res.body, expectedResult);
  assertEquals((addFileForItemMock.execute as any).calls.length, 1);
});

Deno.test("ItemsController.addFile - should return 400 on invalid input", async () => {
  const addFileForItemMock = createMockUsecase<AddFileForItem>(undefined);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    addFileForItemMock,
    {} as DeleteFileForItem,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    body: {
      itemId: "invalid-uuid",
      name: "test.txt",
      originalName: "test.txt",
      path: "/path/to/file",
      mimeType: "text/plain",
      size: 1024
    },
    userId: "user-123"
  });
  const res = new MockResponse();
  
  await controller.addFile(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 400);
});

Deno.test("ItemsController.deleteFile - should delete a file from an item", async () => {
  const deleteFileForItemMock = createMockUsecase<DeleteFileForItem>(undefined);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    deleteFileForItemMock,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    params: { fileId: "550e8400-e29b-41d4-a716-446655440000", itemId: "550e8400-e29b-41d4-a716-446655440000" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.deleteFile(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 204);
  assertEquals((deleteFileForItemMock.execute as any).calls.length, 1);
}); 

Deno.test("ItemsController.deleteFile - should return 400 on invalid input", async () => {
  const deleteFileForItemMock = createMockUsecase<DeleteFileForItem>(undefined);
  const controller = new ItemsController(
    {} as CreateItem,
    {} as GetItem,
    {} as GetItems,
    {} as DeleteItem,
    {} as AddFileForItem,
    deleteFileForItemMock,
    {} as GetItemFiles,
    {} as UpdateItem,
    {} as SearchItems,
  );
  const req = new MockRequest({
    params: { fileId: "invalid-uuid", itemId: "550e8400-e29b-41d4-a716-446655440000" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  const res = new MockResponse();
  
  await controller.deleteFile(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 400);
}); 
