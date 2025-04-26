import { assertEquals, assertRejects } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { returnsNext, spy, stub } from "https://deno.land/std@0.181.0/testing/mock.ts";
import { ContainersController } from "../../../_shared/controllers/ContainersController.ts";
import { 
  CreateContainer, 
  GetContainer, 
  GetContainers, 
  UpdateContainer,
  DeleteContainer 
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

Deno.test("ContainersController.create - should create a container successfully", async () => {
  const expectedResult = { id: "container-id", name: "Test Container" };
  const createContainerMock = createMockUsecase<CreateContainer>(expectedResult);
  
  const controller = new ContainersController(
    createContainerMock,
    {} as GetContainers,
    {} as GetContainer,
    {} as UpdateContainer,
    {} as DeleteContainer
  );
  
  const req = new MockRequest({
    body: {
      name: "Test Container",
      description: "Description",
      imageBase64: "data:image/png;base64,abc123",
      parentId: "550e8400-e29b-41d4-a716-446655440000",
      parentType: "container"
    },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  
  await controller.create(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 201);
  assertEquals(res.body, expectedResult);
  assertEquals((createContainerMock.execute as any).calls.length, 1);
});

Deno.test("ContainersController.create - should handle errors", async () => {
  const error = new Error("Test error");
  const createContainerMock = createErrorMockUsecase<CreateContainer>(error);
  
  const controller = new ContainersController(
    createContainerMock,
    {} as GetContainers,
    {} as GetContainer,
    {} as UpdateContainer,
    {} as DeleteContainer
  );
  
  const req = new MockRequest({
    body: {
      name: "Test Container",
      description: "Description"
    },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  const nextSpy = spy();
  
  await controller.create(req as any, res as any, nextSpy as any);
  
  assertEquals(res.statusCode, 400);
});

Deno.test("ContainersController.getPaginated - should get paginated containers", async () => {
  const expectedResult = { 
    containers: [{ id: "container-id", name: "Test Container" }], 
    total: 1 
  };
  
  const getContainersMock = createMockUsecase<GetContainers>(expectedResult);
  
  const controller = new ContainersController(
    {} as CreateContainer,
    getContainersMock,
    {} as GetContainer,
    {} as UpdateContainer,
    {} as DeleteContainer
  );
  
  const req = new MockRequest({
    query: { 
      limit: "10", 
      skip: "0", 
      parentId: "550e8400-e29b-41d4-a716-446655440000" 
    },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  
  await controller.getPaginated(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 200);
  assertEquals(res.body, expectedResult);
  assertEquals((getContainersMock.execute as any).calls.length, 1);
});

Deno.test("ContainersController.getPaginated - should handle errors", async () => {
  const error = new Error("Test server error");
  const getContainersMock = createErrorMockUsecase<GetContainers>(error);
  
  const controller = new ContainersController(
    {} as CreateContainer,
    getContainersMock,
    {} as GetContainer,
    {} as UpdateContainer,
    {} as DeleteContainer
  );
  
  const req = new MockRequest({
    query: { 
      limit: "10", 
      skip: "0" 
    },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  const nextSpy = spy();
  
  await controller.getPaginated(req as any, res as any, nextSpy as any);
  console.log(res);
  assertEquals(res.statusCode, 500);
  assertEquals(res.body, { error: "Internal Server Error. Check server logs" });
});

Deno.test("ContainersController.get - should get a container by ID", async () => {
  const expectedResult = { id: "container-id", name: "Test Container" };
  const getContainerMock = createMockUsecase<GetContainer>(expectedResult);
  
  const controller = new ContainersController(
    {} as CreateContainer,
    {} as GetContainers,
    getContainerMock,
    {} as UpdateContainer,
    {} as DeleteContainer
  );
  
  const req = new MockRequest({
    params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  
  await controller.get(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 200);
  assertEquals(res.body, expectedResult);
  assertEquals((getContainerMock.execute as any).calls.length, 1);
});

Deno.test("ContainersController.get - should get a container by visual code", async () => {
  const expectedResult = { id: "container-id", name: "Test Container" };
  const getContainerMock = createMockUsecase<GetContainer>(expectedResult);
  
  const controller = new ContainersController(
    {} as CreateContainer,
    {} as GetContainers,
    getContainerMock,
    {} as UpdateContainer,
    {} as DeleteContainer
  );
  
  const visualCode = "KX-KAXF-V";
  
  const req = new MockRequest({
    params: { id: visualCode },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  
  await controller.get(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 200);
  assertEquals(res.body, expectedResult);
  assertEquals((getContainerMock.execute as any).calls.length, 1);
});

Deno.test("ContainersController.get - should return 400 on invalid input", async () => {
  const getContainerMock = createMockUsecase<GetContainer>(undefined);
  
  const controller = new ContainersController(
    {} as CreateContainer,
    {} as GetContainers,
    getContainerMock,
    {} as UpdateContainer,
    {} as DeleteContainer
  );
  
  const req = new MockRequest({
    params: { id: "123" }, // Not a UUID or visual code
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  const nextSpy = spy();
  
  await controller.get(req as any, res as any, nextSpy as any);
  
  assertEquals(res.statusCode, 400);
});

Deno.test("ContainersController.get - should return 400 on invalid id type", async () => {
  const getContainerMock = createMockUsecase<GetContainer>(undefined);
  
  const controller = new ContainersController(
    {} as CreateContainer,
    {} as GetContainers,
    getContainerMock,
    {} as UpdateContainer,
    {} as DeleteContainer
  );
  
  const req = new MockRequest({
    params: { id: 123 as any }, // Not a UUID or visual code
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  const nextSpy = spy();
  
  await controller.get(req as any, res as any, nextSpy as any);
  
  assertEquals(res.statusCode, 400);
});

Deno.test("ContainersController.update - should update a container", async () => {
  const expectedResult = { 
    id: "550e8400-e29b-41d4-a716-446655440000", 
    name: "Updated Container" 
  };
  
  const updateContainerMock = createMockUsecase<UpdateContainer>(expectedResult);
  
  const controller = new ContainersController(
    {} as CreateContainer,
    {} as GetContainers,
    {} as GetContainer,
    updateContainerMock,
    {} as DeleteContainer
  );
  
  const req = new MockRequest({
    params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    body: {
      name: "Updated Container",
      description: "Updated Description",
      imageBase64: "data:image/png;base64,updated123",
      parentId: "550e8400-e29b-41d4-a716-446655440000",
      parentType: "container"
    },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  
  await controller.update(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 200);
  assertEquals(res.body, expectedResult);
  assertEquals((updateContainerMock.execute as any).calls.length, 1);
});

Deno.test("ContainersController.update - should handle parent as root", async () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";
  const expectedResult = { 
    id: "550e8400-e29b-41d4-a716-446655440000", 
    name: "Updated Container" 
  };
  
  const updateContainerMock = createMockUsecase<UpdateContainer>(expectedResult);
  
  const controller = new ContainersController(
    {} as CreateContainer,
    {} as GetContainers,
    {} as GetContainer,
    updateContainerMock,
    {} as DeleteContainer
  );
  
  const req = new MockRequest({
    params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    body: {
      name: "Updated Container",
      description: "Updated Description",
      parentId: null,
      parentType: "root"
    },
    userId
  });
  
  const res = new MockResponse();
  
  await controller.update(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 200);
  assertEquals(res.body, expectedResult);
  assertEquals((updateContainerMock.execute as any).calls.length, 1);
});

Deno.test("ContainersController.update - should handle errors", async () => {
  const updateContainerMock = createMockUsecase<UpdateContainer>();
  
  const controller = new ContainersController(
    {} as CreateContainer,
    {} as GetContainers,
    {} as GetContainer,
    updateContainerMock,
    {} as DeleteContainer
  );
  
  const req = new MockRequest({
    params: { id: "invalid-uuid" },
    body: {
      name: "Updated Container",
      description: "Updated Description"
    },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  const nextSpy = spy();
  
  await controller.update(req as any, res as any, nextSpy as any);
  
  assertEquals(res.statusCode, 400);
});

Deno.test("ContainersController.delete - should delete a container", async () => {
  const deleteContainerMock = createMockUsecase<DeleteContainer>(undefined);
  
  const controller = new ContainersController(
    {} as CreateContainer,
    {} as GetContainers,
    {} as GetContainer,
    {} as UpdateContainer,
    deleteContainerMock
  );
  
  const req = new MockRequest({
    params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  
  await controller.delete(req as any, res as any, nextFunctionMock as any);
  
  assertEquals(res.statusCode, 204);
  assertEquals((deleteContainerMock.execute as any).calls.length, 1);
});

Deno.test("ContainersController.delete - should handle errors", async () => {
  const error = new Error("Test error");
  const deleteContainerMock = createErrorMockUsecase<DeleteContainer>(error);
  
  const controller = new ContainersController(
    {} as CreateContainer,
    {} as GetContainers,
    {} as GetContainer,
    {} as UpdateContainer,
    deleteContainerMock
  );
  
  const req = new MockRequest({
    params: { id: "invalid-uuid" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  const nextSpy = spy();
  
  await controller.delete(req as any, res as any, nextSpy as any);
  
  assertEquals(res.statusCode, 400);
}); 