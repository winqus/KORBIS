import { inject, injectable } from "@needle-di/core";
import {
  CONTAINERS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
import { CreateContainerCommand } from "../index.ts";
import { Container, IVirtualAsset } from "../../entities/index.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";
import { AssetTypeEnum } from "../../core/index.ts";
import { DOMAIN_ROOT_NAME } from "../../config.ts";
import { VisualCode } from '../../utils.ts';
import { CONTAINER_VISUAL_CODE_PREFIX } from '../../config.ts';

@injectable()
export class CreateContainer {
  constructor(
    private readonly containersRepository = inject(CONTAINERS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: CreateContainerCommand) {
    const { name, description, imageBase64, userId, parentId, parentType } =
      command;

    let parent: (Pick<IVirtualAsset, "id" | "type" | "name"> & Pick<Container, "path">) | null = null;
    if (parentId && parentType === AssetTypeEnum.CONTAINER) {
      const container = await this.containersRepository.findById(parentId);
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
        path: "/",
      };
    }

    const newContainer = await this.containersRepository.createWithImage({
      ownerId: userId,
      name,
      description,
      childCount: 0,
      path: parent.path,
      parentId: parent.id,
      parentType: parent.type,
      visualCode: VisualCode.generateRandomVisualCode(CONTAINER_VISUAL_CODE_PREFIX),
    }, imageBase64);

    const { imageUrl } = await this.domainCdnService.uploadImage(
      userId,
      newContainer.imageId!,
      imageBase64,
    );

    return {
      id: newContainer.id,
      ownerId: newContainer.ownerId,
      name: newContainer.name,
      description: newContainer.description,
      parentId: newContainer.parentId,
      parentType: newContainer.parentType,
      path: newContainer.path,
      imageId: newContainer.imageId || null,
      imageUrl: imageUrl || null,
    };
  }
}
