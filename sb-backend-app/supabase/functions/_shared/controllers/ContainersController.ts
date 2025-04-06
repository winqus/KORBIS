import { NextFunction, Request, Response } from "express";
import { CreateContainer } from "../usecases/index.ts";
import { CreateContainerCommand } from "../usecases/index.ts";
import { handleError } from "./errorHandler.ts";
import { inject, injectable } from "@needle-di/core";

@injectable()
export class ContainersController {
  constructor(
    private readonly createContainerUsecase = inject(CreateContainer),
  ) {}

  public async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, imageBase64 } = req.body;
      const userId = req["userId"] as string;

      const command = CreateContainerCommand.create({
        userId,
        name,
        description,
        imageBase64,
      });

      const result = await this.createContainerUsecase.execute(command);

      res.status(201).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }
}
