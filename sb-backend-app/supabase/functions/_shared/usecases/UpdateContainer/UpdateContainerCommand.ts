import validator from "validator";
import { AssetTypeEnum, AuthenticatedCommand } from "../../core/index.ts";
import { isDefined } from "../../utils.ts";

export class UpdateContainerCommand extends AuthenticatedCommand {
  id!: string;
  name?: string;
  description?: string;
  imageBase64?: string;
  parentId?: string;
  parentType?: string;

  static create(data: UpdateContainerCommand) {
    const {
      userId,
      id,
      name,
      description = "",
      imageBase64,
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
        message: "Container ID must be a valid UUID",
      },
      {
        property: "name",
        isValid: !name || validator.isLength(name, { min: 1, max: 100 }),
        message: "Name must be between 1 and 100 characters",
      },
      {
        property: "description",
        isValid: !description || validator.isLength(description, { min: 0, max: 1000 }),
        message: "Description cannot exceed 1000 characters",
      },
      {
        property: "parentType",
        isValid: (!isDefined(parentType) || parentType === "") || validator.isIn(parentType, [
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
    if (isDefined(parentId)) command.parentId = parentId;
    if (isDefined(parentType)) command.parentType = parentType;

    return command;
  }
}
