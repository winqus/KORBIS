import { ItemsRepository } from "@/app/interfaces/index.ts";
import { NextFunction, Request, Response } from "express";

export default class ItemsController {
  constructor(private readonly itemsRepository: ItemsRepository) {}

  public async create(req: Request, res: Response, _next: NextFunction) {
    const { name, description } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).send("Name of type string is required");
      return;
    }

    if (!description && typeof name !== "string") {
      res.status(400).send("Description of type string is required");
      return;
    }

    const newItem = await this.itemsRepository.create({
      name: name as string,
      description: description as string,
    });

    res.json(newItem);
  }

  public async findAll(_req: Request, res: Response, _next: NextFunction) {
    const items = await this.itemsRepository.findAll();

    res.json(items);
  }
}
