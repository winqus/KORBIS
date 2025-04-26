import { assertEquals, assertRejects } from "jsr:@std/assert";
import { GetAssetsOfParent } from "../../../../_shared/usecases/GetAssetsOfParent/GetAssetsOfParentUsecase.ts";
import { GetAssetsOfParentCommand } from "../../../../_shared/usecases/GetAssetsOfParent/GetAssetsOfParentCommand.ts";
import { NoPermissionError } from "../../../../_shared/errors/index.ts";
import { AssetTypeEnum } from "../../../../_shared/core/index.ts";

Deno.test("GetAssetsOfParent - successfully gets assets with default parent (root)", async () => {
  const sampleAssets = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Test Item 1",
      type: AssetTypeEnum.ITEM,
      description: "Item description",
      quantity: 1,
      imageId: "17898454-e29b-41d4-a716-446655440022",
      parentId: "550e8400-e29b-41d4-a716-446655440022",
      parentType: AssetTypeEnum.DOMAIN_ROOT,
      parentName: "Root"
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Test Container 1",
      type: AssetTypeEnum.CONTAINER,
      description: "Container description",
      imageId: "4567898454-e29b-41d4-a716-446655440022",
      parentId: "550e8400-e29b-41d4-a716-446655440022",
      parentType: AssetTypeEnum.DOMAIN_ROOT,
      parentName: "Root",
      childCount: 5,
      path: "Root/Test Container 1",
      visualCode: "ABC123"
    }
  ];
  
  const mockAssetsRepository = {
    getAssetsByParentId: (params: any) => Promise.resolve(sampleAssets)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let getAssetsCalled = false;
  let getAssetsArgs: any[] = [];
  const originalGetAssets = mockAssetsRepository.getAssetsByParentId;
  mockAssetsRepository.getAssetsByParentId = (params: any) => {
    getAssetsCalled = true;
    getAssetsArgs.push(params);
    return originalGetAssets(params);
  };

  let getImageUrlCalled = false;
  let getImageUrlArgs: any[] = [];
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    getImageUrlArgs.push({ userId, imageId });
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new GetAssetsOfParent(
    mockAssetsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetAssetsOfParentCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022"
  });

  const result = await usecase.execute(command);

  assertEquals(getAssetsCalled, true);
  assertEquals(getAssetsArgs[0].ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getAssetsArgs[0].parentId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getAssetsArgs[0].parentType, AssetTypeEnum.DOMAIN_ROOT);
  
  assertEquals(getImageUrlCalled, true);
  assertEquals(getImageUrlArgs.length, 2);
  assertEquals(getImageUrlArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[0].imageId, "17898454-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[1].imageId, "4567898454-e29b-41d4-a716-446655440022");
  
  assertEquals(result.length, 2);
  assertEquals(result[0].id, "550e8400-e29b-41d4-a716-446655440001");
  assertEquals(result[0].type, AssetTypeEnum.ITEM);
  assertEquals(result[0].imageUrl, "https://example.com/images/17898454-e29b-41d4-a716-446655440022.jpg");
  assertEquals(result[1].id, "550e8400-e29b-41d4-a716-446655440002");
  assertEquals(result[1].type, AssetTypeEnum.CONTAINER);
  assertEquals(result[1].imageUrl, "https://example.com/images/4567898454-e29b-41d4-a716-446655440022.jpg");
  assertEquals(result[1].childCount, 5);
});

Deno.test("GetAssetsOfParent - successfully gets assets from specific container", async () => {
  const sampleAssets = [
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Test Item 2",
      type: AssetTypeEnum.ITEM,
      description: "Item in container",
      quantity: 3,
      imageId: "17898454-e29b-41d4-a716-446655440022",
      parentId: "550e8400-e29b-41d4-a716-446655440099",
      parentType: AssetTypeEnum.CONTAINER,
      parentName: "Parent Container"
    }
  ];
  
  const mockAssetsRepository = {
    getAssetsByParentId: (params: any) => Promise.resolve(sampleAssets)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let getAssetsCalled = false;
  let getAssetsArgs: any[] = [];
  const originalGetAssets = mockAssetsRepository.getAssetsByParentId;
  mockAssetsRepository.getAssetsByParentId = (params: any) => {
    getAssetsCalled = true;
    getAssetsArgs.push(params);
    return originalGetAssets(params);
  };

  let getImageUrlCalled = false;
  let getImageUrlArgs: any[] = [];
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    getImageUrlArgs.push({ userId, imageId });
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new GetAssetsOfParent(
    mockAssetsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetAssetsOfParentCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    parentId: "550e8400-e29b-41d4-a716-446655440099",
    parentType: AssetTypeEnum.CONTAINER,
    skip: 0,
    limit: 10
  });

  const result = await usecase.execute(command);

  assertEquals(getAssetsCalled, true);
  assertEquals(getAssetsArgs[0].ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getAssetsArgs[0].parentId, "550e8400-e29b-41d4-a716-446655440099");
  assertEquals(getAssetsArgs[0].parentType, AssetTypeEnum.CONTAINER);
  assertEquals(getAssetsArgs[0].skip, 0);
  assertEquals(getAssetsArgs[0].limit, 10);
  
  assertEquals(getImageUrlCalled, true);
  assertEquals(getImageUrlArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[0].imageId, "17898454-e29b-41d4-a716-446655440022");
  
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result[0].type, AssetTypeEnum.ITEM);
  assertEquals(result[0].imageUrl, "https://example.com/images/17898454-e29b-41d4-a716-446655440022.jpg");
  assertEquals(result[0].parentId, "550e8400-e29b-41d4-a716-446655440099");
  assertEquals(result[0].quantity, 3);
});

Deno.test("GetAssetsOfParent - throws NoPermissionError when userId is missing", async () => {
  const mockAssetsRepository = {
    getAssetsByParentId: (params: any) => Promise.resolve([])
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let getAssetsCalled = false;
  const originalGetAssets = mockAssetsRepository.getAssetsByParentId;
  mockAssetsRepository.getAssetsByParentId = (params: any) => {
    getAssetsCalled = true;
    return originalGetAssets(params);
  };

  const usecase = new GetAssetsOfParent(
    mockAssetsRepository as any,
    mockDomainCdnService as any
  );

  const command = GetAssetsOfParentCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022"
  });

  (command as any).userId = undefined

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertEquals(getAssetsCalled, false);
}); 