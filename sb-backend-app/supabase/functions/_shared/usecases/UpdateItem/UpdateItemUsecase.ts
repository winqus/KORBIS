import { UpdateItemCommand } from "./UpdateItemCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  ITEMS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";
import { Item } from "../../entities/index.ts";
import { randomUUID } from "../../utils.ts";

@injectable()
export class UpdateItem {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: UpdateItemCommand) {
    const { id, name, description, imageBase64, userId, quantity } = command;

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
