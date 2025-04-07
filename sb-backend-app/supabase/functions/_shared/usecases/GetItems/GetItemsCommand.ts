import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class GetItemsCommand extends AuthenticatedCommand {
  skip?: number;
  limit?: number;

  static create(data: GetItemsCommand) {
    const { userId, skip, limit } = data;

    this.validate(data, [
      {
        property: "userId",
        isValid: !!userId && validator.isUUID(userId),
        message: "User ID must be a valid UUID",
      },
      {
        property: "skip",
        isValid: !skip || (Number.isInteger(skip) && skip >= 0),
        message: "Skip must be a non-negative integer",
      },
      {
        property: "limit",
        isValid: !limit || (Number.isInteger(limit) && limit > 0),
        message: "Limit must be a positive integer",
      },
    ]);

    const command = new this();

    command.userId = userId;
    command.skip = skip;
    command.limit = limit;

    return command;
  }
}
