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
      console.log("Command data:",
        JSON.stringify(
          { ...data, imageBase64: ((data as any)["imageBase64"] as any)?.slice(0, 10) },
          null,
          2,
        ),
      );
      throw new BadRequestError(invalidFields);
    }
  }
}
