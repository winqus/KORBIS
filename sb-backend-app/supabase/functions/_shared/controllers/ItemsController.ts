import { NextFunction, Request, Response } from "express";
import {
  CreateItem,
  CreateItemCommand,
  DeleteItem,
  DeleteItemCommand,
  GetItem,
  GetItemCommand,
} from "../usecases/index.ts";
import { handleError } from "./errorHandler.ts";
import { inject, injectable } from "@needle-di/core";

@injectable()
export class ItemsController {
  constructor(
    private readonly createItemUsecase = inject(CreateItem),
    private readonly getItemUsecase = inject(GetItem),
    private readonly deleteItemUsecase = inject(DeleteItem),
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

      const command = GetItemCommand.create({
        itemId: id,
        userId,
      });

      const result = await this.getItemUsecase.execute(command);

      res.status(200).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req["userId"] as string;

      const command = DeleteItemCommand.create({
        itemId: id,
        userId,
      });

      await this.deleteItemUsecase.execute(command);

      res.status(204).send();
    } catch (error) {
      handleError(error, req, res, next);
    }
  }
}
