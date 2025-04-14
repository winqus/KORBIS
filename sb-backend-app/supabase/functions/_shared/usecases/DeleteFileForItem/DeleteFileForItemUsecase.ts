import { DeleteFileForItemCommand } from "./DeleteFileForItemCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  ITEMS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";

@injectable()
export class DeleteFileForItem {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: DeleteFileForItemCommand): Promise<void> {
    const { userId, fileId, itemId } = command;

    const item = await this.itemsRepository.findById(itemId);
    if (!item) {
      throw new DocumentNotFoundError(`Item with ID ${itemId} not found`, itemId);
    }

    if (item.ownerId !== userId) {
      throw new NoPermissionError();
    }

    const fileExists = item.files?.some(file => file.id === fileId);
    if (!fileExists) {
      throw new DocumentNotFoundError(`File with ID ${fileId} not found in item ${itemId}`, itemId);
    }

    const fileToDelete = item.files?.find(file => file.id === fileId);
    if (fileToDelete && fileToDelete.fileUrl) {
      try {
        await this.domainCdnService.deleteFile(fileToDelete.fileUrl);
      } catch (error) {
        console.error("Failed to delete file from storage:", error);
      }
    }

    await this.itemsRepository.deleteFile(itemId, fileId);
  }
}
