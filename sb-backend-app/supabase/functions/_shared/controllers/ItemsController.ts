import { NextFunction, Request, Response } from "express";
import { CreateItem } from "../usecases/index.ts";
import { CreateItemCommand } from "../usecases/index.ts";
import { CreateItemRequestDto } from "../dtos/CreateItemRequestDto.ts";
import { handleError } from "./errorHandler.ts";
import { inject, injectable } from "@needle-di/core";

@injectable()
export class ItemsController {
  constructor(
    private readonly createItemUsecase = inject(CreateItem),
  ) {}

  public async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, imageBase64 } = req.body as CreateItemRequestDto;
      const userId = req["userId"] as string;

      const command = CreateItemCommand.create({
        userId,
        name,
        description,
        imageBase64,
      });

      const result = await this.createItemUsecase.execute(command);

      res.status(201).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }
}
