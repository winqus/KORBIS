import { NextFunction, Request, Response } from "express";
import {
  CreateItem,
  CreateItemCommand,
  DeleteItem,
  DeleteItemCommand,
  GetItem,
  GetItemCommand,
  GetItems,
  GetItemsCommand,
} from "../usecases/index.ts";
import { handleError } from "./errorHandler.ts";
import { inject, injectable } from "@needle-di/core";

@injectable()
export class ItemsController {
  constructor(
    private readonly createItemUsecase = inject(CreateItem),
    private readonly getItemUsecase = inject(GetItem),
    private readonly getItemsUsecase = inject(GetItems),
    private readonly deleteItemUsecase = inject(DeleteItem),
  ) {}

  public async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, imageBase64, parentId, parentType, quantity } = req.body;
      const userId = req["userId"] as string;

      const command = CreateItemCommand.create({
        userId,
        name,
        description,
        imageBase64,
        parentId,
        parentType,
        quantity,
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

  public async getPaginated(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 50, skip = 0 } = req.query;
      const userId = req["userId"] as string;

      const command = GetItemsCommand.create({
        userId,
        limit: Number(limit),
        skip: Number(skip),
      });

      const result = await this.getItemsUsecase.execute(command);

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
