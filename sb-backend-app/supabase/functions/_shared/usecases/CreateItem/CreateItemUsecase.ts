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
import { IVirtualAsset } from "../../entities/index.ts";
import { AssetTypeEnum } from "../../core/index.ts";
import { DOMAIN_ROOT_NAME } from "../../config.ts";

// @injectable()
export class CreateItem {
  constructor(
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly containersRepository = inject(CONTAINERS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: CreateItemCommand) {
    const { name, description, imageBase64, userId, parentId, parentType, quantity = 1 } =
      command;

    let parent: Pick<IVirtualAsset, "id" | "type" | "name"> | null = null;
    if (parentId && parentType === AssetTypeEnum.CONTAINER) {
      const container = await this.containersRepository.findById(
        parentId,
      );
      if (!container) {
        throw new DocumentNotFoundError("Container", parentId, "Container not found");
      }

      if (container.ownerId !== userId) {
        throw new NoPermissionError();
      }

      parent = container;
    }

    if (!parent) {
      parent = {
        id: userId,
        type: AssetTypeEnum.DOMAIN_ROOT,
        name: DOMAIN_ROOT_NAME,
      }
    }

    const newItem = await this.itemsRepository.createWithImage({
      ownerId: userId,
      name,
      description,
      parentId: parent.id,
      parentType: parent.type, 
      parentName: parent.name,
      quantity,
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
      parentId: newItem.parentId,
      parentType: newItem.parentType,
      imageId: newItem.imageId || null,
      imageUrl: imageUrl || null,
    };
  }
}
