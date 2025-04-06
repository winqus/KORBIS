import { BaseCommand } from "./BaseCommand.ts";

export abstract class AuthenticatedCommand extends BaseCommand {
  public userId!: string;
}
