import { GetItemCommand } from "./GetItemCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  DOMAIN_CDN_SERVICE,
  ITEMS_REPOSITORY,
} from "../../injection-tokens.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";

@injectable()
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

    const { imageUrl } = await this.domainCdnService.getImageUrl(
      userId,
      item.imageId!,
    );

    return {
      id: item.id,
      ownerId: item.ownerId,
      name: item.name,
      description: item.description,
      type: item.type,
      imageUrl: imageUrl,
      parentId: item.parentId,
      parentType: item.parentType,
    };
  }
}
