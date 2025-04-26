import { assertEquals, assertRejects } from "jsr:@std/assert";
import { GetItem } from "../../../../_shared/usecases/GetItem/GetItemUsecase.ts";
import { GetItemCommand } from "../../../../_shared/usecases/GetItem/GetItemCommand.ts";
import { DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";
import { AssetTypeEnum } from "../../../../_shared/core/index.ts";

Deno.test("GetItem - successfully gets item", async () => {
  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    type: AssetTypeEnum.ITEM,
    description: "Item description",
    quantity: 5,
    imageId: "image-123",
    parentId: "550e8400-e29b-41d4-a716-446655440099",
    parentType: AssetTypeEnum.CONTAINER,
    parentName: "Parent Container"
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let getImageUrlCalled = false;
  let getImageUrlArgs: any[] = [];
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    getImageUrlArgs.push({ userId, imageId });
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new GetItem(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003"
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(getImageUrlCalled, true);
  assertEquals(getImageUrlArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[0].imageId, "image-123");
  
  assertEquals(result.id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.name, "Test Item");
  assertEquals(result.description, "Item description");
  assertEquals(result.imageUrl, "https://example.com/images/image-123.jpg");
  assertEquals(result.quantity, 5);
  assertEquals(result.parentId, "550e8400-e29b-41d4-a716-446655440099");
  assertEquals(result.parentType, AssetTypeEnum.CONTAINER);
  assertEquals(result.parentName, "Parent Container");
});

Deno.test("GetItem - throws DocumentNotFoundError when item doesn't exist", async () => {
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(null)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let getImageUrlCalled = false;
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new GetItem(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemCommand.create({
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
  assertEquals(getImageUrlCalled, false);
});

Deno.test("GetItem - throws NoPermissionError when user is not item owner", async () => {
  const sampleItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440044", // Different owner
    name: "Test Item",
    type: AssetTypeEnum.ITEM,
    description: "Item description",
    quantity: 5,
    imageId: "image-123"
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(sampleItem)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let getImageUrlCalled = false;
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new GetItem(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    itemId: "550e8400-e29b-41d4-a716-446655440003"
  });

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(getImageUrlCalled, false);
}); 