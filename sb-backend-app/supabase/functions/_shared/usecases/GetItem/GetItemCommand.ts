import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class GetItemCommand extends AuthenticatedCommand {
  itemId!: string;

  static create(data: GetItemCommand) {
    const { userId, itemId } = data;

    this.validate(data, [
      {
        property: "itemId",
        isValid: !!data.itemId && validator.isUUID(data.itemId),
        message: "Item ID must be a valid UUID",
      },
      {
        property: "userId",
        isValid: !!data.userId && validator.isUUID(data.userId),
        message: "User ID must be a valid UUID",
      },
    ]);

    const command = new this();

    command.itemId = itemId;
    command.userId = userId;

    return command;
  }
}
