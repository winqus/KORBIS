import { assertEquals, assertRejects } from "jsr:@std/assert";
import { CreateItem } from "../../../../_shared/usecases/CreateItem/CreateItemUsecase.ts";
import { CreateItemCommand } from "../../../../_shared/usecases/CreateItem/CreateItemCommand.ts";
import { DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";
import { AssetTypeEnum } from "../../../../_shared/core/index.ts";
import { DOMAIN_ROOT_NAME } from "../../../../_shared/config.ts";

Deno.test("CreateItem - successfully creates item with parent container", async () => {
  const sampleContainer = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Parent Container",
    type: "container"
  };
  
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(sampleContainer)
  };

  const mockItemsRepository = {
    createWithImage: (data: any, imageBase64: string) => Promise.resolve({
      id: "new-item-id",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "New Item",
      description: "Test item",
      parentId: "550e8400-e29b-41d4-a716-446655440003",
      parentType: AssetTypeEnum.CONTAINER,
      imageId: "image-123",
      type: "item"
    })
  };

  const mockDomainCdnService = {
    uploadImage: (userId: string, imageId: string, imageBase64: string) => Promise.resolve({
      imageUrl: "https://example.com/images/image-123.jpg"
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

  let createWithImageCalled = false;
  let createWithImageArgs: any[] = [];
  const originalCreateWithImage = mockItemsRepository.createWithImage;
  mockItemsRepository.createWithImage = (data: any, imageBase64: string) => {
    createWithImageCalled = true;
    createWithImageArgs.push({ data, imageBase64 });
    return originalCreateWithImage(data, imageBase64);
  };

  let uploadImageCalled = false;
  let uploadImageArgs: any[] = [];
  const originalUploadImage = mockDomainCdnService.uploadImage;
  mockDomainCdnService.uploadImage = (userId: string, imageId: string, imageBase64: string) => {
    uploadImageCalled = true;
    uploadImageArgs.push({ userId, imageId, imageBase64 });
    return originalUploadImage(userId, imageId, imageBase64);
  };

  const usecase = new CreateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = CreateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    name: "New Item",
    description: "Test item",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
    parentId: "550e8400-e29b-41d4-a716-446655440003",
    parentType: AssetTypeEnum.CONTAINER,
    quantity: 3
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(createWithImageCalled, true);
  assertEquals(createWithImageArgs[0].data.ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(createWithImageArgs[0].data.name, "New Item");
  assertEquals(createWithImageArgs[0].data.parentId, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(createWithImageArgs[0].data.parentType, AssetTypeEnum.CONTAINER);
  assertEquals(createWithImageArgs[0].data.parentName, "Parent Container");
  assertEquals(createWithImageArgs[0].data.quantity, 3);
  
  assertEquals(uploadImageCalled, true);
  assertEquals(uploadImageArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(uploadImageArgs[0].imageId, "image-123");
  
  assertEquals(result.id, "new-item-id");
  assertEquals(result.ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(result.name, "New Item");
  assertEquals(result.description, "Test item");
  assertEquals(result.parentId, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.parentType, AssetTypeEnum.CONTAINER);
  assertEquals(result.imageUrl, "https://example.com/images/image-123.jpg");
});

Deno.test("CreateItem - successfully creates item at root level", async () => {
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(null)
  };

  const mockItemsRepository = {
    createWithImage: (data: any, imageBase64: string) => Promise.resolve({
      id: "new-item-id",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Root Item",
      description: "Test root item",
      parentId: "550e8400-e29b-41d4-a716-446655440022",
      parentType: AssetTypeEnum.DOMAIN_ROOT,
      parentName: DOMAIN_ROOT_NAME,
      imageId: "image-123",
      type: "item"
    })
  };

  const mockDomainCdnService = {
    uploadImage: (userId: string, imageId: string, imageBase64: string) => Promise.resolve({
      imageUrl: "https://example.com/images/image-123.jpg"
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

  let createWithImageCalled = false;
  let createWithImageArgs: any[] = [];
  const originalCreateWithImage = mockItemsRepository.createWithImage;
  mockItemsRepository.createWithImage = (data: any, imageBase64: string) => {
    createWithImageCalled = true;
    createWithImageArgs.push({ data, imageBase64 });
    return originalCreateWithImage(data, imageBase64);
  };

  let uploadImageCalled = false;
  let uploadImageArgs: any[] = [];
  const originalUploadImage = mockDomainCdnService.uploadImage;
  mockDomainCdnService.uploadImage = (userId: string, imageId: string, imageBase64: string) => {
    uploadImageCalled = true;
    uploadImageArgs.push({ userId, imageId, imageBase64 });
    return originalUploadImage(userId, imageId, imageBase64);
  };

  const usecase = new CreateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = CreateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Root Item",
    description: "Test root item",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=="
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, false);
  
  assertEquals(createWithImageCalled, true);
  assertEquals(createWithImageArgs[0].data.ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(createWithImageArgs[0].data.name, "Root Item");
  assertEquals(createWithImageArgs[0].data.parentId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(createWithImageArgs[0].data.parentType, AssetTypeEnum.DOMAIN_ROOT);
  assertEquals(createWithImageArgs[0].data.parentName, DOMAIN_ROOT_NAME);
  
  assertEquals(uploadImageCalled, true);
  assertEquals(uploadImageArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  
  assertEquals(result.id, "new-item-id");
  assertEquals(result.name, "Root Item");
  assertEquals(result.parentId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(result.parentType, AssetTypeEnum.DOMAIN_ROOT);
});

Deno.test("CreateItem - throws DocumentNotFoundError when parent container doesn't exist", async () => {
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(null)
  };

  const mockItemsRepository = {
    createWithImage: (data: any, imageBase64: string) => Promise.resolve({})
  };

  const mockDomainCdnService = {
    uploadImage: (userId: string, imageId: string, imageBase64: string) => Promise.resolve({})
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let createWithImageCalled = false;
  const originalCreateWithImage = mockItemsRepository.createWithImage;
  mockItemsRepository.createWithImage = (data: any, imageBase64: string) => {
    createWithImageCalled = true;
    return originalCreateWithImage(data, imageBase64);
  };

  let uploadImageCalled = false;
  const originalUploadImage = mockDomainCdnService.uploadImage;
  mockDomainCdnService.uploadImage = (userId: string, imageId: string, imageBase64: string) => {
    uploadImageCalled = true;
    return originalUploadImage(userId, imageId, imageBase64);
  };

  const usecase = new CreateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = CreateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    name: "New Item",
    description: "Test item",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
    parentId: "550e8400-e29b-41d4-a716-446655440003",
    parentType: AssetTypeEnum.CONTAINER
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "Container"
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(createWithImageCalled, false);
  assertEquals(uploadImageCalled, false);
});

Deno.test("CreateItem - throws NoPermissionError when user is not container owner", async () => {
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve({
      id: "550e8400-e29b-41d4-a716-446655440003",
      ownerId: "550e8400-e29b-41d4-a716-446655440044", 
      name: "Parent Container",
      type: "container"
    })
  };

  const mockItemsRepository = {
    createWithImage: (data: any, imageBase64: string) => Promise.resolve({})
  };

  const mockDomainCdnService = {
    uploadImage: (userId: string, imageId: string, imageBase64: string) => Promise.resolve({})
  };

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let createWithImageCalled = false;
  const originalCreateWithImage = mockItemsRepository.createWithImage;
  mockItemsRepository.createWithImage = (data: any, imageBase64: string) => {
    createWithImageCalled = true;
    return originalCreateWithImage(data, imageBase64);
  };

  let uploadImageCalled = false;
  const originalUploadImage = mockDomainCdnService.uploadImage;
  mockDomainCdnService.uploadImage = (userId: string, imageId: string, imageBase64: string) => {
    uploadImageCalled = true;
    return originalUploadImage(userId, imageId, imageBase64);
  };

  const usecase = new CreateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = CreateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022", 
    name: "New Item",
    description: "Test item",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
    parentId: "550e8400-e29b-41d4-a716-446655440003",
    parentType: AssetTypeEnum.CONTAINER
  });

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(createWithImageCalled, false);
  assertEquals(uploadImageCalled, false);
}); 