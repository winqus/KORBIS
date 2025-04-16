import { UpdateContainerCommand } from "./UpdateContainerCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  DOMAIN_CDN_SERVICE,
  CONTAINERS_REPOSITORY,
} from "../../injection-tokens.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";
import { Container } from "../../entities/index.ts";
import { randomUUID } from "../../utils.ts";
import { AssetTypeEnum } from "../../core/index.ts";
import { DOMAIN_ROOT_NAME } from "../../config.ts";

// @injectable()
export class UpdateContainer {
  constructor(
    private readonly containersRepository = inject(CONTAINERS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: UpdateContainerCommand) {
    const { id, name, description, imageBase64, userId, parentId, parentType } = command;

    const existingContainer = await this.containersRepository.findById(id);
    if (!existingContainer) {
      throw new DocumentNotFoundError("Container", id);
    }

    if (existingContainer.ownerId !== userId) {
      throw new NoPermissionError();
    }

    const updateData: Partial<Container> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();

    if (parentId !== undefined && parentType !== undefined) {
      if (parentType === AssetTypeEnum.CONTAINER) {
        const container = await this.containersRepository.findById(parentId);
        if (!container) {
          throw new DocumentNotFoundError("Container", parentId);
        }

        if (container.ownerId !== userId) {
          throw new NoPermissionError();
        }

        updateData.parentId = parentId;
        updateData.parentType = parentType;
        updateData.parentName = container.name;
      } else if (parentType === AssetTypeEnum.DOMAIN_ROOT) {
        updateData.parentId = userId;
        updateData.parentType = AssetTypeEnum.DOMAIN_ROOT;
        updateData.parentName = DOMAIN_ROOT_NAME;
      } else {
        throw new NoPermissionError();
      }
    }

    let imageUrl = undefined;
    if (imageBase64) {
      const imageId = existingContainer.imageId || randomUUID();
      updateData.imageId = imageId;

      const imageResult = await this.domainCdnService.uploadImage(
        userId,
        imageId,
        imageBase64
      );
      imageUrl = imageResult.imageUrl;
    } else if (existingContainer.imageId) {
      const imageResult = this.domainCdnService.getImageUrl(
        userId,
        existingContainer.imageId
      );
      imageUrl = imageResult.imageUrl;
    }

    const updatedContainer = await this.containersRepository.update(id, updateData);
    if (!updatedContainer) {
      throw new DocumentNotFoundError("Container", id);
    }

    return {
      id: updatedContainer.id,
      ownerId: updatedContainer.ownerId,
      name: updatedContainer.name,
      description: updatedContainer.description,
      parentId: updatedContainer.parentId,
      parentType: updatedContainer.parentType,
      parentName: updatedContainer.parentName,
      imageId: updatedContainer.imageId || null,
      imageUrl: imageUrl || null,
    };
  }
}
