import { assertEquals, assertRejects } from "jsr:@std/assert";
import { GetItems } from "../../../../_shared/usecases/GetItems/GetItemsUsecase.ts";
import { GetItemsCommand } from "../../../../_shared/usecases/GetItems/GetItemsCommand.ts";
import { NoPermissionError } from "../../../../_shared/errors/index.ts";
import { AssetTypeEnum } from "../../../../_shared/core/index.ts";

Deno.test("GetItems - successfully gets items list", async () => {
  const sampleItems = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Item 1",
      type: AssetTypeEnum.ITEM,
      description: "First item",
      quantity: 5,
      imageId: "image-123",
      parentId: "550e8400-e29b-41d4-a716-446655440022",
      parentType: AssetTypeEnum.DOMAIN_ROOT,
      parentName: "Root"
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Item 2",
      type: AssetTypeEnum.ITEM,
      description: "Second item",
      quantity: 1,
      imageId: "image-456",
      parentId: "550e8400-e29b-41d4-a716-446655440022",
      parentType: AssetTypeEnum.DOMAIN_ROOT,
      parentName: "Root"
    }
  ];
  
  const mockItemsRepository = {
    paginate: (params: any) => Promise.resolve(sampleItems)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let paginateCalled = false;
  let paginateArgs: any[] = [];
  const originalPaginate = mockItemsRepository.paginate;
  mockItemsRepository.paginate = (params: any) => {
    paginateCalled = true;
    paginateArgs.push(params);
    return originalPaginate(params);
  };

  let getImageUrlCalled = false;
  let getImageUrlArgs: any[] = [];
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    getImageUrlArgs.push({ userId, imageId });
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new GetItems(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemsCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    limit: 10,
    skip: 0
  });

  const result = await usecase.execute(command);

  assertEquals(paginateCalled, true);
  assertEquals(paginateArgs[0].ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(paginateArgs[0].limit, 10);
  assertEquals(paginateArgs[0].skip, 0);
  
  assertEquals(getImageUrlCalled, true);
  assertEquals(getImageUrlArgs.length, 2);
  assertEquals(getImageUrlArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[0].imageId, "image-123");
  assertEquals(getImageUrlArgs[1].imageId, "image-456");
  
  assertEquals(result.length, 2);
  assertEquals(result[0].id, "550e8400-e29b-41d4-a716-446655440001");
  assertEquals(result[0].name, "Item 1");
  assertEquals(result[0].imageUrl, "https://example.com/images/image-123.jpg");
  assertEquals(result[0].quantity, 5);
  assertEquals(result[1].id, "550e8400-e29b-41d4-a716-446655440002");
  assertEquals(result[1].name, "Item 2");
  assertEquals(result[1].imageUrl, "https://example.com/images/image-456.jpg");
});

Deno.test("GetItems - successfully gets items with parentId filter", async () => {
  const sampleItems = [
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Container Item",
      type: AssetTypeEnum.ITEM,
      description: "Item in container",
      quantity: 3,
      imageId: "image-789",
      parentId: "550e8400-e29b-41d4-a716-446655440099",
      parentType: AssetTypeEnum.CONTAINER,
      parentName: "Parent Container"
    }
  ];
  
  const mockItemsRepository = {
    paginate: (params: any) => Promise.resolve(sampleItems)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let paginateCalled = false;
  let paginateArgs: any[] = [];
  const originalPaginate = mockItemsRepository.paginate;
  mockItemsRepository.paginate = (params: any) => {
    paginateCalled = true;
    paginateArgs.push(params);
    return originalPaginate(params);
  };

  let getImageUrlCalled = false;
  let getImageUrlArgs: any[] = [];
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    getImageUrlArgs.push({ userId, imageId });
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new GetItems(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemsCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    parentId: "550e8400-e29b-41d4-a716-446655440099",
    limit: 20,
    skip: 5
  });

  const result = await usecase.execute(command);

  assertEquals(paginateCalled, true);
  assertEquals(paginateArgs[0].ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(paginateArgs[0].parentId, "550e8400-e29b-41d4-a716-446655440099");
  assertEquals(paginateArgs[0].limit, 20);
  assertEquals(paginateArgs[0].skip, 5);
  
  assertEquals(getImageUrlCalled, true);
  assertEquals(getImageUrlArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[0].imageId, "image-789");
  
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result[0].name, "Container Item");
  assertEquals(result[0].imageUrl, "https://example.com/images/image-789.jpg");
  assertEquals(result[0].parentId, "550e8400-e29b-41d4-a716-446655440099");
  assertEquals(result[0].quantity, 3);
});

Deno.test("GetItems - returns empty array when no items match criteria", async () => {
  const mockItemsRepository = {
    paginate: (params: any) => Promise.resolve([])
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let paginateCalled = false;
  let paginateArgs: any[] = [];
  const originalPaginate = mockItemsRepository.paginate;
  mockItemsRepository.paginate = (params: any) => {
    paginateCalled = true;
    paginateArgs.push(params);
    return originalPaginate(params);
  };

  let getImageUrlCalled = false;
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new GetItems(
    mockItemsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetItemsCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    parentId: "550e8400-e29b-41d4-a716-446655440404"
  });

  const result = await usecase.execute(command);

  assertEquals(paginateCalled, true);
  assertEquals(paginateArgs[0].ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(paginateArgs[0].parentId, "550e8400-e29b-41d4-a716-446655440404");
  assertEquals(getImageUrlCalled, false);
  assertEquals(result.length, 0);
}); 