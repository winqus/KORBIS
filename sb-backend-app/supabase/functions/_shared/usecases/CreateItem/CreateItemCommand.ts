// @ts-types="npm:@types/validator"
import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class CreateItemCommand extends AuthenticatedCommand {
  domainId!: string;

  name!: string;

  description!: string;

  imageBase64!: string;

  static create(data: CreateItemCommand) {
    const { userId, domainId, name, description, imageBase64 } = data;

    this.validate(data, [
      {
        property: "userId",
        isValid: !!userId && validator.isLength(userId, { min: 1, max: 255 }),
        message: "User ID must be between 1 and 255 characters",
      },
      {
        property: "domainId",
        isValid: !!domainId &&
          validator.isLength(domainId, { min: 1, max: 255 }),
        message: "Domain ID must be between 1 and 255 characters",
      },
      {
        property: "name",
        isValid: !!name && validator.isLength(name, { min: 1, max: 255 }),
        message: "Name must be between 1 and 255 characters",
      },
      {
        property: "description",
        isValid: !!description &&
          validator.isLength(description, { min: 0, max: 255 }),
        message: "Description cannot exceed 255 characters",
      },
      {
        property: "imageBase64",
        isValid: !!imageBase64 && validator.isLength(imageBase64, { min: 1 }),
        message: "Image base64 data is required",
      },
    ]);

    const command = new CreateItemCommand();

    command.userId = userId;
    command.domainId = domainId;
    command.name = name;
    command.description = description;
    command.imageBase64 = imageBase64;

    return command;
  }
}
