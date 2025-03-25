import { ItemsRepository } from "@/app/interfaces/index.ts";
import { NextFunction, Request, Response } from "express";

export default class ItemsController {
  constructor(private readonly itemsRepository: ItemsRepository) {}

  public async create(req: Request, res: Response, _next: NextFunction) {
    try {
      const { name, description } = req.body;
      if (!name || typeof name !== "string") {
        console.log(`Attempted to create item with invalid name: ${name}`);
        res.status(400).send("Name of type string is required");

        return;
      }
      if (!description && typeof name !== "string") {
        console.log(
          `Attempted to create item with invalid description: ${description}`,
        );
        res.status(400).send("Description of type string is required");

        return;
      }

      const newItem = await this.itemsRepository.create({
        name: name as string,
        description: description as string,
      });
      console.log(`Created new item with ID: ${newItem.ID}`);

      res.json(newItem);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).send("Internal server error");
    }
  }

  public async findAll(_req: Request, res: Response, _next: NextFunction) {
    try {
      const items = await this.itemsRepository.findAll();
      console.log(`Found ${items.length} items`);

      res.json(items);
    } catch (error) {
      console.error("Error finding item by ID:", error);
      res.status(500).send("Internal server error");
    }
  }

  public async findById(req: Request, res: Response, _next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        console.log(`Attempted to find item with invalid ID: ${id}`);
        res.status(400).send("ID of type string is required");

        return;
      }

      const item = await this.itemsRepository.findByID(id as string);
      if (!item) {
        console.log(`Item with ID ${id} not found`);
        res.status(404).send("Item not found");

        return;
      }

      console.log(`Found item with ID ${id}`);

      res.json(item);
    } catch (error) {
      console.error("Error finding item by ID:", error);
      res.status(500).send("Internal server error");
    }
  }

  public async delete(req: Request, res: Response, _next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        console.log(`Attempted to delete item with invalid ID: ${id}`);
        res.status(400).send("ID of type string is required");

        return;
      }

      const item = await this.itemsRepository.findByID(id as string);
      if (!item) {
        console.log(`Item with ID ${id} not found`);
        res.status(404).send("Item not found");

        return;
      }

      await this.itemsRepository.delete(item);
      console.log(`Deleted item with ID ${id}`);

      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting item:`, error);
      res.status(500).send("Internal server error");
    }
  }
}
