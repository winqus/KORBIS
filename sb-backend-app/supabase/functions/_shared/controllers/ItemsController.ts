import { NextFunction, Request, Response } from "express";
import {
  AddFileForItem,
  AddFileForItemCommand,
  CreateItem,
  CreateItemCommand,
  DeleteFileForItem,
  DeleteFileForItemCommand,
  DeleteItem,
  DeleteItemCommand,
  GetItem,
  GetItemCommand,
  GetItemFiles,
  GetItemFilesCommand,
  GetItems,
  GetItemsCommand,
  UpdateItem,
  UpdateItemCommand,
  SearchItems,
  SearchItemsCommand,
} from "../usecases/index.ts";
import { handleError } from "./errorHandler.ts";
import { inject, injectable } from "@needle-di/core";

// @injectable()
export class ItemsController {
  constructor(
    private readonly createItemUsecase = inject(CreateItem),
    private readonly getItemUsecase = inject(GetItem),
    private readonly getItemsUsecase = inject(GetItems),
    private readonly deleteItemUsecase = inject(DeleteItem),
    private readonly addFileForItemUsecase = inject(AddFileForItem),
    private readonly deleteFileForItemUsecase = inject(DeleteFileForItem),
    private readonly getItemFilesUsecase = inject(GetItemFiles),
    private readonly updateItemUsecase = inject(UpdateItem),
    private readonly searchItemsUsecase = inject(SearchItems),
  ) {}

  public async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, imageBase64, parentId, parentType, quantity } =
        req.body;
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
      const { limit = 50, skip = 0, parentId } = req.query;
      const userId = req["userId"] as string;

      const command = GetItemsCommand.create({
        userId,
        limit: Number(limit),
        skip: Number(skip),
        parentId,
      });

      const result = await this.getItemsUsecase.execute(command);

      res.status(200).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, imageBase64, quantity, parentId, parentType } =
        req.body;
      const userId = req["userId"] as string;

      const command = UpdateItemCommand.create({
        userId,
        id,
        name,
        description,
        imageBase64,
        quantity,
        parentId: parentType === "root" ? userId : parentId,
        parentType,
      });

      const result = await this.updateItemUsecase.execute(command);

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

  public async getFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const userId = req["userId"] as string;

      const command = GetItemFilesCommand.create({
        userId,
        itemId,
      });

      const result = await this.getItemFilesUsecase.execute(command);

      res.status(200).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }

  public async addFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId, name, originalName, path, mimeType, size } = req.body;
      const userId = req["userId"] as string;

      const command = AddFileForItemCommand.create({
        userId,
        itemId,
        name,
        originalName,
        path,
        mimeType,
        size,
      });

      const result = await this.addFileForItemUsecase.execute(command);

      res.status(201).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }

  public async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileId, itemId } = req.params;
      const userId = req["userId"] as string;

      const command = DeleteFileForItemCommand.create({
        userId,
        fileId,
        itemId,
      });

      await this.deleteFileForItemUsecase.execute(command);

      res.status(204).send();
    } catch (error) {
      handleError(error, req, res, next);
    }
  }

  public async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { queryText, queryImageBase64 } = req.body;
      const userId = req["userId"] as string;

      const command = SearchItemsCommand.create({
        userId,
        queryText,
        queryImageBase64,
      });

      const result = await this.searchItemsUsecase.execute(command);

      res.status(200).json(result);
    } catch (error) {
      handleError(error, req, res, next);
    }
  }
}
