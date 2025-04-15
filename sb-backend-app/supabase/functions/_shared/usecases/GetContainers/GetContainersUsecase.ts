import { GetContainersCommand } from "./GetContainersCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  CONTAINERS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
  import {
  NoPermissionError,
} from "../../errors/index.ts";
import { Container } from "../../entities/index.ts";

@injectable()
export class GetContainers {
  constructor(
    private readonly containersRepository = inject(CONTAINERS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: GetContainersCommand) {
    const { userId, limit = 50, skip = 0, parentId } = command;

    if (!userId) {
      throw new NoPermissionError();
    }

    const containers = await this.containersRepository.paginate({
      ownerId: userId,
      limit,
      skip,
      parentId
    });

    const result = containers.map((container: Container) => {
      const { imageUrl } = this.domainCdnService.getImageUrl(
        userId,
        container.imageId!,
      );

      return {
        id: container.id,
        ownerId: container.ownerId,
        name: container.name,
        type: container.type,
        description: container.description,
        imageId: container.imageId,
        imageUrl: imageUrl,
        parentName: container.parentName,
        parentId: container.parentId,
        parentType: container.parentType,
        childCount: container.childCount,
        path: container.path
      };
    });

    return result;
  }
}
