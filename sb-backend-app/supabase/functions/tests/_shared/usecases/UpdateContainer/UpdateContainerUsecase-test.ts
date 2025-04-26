import { assertEquals, assertRejects } from "jsr:@std/assert";
import { UpdateContainer } from "../../../../_shared/usecases/UpdateContainer/UpdateContainerUsecase.ts";
import { UpdateContainerCommand } from "../../../../_shared/usecases/UpdateContainer/UpdateContainerCommand.ts";
import { DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";
import { AssetTypeEnum } from "../../../../_shared/core/index.ts";
import { DOMAIN_ROOT_NAME } from "../../../../_shared/config.ts";

Deno.test("UpdateContainer - successfully updates container name and description", async () => {
  const existingContainer = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Original Container",
    description: "Original description",
    imageId: "image-123",
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT,
    parentName: DOMAIN_ROOT_NAME,
    type: "container"
  };
  
  const updatedContainer = {
    ...existingContainer,
    name: "Updated Container",
    description: "Updated description"
  };
  
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(existingContainer),
    update: (id: string, data: any) => Promise.resolve(updatedContainer)
  };

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
  const originalFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let updateCalled = false;
  let updateArgs: any[] = [];
  const originalUpdate = mockContainersRepository.update;
  mockContainersRepository.update = (id: string, data: any) => {
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

  const usecase = new UpdateContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "Updated Container",
    description: "Updated description"
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(updateCalled, true);
  assertEquals(updateArgs[0].id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(updateArgs[0].data.name, "Updated Container");
  assertEquals(updateArgs[0].data.description, "Updated description");
  
  assertEquals(getImageUrlCalled, true);
  assertEquals(getImageUrlArgs[0].userId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(getImageUrlArgs[0].imageId, "image-123");
  
  assertEquals(result.id, "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(result.name, "Updated Container");
  assertEquals(result.description, "Updated description");
  assertEquals(result.imageUrl, "https://example.com/images/image-123.jpg");
});

Deno.test("UpdateContainer - successfully updates container image", async () => {
  const existingContainer = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Container",
    description: "Test description",
    imageId: "image-123",
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT,
    parentName: DOMAIN_ROOT_NAME,
    type: "container"
  };
  
  const updatedContainer = {
    ...existingContainer,
    imageId: "image-123" // Same ID but new image was uploaded
  };
  
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(existingContainer),
    update: (id: string, data: any) => Promise.resolve(updatedContainer)
  };

  const mockDomainCdnService = {
    uploadImage: (userId: string, imageId: string, imageBase64: string) => Promise.resolve({
      imageUrl: `https://example.com/images/${imageId}.jpg?updated=true`
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

  let updateCalled = false;
  let updateArgs: any[] = [];
  const originalUpdate = mockContainersRepository.update;
  mockContainersRepository.update = (id: string, data: any) => {
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

  const usecase = new UpdateContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateContainerCommand.create({
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

Deno.test("UpdateContainer - successfully updates container parent to another container", async () => {
  const existingContainer = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Container",
    description: "Test description",
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT,
    parentName: DOMAIN_ROOT_NAME,
    type: "container"
  };
  
  const parentContainer = {
    id: "550e8400-e29b-41d4-a716-446655440099",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Parent Container",
    type: "container"
  };
  
  const updatedContainer = {
    ...existingContainer,
    parentId: "550e8400-e29b-41d4-a716-446655440099",
    parentType: AssetTypeEnum.CONTAINER,
    parentName: "Parent Container"
  };
  
  const mockContainersRepository = {
    findById: (id: string) => {
      if (id === "550e8400-e29b-41d4-a716-446655440003") {
        return Promise.resolve(existingContainer);
      } else if (id === "550e8400-e29b-41d4-a716-446655440099") {
        return Promise.resolve(parentContainer);
      }
      return Promise.resolve(null);
    },
    update: (id: string, data: any) => Promise.resolve(updatedContainer)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: null
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

  let updateCalled = false;
  let updateArgs: any[] = [];
  const originalUpdate = mockContainersRepository.update;
  mockContainersRepository.update = (id: string, data: any) => {
    updateCalled = true;
    updateArgs.push({ id, data });
    return originalUpdate(id, data);
  };

  const usecase = new UpdateContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    id: "550e8400-e29b-41d4-a716-446655440003",
    parentId: "550e8400-e29b-41d4-a716-446655440099",
    parentType: AssetTypeEnum.CONTAINER
  });

  const result = await usecase.execute(command);

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(findByIdArgs[1], "550e8400-e29b-41d4-a716-446655440099");
  
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

Deno.test("UpdateContainer - successfully updates container parent to domain root", async () => {
  const existingContainer = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Container",
    description: "Test description",
    parentId: "550e8400-e29b-41d4-a716-446655440099",
    parentType: AssetTypeEnum.CONTAINER,
    parentName: "Parent Container",
    type: "container"
  };
  
  const updatedContainer = {
    ...existingContainer,
    parentId: "550e8400-e29b-41d4-a716-446655440022",
    parentType: AssetTypeEnum.DOMAIN_ROOT,
    parentName: DOMAIN_ROOT_NAME
  };
  
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(existingContainer),
    update: (id: string, data: any) => Promise.resolve(updatedContainer)
  };

  const mockDomainCdnService = {
    getImageUrl: (userId: string, imageId: string) => ({
      imageUrl: null
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

  let updateCalled = false;
  let updateArgs: any[] = [];
  const originalUpdate = mockContainersRepository.update;
  mockContainersRepository.update = (id: string, data: any) => {
    updateCalled = true;
    updateArgs.push({ id, data });
    return originalUpdate(id, data);
  };

  const usecase = new UpdateContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateContainerCommand.create({
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

Deno.test("UpdateContainer - throws DocumentNotFoundError when container doesn't exist", async () => {
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(null),
    update: (id: string, data: any) => Promise.resolve(null)
  };

  const mockDomainCdnService = {};

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let updateCalled = false;
  const originalUpdate = mockContainersRepository.update;
  mockContainersRepository.update = (id: string, data: any) => {
    updateCalled = true;
    return originalUpdate(id, data);
  };

  const usecase = new UpdateContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "Updated Name"
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "Container"
  );

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(updateCalled, false);
});

Deno.test("UpdateContainer - throws NoPermissionError when user is not container owner", async () => {
  const existingContainer = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440044", // Different owner
    name: "Test Container",
    type: "container"
  };
  
  const mockContainersRepository = {
    findById: (id: string) => Promise.resolve(existingContainer),
    update: (id: string, data: any) => Promise.resolve(null)
  };

  const mockDomainCdnService = {};

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let updateCalled = false;
  const originalUpdate = mockContainersRepository.update;
  mockContainersRepository.update = (id: string, data: any) => {
    updateCalled = true;
    return originalUpdate(id, data);
  };

  const usecase = new UpdateContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateContainerCommand.create({
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

Deno.test("UpdateContainer - throws DocumentNotFoundError when parent container doesn't exist", async () => {
  const existingContainer = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Test Container",
    type: "container"
  };
  
  const mockContainersRepository = {
    findById: (id: string) => {
      if (id === "550e8400-e29b-41d4-a716-446655440003") {
        return Promise.resolve(existingContainer);
      }
      return Promise.resolve(null);
    },
    update: (id: string, data: any) => Promise.resolve(null)
  };

  const mockDomainCdnService = {};

  let findByIdCalled = false;
  let findByIdArgs: any[] = [];
  const originalFindById = mockContainersRepository.findById;
  mockContainersRepository.findById = (id: string) => {
    findByIdCalled = true;
    findByIdArgs.push(id);
    return originalFindById(id);
  };

  let updateCalled = false;
  const originalUpdate = mockContainersRepository.update;
  mockContainersRepository.update = (id: string, data: any) => {
    updateCalled = true;
    return originalUpdate(id, data);
  };

  const usecase = new UpdateContainer(
    mockContainersRepository as any,
    mockDomainCdnService as any
  );

  const command = UpdateContainerCommand.create({
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

  assertEquals(findByIdCalled, true);
  assertEquals(findByIdArgs[0], "550e8400-e29b-41d4-a716-446655440003");
  assertEquals(findByIdArgs[1], "550e8400-e29b-41d4-a716-446655440099");
  assertEquals(updateCalled, false);
}); 