import validator from "validator";
import { AuthenticatedCommand } from "../../core/index.ts";

export class DeleteFileForItemCommand extends AuthenticatedCommand {
  // TODO: Define properties
  // e.g. name!: string;
  //       description!: string;

  static create(data: DeleteFileForItemCommand) {
    // TODO: Destructure input properties
    // const { userId, ... } = data;

    this.validate(data, [
      // TODO: Add validation rules
      // {
      //   property: "example",
      //   isValid: !!example && validator.isLength(example, { min: 1 }),
      //   message: "Example must be provided",
      // }
    ]);

    const command = new this();

    // TODO: Assign values to the command instance
    // command.userId = userId;
    // command.name = name;

    return command;
  }
}
