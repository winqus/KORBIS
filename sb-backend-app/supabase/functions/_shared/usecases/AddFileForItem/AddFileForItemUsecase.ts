import { AddFileForItemCommand } from "./AddFileForItemCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  ITEMS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";
import { File } from "../../entities/index.ts";
import { randomUUID } from "../../utils.ts";

@injectable()
export class AddFileForItem {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: AddFileForItemCommand): Promise<File> {
    const { userId, itemId, name, originalName, path, mimeType, size } = command;

    const item = await this.itemsRepository.findById(itemId);
    if (!item) {
      throw new DocumentNotFoundError(`Item`, itemId);
    }

    if (item.ownerId !== userId) {
      throw new NoPermissionError();
    }

    const fileUrl = this.domainCdnService.getPublicUrl(path);
    
    const fileData = {
      id: randomUUID(),
      name,
      originalName,
      fileUrl,
      mimeType,
      size,
      createdAt: new Date().toISOString(),
    };

    const file = await this.itemsRepository.addFile(itemId, fileData);

    return file;
  }
}
