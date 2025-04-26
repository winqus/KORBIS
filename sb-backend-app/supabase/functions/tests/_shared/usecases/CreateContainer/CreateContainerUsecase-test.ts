import { assertEquals, assertRejects } from "jsr:@std/assert";
import { assertSpyCalls, spy } from "jsr:@std/testing/mock";
import { CreateContainer } from "../../../../_shared/usecases/CreateContainer/CreateContainerUsecase.ts";
import { CreateContainerCommand } from "../../../../_shared/usecases/CreateContainer/CreateContainerCommand.ts";
import { DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";
import { AssetTypeEnum } from "../../../../_shared/core/index.ts";
import { DOMAIN_ROOT_NAME } from "../../../../_shared/config.ts";
import { ContainersRepository } from "../../../../_shared/interfaces/ContainersRepository.ts";
import { DomainCdnService } from "../../../../_shared/interfaces/DomainCdnService.ts";
import { Container } from "../../../../_shared/entities/Container.ts";

Deno.test("CreateContainer - successfully creates container with parent container", async () => {
  const sampleContainer = {
    id: "550e8400-e29b-41d4-a716-446655440001",
    ownerId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Parent Container",
    type: "container",
    path: "/parent-path/"
  } as Container;
  
  const mockContainersRepository = {
    findById: spy((id: string) => Promise.resolve(sampleContainer)),
    createWithImage: spy((data: any, imageBase64: string) => Promise.resolve({
      id: "550e8400-e29b-41d4-a716-446655440002",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "New Container",
      description: "Test container",
      childCount: 0,
      path: "/parent-path/",
      parentId: "550e8400-e29b-41d4-a716-446655440001",
      parentType: AssetTypeEnum.CONTAINER,
      imageId: "550e8400-e29b-41d4-a716-446655440003",
      visualCode: "KC-ABCD-X",
      type: "container"
    } as Container))
  };

  const mockDomainCdnService = {
    uploadImage: spy((userId: string, imageId: string, imageBase64: string) => Promise.resolve({
      imageUrl: "https://example.com/images/550e8400-e29b-41d4-a716-446655440003.jpg"
    })),
    getPublicUrl: () => "",
    getImageUrl: () => ({ imageUrl: "" }),
    deleteFile: () => Promise.resolve()
  };

  const usecase = new CreateContainer(
    mockContainersRepository as unknown as ContainersRepository,
    mockDomainCdnService as unknown as DomainCdnService
  );

  const command = CreateContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    name: "New Container",
    description: "Test container",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
    parentId: "550e8400-e29b-41d4-a716-446655440001",
    parentType: AssetTypeEnum.CONTAINER
  });

  const result = await usecase.execute(command);

  assertSpyCalls(mockContainersRepository.findById, 1);
  assertEquals(mockContainersRepository.findById.calls[0].args[0], "550e8400-e29b-41d4-a716-446655440001");
  
  assertSpyCalls(mockContainersRepository.createWithImage, 1);
  const creationArgs = mockContainersRepository.createWithImage.calls[0].args[0] as any;
  assertEquals(creationArgs.ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(creationArgs.name, "New Container");
  assertEquals(creationArgs.path, "/parent-path/");
  assertEquals(creationArgs.parentId, "550e8400-e29b-41d4-a716-446655440001");
  assertEquals(creationArgs.parentType, AssetTypeEnum.CONTAINER);
  
  assertSpyCalls(mockDomainCdnService.uploadImage, 1);
  assertEquals(mockDomainCdnService.uploadImage.calls[0].args[0], "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(mockDomainCdnService.uploadImage.calls[0].args[1], "550e8400-e29b-41d4-a716-446655440003");
  
  assertEquals(result.id, "550e8400-e29b-41d4-a716-446655440002");
  assertEquals(result.ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(result.name, "New Container");
  assertEquals(result.description, "Test container");
  assertEquals(result.parentId, "550e8400-e29b-41d4-a716-446655440001");
  assertEquals(result.parentType, AssetTypeEnum.CONTAINER);
  assertEquals(result.imageUrl, "https://example.com/images/550e8400-e29b-41d4-a716-446655440003.jpg");
});

Deno.test("CreateContainer - successfully creates container at root level", async () => {
  const mockContainersRepository = {
    findById: spy((id: string) => Promise.resolve(null)),
    createWithImage: spy((data: any, imageBase64: string) => Promise.resolve({
      id: "550e8400-e29b-41d4-a716-446655440002",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Root Container",
      description: "Test root container",
      childCount: 0,
      path: "/",
      parentId: "550e8400-e29b-41d4-a716-446655440022",
      parentType: AssetTypeEnum.DOMAIN_ROOT,
      imageId: "550e8400-e29b-41d4-a716-446655440003",
      visualCode: "KC-ABCD-X",
      type: "container"
    } as Container))
  };

  const mockDomainCdnService = {
    uploadImage: spy((userId: string, imageId: string, imageBase64: string) => Promise.resolve({
      imageUrl: "https://example.com/images/550e8400-e29b-41d4-a716-446655440003.jpg"
    })),
    getPublicUrl: () => "",
    getImageUrl: () => ({ imageUrl: "" }),
    deleteFile: () => Promise.resolve()
  };

  const usecase = new CreateContainer(
    mockContainersRepository as unknown as ContainersRepository,
    mockDomainCdnService as unknown as DomainCdnService
  );

  const command = CreateContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    name: "Root Container",
    description: "Test root container",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=="
  });

  const result = await usecase.execute(command);

  assertSpyCalls(mockContainersRepository.findById, 0);
  
  assertSpyCalls(mockContainersRepository.createWithImage, 1);
  const creationArgs = mockContainersRepository.createWithImage.calls[0].args[0] as any;
  assertEquals(creationArgs.ownerId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(creationArgs.name, "Root Container");
  assertEquals(creationArgs.path, "/");
  assertEquals(creationArgs.parentId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(creationArgs.parentType, AssetTypeEnum.DOMAIN_ROOT);
  
  assertSpyCalls(mockDomainCdnService.uploadImage, 1);
  assertEquals(mockDomainCdnService.uploadImage.calls[0].args[0], "550e8400-e29b-41d4-a716-446655440022");
  
  assertEquals(result.id, "550e8400-e29b-41d4-a716-446655440002");
  assertEquals(result.name, "Root Container");
  assertEquals(result.parentId, "550e8400-e29b-41d4-a716-446655440022");
  assertEquals(result.parentType, AssetTypeEnum.DOMAIN_ROOT);
});

Deno.test("CreateContainer - throws DocumentNotFoundError when parent container doesn't exist", async () => {
  const mockContainersRepository = {
    findById: spy((id: string) => Promise.resolve(null)),
    createWithImage: spy((data: any, imageBase64: string) => Promise.resolve({} as Container))
  };

  const mockDomainCdnService = {
    uploadImage: spy((userId: string, imageId: string, imageBase64: string) => Promise.resolve({
      imageUrl: ""
    })),
    getPublicUrl: () => "",
    getImageUrl: () => ({ imageUrl: "" }),
    deleteFile: () => Promise.resolve()
  };

  const usecase = new CreateContainer(
    mockContainersRepository as unknown as ContainersRepository,
    mockDomainCdnService as unknown as DomainCdnService
  );

  const command = CreateContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    name: "New Container",
    description: "Test container",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
    parentId: "550e8400-e29b-41d4-a716-446655440099",
    parentType: AssetTypeEnum.CONTAINER
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "Container"
  );

  assertSpyCalls(mockContainersRepository.findById, 1);
  assertSpyCalls(mockContainersRepository.createWithImage, 0);
  assertSpyCalls(mockDomainCdnService.uploadImage, 0);
});

Deno.test("CreateContainer - throws NoPermissionError when user is not container owner", async () => {
  const mockContainersRepository = {
    findById: spy((id: string) => Promise.resolve({
      id: "550e8400-e29b-41d4-a716-446655440001",
      ownerId: "550e8400-e29b-41d4-a716-446655440099", 
      name: "Parent Container",
      type: "container",
      path: "/parent-path/"
    } as Container)),
    createWithImage: spy((data: any, imageBase64: string) => Promise.resolve({} as Container))
  };

  const mockDomainCdnService = {
    uploadImage: spy((userId: string, imageId: string, imageBase64: string) => Promise.resolve({
      imageUrl: ""
    })),
    getPublicUrl: () => "",
    getImageUrl: () => ({ imageUrl: "" }),
    deleteFile: () => Promise.resolve()
  };

  const usecase = new CreateContainer(
    mockContainersRepository as unknown as ContainersRepository,
    mockDomainCdnService as unknown as DomainCdnService
  );

  const command = CreateContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022", 
    name: "New Container",
    description: "Test container",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
    parentId: "550e8400-e29b-41d4-a716-446655440001",
    parentType: AssetTypeEnum.CONTAINER
  });

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertSpyCalls(mockContainersRepository.findById, 1);
  assertSpyCalls(mockContainersRepository.createWithImage, 0);
  assertSpyCalls(mockDomainCdnService.uploadImage, 0);
}); 