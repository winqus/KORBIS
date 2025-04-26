import { assertEquals, assertRejects } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { spy } from "https://deno.land/std@0.181.0/testing/mock.ts";
import { SupabaseService } from "../../../_shared/services/SupabaseService.ts";
import { ConfigService } from "../../../_shared/interfaces/ConfigService.ts";
import { SupabaseClient } from "@supabase/supabase-js";

const mockQueryResultSuccess = { rowCount: 1, rows: [] };
const mockPoolConnection = {
  queryArray: spy(async () => mockQueryResultSuccess),
  release: spy()
};
const mockPool = {
  connect: spy(async () => mockPoolConnection)
};
const mockPostgres = {
  Pool: spy(function() {
    return mockPool;
  })
};

const createMockStorageFileApi = (options = {}) => {
  const defaultImplementations = {
    upload: spy(async () => ({ data: { path: "path/to/file" }, error: null })),
    getPublicUrl: spy(() => ({ data: { publicUrl: "http://kong:8000/storage/v1/object/public/bucket/path/to/file" } })),
    remove: spy(async () => ({ error: null }))
  };
  
  return { ...defaultImplementations, ...options };
};

const createMockStorageApi = (options = {}) => {
  const defaultImplementations = {
    from: spy(() => createMockStorageFileApi()),
    createBucket: spy(async () => ({ error: null })),
    deleteBucket: spy(async () => ({ error: null }))
  };
  
  return { ...defaultImplementations, ...options };
};

const createMockClient = (options = {}) => {
  const defaultImplementations = {
    storage: createMockStorageApi(),
    auth: {},
    from: () => ({})
  };
  
  return { ...defaultImplementations, ...options };
};

class MockConfigService implements ConfigService {
  private env: Record<string, string> = {
    SUPABASE_URL: "http://localhost:54321",
    SUPABASE_ANON_KEY: "test-anon-key"
  };
  
  constructor(customEnv?: Record<string, string>) {
    if (customEnv) {
      this.env = { ...this.env, ...customEnv };
    }
  }
  
  get(key: string): string | null {
    return this.env[key] || null;
  }
  
  getOrThrow(key: string): string {
    const value = this.get(key);
    if (value === null) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
  }
}

Deno.test("SupabaseService.uploadFileAsAdmin - should upload file correctly", async () => {
  const mockClient: any = createMockClient();
  const mockAdminClient = () => mockClient;
  const mockUserClient = () => createMockClient() as any;
  const configService = new MockConfigService();
  
  const service = new SupabaseService(
    mockAdminClient,
    mockUserClient,
    configService
  );
  
  const result = await service.uploadFileAsAdmin(
    "test-bucket",
    new ArrayBuffer(10),
    "test/file.png",
    "image/png"
  );
  
  assertEquals(result.data?.path, "path/to/file");
  assertEquals(result.error, null);
  assertEquals(mockClient.storage.from.calls.length, 1);
  const firstCall = mockClient.storage.from.calls[0];
  assertEquals(firstCall.args[0], "test-bucket");
});

Deno.test("SupabaseService.createAdminFileUploader - should return uploader function", async () => {
  const mockStorageFileApi: any = createMockStorageFileApi();
  const mockStorageApi: any = createMockStorageApi({
    from: spy(() => mockStorageFileApi)
  });
  const mockClient: any = createMockClient({
    storage: mockStorageApi
  });
  const mockAdminClient = () => mockClient;
  const service = new SupabaseService(
    mockAdminClient,
    () => createMockClient() as any,
    new MockConfigService()
  );
  
  const uploader = service.createAdminFileUploader(
    "test-bucket",
    new ArrayBuffer(10),
    "test/file.png",
    "image/png"
  );
  
  assertEquals(typeof uploader, "function");
  
  const result = await uploader();
  
  assertEquals(result.data?.path, "path/to/file");
  assertEquals(result.error, null);
  assertEquals(mockStorageApi.from.calls.length, 1);
  const fromCall = mockStorageApi.from.calls[0];
  assertEquals(fromCall.args[0], "test-bucket");
  assertEquals(mockStorageFileApi.upload.calls.length, 1);
  const uploadCall = mockStorageFileApi.upload.calls[0];
  assertEquals(uploadCall.args[0], "test/file.png");
  assertEquals(uploadCall.args[2], { contentType: "image/png" });
});

Deno.test("SupabaseService.getFilePublicUrl - should return corrected URL in local env", () => {
  const mockStorageFileApi: any = createMockStorageFileApi();
  const mockStorageApi: any = createMockStorageApi({
    from: spy(() => mockStorageFileApi)
  });
  const mockClient: any = createMockClient({
    storage: mockStorageApi
  });
  
  const service = new SupabaseService(
    () => createMockClient() as any,
    () => mockClient,
    new MockConfigService()
  );
  
  const url = service.getFilePublicUrl("test-bucket", "test/file.png");
  
  assertEquals(url, "http://kong:8000/storage/v1/object/public/bucket/path/to/file");
  assertEquals(mockStorageApi.from.calls.length, 1);
  const fromCall = mockStorageApi.from.calls[0];
  assertEquals(fromCall.args[0], "test-bucket");
  assertEquals(mockStorageFileApi.getPublicUrl.calls.length, 1);
  const publicUrlCall = mockStorageFileApi.getPublicUrl.calls[0];
  assertEquals(publicUrlCall.args[0], "test/file.png");
});

Deno.test("SupabaseService.ensureFileBase64UploadToBucket - should convert base64 and upload", async () => {
  const mockClient: any = createMockClient();
  const mockAdminClient = () => mockClient;
  
  const service = new SupabaseService(
    mockAdminClient,
    () => createMockClient() as any,
    new MockConfigService()
  );
  
  const result = await service.ensureFileBase64UploadToBucket({
    bucketName: "test-bucket",
    fileBase64: "SGVsbG8gV29ybGQ=",
    filePath: "test/file.txt",
    contentType: "text/plain",
    bucketOptions: {
      public: true
    }
  });
  
  assertEquals(result.data?.path, "path/to/file");
  assertEquals(result.error, null);
});

Deno.test("SupabaseService.ensureFileUploadToBucket - should upload to existing bucket", async () => {
  const mockClient: any = createMockClient();
  const mockAdminClient = () => mockClient;
  
  const service = new SupabaseService(
    mockAdminClient,
    () => createMockClient() as any,
    new MockConfigService()
  );
  
  const result = await service.ensureFileUploadToBucket({
    bucketName: "test-bucket",
    fileBuffer: new ArrayBuffer(10),
    filePath: "test/file.png",
    contentType: "image/png",
    bucketOptions: {
      public: true
    }
  });
  
  assertEquals(result.data?.path, "path/to/file");
  assertEquals(result.error, null);
  assertEquals(mockClient.storage.createBucket.calls.length, 0);
});

Deno.test("SupabaseService.ensureFileUploadToBucket - should create bucket if not exists", async () => {
  const mockStorageFileApi: any = createMockStorageFileApi();
  let firstCallMade = false;
  
  const uploadSpy = spy(async () => {
    if (!firstCallMade) {
      firstCallMade = true;
      return { 
        data: null, 
        error: { message: "Bucket not found" }
      };
    }
    return { 
      data: { path: "path/to/file" }, 
      error: null 
    };
  });
  
  mockStorageFileApi.upload = uploadSpy;
  
  const mockStorageApi: any = createMockStorageApi({
    from: spy(() => mockStorageFileApi)
  });
  
  const mockClient: any = createMockClient({
    storage: mockStorageApi
  });
  
  const mockAdminClient = () => mockClient;
  
  const service = new SupabaseService(
    mockAdminClient,
    () => createMockClient() as any,
    new MockConfigService()
  );
  
  const result = await service.ensureFileUploadToBucket({
    bucketName: "test-bucket",
    fileBuffer: new ArrayBuffer(10),
    filePath: "test/file.png",
    contentType: "image/png",
    bucketOptions: {
      public: true,
      allowedMimeTypes: ["image/*"],
      fileSizeLimit: "10MB"
    }
  });
  
  assertEquals(result.data?.path, "path/to/file");
  assertEquals(result.error, null);
  assertEquals(mockClient.storage.createBucket.calls.length, 1);
  const createBucketCall = mockClient.storage.createBucket.calls[0];
  assertEquals(createBucketCall.args[0], "test-bucket");
  assertEquals(createBucketCall.args[1], {
    public: true,
    allowedMimeTypes: ["image/*"],
    fileSizeLimit: "10MB"
  });
  assertEquals(uploadSpy.calls.length, 2);
});

Deno.test("SupabaseService.ensureFileUploadToBucket - should handle bucket creation failure", async () => {
  const mockStorageFileApi: any = createMockStorageFileApi({
    upload: spy(async () => ({ 
      data: null, 
      error: { message: "Bucket not found" }
    }))
  });
  
  const mockStorageApi: any = createMockStorageApi({
    from: spy(() => mockStorageFileApi),
    createBucket: spy(async () => ({ 
      error: { message: "Permission denied" } 
    }))
  });
  
  const mockClient: any = createMockClient({
    storage: mockStorageApi
  });
  
  const mockAdminClient = () => mockClient;
  
  const service = new SupabaseService(
    mockAdminClient,
    () => createMockClient() as any,
    new MockConfigService()
  );
  
  const result = await service.ensureFileUploadToBucket({
    bucketName: "test-bucket",
    fileBuffer: new ArrayBuffer(10),
    filePath: "test/file.png",
    contentType: "image/png",
    bucketOptions: {
      public: true
    }
  });
  
  assertEquals(result.data, null);
  assertEquals(result.error?.message, "Permission denied");
});

Deno.test("SupabaseService.deleteBucket - should delete bucket", async () => {
  const mockClient: any = createMockClient();
  const mockAdminClient = () => mockClient;
  
  const service = new SupabaseService(
    mockAdminClient,
    () => createMockClient() as any,
    new MockConfigService()
  );
  
  await service.deleteBucket("test-bucket");
  
  assertEquals(mockClient.storage.deleteBucket.calls.length, 1);
  const deleteBucketCall = mockClient.storage.deleteBucket.calls[0];
  assertEquals(deleteBucketCall.args[0], "test-bucket");
});

Deno.test("SupabaseService.deleteBucket - should throw on deletion error", async () => {
  const mockStorageApi: any = createMockStorageApi({
    deleteBucket: spy(async () => ({ 
      error: { message: "Bucket not found" } 
    }))
  });
  
  const mockClient: any = createMockClient({
    storage: mockStorageApi
  });
  
  const mockAdminClient = () => mockClient;
  
  const service = new SupabaseService(
    mockAdminClient,
    () => createMockClient() as any,
    new MockConfigService()
  );
  
  await assertRejects(
    async () => await service.deleteBucket("test-bucket"),
    Error,
    "Failed to delete bucket: Bucket not found"
  );
});

Deno.test("SupabaseService.deleteFile - should delete file", async () => {
  const mockStorageFileApi: any = createMockStorageFileApi();
  
  const mockStorageApi: any = createMockStorageApi({
    from: spy(() => mockStorageFileApi)
  });
  
  const mockClient: any = createMockClient({
    storage: mockStorageApi
  });
  
  const mockAdminClient = () => mockClient;
  
  const service = new SupabaseService(
    mockAdminClient,
    () => createMockClient() as any,
    new MockConfigService()
  );
  
  await service.deleteFile("test-bucket", "test/file.png");
  
  assertEquals(mockStorageApi.from.calls.length, 1);
  const fromCall = mockStorageApi.from.calls[0];
  assertEquals(fromCall.args[0], "test-bucket");
  assertEquals(mockStorageFileApi.remove.calls.length, 1);
  const removeCall = mockStorageFileApi.remove.calls[0];
  assertEquals(removeCall.args[0], ["test/file.png"]);
});

Deno.test("SupabaseService.deleteFile - should throw on deletion error", async () => {
  const mockStorageFileApi: any = createMockStorageFileApi({
    remove: spy(async () => ({ 
      error: { message: "File not found" } 
    }))
  });
  
  const mockStorageApi: any = createMockStorageApi({
    from: spy(() => mockStorageFileApi)
  });
  
  const mockClient: any = createMockClient({
    storage: mockStorageApi
  });
  
  const mockAdminClient = () => mockClient;
  
  const service = new SupabaseService(
    mockAdminClient,
    () => createMockClient() as any,
    new MockConfigService()
  );
  
  await assertRejects(
    async () => await service.deleteFile("test-bucket", "test/file.png"),
    Error,
    "Failed to delete file: File not found"
  );
}); 

Deno.test("SupabaseService.createUserFolderPolicy - should create user folder policy", async () => {
  // @ts-ignore - Mocking the postgres module
  SupabaseService.prototype.executeQuery = async function(query: string) {
    assertEquals(typeof query, "string");
    assertEquals(query.includes("CREATE POLICY"), true);
    assertEquals(query.includes("test-bucket"), true);
    return mockQueryResultSuccess;
  };
  
  const mockClient: any = createMockClient();
  const mockAdminClient = () => mockClient;
  
  const service = new SupabaseService(
    mockAdminClient,
    () => createMockClient() as any,
    new MockConfigService({
      SUPABASE_DB_URL: "postgres://user:password@localhost:5432/db",
      SUPABASE_ANON_KEY: "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    })
  );
  
  const result = await service.createUserFolderPolicy("test-bucket");
  
  assertEquals(typeof result, "object");
  assertEquals(result.rowCount, 1);
  
  // @ts-ignore - Restoring the original method
  delete SupabaseService.prototype.executeQuery;
}); 