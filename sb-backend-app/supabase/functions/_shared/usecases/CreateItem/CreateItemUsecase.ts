import { ItemsRepository } from "../../interfaces/index.ts";
import { CreateItemCommand } from "./CreateItemCommand.ts";
import { DomainCdnService } from "../../interfaces/DomainCdnService.ts";
import { inject, injectable } from "@needle-di/core";
import {
  DOMAIN_CDN_SERVICE,
  ITEMS_REPOSITORY,
} from "../../injection-tokens.ts";
import { SupabaseService } from "../../services/index.ts";

@injectable()
export class CreateItem {
  constructor(
    private readonly itemsRepository: ItemsRepository = inject(
      ITEMS_REPOSITORY,
    ),
    private readonly domainCdnService: DomainCdnService = inject(
      DOMAIN_CDN_SERVICE,
    ),
    private readonly supabase = inject(SupabaseService),
  ) {}

  public async execute(command: CreateItemCommand) {
    const { name, description, imageBase64, domainId, userId } = command;

    // TODO add domainId to the item
    const newItem = await this.itemsRepository.createWithImage({
      name,
      description,
    }, imageBase64);

    const { imageUrl } = await this.domainCdnService.uploadImage(
      domainId,
      newItem.imageId!,
      imageBase64,
    );

    // TODO add domainId to the item
    return {
      id: newItem.id,
      name: newItem.name,
      description: newItem.description,
      imageId: newItem.imageId || null,
      imageUrl: imageUrl || null,
    };
  }
}
