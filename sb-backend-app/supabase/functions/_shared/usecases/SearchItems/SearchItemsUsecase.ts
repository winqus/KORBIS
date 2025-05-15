import { SearchItemsCommand } from "./SearchItemsCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  ITEMS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
import { Item } from "../../entities/index.ts";

@injectable()
export class SearchItems {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: SearchItemsCommand) {
    const { queryText, queryImageBase64, userId } = command;

    const items = await this.itemsRepository.search({
      ownerId: userId,
      queryText,
      queryImageBase64,
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
        parentName: item.parentName,
        parentId: item.parentId,
        parentType: item.parentType,
      } satisfies Item & { imageUrl?: string };
    });

    return result;
  }
}
