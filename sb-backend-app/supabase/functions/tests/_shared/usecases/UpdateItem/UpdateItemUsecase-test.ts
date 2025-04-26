import { assertEquals, assertRejects } from "jsr:@std/assert";
import { UpdateItem } from "../../../../_shared/usecases/UpdateItem/UpdateItemUsecase.ts";
import { UpdateItemCommand } from "../../../../_shared/usecases/UpdateItem/UpdateItemCommand.ts";
import { DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";
import { AssetTypeEnum } from "../../../../_shared/core/index.ts";
import { DOMAIN_ROOT_NAME } from "../../../../_shared/config.ts";

Deno.test("UpdateItem - successfully updates item name, description and quantity", async () => {
  const existingItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Original Item",
    description: "Original description",
    quantity: 1,
    imageId: "image-123",
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT,
    parentName: DOMAIN_ROOT_NAME,
    type: "item"
  };
  
  const updatedItem = {
    ...existingItem,
    name: "Updated Item",
    description: "Updated description",
    quantity: 5
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(existingItem),
    update: (id: string, data: any) => Promise.resolve(updatedItem)
  };

  const mockContainersRepository = {};

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: `https://example.com/images/${imageId}.jpg`
    }),
    uploadImage: (userId: string, imageId: string, imageBase64: string) => Promise.resolve({
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

  let updateCalled = false;
  let updateArgs: any[] = [];
  const originalUpdate = mockItemsRepository.update;
  mockItemsRepository.update = (id: string, data: any) => {
    updateCalled = true;
    updateArgs.push({ id, data });
    return originalUpdate(id, data);
  };

  let getImageUrlCalled = false;
  let getImageUrlArgs: any[] = [];
  const originalGetImageUrl = mockDomainCdnService.getImageUrl;
  mockDomainCdnService.getImageUrl = (userId: string, imageId: string) => {
    getImageUrlCalled = true;
    getImageUrlArgs.push({ userId, imageId });
    return originalGetImageUrl(userId, imageId);
  };

  const usecase = new UpdateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "Updated Item",
    description: "Updated description",
    quantity: 5
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(updateCalled, true);
  assertEquals(updateArgs[0].id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(updateArgs[0].data.name, "Updated Item");
  assertEquals(updateArgs[0].data.description, "Updated description");
  assertEquals(updateArgs[0].data.quantity, 5);
  
  assertEquals(getImageUrlCalled, true);
  assertEquals(getImageUrlArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[0].imageId, "image-123");
  
  assertEquals(result.id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.name, "Updated Item");
  assertEquals(result.description, "Updated description");
  assertEquals(result.quantity, 5);
  assertEquals(result.imageUrl, "https://example.com/images/image-123.jpg");
});

Deno.test("UpdateItem - successfully updates item image", async () => {
  const existingItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    description: "Test description",
    quantity: 1,
    imageId: "image-123",
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT,
    parentName: DOMAIN_ROOT_NAME,
    type: "item"
  };
  
  const updatedItem = {
    ...existingItem,
    imageId: "image-123" // Same ID but new image was uploaded
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(existingItem),
    update: (id: string, data: any) => Promise.resolve(updatedItem)
  };

  const mockContainersRepository = {};

  const mockDomainCdnService = {
    uploadImage: (userId: string, imageId: string, imageBase64: string) => Promise.resolve({
      imageUrl: `https://example.com/images/${imageId}.jpg?updated=true`
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

  let updateCalled = false;
  let updateArgs: any[] = [];
  const originalUpdate = mockItemsRepository.update;
  mockItemsRepository.update = (id: string, data: any) => {
    updateCalled = true;
    updateArgs.push({ id, data });
    return originalUpdate(id, data);
  };

  let uploadImageCalled = false;
  let uploadImageArgs: any[] = [];
  const originalUploadImage = mockDomainCdnService.uploadImage;
  mockDomainCdnService.uploadImage = (userId: string, imageId: string, imageBase64: string) => {
    uploadImageCalled = true;
    uploadImageArgs.push({ userId, imageId, imageBase64 });
    return originalUploadImage(userId, imageId, imageBase64);
  };

  const usecase = new UpdateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    id: "550e8400-e29b-41d4-a716-446655440003",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=="
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(uploadImageCalled, true);
  assertEquals(uploadImageArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(uploadImageArgs[0].imageId, "image-123");
  assertEquals(uploadImageArgs[0].imageBase64, "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==");
  
  assertEquals(updateCalled, true);
  assertEquals(updateArgs[0].id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(updateArgs[0].data.imageId, "image-123");
  
  assertEquals(result.id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.imageUrl, "https://example.com/images/image-123.jpg?updated=true");
});

Deno.test("UpdateItem - successfully updates item parent to a container", async () => {
  const existingItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    description: "Test description",
    quantity: 1,
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT,
    parentName: DOMAIN_ROOT_NAME,
    type: "item"
  };
  
  const parentContainer = {
    id: "550e8400-e29b-41d4-a716-446655440099",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Parent Container",
    type: "container"
  };
  
  const updatedItem = {
    ...existingItem,
    parentId: "550e8400-e29b-41d4-a716-446655440099",
    parentType: AssetTypeEnum.CONTAINER,
    parentName: "Parent Container"
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(existingItem),
    update: (id: string, data: any) => Promise.resolve(updatedItem)
  };

  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(parentContainer)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: null
    })
  };

  let itemFindByIdCalled = false;
  let itemFindByIdArgs: any[] = [];
  const originalItemFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    itemFindByIdCalled = true;
    itemFindByIdArgs.push(id);
    return originalItemFindById(id);
  };

  let containerFindByIdCalled = false;
  let containerFindByIdArgs: any[] = [];
  const originalContainerFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
    containerFindByIdCalled = true;
    containerFindByIdArgs.push(id);
    return originalContainerFindById(id);
  };

  let updateCalled = false;
  let updateArgs: any[] = [];
  const originalUpdate = mockItemsRepository.update;
  mockItemsRepository.update = (id: string, data: any) => {
    updateCalled = true;
    updateArgs.push({ id, data });
    return originalUpdate(id, data);
  };

  const usecase = new UpdateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    id: "550e8400-e29b-41d4-a716-446655440003",
    parentId: "550e8400-e29b-41d4-a716-446655440099",
    parentType: AssetTypeEnum.CONTAINER
  });

  const result = await usecase.execute(command);

  assertEquals(itemFindByIdCalled, true);
  assertEquals(itemFindByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(containerFindByIdCalled, true);
  assertEquals(containerFindByIdArgs[0], "550e8400-e29b-41d4-a716-446655440099");
  
  assertEquals(updateCalled, true);
  assertEquals(updateArgs[0].id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(updateArgs[0].data.parentId, "550e8400-e29b-41d4-a716-446655440099");
  assertEquals(updateArgs[0].data.parentType, AssetTypeEnum.CONTAINER);
  assertEquals(updateArgs[0].data.parentName, "Parent Container");
  
  assertEquals(result.id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.parentId, "550e8400-e29b-41d4-a716-446655440099");
  assertEquals(result.parentType, AssetTypeEnum.CONTAINER);
  assertEquals(result.parentName, "Parent Container");
});

Deno.test("UpdateItem - successfully updates item parent to domain root", async () => {
  const existingItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    description: "Test description",
    quantity: 1,
    parentId: "550e8400-e29b-41d4-a716-446655440099",
    parentType: AssetTypeEnum.CONTAINER,
    parentName: "Parent Container",
    type: "item"
  };
  
  const updatedItem = {
    ...existingItem,
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT,
    parentName: DOMAIN_ROOT_NAME
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(existingItem),
    update: (id: string, data: any) => Promise.resolve(updatedItem)
  };

  const mockContainersRepository = {};

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: null
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

  let updateCalled = false;
  let updateArgs: any[] = [];
  const originalUpdate = mockItemsRepository.update;
  mockItemsRepository.update = (id: string, data: any) => {
    updateCalled = true;
    updateArgs.push({ id, data });
    return originalUpdate(id, data);
  };

  const usecase = new UpdateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    id: "550e8400-e29b-41d4-a716-446655440003",
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(updateCalled, true);
  assertEquals(updateArgs[0].id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(updateArgs[0].data.parentId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(updateArgs[0].data.parentType, AssetTypeEnum.DOMAIN_ROOT);
  assertEquals(updateArgs[0].data.parentName, DOMAIN_ROOT_NAME);
  
  assertEquals(result.id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.parentId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(result.parentType, AssetTypeEnum.DOMAIN_ROOT);
  assertEquals(result.parentName, DOMAIN_ROOT_NAME);
});

Deno.test("UpdateItem - throws DocumentNotFoundError when item doesn't exist", async () => {
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(null),
    update: (id: string, data: any) => Promise.resolve(null)
  };

  const mockContainersRepository = {};
  const mockDomainCdnService = {};

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let updateCalled = false;
  const originalUpdate = mockItemsRepository.update;
  mockItemsRepository.update = (id: string, data: any) => {
    updateCalled = true;
    return originalUpdate(id, data);
  };

  const usecase = new UpdateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "Updated Name"
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "Item"
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(updateCalled, false);
});

Deno.test("UpdateItem - throws NoPermissionError when user is not item owner", async () => {
  const existingItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440044", // Different owner
    name: "Test Item",
    type: "item"
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(existingItem),
    update: (id: string, data: any) => Promise.resolve(null)
  };

  const mockContainersRepository = {};
  const mockDomainCdnService = {};

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let updateCalled = false;
  const originalUpdate = mockItemsRepository.update;
  mockItemsRepository.update = (id: string, data: any) => {
    updateCalled = true;
    return originalUpdate(id, data);
  };

  const usecase = new UpdateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "Updated Name"
  });

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(updateCalled, false);
});

Deno.test("UpdateItem - throws DocumentNotFoundError when parent container doesn't exist", async () => {
  const existingItem = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Item",
    type: "item"
  };
  
  const mockItemsRepository = {
    findById: (id: string) => Promise.resolve(existingItem),
    update: (id: string, data: any) => Promise.resolve(null)
  };

  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(null)
  };

  const mockDomainCdnService = {};

  let itemFindByIdCalled = false;
  let itemFindByIdArgs: any[] = [];
  const originalItemFindById = mockItemsRepository.findById;
  mockItemsRepository.findById = (id: string) => {
    itemFindByIdCalled = true;
    itemFindByIdArgs.push(id);
    return originalItemFindById(id);
  };

  let containerFindByIdCalled = false;
  let containerFindByIdArgs: any[] = [];
  const originalContainerFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
    containerFindByIdCalled = true;
    containerFindByIdArgs.push(id);
    return originalContainerFindById(id);
  };

  let updateCalled = false;
  const originalUpdate = mockItemsRepository.update;
  mockItemsRepository.update = (id: string, data: any) => {
    updateCalled = true;
    return originalUpdate(id, data);
  };

  const usecase = new UpdateItem(
    mockItemsRepository as any,
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    id: "550e8400-e29b-41d4-a716-446655440003",
    parentId: "550e8400-e29b-41d4-a716-446655440099", // Non-existent parent
    parentType: AssetTypeEnum.CONTAINER
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "Container"
  );

  assertEquals(itemFindByIdCalled, true);
  assertEquals(itemFindByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(containerFindByIdCalled, true);
  assertEquals(containerFindByIdArgs[0], "550e8400-e29b-41d4-a716-446655440099");
  assertEquals(updateCalled, false);
}); 