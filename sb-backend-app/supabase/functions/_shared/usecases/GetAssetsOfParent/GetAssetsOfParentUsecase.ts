import { GetAssetsOfParentCommand } from "./GetAssetsOfParentCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  ASSETS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
import { NoPermissionError } from "../../errors/index.ts";
import { Container, Item } from "../../entities/index.ts";
import { DEFAULT_PAGINATION_LIMIT } from "../../config.ts";
import { AssetTypeEnum } from "../../core/index.ts";

// @injectable()
export class GetAssetsOfParent {
  constructor(
    private readonly assetsRepository = inject(ASSETS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: GetAssetsOfParentCommand) {
    const { userId, skip = 0, limit = DEFAULT_PAGINATION_LIMIT } = command;

    if (!userId) {
      throw new NoPermissionError();
    }

    const parentId = command.parentId || userId;
    const parentType = command.parentType || AssetTypeEnum.DOMAIN_ROOT;

    const assets = await this.assetsRepository.getAssetsByParentId({
      ownerId: userId,
      parentId,
      parentType,
      skip,
      limit,
    });

    return assets.map((asset) => {
      if (asset.type === AssetTypeEnum.ITEM) {
        const { imageUrl } = this.domainCdnService.getImageUrl(
          userId,
          asset.imageId!,
        );

        return {
          id: asset.id,
          ownerId: asset.ownerId,
          name: asset.name,
          type: asset.type,
          description: asset.description,
          quantity: asset.quantity,
          imageId: asset.imageId,
          imageUrl: imageUrl,
          parentName: asset.parentName,
          parentId: asset.parentId,
          parentType: asset.parentType,
        } satisfies Item & { imageUrl?: string };
      } else if (asset.type === AssetTypeEnum.CONTAINER) {
        const { imageUrl } = this.domainCdnService.getImageUrl(
          userId,
          asset.imageId!,
        );

        return {
          id: asset.id,
          ownerId: asset.ownerId,
          name: asset.name,
          type: asset.type,
          description: asset.description,
          imageId: asset.imageId,
          imageUrl: imageUrl,
          parentName: asset.parentName,
          parentId: asset.parentId,
          parentType: asset.parentType,
          childCount: asset.childCount,
          path: asset.path,
          visualCode: asset.visualCode,
        } satisfies Container & { imageUrl?: string };
      } else {
        throw new Error("Invalid asset type");
      }
    });
  }
}
