import { UpdateItemCommand } from "./UpdateItemCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  ITEMS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
  CONTAINERS_REPOSITORY,
} from "../../injection-tokens.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";
import { Item } from "../../entities/index.ts";
import { randomUUID } from "../../utils.ts";
import { AssetTypeEnum } from "../../core/index.ts";
import { DOMAIN_ROOT_NAME } from "../../config.ts";

// @injectable()
export class UpdateItem {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly containersRepository = inject(CONTAINERS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: UpdateItemCommand) {
    const { id, name, description, imageBase64, userId, quantity, parentId, parentType } = command;

    const existingItem = await this.itemsRepository.findById(id);
    if (!existingItem) {
      throw new DocumentNotFoundError("Item", id);
    }

    if (existingItem.ownerId !== userId) {
      throw new NoPermissionError();
    }

    const updateData: Partial<Item> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (quantity !== undefined) updateData.quantity = quantity;

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
      const imageId = existingItem.imageId || randomUUID();
      updateData.imageId = imageId;
      
      const imageResult = await this.domainCdnService.uploadImage(
        userId,
        imageId,
        imageBase64
      );
      imageUrl = imageResult.imageUrl;
    } else if (existingItem.imageId) {
      const imageResult = this.domainCdnService.getImageUrl(
        userId,
        existingItem.imageId
      );
      imageUrl = imageResult.imageUrl;
    }

    const updatedItem = await this.itemsRepository.update(id, updateData);
    if (!updatedItem) {
      throw new DocumentNotFoundError("Item", id);
    }

    return {
      id: updatedItem.id,
      ownerId: updatedItem.ownerId,
      name: updatedItem.name,
      description: updatedItem.description,
      parentId: updatedItem.parentId,
      parentType: updatedItem.parentType,
      parentName: updatedItem.parentName,
      quantity: updatedItem.quantity,
      imageId: updatedItem.imageId || null,
      imageUrl: imageUrl || null,
    };
  }
}
