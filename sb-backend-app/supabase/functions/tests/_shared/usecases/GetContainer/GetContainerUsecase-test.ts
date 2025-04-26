import { assertEquals, assertRejects } from "jsr:@std/assert";
import { GetContainer } from "../../../../_shared/usecases/GetContainer/GetContainerUsecase.ts";
import { GetContainerCommand } from "../../../../_shared/usecases/GetContainer/GetContainerCommand.ts";
import { DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";
import { AssetTypeEnum } from "../../../../_shared/core/index.ts";

Deno.test("GetContainer - successfully gets container by ID", async () => {
  const sampleContainer = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Container",
    description: "Container description",
    imageId: "image-123",
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT,
    parentName: "Root",
    type: "container",
    childCount: 5,
    path: "Root/Test Container",
    visualCode: "ABC123"
  };
  
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(sampleContainer),
    findByVisualCode: (code: string) => Promise.resolve(null)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let findByVisualCodeCalled = false;
  const originalFindByVisualCode = mockContainersRepository.findByVisualCode;
  mockContainersRepository.findByVisualCode = (code: string) => {
    findByVisualCodeCalled = true;
    return originalFindByVisualCode(code);
  };

  let getImageUrlCalled = false;
  let getImageUrlArgs: any[] = [];
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    getImageUrlArgs.push({ userId, imageId });
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new GetContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = GetContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    containerId: "550e8400-e29b-41d4-a716-446655440003"
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(findByVisualCodeCalled, false);
  
  assertEquals(getImageUrlCalled, true);
  assertEquals(getImageUrlArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[0].imageId, "image-123");
  
  assertEquals(result.id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.name, "Test Container");
  assertEquals(result.description, "Container description");
  assertEquals(result.imageUrl, "https://example.com/images/image-123.jpg");
  assertEquals(result.childCount, 5);
  assertEquals(result.visualCode, "ABC123");
});

Deno.test("GetContainer - successfully gets container by visual code", async () => {
  const sampleContainer = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Container",
    description: "Container description",
    imageId: "image-123",
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT,
    parentName: "Root",
    type: "container",
    childCount: 5,
    path: "Root/Test Container",
    visualCode: "ABC123"
  };
  
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(null),
    findByVisualCode: (code: string) => Promise.resolve(sampleContainer)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let findByIdCalled = false;
  const originalFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
    findByIdCalled = true;
    return originalFindById(id);
  };

  let findByVisualCodeCalled = false;
  let findByVisualCodeArgs: any[] = [];
  const originalFindByVisualCode = mockContainersRepository.findByVisualCode;
  mockContainersRepository.findByVisualCode = (code: string) => {
    findByVisualCodeCalled = true;
    findByVisualCodeArgs.push(code);
    return originalFindByVisualCode(code);
  };

  let getImageUrlCalled = false;
  let getImageUrlArgs: any[] = [];
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    getImageUrlArgs.push({ userId, imageId });
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new GetContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = GetContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    visualCode: "ABC123"
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, false);
  assertEquals(findByVisualCodeCalled, true);
  assertEquals(findByVisualCodeArgs[0], "ABC123");
  
  assertEquals(getImageUrlCalled, true);
  assertEquals(getImageUrlArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[0].imageId, "image-123");
  
  assertEquals(result.id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.name, "Test Container");
  assertEquals(result.visualCode, "ABC123");
});

Deno.test("GetContainer - throws DocumentNotFoundError when container doesn't exist", async () => {
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(null),
    findByVisualCode: (code: string) => Promise.resolve(null)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
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

  const usecase = new GetContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = GetContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    containerId: "550e8400-e29b-41d4-a716-446655440003"
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "Container"
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(getImageUrlCalled, false);
});

Deno.test("GetContainer - throws NoPermissionError when user is not container owner", async () => {
  const sampleContainer = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440044",
    name: "Test Container",
    description: "Container description",
    imageId: "image-123",
    type: "container"
  };
  
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(sampleContainer),
    findByVisualCode: (code: string) => Promise.resolve(null)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    })
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
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

  const usecase = new GetContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = GetContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    containerId: "550e8400-e29b-41d4-a716-446655440003"
  });

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(getImageUrlCalled, false);
}); 