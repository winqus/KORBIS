import { BadRequestError } from "../errors/index.ts";

export abstract class BaseCommand {
  static validate<T extends BaseCommand>(data: T, validators: {
    property: keyof T;
    isValid: boolean;
    message: string;
  }[]): void {
    const invalidFields = validators.filter((v) => !v.isValid).reduce(
      (acc, v) => {
        (acc as any)[v.property] = v.message;
        return acc;
      },
      {},
    );

    if (Object.keys(invalidFields).length > 0) {
      throw new BadRequestError(invalidFields);
    }
  }
}
