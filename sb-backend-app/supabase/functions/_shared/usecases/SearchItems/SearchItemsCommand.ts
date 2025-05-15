import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class SearchItemsCommand extends AuthenticatedCommand {
  queryText?: string;
  queryImageBase64?: string;

  static create(data: SearchItemsCommand) {
    const { userId, queryText, queryImageBase64 } = data;

    this.validate(data, [
      {
        property: "userId",
        isValid: !!userId && validator.isUUID(userId),
        message: "User ID must be a valid UUID",
      },
      {
        property: "queryText",
        isValid: !!queryText || !!queryImageBase64,
        message: "Either query text or image must be provided",
      },
    ]);

    const command = new this();

    command.userId = userId;
    command.queryText = queryText;
    command.queryImageBase64 = queryImageBase64;

    return command;
  }
}
