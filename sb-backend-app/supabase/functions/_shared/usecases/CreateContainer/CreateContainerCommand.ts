import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class CreateContainerCommand extends AuthenticatedCommand {
  name!: string;

  description!: string;

  imageBase64!: string;

  parentType?: string;

  parentId?: string;

  static create(data: CreateContainerCommand) {
    const { userId, name, description, imageBase64, parentId, parentType } =
      data;

    this.validate(data, [
      {
        property: "userId",
        isValid: !!userId && validator.isLength(userId, { min: 1, max: 255 }),
        message: "User ID must be between 1 and 255 characters",
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
      {
        property: "parentType",
        isValid: !parentType || validator.isIn(parentType, [
          "container",
        ]),
        message: "Parent type must be 'container'",
      },
      {
        property: "parentId",
        isValid: !parentId || validator.isLength(userId, { min: 1, max: 255 }),
        message: "Parent ID must be between 1 and 255 characters",
      },
      {
        property: "parentId",
        isValid: !parentId || !!parentType,
        message: "Parent ID must be provided if parent type is provided",
      },
      {
        property: "parentType",
        isValid: !parentType || !!parentId,
        message: "Parent type must be provided if parent ID is provided",
      },
    ]);

    const command = new this();

    command.userId = userId;
    command.name = name;
    command.description = description;
    command.imageBase64 = imageBase64;
    command.parentType = parentType;
    command.parentId = parentId;
    
    return command;
  }
}
