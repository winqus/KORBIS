import { GetItemCommand } from "./GetItemCommand.ts";
import { inject, injectable } from "@needle-di/core";
import { Item } from "../../entities/index.ts";
import {
  DOMAIN_CDN_SERVICE,
  ITEMS_REPOSITORY,
} from "../../injection-tokens.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";

// @injectable()
export class GetItem {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: GetItemCommand) {
    const { userId, itemId } = command;

    const item = await this.itemsRepository.findById(itemId);
    if (!item) {
      throw new DocumentNotFoundError("Item", itemId, "Item not found");
    }

    if (item.ownerId !== userId) {
      throw new NoPermissionError();
    }

    const { imageUrl } = this.domainCdnService.getImageUrl(
      userId,
      item.imageId!,
    );

    return {
      id: item.id,
      ownerId: item.ownerId,
      name: item.name,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      imageUrl: imageUrl,
      parentId: item.parentId,
      parentType: item.parentType,
      parentName: item.parentName,
    } satisfies Item & { imageUrl?: string };
  }
}
