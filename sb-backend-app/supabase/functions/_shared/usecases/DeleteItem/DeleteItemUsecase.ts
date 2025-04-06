import { DeleteItemCommand } from "./DeleteItemCommand.ts";
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
export class DeleteItem {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: DeleteItemCommand) {
    const { userId, itemId } = command;

    const item = await this.itemsRepository.findById(itemId);
    if (!item) {
      throw new DocumentNotFoundError("Item", itemId);
    }

    if (item.ownerId !== userId) {
      throw new NoPermissionError();
    }

    await this.itemsRepository.delete(itemId);

    // TODO: Delete image from CDN
  }
}
