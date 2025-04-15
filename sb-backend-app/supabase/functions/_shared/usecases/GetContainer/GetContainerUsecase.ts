import { GetContainerCommand } from "./GetContainerCommand.ts";
import { inject, injectable } from "@needle-di/core";
import {
  DOMAIN_CDN_SERVICE,
  CONTAINERS_REPOSITORY,
} from "../../injection-tokens.ts";
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";
import { Container } from "../../entities/index.ts";

@injectable()
export class GetContainer {
  constructor(
    private readonly containersRepository = inject(CONTAINERS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: GetContainerCommand) {
    const { userId, containerId, visualCode } = command;

    let container: Container | null = null;

    if (containerId) {
      container = await this.containersRepository.findById(containerId);
    } else if (visualCode) {
      container = await this.containersRepository.findByVisualCode(visualCode);
    }

    if (!container) {
      const errorMessage = `Container with ${containerId ? "ID" : "visual code"} ${containerId ?? visualCode} not found`;
      throw new DocumentNotFoundError("Container", containerId ?? visualCode ?? "", errorMessage);
    }

    if (container.ownerId !== userId) {
      throw new NoPermissionError();
    }

    const { imageUrl } = this.domainCdnService.getImageUrl(
      userId,
      container.imageId!,
    );

    return {
      id: container.id,
      ownerId: container.ownerId,
      name: container.name,
      description: container.description,
      imageUrl: imageUrl,
      parentId: container.parentId,
      parentType: container.parentType,
      parentName: container.parentName,
      type: container.type,
      childCount: container.childCount,
      path: container.path,
    } satisfies Container & { imageUrl?: string };
  }
}
