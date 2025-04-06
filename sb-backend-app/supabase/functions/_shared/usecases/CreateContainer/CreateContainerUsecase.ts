import { inject, injectable } from "@needle-di/core";
import {
  CONTAINERS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
import { CreateContainerCommand } from "../index.ts";
import { Container } from "../../entities/index.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";

@injectable()
export class CreateContainer {
  constructor(
    private readonly containersRepository = inject(CONTAINERS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: CreateContainerCommand) {
    const { name, description, imageBase64, userId, parentId, parentType } =
      command;

    let parentContainer: Container | null = null;
    let path = "";

    if (parentId && parentType === "container") {
      const container = await this.containersRepository.findById(parentId);
      if (!container) {
        throw new DocumentNotFoundError(
          "Container",
          parentId,
          "Container not found",
        );
      }

      if (container.ownerId !== userId) {
        throw new NoPermissionError();
      }

      parentContainer = container;

      path = container.path
        ? `${container.path}/${container.name}`
        : container.name;
    }

    const newContainer = await this.containersRepository.createWithImage({
      ownerId: userId,
      name,
      description,
      childCount: 0,
      path,
      parentId: parentContainer?.id,
      parentType: parentContainer ? "container" : undefined,
    }, imageBase64);

    const { imageUrl } = await this.domainCdnService.uploadImage(
      userId,
      newContainer.imageId!,
      imageBase64,
    );

    return {
      id: newContainer.id,
      ownerId: newContainer.ownerId,
      name: newContainer.name,
      description: newContainer.description,
      parentId: parentContainer?.id || null,
      parentType: parentContainer ? "container" : null,
      path: newContainer.path,
      imageId: newContainer.imageId || null,
      imageUrl: imageUrl || null,
    };
  }
}
