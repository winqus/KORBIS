import { assertEquals, assertRejects } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { returnsNext, spy, stub } from "https://deno.land/std@0.181.0/testing/mock.ts";
import { AssetsController } from "../../../_shared/controllers/AssetsController.ts";
import { 
  GetAssetsOfParent, 
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
Deno.test("AssetsController.get - should return 200 on success", async () => {
  const getAssetsMock = createMockUsecase<GetAssetsOfParent>(undefined);
  
  const controller = new AssetsController(
    getAssetsMock,
  );
  
  const req = new MockRequest({
    params: {},
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  const nextSpy = spy();
  
  await controller.get(req as any, res as any, nextSpy as any);
  
  assertEquals(res.statusCode, 200);
});

Deno.test("AssetsController.get - should return 400 on invalid id type", async () => {
  const getAssetsMock = createMockUsecase<GetAssetsOfParent>(undefined);
  
  const controller = new AssetsController(
    getAssetsMock,
  );
  
  const req = new MockRequest({
    query: { parentId: "invalid-uuid", parentType: "container" },
    userId: "550e8400-e29b-41d4-a716-446655440000"
  });
  
  const res = new MockResponse();
  const nextSpy = spy();
  
  await controller.get(req as any, res as any, nextSpy as any);
  
  assertEquals(res.statusCode, 400);
});