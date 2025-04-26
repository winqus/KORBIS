import { assertEquals } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { spy, stub } from "https://deno.land/std@0.181.0/testing/mock.ts";
import { handleError } from "../../../_shared/controllers/errorHandler.ts";
import {
  BadRequestError,
  DocumentNotFoundError,
  MissingEnvVariableError,
  NoPermissionError,
} from "../../../_shared/errors/index.ts";

class MockRequest {
  userId?: string;
  constructor(userId?: string) {
    this.userId = userId;
  }
}

class MockResponse {
  statusCode: number = 200;
  responseBody: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: any) {
    this.responseBody = data;
    return this;
  }
}

const originalConsoleError = console.error;
let consoleErrorSpy: ReturnType<typeof spy>;

function setupTest(isDevelopment = false) {
  const req = new MockRequest("test-user-id");
  const res = new MockResponse();
  const next = spy();
  
  consoleErrorSpy = spy();
  console.error = consoleErrorSpy;
  
  if (isDevelopment) {
    Deno.env.set("ENVIRONMENT", "development");
  } else {
    Deno.env.delete("ENVIRONMENT");
  }
  
  return { req, res, next };
}

function cleanupTest() {
  console.error = originalConsoleError;
  Deno.env.delete("ENVIRONMENT");
}

Deno.test("handleError - should handle BadRequestError in production", () => {
  const { req, res, next } = setupTest();
  const errorDetails = { field: "Invalid field value" };
  const error = new BadRequestError(errorDetails);

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 400);
  assertEquals(res.responseBody, {
    error: "Bad Request",
    details: errorDetails
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle BadRequestError in development", () => {
  const { req, res, next } = setupTest(true);
  const errorDetails = { field: "Invalid field value" };
  const error = new BadRequestError(errorDetails);

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 400);
  assertEquals(res.responseBody, {
    error: "Bad Request",
    details: errorDetails,
    __devInfo: JSON.stringify(errorDetails)
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle MissingEnvVariableError in production", () => {
  const { req, res, next } = setupTest();
  const error = new MissingEnvVariableError("API_KEY");

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 500);
  assertEquals(res.responseBody, {
    error: "Internal Server Error. Check server logs"
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle MissingEnvVariableError in development", () => {
  const { req, res, next } = setupTest(true);
  const error = new MissingEnvVariableError("API_KEY");

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 500);
  assertEquals(res.responseBody, {
    error: "Internal Server Error. Check server logs",
    __devInfo: "Missing environment variable: API_KEY"
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle DocumentNotFoundError in production", () => {
  const { req, res, next } = setupTest();
  const error = new DocumentNotFoundError("Container", "123");

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 404);
  assertEquals(res.responseBody, {
    error: "Not Found",
    details: JSON.parse(error.message)
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle DocumentNotFoundError in development", () => {
  const { req, res, next } = setupTest(true);
  const error = new DocumentNotFoundError("Container", "123");

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 404);
  assertEquals(res.responseBody, {
    error: "Not Found",
    details: JSON.parse(error.message),
    __devInfo: error.message
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle NoPermissionError in production", () => {
  const { req, res, next } = setupTest();
  const error = new NoPermissionError();

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 403);
  assertEquals(res.responseBody, {
    error: "Forbidden",
    details: { message: error.message }
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle NoPermissionError in development", () => {
  const { req, res, next } = setupTest(true);
  const error = new NoPermissionError();

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 403);
  assertEquals(res.responseBody, {
    error: "Forbidden",
    details: { message: error.message },
    __devInfo: { message: error.message, userId: "test-user-id" }
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle generic Error in production", () => {
  const { req, res, next } = setupTest();
  const error = new Error("Something went wrong");

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 500);
  assertEquals(res.responseBody, {
    error: "Internal Server Error. Check server logs"
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle generic Error in development", () => {
  const { req, res, next } = setupTest(true);
  const error = new Error("Something went wrong");

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 500);
  assertEquals(res.responseBody, {
    error: "Internal Server Error. Check server logs",
    __devInfo: error.message
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle unknown error in production", () => {
  const { req, res, next } = setupTest();
  const error = "Unexpected string error";

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 500);
  assertEquals(res.responseBody, {
    error: "Internal Server Error. Check server logs."
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle unknown error in development", () => {
  const { req, res, next } = setupTest(true);
  const error = "Unexpected string error";

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 500);
  assertEquals(res.responseBody, {
    error: "Internal Server Error. Check server logs.",
    __devInfo: String(error)
  });
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
});

Deno.test("handleError - should handle error in error handler", () => {
  const { req, res, next } = setupTest(true);
  const error = {
    toString: () => { throw new Error("Cannot convert to string"); }
  };

  handleError(error, req as any, res as any, next as any);

  assertEquals(res.statusCode, 500);
  assertEquals(res.responseBody.error, "Something went wrong. Check server logs.");
  assertEquals(consoleErrorSpy.calls.length, 1);

  cleanupTest();
}); 