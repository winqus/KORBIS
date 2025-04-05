import { CreateItemCommand } from "./CreateItemCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  DOMAIN_CDN_SERVICE,
  ITEMS_REPOSITORY,
} from "../../injection-tokens.ts";

@injectable()
export class CreateItem {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: CreateItemCommand) {
    const { name, description, imageBase64, userId } = command;

    const newItem = await this.itemsRepository.createWithImage({
      ownerId: userId,
      name,
      description,
    }, imageBase64);

    const { imageUrl } = await this.domainCdnService.uploadImage(
      userId,
      newItem.imageId!,
      imageBase64,
    );

    return {
      id: newItem.id,
      ownerId: newItem.ownerId,
      name: newItem.name,
      description: newItem.description,
      imageId: newItem.imageId || null,
      imageUrl: imageUrl || null,
    };
  }
}
