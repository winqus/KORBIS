import { assertEquals, assertRejects } from "jsr:@std/assert";
import { assertSpyCalls, spy } from "jsr:@std/testing/mock";
import { DeleteContainer } from "../../../../_shared/usecases/DeleteContainer/DeleteContainerUsecase.ts";
import { DeleteContainerCommand } from "../../../../_shared/usecases/DeleteContainer/DeleteContainerCommand.ts";
import { BadRequestError, DocumentNotFoundError, NoPermissionError } from "../../../../_shared/errors/index.ts";
import { GetAssetsOfParent } from "../../../../_shared/usecases/index.ts";
import { AssetTypeEnum } from "../../../../_shared/core/index.ts";
import { ContainersRepository } from "../../../../_shared/interfaces/ContainersRepository.ts";
import { Container } from "../../../../_shared/entities/Container.ts";

Deno.test("DeleteContainer - successfully deletes empty container", async () => {
  const mockContainersRepository = {
    findById: spy(() => Promise.resolve({
      id: "550e8400-e29b-41d4-a716-446655440001",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Container to Delete",
      type: "container"
    } as Container)),
    delete: spy(() => Promise.resolve())
  };

  const mockGetAssetsOfParent = {
    execute: spy(() => Promise.resolve([]))
  };

  const usecase = new DeleteContainer(
    mockContainersRepository as unknown as ContainersRepository,
    mockGetAssetsOfParent as unknown as GetAssetsOfParent
  );

  const command = DeleteContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    containerId: "550e8400-e29b-41d4-a716-446655440001"
  });

  await usecase.execute(command);

  assertSpyCalls(mockContainersRepository.findById, 1);

  
  assertSpyCalls(mockGetAssetsOfParent.execute, 1);

  assertSpyCalls(mockContainersRepository.delete, 1);
});

Deno.test("DeleteContainer - throws DocumentNotFoundError when container doesn't exist", async () => {
  const mockContainersRepository = {
    findById: spy(() => Promise.resolve(null)),
    delete: spy(() => Promise.resolve())
  };

  const mockGetAssetsOfParent = {
    execute: spy(() => Promise.resolve([]))
  };

  const usecase = new DeleteContainer(
    mockContainersRepository as unknown as ContainersRepository,
    mockGetAssetsOfParent as unknown as GetAssetsOfParent
  );

  const command = DeleteContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    containerId: "550e8400-e29b-41d4-a716-446655440099"
  });

  await assertRejects(
    () => usecase.execute(command),
    DocumentNotFoundError,
    "Container"
  );

  assertSpyCalls(mockContainersRepository.findById, 1);
  assertSpyCalls(mockGetAssetsOfParent.execute, 0);
  assertSpyCalls(mockContainersRepository.delete, 0);
});

Deno.test("DeleteContainer - throws NoPermissionError when user is not container owner", async () => {
  const mockContainersRepository = {
    findById: spy(() => Promise.resolve({
      id: "550e8400-e29b-41d4-a716-446655440001",
      ownerId: "550e8400-e29b-41d4-a716-446655440099", 
      name: "Container to Delete",
      type: "container"
    } as Container)),
    delete: spy(() => Promise.resolve())
  };

  const mockGetAssetsOfParent = {
    execute: spy(() => Promise.resolve([]))
  };

  const usecase = new DeleteContainer(
    mockContainersRepository as unknown as ContainersRepository,
    mockGetAssetsOfParent as unknown as GetAssetsOfParent
  );

  const command = DeleteContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022", 
    containerId: "550e8400-e29b-41d4-a716-446655440001"
  });

  await assertRejects(
    () => usecase.execute(command),
    NoPermissionError
  );

  assertSpyCalls(mockContainersRepository.findById, 1);
  assertSpyCalls(mockGetAssetsOfParent.execute, 0);
  assertSpyCalls(mockContainersRepository.delete, 0);
});

Deno.test("DeleteContainer - throws BadRequestError when container has items inside", async () => {
  const mockContainersRepository = {
    findById: spy(() => Promise.resolve({
      id: "550e8400-e29b-41d4-a716-446655440001",
      ownerId: "550e8400-e29b-41d4-a716-446655440022",
      name: "Container with Items",
      type: "container"
    } as Container)),
    delete: spy(() => Promise.resolve())
  };
  
  const mockGetAssetsOfParent = {
    execute: spy(() => Promise.resolve([
      { id: "550e8400-e29b-41d4-a716-446655440010", name: "Item 1", type: "item" },
      { id: "550e8400-e29b-41d4-a716-446655440011", name: "Item 2", type: "item" }
    ]))
  };

  const usecase = new DeleteContainer(
    mockContainersRepository as unknown as ContainersRepository,
    mockGetAssetsOfParent as unknown as GetAssetsOfParent
  );

  const command = DeleteContainerCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440022",
    containerId: "550e8400-e29b-41d4-a716-446655440001"
  });

  await assertRejects(
    () => usecase.execute(command),
    BadRequestError,
    "Cannot delete Container with Items because it has items inside"
  );

  assertSpyCalls(mockContainersRepository.findById, 1);
  assertSpyCalls(mockGetAssetsOfParent.execute, 1);
  assertSpyCalls(mockContainersRepository.delete, 0);
}); 