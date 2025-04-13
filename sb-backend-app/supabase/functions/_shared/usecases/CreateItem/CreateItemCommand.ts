// @ts-types="npm:@types/validator"
import validator from "validator";
import { AssetTypeEnum, AuthenticatedCommand } from "../../core/index.ts";
import { isDefined } from "../../utils.ts";

export class CreateItemCommand extends AuthenticatedCommand {
  name!: string;

  description!: string;

  imageBase64!: string;

  parentType?: string;

  parentId?: string;

  quantity?: number;

  static create(data: CreateItemCommand) {
    const {
      userId,
      name,
      description = "",
      imageBase64,
      parentId,
      parentType,
      quantity = 1,
    } = data;
    this.validate(data, [
      {
        property: "userId",
        isValid: isDefined(userId) && validator.isUUID(userId),
        message: "User ID must be a valid UUID",
      },
      {
        property: "name",
        isValid: isDefined(name) && validator.isLength(name, { min: 1, max: 100 }),
        message: "Name must be between 1 and 100 characters",
      },
      {
        property: "description",
        isValid: validator.isLength(description, { min: 0, max: 1000 }),
        message: "Description cannot exceed 1000 characters",
      },
      {
        property: "imageBase64",
        isValid: isDefined(imageBase64) && validator.isLength(imageBase64, { min: 1 }),
        message: "Image base64 data is required",
      },
      {
        property: "parentType",
        isValid: (!isDefined(parentType) || parentType === "") || validator.isIn(parentType, [
          AssetTypeEnum.CONTAINER,
        ]),
        message: "Parent type must be 'container'",
      },
      {
        property: "parentId",
        isValid: !parentId || validator.isUUID(parentId),
        message: "Parent ID must be a valid UUID",
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
      {
        property: "quantity",
        isValid: isDefined(quantity) &&
          validator.isInt(quantity.toString(), { min: 0, max: 4294967295 }),
        message: "Quantity must be a positive integer or 0",
      },
    ]);

    const command = new this();

    command.userId = userId;
    command.name = name;
    command.description = description;
    command.imageBase64 = imageBase64;
    command.parentType = parentType;
    command.parentId = parentId;
    command.quantity = quantity;

    return command;
  }
}
