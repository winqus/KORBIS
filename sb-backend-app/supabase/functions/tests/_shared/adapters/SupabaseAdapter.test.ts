import { spy } from "https://deno.land/std@0.181.0/testing/mock.ts";
import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { SupabaseAdapter } from "../../../_shared/adapters/SupabaseAdapter.ts";
import { SupabaseService } from "../../../_shared/services/SupabaseService.ts";

interface MockSupabaseService {
  ensureFileBase64UploadToBucket: ReturnType<typeof spy>;
  getFilePublicUrl: ReturnType<typeof spy>;
  deleteFile: ReturnType<typeof spy>;
}

Deno.test("SupabaseAdapter", async (t) => {
  await t.step("should create an instance", () => {
    const mockSupabaseService = createMockSupabaseService();
    const adapter = new SupabaseAdapter(mockSupabaseService as unknown as SupabaseService);
    assertExists(adapter);
  });

  await t.step("uploadImage should upload an image and return a URL", async () => {
    const mockSupabaseService = createMockSupabaseService();
    const adapter = new SupabaseAdapter(mockSupabaseService as unknown as SupabaseService);
    
    const uploadResult = await adapter.uploadImage(
      "domain123",
      "image456",
      "base64ImageData"
    );
    
    assertEquals(uploadResult.imageUrl, "https://example.com/public-url");
    assertEquals(mockSupabaseService.ensureFileBase64UploadToBucket.calls.length, 1);
    
    const uploadCall = mockSupabaseService.ensureFileBase64UploadToBucket.calls[0];
    const uploadOptions = uploadCall.args[0] as {
      bucketName: string;
      fileBase64: string;
      filePath: string;
      contentType: string;
    };
    
    assertEquals(uploadOptions.bucketName, "domain-images");
    assertEquals(uploadOptions.fileBase64, "base64ImageData");
    assertEquals(uploadOptions.filePath, "domain123/image456.png");
    assertEquals(uploadOptions.contentType, "image/png");
  });

  await t.step("uploadImage should throw error if upload fails", async () => {
    const errorMessage = "Upload error from CDN";
    const mockSupabaseService = createMockSupabaseService({
      ensureFileBase64UploadToBucket: spy(async () => ({ 
        error: { message: errorMessage }, 
        data: null 
      }))
    });
    
    const adapter = new SupabaseAdapter(mockSupabaseService as unknown as SupabaseService);
    
    await assertRejects(
      async () => {
        await adapter.uploadImage("domain123", "image456", "base64ImageData");
      },
      Error,
      `Error uploading image to CDN: ${errorMessage}`
    );
  });

  await t.step("getImageUrl should return valid URL for existing image ID", () => {
    const mockSupabaseService = createMockSupabaseService();
    const adapter = new SupabaseAdapter(mockSupabaseService as unknown as SupabaseService);
    
    const result = adapter.getImageUrl("domain123", "image456");
    
    assertEquals(result.imageUrl, "https://example.com/public-url");
    assertEquals(mockSupabaseService.getFilePublicUrl.calls.length, 1);
    assertEquals(mockSupabaseService.getFilePublicUrl.calls[0].args[0], "domain-images");
    assertEquals(mockSupabaseService.getFilePublicUrl.calls[0].args[1], "domain123/image456.png");
  });

  await t.step("getImageUrl should return undefined for empty image ID", () => {
    const mockSupabaseService = createMockSupabaseService();
    const adapter = new SupabaseAdapter(mockSupabaseService as unknown as SupabaseService);
    
    const result = adapter.getImageUrl("domain123", "");
    
    assertEquals(result.imageUrl, undefined);
    assertEquals(mockSupabaseService.getFilePublicUrl.calls.length, 0);
  });

  await t.step("getPublicUrl should return the correct public URL", () => {
    const mockSupabaseService = createMockSupabaseService();
    const adapter = new SupabaseAdapter(mockSupabaseService as unknown as SupabaseService);
    
    const result = adapter.getPublicUrl("bucket-name/file-path/image.png");
    
    assertEquals(result, "https://example.com/public-url");
    assertEquals(mockSupabaseService.getFilePublicUrl.calls.length, 1);
    assertEquals(mockSupabaseService.getFilePublicUrl.calls[0].args[0], "bucket-name");
    assertEquals(mockSupabaseService.getFilePublicUrl.calls[0].args[1], "file-path/image.png");
  });

  await t.step("deleteFile should parse URL and delete the file correctly", async () => {
    const mockSupabaseService = createMockSupabaseService();
    const adapter = new SupabaseAdapter(mockSupabaseService as unknown as SupabaseService);
    
    await adapter.deleteFile("https://example.com/storage/v1/object/public/bucket-name/path/to/file.png");
    
    assertEquals(mockSupabaseService.deleteFile.calls.length, 1);
    assertEquals(mockSupabaseService.deleteFile.calls[0].args[0], "bucket-name");
    assertEquals(mockSupabaseService.deleteFile.calls[0].args[1], "path/to/file.png");
  });

  await t.step("deleteFile should throw error for invalid URL format", async () => {
    const mockSupabaseService = createMockSupabaseService();
    const adapter = new SupabaseAdapter(mockSupabaseService as unknown as SupabaseService);
    
    await assertRejects(
      async () => {
        await adapter.deleteFile("https://example.com/invalid/url/format");
      },
      Error,
      "Invalid Supabase file URL format"
    );
    
    assertEquals(mockSupabaseService.deleteFile.calls.length, 0);
  });

  await t.step("deleteFile should pass through errors from SupabaseService", async () => {
    const errorMessage = "File deletion error";
    const mockSupabaseService = createMockSupabaseService({
      deleteFile: spy(async () => {
        throw new Error(errorMessage);
      })
    });
    
    const adapter = new SupabaseAdapter(mockSupabaseService as unknown as SupabaseService);
    
    await assertRejects(
      async () => {
        await adapter.deleteFile("https://example.com/storage/v1/object/public/bucket-name/path/to/file.png");
      },
      Error,
      errorMessage
    );
  });
});

function createMockSupabaseService(customImplementation = {}): MockSupabaseService {
  return {
    ensureFileBase64UploadToBucket: spy(async () => ({ 
      data: { path: "path/to/file" }, 
      error: null 
    })),
    getFilePublicUrl: spy(() => "https://example.com/public-url"),
    deleteFile: spy(async () => {}),
    ...customImplementation
  };
} 