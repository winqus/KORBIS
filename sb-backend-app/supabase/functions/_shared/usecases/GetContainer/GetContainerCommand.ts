import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class GetContainerCommand extends AuthenticatedCommand {
  containerId?: string;
  visualCode?: string;

  static create(data: GetContainerCommand) {
    const { userId, containerId, visualCode } = data;

    this.validate(data, [
      {
        property: "userId",
        isValid: !!data.userId && validator.isUUID(data.userId),
        message: "User ID must be a valid UUID",
      },
      {
        property: "containerId",
        isValid: !!containerId || !!visualCode,
        message: "Either container ID or visual code must be provided",
      },
      {
        property: "containerId",
        isValid: !containerId || validator.isUUID(containerId),
        message: "Container ID must be a valid UUID",
      },
      {
        property: "visualCode",
        isValid: !visualCode || validator.isLength(visualCode, { min: 1, max: 20 }),
        message: "Visual code must be a string between 1 and 20 characters",
      },
    ]);

    const command = new this();

    command.containerId = containerId;
    command.userId = userId;
    command.visualCode = visualCode;

    return command;
  }
}
