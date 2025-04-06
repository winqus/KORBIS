import { inject, injectable } from "@needle-di/core";
import {
  CONTAINERS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
import { CreateContainerCommand } from "../index.ts";

@injectable()
export class CreateContainer {
  constructor(
    private readonly containersRepository = inject(CONTAINERS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: CreateContainerCommand) {
    const { name, description, imageBase64, userId } = command;

    const newContainer = await this.containersRepository.createWithImage({
      ownerId: userId,
      name,
      description,
      childCount: 0,
      path: "",
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
      imageId: newContainer.imageId || null,
      imageUrl: imageUrl || null,
    };
  }
}
