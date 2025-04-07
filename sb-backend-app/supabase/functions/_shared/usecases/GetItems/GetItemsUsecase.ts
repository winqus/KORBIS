import { GetItemsCommand } from "./GetItemsCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  DOMAIN_CDN_SERVICE,
  ITEMS_REPOSITORY,
} from "../../injection-tokens.ts";
import { Item } from "../../entities/index.ts";

@injectable()
export class GetItems {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: GetItemsCommand) {
    const { userId, limit = 50, skip = 0 } = command;

    const items = await this.itemsRepository.paginate({
      ownerId: userId,
      limit,
      skip,
    });

    const result = items.map((item) => {
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
        imageId: item.imageId,
        imageUrl: imageUrl,
        parentId: item.parentId,
        parentType: item.parentType,
      } satisfies Item & { imageUrl?: string };
    });

    return result;
  }
}
