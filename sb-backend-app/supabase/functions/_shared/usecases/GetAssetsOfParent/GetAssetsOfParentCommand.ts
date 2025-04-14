import validator from "validator";
import { AssetTypeEnum, AuthenticatedCommand } from "../../core/index.ts";

export class GetAssetsOfParentCommand extends AuthenticatedCommand {
  skip?: number;
  limit?: number;
  parentId?: string;
  parentType?: AssetTypeEnum.CONTAINER;

  static create(data: GetAssetsOfParentCommand) {
    const { userId, skip, limit, parentId, parentType } = data;

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
      {
        property: "parentId",
        isValid: !parentId || validator.isUUID(parentId),
        message: "Parent ID must be a valid UUID",
      },
      {
        property: "parentType",
        isValid: !parentType || validator.isIn(parentType, [AssetTypeEnum.CONTAINER]),
        message: "Parent type must be 'container' or undefined",
      },
    ]);

    const command = new this();

    command.userId = userId;
    command.skip = skip;
    command.limit = limit;
    command.parentId = parentId;
    command.parentType = parentType;

    return command;
  }
}
