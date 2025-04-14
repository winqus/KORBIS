import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class AddFileForItemCommand extends AuthenticatedCommand {
  itemId!: string;
  name!: string;
  originalName!: string;
  path!: string;
  mimeType?: string;
  size?: number;

  static create(data: AddFileForItemCommand) {
    const { userId, itemId, name, originalName, path, mimeType, size } = data;

    this.validate(data, [
      {
        property: "itemId",
        isValid: !!itemId && validator.isUUID(itemId),
        message: "Item ID must be a valid UUID",
      },
      {
        property: "name",
        isValid: !!name && validator.isLength(name, { min: 1, max: 255 }),
        message: "File name must be provided and must be less than 255 characters",
      },
      {
        property: "originalName",
        isValid: !!originalName && validator.isLength(originalName, { min: 1, max: 255 }),
        message: "Original file name must be provided and must be less than 255 characters",
      },
      {
        property: "path",
        isValid: !!path && validator.isLength(path, { min: 1, max: 1000 }),
        message: "File path must be provided and must be less than 1000 characters",
      },
    ]);

    const command = new this();
    command.userId = userId;
    command.itemId = itemId;
    command.name = name;
    command.originalName = originalName;
    command.path = path;
    command.mimeType = mimeType;
    command.size = size;

    return command;
  }
}
