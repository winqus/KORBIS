import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class DeleteContainerCommand extends AuthenticatedCommand {
  containerId!: string;

  static create(data: DeleteContainerCommand) {
    const { userId, containerId } = data;

    this.validate(data, [
      {
        property: "containerId",
        isValid: !!data.containerId && validator.isUUID(data.containerId),
        message: "Container ID must be a valid UUID",
      },
      {
        property: "userId",
        isValid: !!data.userId && validator.isUUID(data.userId),
        message: "User ID must be a valid UUID",
      },
    ]);

    const command = new this();

    command.containerId = containerId;
    command.userId = userId;

    return command;
  }
}
