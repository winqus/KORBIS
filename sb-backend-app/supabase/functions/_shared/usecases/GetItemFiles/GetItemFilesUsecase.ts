import { GetItemFilesCommand } from "./GetItemFilesCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  ITEMS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";
import { File } from "../../entities/File.ts";

// @injectable()
export class GetItemFiles {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: GetItemFilesCommand): Promise<File[]> {
    const { userId, itemId } = command;

    const item = await this.itemsRepository.findById(itemId);
    if (!item) {
      throw new DocumentNotFoundError(`Item`, itemId);
    }

    if (item.ownerId !== userId) {
      throw new NoPermissionError();
    }

    return item.files || [];
  }
}
