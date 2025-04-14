import { AddFileForItemCommand } from "./AddFileForItemCommand.ts";
import { inject, injectable } from "@needle-di/core";
// TODO: Adjust token imports
import {
  ITEMS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
} from "../../injection-tokens.ts";
// TODO: Adjust error and entity imports as needed
import {
  DocumentNotFoundError,
  NoPermissionError,
} from "../../errors/index.ts";
import { Container } from "../../entities/index.ts";

@injectable()
export class AddFileForItem {
  constructor(
    // TODO: Inject needed repositories/services
    private readonly itemsRepository = inject(ITEMS_REPOSITORY),
    private readonly domainCdnService = inject(DOMAIN_CDN_SERVICE),
  ) {}

  public async execute(command: AddFileForItemCommand) {
    // TODO: Destructure command properties
    // const { name, userId, ... } = command;

    // TODO: Add logic (e.g. permission checks, validations)

    // TODO: Perform action (e.g. create/update/delete/etc.)
    // const result = await this.itemsRepository.method(...);

    // TODO: Return appropriate response
    return {
      // id: result.id,
      // name: result.name,
      // ...
    };
  }
}
