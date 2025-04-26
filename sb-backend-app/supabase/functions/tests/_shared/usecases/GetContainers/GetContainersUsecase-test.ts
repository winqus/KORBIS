import { assertEquals, assertRejects } from "jsr:@std/assert";
import { GetContainers } from "../../../../_shared/usecases/GetContainers/GetContainersUsecase.ts";
import { GetContainersCommand } from "../../../../_shared/usecases/GetContainers/GetContainersCommand.ts";
import { NoPermissionError } from "../../../../_shared/errors/index.ts";
import { AssetTypeEnum } from "../../../../_shared/core/index.ts";

Deno.test("GetContainers - successfully gets containers list", async () => {
  const sampleContainers = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Container 1",
      type: "container",
      description: "First container",
      imageId: "image-123",
      parentId: "550e8400-e29b-41d4-a716-446655440022",
      parentType: AssetTypeEnum.DOMAIN_ROOT,
      parentName: "Root",
      childCount: 3,
      path: "Root/Container 1"
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Container 2",
      type: "container",
      description: "Second container",
      imageId: "image-456",
      parentId: "550e8400-e29b-41d4-a716-446655440022",
      parentType: AssetTypeEnum.DOMAIN_ROOT,
      parentName: "Root",
      childCount: 0,
      path: "Root/Container 2"
    }
  ];
  
  const mockContainersRepository = {
    paginate: (params: any) => Promise.resolve(sampleContainers)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let paginateCalled = false;
  let paginateArgs: any[] = [];
  const originalPaginate = mockContainersRepository.paginate;
  mockContainersRepository.paginate = (params: any) => {
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

  const usecase = new GetContainers(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = GetContainersCommand.create({
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
  assertEquals(result[0].name, "Container 1");
  assertEquals(result[0].imageUrl, "https://example.com/images/image-123.jpg");
  assertEquals(result[0].childCount, 3);
  assertEquals(result[1].id, "550e8400-e29b-41d4-a716-446655440002");
  assertEquals(result[1].name, "Container 2");
  assertEquals(result[1].imageUrl, "https://example.com/images/image-456.jpg");
});

Deno.test("GetContainers - successfully gets containers with parentId filter", async () => {
  const sampleContainers = [
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Nested Container",
      type: "container",
      description: "Nested container",
      imageId: "image-789",
      parentId: "550e8400-e29b-41d4-a716-446655440001",
      parentType: AssetTypeEnum.CONTAINER,
      parentName: "Container 1",
      childCount: 0,
      path: "Root/Container 1/Nested Container"
    }
  ];
  
  const mockContainersRepository = {
    paginate: (params: any) => Promise.resolve(sampleContainers)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let paginateCalled = false;
  let paginateArgs: any[] = [];
  const originalPaginate = mockContainersRepository.paginate;
  mockContainersRepository.paginate = (params: any) => {
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

  const usecase = new GetContainers(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = GetContainersCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    parentId: "550e8400-e29b-41d4-a716-446655440001",
    limit: 20,
    skip: 5
  });

  const result = await usecase.execute(command);

  assertEquals(paginateCalled, true);
  assertEquals(paginateArgs[0].ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(paginateArgs[0].parentId, "550e8400-e29b-41d4-a716-446655440001");
  assertEquals(paginateArgs[0].limit, 20);
  assertEquals(paginateArgs[0].skip, 5);
  
  assertEquals(getImageUrlCalled, true);
  assertEquals(getImageUrlArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[0].imageId, "image-789");
  
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result[0].name, "Nested Container");
  assertEquals(result[0].imageUrl, "https://example.com/images/image-789.jpg");
  assertEquals(result[0].parentId, "550e8400-e29b-41d4-a716-446655440001");
  assertEquals(result[0].path, "Root/Container 1/Nested Container");
});

Deno.test("GetContainers - throws NoPermissionError when userId is missing", async () => {
  const mockContainersRepository = {
    paginate: (params: any) => Promise.resolve([])
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let paginateCalled = false;
  const originalPaginate = mockContainersRepository.paginate;
  mockContainersRepository.paginate = (params: any) => {
    paginateCalled = true;
    return originalPaginate(params);
  };

  const usecase = new GetContainers(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = GetContainersCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022"
  });

  (command as any).userId = undefined

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertEquals(paginateCalled, false);
}); 