import { NextFunction, Request, Response } from "express";
import {
  CreateContainer,
  CreateContainerCommand,
  GetContainers,
  GetContainersCommand,
} from "../usecases/index.ts";
import { handleError } from "./errorHandler.ts";
import { inject, injectable } from "@needle-di/core";

@injectable()
export class ContainersController {
  constructor(
    private readonly createContainerUsecase = inject(CreateContainer),
    private readonly getContainersUsecase = inject(GetContainers),
  ) {}

  public async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, imageBase64, parentId, parentType } = req.body;
      const userId = req["userId"] as string;

      const command = CreateContainerCommand.create({
        userId,
        name,
        description,
        imageBase64,
        parentId,
        parentType,
      });

      const result = await this.createContainerUsecase.execute(command);

      res.status(201).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }

  public async getPaginated(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 50, skip = 0, parentId } = req.query;
      const userId = req["userId"] as string;

      const command = GetContainersCommand.create({
        userId,
        limit: Number(limit),
        skip: Number(skip),
        parentId: parentId as string,
      });

      const result = await this.getContainersUsecase.execute(command);

      res.status(200).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }
}
