import { assertEquals, assertRejects } from "jsr:@std/assert";
import { DeleteItem } from "../../../../_shared/usecases/DeleteItem/DeleteItemUsecase.ts";
import { DeleteItemCommand } from "../../../../_shared/usecases/DeleteItem/DeleteItemCommand.ts";
import { DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";

Deno.test("DeleteItem - successfully deletes item", async () => {
  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    imageId: "image-123",
    type: "item"
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem),
    delete: (id: string) => Promise.resolve()
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

  let deleteCalled = false;
  let deleteArgs: any[] = [];
  const originalDelete = mockItemsRepository.delete;
  mockItemsRepository.delete = (id: string) => {
    deleteCalled = true;
    deleteArgs.push(id);
    return originalDelete(id);
  };

  const usecase = new DeleteItem(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = DeleteItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003"
  });

  await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(deleteCalled, true);
  assertEquals(deleteArgs[0], "550e8400-e29b-41d4-a716-446655440003");
});

Deno.test("DeleteItem - throws DocumentNotFoundError when item doesn't exist", async () => {
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(null),
    delete: (id: string) => Promise.resolve()
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

  let deleteCalled = false;
  const originalDelete = mockItemsRepository.delete;
  mockItemsRepository.delete = (id: string) => {
    deleteCalled = true;
    return originalDelete(id);
  };

  const usecase = new DeleteItem(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = DeleteItemCommand.create({
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
  assertEquals(deleteCalled, false);
});

Deno.test("DeleteItem - throws NoPermissionError when user is not item owner", async () => {
  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440044",
    name: "Test Item",
    imageId: "image-123",
    type: "item"
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem),
    delete: (id: string) => Promise.resolve()
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

  let deleteCalled = false;
  const originalDelete = mockItemsRepository.delete;
  mockItemsRepository.delete = (id: string) => {
    deleteCalled = true;
    return originalDelete(id);
  };

  const usecase = new DeleteItem(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = DeleteItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003"
  });

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(deleteCalled, false);
}); 