import { ItemsRepository } from "@/app/interfaces/index.ts";
import { Request, Response, NextFunction } from "express";

export default class ItemsController {
  constructor(items: ItemsRepository) {}

  public async create(req: Request, res: Response, next: NextFunction) {
    throw new Error("Method not implemented.");
    // const { name } = req.body;
    
    // res.send(`Hello ${name}!`);
  }

  public async findAll(req: Request, res: Response, next: NextFunction) {
    throw new Error("Method not implemented.");
    // res.send("Hello World!");
  }
}
