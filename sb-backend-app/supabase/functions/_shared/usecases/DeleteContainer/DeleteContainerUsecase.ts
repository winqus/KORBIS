import { DeleteContainerCommand } from "./DeleteContainerCommand.ts";
import { inject, injectable } from "@needle-di/core";
import { CONTAINERS_REPOSITORY } from "../../injection-tokens.ts";
import {
  BadRequestError,
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";
import { GetAssetsOfParent, GetAssetsOfParentCommand } from "../index.ts";
import { AssetTypeEnum } from "../../core/index.ts";

@injectable()
export class DeleteContainer {
  constructor(
    private readonly containersRepository = inject(CONTAINERS_REPOSITORY),
    private readonly getAssetsOfParentUsecase = inject(GetAssetsOfParent),
  ) {}

  public async execute(command: DeleteContainerCommand) {
    const { userId, containerId } = command;

    const container = await this.containersRepository.findById(containerId);
    if (!container) {
      throw new DocumentNotFoundError("Container", containerId);
    }

    if (container.ownerId !== userId) {
      throw new NoPermissionError();
    }

    const assetsInContainer = await this.getAssetsOfParentUsecase.execute(
      GetAssetsOfParentCommand.create({
        userId,
        parentId: containerId,
        parentType: AssetTypeEnum.CONTAINER,
        skip: 0,
        limit: 10,
      }),
    );

    if (assetsInContainer.length > 0) {
      throw new BadRequestError(
        `Cannot delete ${container.name} because it has items inside.`,
      );
    }

    await this.containersRepository.delete(containerId);
  }
}
