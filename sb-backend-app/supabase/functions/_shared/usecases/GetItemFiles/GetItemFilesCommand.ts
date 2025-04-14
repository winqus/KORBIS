import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class GetItemFilesCommand extends AuthenticatedCommand {
  itemId!: string;

  static create(data: GetItemFilesCommand) {
    const { userId, itemId } = data;

    this.validate(data, [
      {
        property: "itemId",
        isValid: !!itemId && validator.isUUID(itemId),
        message: "Item ID must be a valid UUID",
      }
    ]);

    const command = new this();
    command.userId = userId;
    command.itemId = itemId;

    return command;
  }
}
