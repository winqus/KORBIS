import { NextFunction, Request, Response } from "express";
import { GetAssetsOfParent } from "../usecases/GetAssetsOfParent/GetAssetsOfParentUsecase.ts";
import { GetAssetsOfParentCommand } from "../usecases/GetAssetsOfParent/GetAssetsOfParentCommand.ts";
import { handleError } from "./errorHandler.ts";
import { inject, injectable } from "jsr:@needle-di/core@0.12.0";

@injectable()
export class AssetsController {
  constructor(
    private readonly getAssetsOfParentUsecase = inject(GetAssetsOfParent),
  ) {}

  public async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { parentId, parentType, skip, limit } = req.query;
      const userId = req["userId"] as string;

      const command = GetAssetsOfParentCommand.create({
        userId,
        parentId: typeof parentId === 'string' ? parentId : undefined,
        parentType: typeof parentType === 'string' ? parentType : (undefined as any),
        skip: typeof skip === 'string' ? parseInt(skip) : undefined,
        limit: typeof limit === 'string' ? parseInt(limit) : undefined,
      });

      const result = await this.getAssetsOfParentUsecase.execute(command);

      res.status(200).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }
}
