import { NextFunction, Request, Response } from "express";
import { CreateItem, GetItem } from "../usecases/index.ts";
import { CreateItemCommand } from "../usecases/index.ts";
import { handleError } from "./errorHandler.ts";
import { inject, injectable } from "@needle-di/core";

@injectable()
export class ItemsController {
  constructor(
    private readonly createItemUsecase = inject(CreateItem),
    private readonly getItemUsecase = inject(GetItem),
  ) {}

  public async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, imageBase64, parentId, parentType } = req.body;
      const userId = req["userId"] as string;

      const command = CreateItemCommand.create({
        userId,
        name,
        description,
        imageBase64,
        parentId,
        parentType,
      });

      const result = await this.createItemUsecase.execute(command);

      res.status(201).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }

  public async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req["userId"] as string;

      const result = await this.getItemUsecase.execute({ itemId: id, userId });

      res.status(200).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }
}
