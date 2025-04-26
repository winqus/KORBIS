import { assertEquals, assertRejects } from "jsr:@std/assert";
import { GetItemFiles } from "../../../../_shared/usecases/GetItemFiles/GetItemFilesUsecase.ts";
import { GetItemFilesCommand } from "../../../../_shared/usecases/GetItemFiles/GetItemFilesCommand.ts";
import { DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";

Deno.test("GetItemFiles - successfully gets files for an item", async () => {
  const sampleFiles = [
    {
      id: "550e8400-e29b-41d4-a716-446655440099",
      fileName: "test-file.pdf",
      fileUrl: "https://example.com/files/test-file.pdf",
      contentType: "application/pdf",
      sizeBytes: 1024
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440088",
      fileName: "another-file.docx",
      fileUrl: "https://example.com/files/another-file.docx",
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 2048
    }
  ];

  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    files: sampleFiles
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem)
  };

  const mockDomainCdnService = {};

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  const usecase = new GetItemFiles(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemFilesCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003"
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(result.length, 2);
  assertEquals(result[0].id, "550e8400-e29b-41d4-a716-446655440099");
  assertEquals(result[0].fileUrl, "https://example.com/files/test-file.pdf");
  assertEquals(result[1].id, "550e8400-e29b-41d4-a716-446655440088");
});

Deno.test("GetItemFiles - returns empty array when item has no files", async () => {
  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    files: []
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem)
  };

  const mockDomainCdnService = {};

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  const usecase = new GetItemFiles(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemFilesCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003"
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.length, 0);
});

Deno.test("GetItemFiles - returns empty array when item has no files property", async () => {
  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item"
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem)
  };

  const mockDomainCdnService = {};

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  const usecase = new GetItemFiles(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemFilesCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003"
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.length, 0);
});

Deno.test("GetItemFiles - throws DocumentNotFoundError when item doesn't exist", async () => {
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(null)
  };

  const mockDomainCdnService = {};

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  const usecase = new GetItemFiles(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemFilesCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003"
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "Item"
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
});

Deno.test("GetItemFiles - throws NoPermissionError when user is not item owner", async () => {
  const sampleFiles = [
    {
      id: "550e8400-e29b-41d4-a716-446655440099",
      fileName: "test-file.pdf",
      fileUrl: "https://example.com/files/test-file.pdf"
    }
  ];

  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440044", // Different owner
    name: "Test Item",
    files: sampleFiles
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem)
  };

  const mockDomainCdnService = {};

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  const usecase = new GetItemFiles(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemFilesCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003"
  });

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
}); 