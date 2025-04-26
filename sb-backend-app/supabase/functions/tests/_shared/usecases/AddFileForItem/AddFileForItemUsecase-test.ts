import { assertEquals, assertRejects } from "jsr:@std/assert";
import { assertSpyCalls, spy } from "jsr:@std/testing/mock";
import { AddFileForItem } from "../../../../_shared/usecases/AddFileForItem/AddFileForItemUsecase.ts";
import { AddFileForItemCommand } from "../../../../_shared/usecases/AddFileForItem/AddFileForItemCommand.ts";
import { DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";
import { File } from "../../../../_shared/entities/index.ts";
import { ItemsRepository } from "../../../../_shared/interfaces/ItemsRepository.ts";
import { DomainCdnService } from "../../../../_shared/interfaces/DomainCdnService.ts";
import { Item } from "../../../../_shared/entities/Item.ts";

Deno.test("AddFileForItem - successfully adds file when user has permission", async () => {
  const mockItem = {
    id: "550e8400-e29b-41d4-a716-446655440001",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    type: "item",
    description: "",
    quantity: 1
  } as Item;

  const mockItemsRepository = {
    findById: spy((id: string) => Promise.resolve(mockItem)),
    addFile: spy((itemId: string, fileData: any) => 
      Promise.resolve({
        id: fileData.id,
        name: fileData.name,
        originalName: fileData.originalName,
        fileUrl: fileData.fileUrl,
        mimeType: fileData.mimeType,
        size: fileData.size,
        createdAt: fileData.createdAt
      } as File)
    )
  };

  const mockDomainCdnService = {
    getPublicUrl: spy((path: string) => `https://example.com/${path}`),
    uploadImage: () => Promise.resolve({ imageUrl: "" }),
    getImageUrl: () => ({ imageUrl: "" }),
    deleteFile: () => Promise.resolve()
  };

  const usecase = new AddFileForItem(
    mockItemsRepository as unknown as ItemsRepository,
    mockDomainCdnService as unknown as DomainCdnService
  );

  const command = AddFileForItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440001",
    name: "test-file.pdf",
    originalName: "test-file.pdf",
    path: "uploads/test-file.pdf",
    mimeType: "application/pdf",
    size: 123456
  });

  const result = await usecase.execute(command);

  assertSpyCalls(mockItemsRepository.findById, 1);
  assertEquals(mockItemsRepository.findById.calls[0].args[0], "550e8400-e29b-41d4-a716-446655440001");
  
  assertSpyCalls(mockDomainCdnService.getPublicUrl, 1);
  assertEquals(mockDomainCdnService.getPublicUrl.calls[0].args[0], "uploads/test-file.pdf");
  
  assertSpyCalls(mockItemsRepository.addFile, 1);
  assertEquals(mockItemsRepository.addFile.calls[0].args[0], "550e8400-e29b-41d4-a716-446655440001");
  
  assertEquals(result.name, "test-file.pdf");
  assertEquals(result.originalName, "test-file.pdf");
  assertEquals(result.fileUrl, "https://example.com/uploads/test-file.pdf");
  assertEquals(result.mimeType, "application/pdf");
  assertEquals(result.size, 123456);
});

Deno.test("AddFileForItem - throws DocumentNotFoundError when item doesn't exist", async () => {
  const mockItemsRepository = {
    findById: spy((id: string) => Promise.resolve(null)),
    addFile: spy((itemId: string, fileData: any) => Promise.resolve({} as File))
  };

  const mockDomainCdnService = {
    getPublicUrl: spy((path: string) => `https://example.com/${path}`),
    uploadImage: () => Promise.resolve({ imageUrl: "" }),
    getImageUrl: () => ({ imageUrl: "" }),
    deleteFile: () => Promise.resolve()
  };

  const usecase = new AddFileForItem(
    mockItemsRepository as unknown as ItemsRepository,
    mockDomainCdnService as unknown as DomainCdnService
  );

  const command = AddFileForItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e1100-e29b-41d4-a716-446655440022",
    name: "test-file.pdf",
    originalName: "test-file.pdf",
    path: "uploads/test-file.pdf",
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "Item"
  );

  assertSpyCalls(mockItemsRepository.findById, 1);
  assertEquals(mockItemsRepository.findById.calls[0].args[0], "550e1100-e29b-41d4-a716-446655440022");
  assertSpyCalls(mockDomainCdnService.getPublicUrl, 0);
  assertSpyCalls(mockItemsRepository.addFile, 0);
});

Deno.test("AddFileForItem - throws NoPermissionError when user is not item owner", async () => {
  const mockItem = {
    id: "550e8400-e29b-41d4-a716-446655440001",
    ownerId: "other-user",
    name: "Test Item",
    type: "item",
    description: "",
    quantity: 1
  } as Item;

  const mockItemsRepository = {
    findById: spy((id: string) => Promise.resolve(mockItem)),
    addFile: spy((itemId: string, fileData: any) => Promise.resolve({} as File))
  };

  const mockDomainCdnService = {
    getPublicUrl: spy((path: string) => `https://example.com/${path}`),
    uploadImage: () => Promise.resolve({ imageUrl: "" }),
    getImageUrl: () => ({ imageUrl: "" }),
    deleteFile: () => Promise.resolve()
  };

  const usecase = new AddFileForItem(
    mockItemsRepository as unknown as ItemsRepository,
    mockDomainCdnService as unknown as DomainCdnService
  );

  const command = AddFileForItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440001",
    name: "test-file.pdf",
    originalName: "test-file.pdf",
    path: "uploads/test-file.pdf",
  });

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertSpyCalls(mockItemsRepository.findById, 1);
  assertSpyCalls(mockDomainCdnService.getPublicUrl, 0);
  assertSpyCalls(mockItemsRepository.addFile, 0);
}); 