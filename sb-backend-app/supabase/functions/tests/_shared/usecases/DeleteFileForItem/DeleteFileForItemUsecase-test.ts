import { assertEquals, assertRejects } from "jsr:@std/assert";
import { DeleteFileForItem } from "../../../../_shared/usecases/DeleteFileForItem/DeleteFileForItemUsecase.ts";
import { DeleteFileForItemCommand } from "../../../../_shared/usecases/DeleteFileForItem/DeleteFileForItemCommand.ts";
import { DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";

Deno.test("DeleteFileForItem - successfully deletes file for item", async () => {
  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    files: [
      {
        id: "550e8400-e29b-41d4-a716-446655440099",
        fileName: "test-file.pdf",
        fileUrl: "https://example.com/files/test-file.pdf"
      }
    ]
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem),
    deleteFile: (itemId: string, fileId: string) => Promise.resolve()
  };

  const mockDomainCdnService = {
    deleteFile: (fileUrl: string) => Promise.resolve()
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let deleteFileCalled = false;
  let deleteFileArgs: any[] = [];
  const originalDeleteFile = mockItemsRepository.deleteFile;
  mockItemsRepository.deleteFile = (itemId: string, fileId: string) => {
    deleteFileCalled = true;
    deleteFileArgs.push({ itemId, fileId });
    return originalDeleteFile(itemId, fileId);
  };

  let cdnDeleteFileCalled = false;
  let cdnDeleteFileArgs: any[] = [];
  const originalCdnDeleteFile = mockDomainCdnService.deleteFile;
  mockDomainCdnService.deleteFile = (fileUrl: string) => {
    cdnDeleteFileCalled = true;
    cdnDeleteFileArgs.push(fileUrl);
    return originalCdnDeleteFile(fileUrl);
  };

  const usecase = new DeleteFileForItem(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = DeleteFileForItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003",
    fileId: "550e8400-e29b-41d4-a716-446655440099"
  });

  await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(cdnDeleteFileCalled, true);
  assertEquals(cdnDeleteFileArgs[0], "https://example.com/files/test-file.pdf");
  
  assertEquals(deleteFileCalled, true);
  assertEquals(deleteFileArgs[0].itemId, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(deleteFileArgs[0].fileId, "550e8400-e29b-41d4-a716-446655440099");
});

Deno.test("DeleteFileForItem - throws DocumentNotFoundError when item doesn't exist", async () => {
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(null),
    deleteFile: (itemId: string, fileId: string) => Promise.resolve()
  };

  const mockDomainCdnService = {
    deleteFile: (fileUrl: string) => Promise.resolve()
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let deleteFileCalled = false;
  const originalDeleteFile = mockItemsRepository.deleteFile;
  mockItemsRepository.deleteFile = (itemId: string, fileId: string) => {
    deleteFileCalled = true;
    return originalDeleteFile(itemId, fileId);
  };

  let cdnDeleteFileCalled = false;
  const originalCdnDeleteFile = mockDomainCdnService.deleteFile;
  mockDomainCdnService.deleteFile = (fileUrl: string) => {
    cdnDeleteFileCalled = true;
    return originalCdnDeleteFile(fileUrl);
  };

  const usecase = new DeleteFileForItem(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = DeleteFileForItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003",
    fileId: "550e8400-e29b-41d4-a716-446655440099"
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "Item"
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(deleteFileCalled, false);
  assertEquals(cdnDeleteFileCalled, false);
});

Deno.test("DeleteFileForItem - throws NoPermissionError when user is not item owner", async () => {
  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440044",
    name: "Test Item",
    files: [
      {
        id: "550e8400-e29b-41d4-a716-446655440099",
        fileName: "test-file.pdf",
        fileUrl: "https://example.com/files/test-file.pdf"
      }
    ]
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem),
    deleteFile: (itemId: string, fileId: string) => Promise.resolve()
  };

  const mockDomainCdnService = {
    deleteFile: (fileUrl: string) => Promise.resolve()
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let deleteFileCalled = false;
  const originalDeleteFile = mockItemsRepository.deleteFile;
  mockItemsRepository.deleteFile = (itemId: string, fileId: string) => {
    deleteFileCalled = true;
    return originalDeleteFile(itemId, fileId);
  };

  let cdnDeleteFileCalled = false;
  const originalCdnDeleteFile = mockDomainCdnService.deleteFile;
  mockDomainCdnService.deleteFile = (fileUrl: string) => {
    cdnDeleteFileCalled = true;
    return originalCdnDeleteFile(fileUrl);
  };

  const usecase = new DeleteFileForItem(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = DeleteFileForItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003",
    fileId: "550e8400-e29b-41d4-a716-446655440099"
  });

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(deleteFileCalled, false);
  assertEquals(cdnDeleteFileCalled, false);
});

Deno.test("DeleteFileForItem - throws DocumentNotFoundError when file doesn't exist in item", async () => {
  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    files: [
      {
        id: "550e8400-e29b-41d4-a716-446655440088",
        fileName: "other-file.pdf",
        fileUrl: "https://example.com/files/other-file.pdf"
      }
    ]
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem),
    deleteFile: (itemId: string, fileId: string) => Promise.resolve()
  };

  const mockDomainCdnService = {
    deleteFile: (fileUrl: string) => Promise.resolve()
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let deleteFileCalled = false;
  const originalDeleteFile = mockItemsRepository.deleteFile;
  mockItemsRepository.deleteFile = (itemId: string, fileId: string) => {
    deleteFileCalled = true;
    return originalDeleteFile(itemId, fileId);
  };

  let cdnDeleteFileCalled = false;
  const originalCdnDeleteFile = mockDomainCdnService.deleteFile;
  mockDomainCdnService.deleteFile = (fileUrl: string) => {
    cdnDeleteFileCalled = true;
    return originalCdnDeleteFile(fileUrl);
  };

  const usecase = new DeleteFileForItem(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = DeleteFileForItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003",
    fileId: "550e8400-e29b-41d4-a716-446655440099"
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "File"
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(deleteFileCalled, false);
  assertEquals(cdnDeleteFileCalled, false);
}); 