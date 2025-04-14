import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class DeleteFileForItemCommand extends AuthenticatedCommand {
  fileId!: string;
  itemId!: string;

  static create(data: DeleteFileForItemCommand) {
    const { userId, fileId, itemId } = data;

    this.validate(data, [
      {
        property: "fileId",
        isValid: !!fileId && validator.isUUID(fileId),
        message: "File ID must be a valid UUID",
      },
      {
        property: "itemId", 
        isValid: !!itemId && validator.isUUID(itemId),
        message: "Item ID must be a valid UUID",
      }
    ]);

    const command = new this();
    command.userId = userId;
    command.fileId = fileId;
    command.itemId = itemId;

    return command;
  }
}
