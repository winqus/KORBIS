import { CreateItemCommand } from "./CreateItemCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  CONTAINERS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
  ITEMS_REPOSITORY,
} from "../../injection-tokens.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";
import { Container } from "../../entities/index.ts";

@injectable()
export class CreateItem {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly containersRepository = inject(CONTAINERS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: CreateItemCommand) {
    const { name, description, imageBase64, userId, parentId, parentType } =
      command;

    let parentContainer: Container | null = null;
    if (parentId && parentType === "container") {
      const container = await this.containersRepository.findById(
        parentId,
      );
      if (!container) {
        throw new DocumentNotFoundError("Container", parentId, "Container not found");
      }

      if (container.ownerId !== userId) {
        throw new NoPermissionError();
      }

      parentContainer = container;
    }

    const newItem = await this.itemsRepository.createWithImage({
      ownerId: userId,
      name,
      description,
      parentId: parentContainer?.id,
      parentType: parentContainer?.type, 
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
      parentId: parentContainer?.id || null,
      parentType: parentContainer ? "container" : null,
      imageId: newItem.imageId || null,
      imageUrl: imageUrl || null,
    };
  }
}
