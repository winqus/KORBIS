import validator from "validator";
import { AssetTypeEnum, AuthenticatedCommand } from "../../core/index.ts";
import { isDefined } from "../../utils.ts";

export class UpdateItemCommand extends AuthenticatedCommand {
  id!: string;
  name?: string;
  description?: string;
  imageBase64?: string;
  quantity?: number;
  parentId?: string;
  parentType?: string;

  static create(data: UpdateItemCommand) {
    const {
      userId,
      id,
      name,
      description = "",
      imageBase64,
      quantity,
      parentId,
      parentType,
    } = data;

    this.validate(data, [
      {
        property: "userId",
        isValid: isDefined(userId) && validator.isUUID(userId),
        message: "User ID must be a valid UUID",
      },
      {
        property: "id",
        isValid: isDefined(id) && validator.isUUID(id),
        message: "Item ID must be a valid UUID",
      },
      {
        property: "name",
        isValid: !name || validator.isLength(name, { min: 1, max: 100 }),
        message: "Name must be between 1 and 100 characters",
      },
      {
        property: "description",
        isValid: !description ||
          validator.isLength(description, { min: 0, max: 1000 }),
        message: "Description cannot exceed 1000 characters",
      },
      {
        property: "quantity",
        isValid: !quantity ||
          (validator.isInt(quantity.toString(), { min: 0, max: 4294967295 })),
        message: "Quantity must be a positive integer or 0",
      },
      {
        property: "parentType",
        isValid: (!isDefined(parentType) || parentType === "") ||
          validator.isIn(parentType, [
            AssetTypeEnum.CONTAINER,
            AssetTypeEnum.DOMAIN_ROOT,
          ]),
        message: "Parent type must be 'container' or 'domain_root'",
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
    ]);

    const command = new this();

    command.userId = userId;
    command.id = id;

    if (isDefined(name)) command.name = name.trim();
    if (isDefined(description)) command.description = description.trim();
    if (isDefined(imageBase64)) command.imageBase64 = imageBase64;
    if (isDefined(quantity)) command.quantity = quantity;
    if (isDefined(parentId)) command.parentId = parentId;
    if (isDefined(parentType)) command.parentType = parentType;

    return command;
  }
}
