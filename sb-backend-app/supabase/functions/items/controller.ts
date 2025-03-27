import { ItemsRepository } from "@/app/interfaces/index.ts";
import { NextFunction, Request, Response } from "express";
import { createClient } from "jsr:@supabase/supabase-js";
import { decode as decodeBase64 } from "npm:base64-arraybuffer";

type CreateItemDTO = {
  name: string;
  description?: string;
  imageBase64?: string;
}

export default class ItemsController {
  constructor(private readonly itemsRepository: ItemsRepository) {}

  public async create(req: Request, res: Response, _next: NextFunction) {
    try {
      const { name, description, imageBase64 } = req.body as CreateItemDTO;
      if (!name || typeof name !== "string") {
        console.log(`Attempted to create item with invalid name: ${name}`);
        res.status(400).send("Name of type string is required");

        return;
      }
      if (description && typeof description !== "string") {
        console.log(
          `Attempted to create item with invalid description: ${description}`,
        );
        res.status(400).send("Description of type string is required");

        return;
      }
      if (imageBase64 && typeof imageBase64 !== "string") {
        console.log(
          `Attempted to create item with no image`,
        );
        res.status(400).send("Image of type string is required");

        return;
      }
      if (
        // TODO: refactor
        // imageBase64 && !/^data:image\/(png|jpeg|jpg);base64,/.test(imageBase64)
        imageBase64 && !/^\//.test(imageBase64)
      ) {
        console.log(
          `Invalid Base64 image format: ${imageBase64.substring(0, 30)}...`,
        );
        res.status(400).send("Invalid image format. Expected Base64 string.");
        return;
      }

      // TODO: Refactor to ItemsService::createItem
      const newItem = await this.itemsRepository.create({
        name: name as string,
        description: description as string,
        imageBase64: imageBase64 as string,
      });
      // TODO: Refactor to ItemsImageRepository::saveImage
      console.log(`Created new item with ID: ${newItem.ID}`);
      if (imageBase64) {
        const supabaseAdminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
        );

        let userID = null;
        const { data: { user }, error: error1 } = await supabaseClient.auth.getUser();
        /* TODO: remove/refactor this block later ***********************************/
        if (error1) {
          console.error("error1", error1.message);
        }
        if (user) {
          console.log("Successfully authenticated user with ANON key, userId:", user.id);
        } else {
          const jwt = req.get("Authorization")!.replace('Bearer ', '');
          console.log("Request JWT token:", jwt.slice(0, 30) + "...");
          const { data: { user }, error: error2 } = await supabaseAdminClient.auth.getUser(jwt);
          if (error2) {
            console.error("error2", error2.message);
          }
          if (user) {
            console.log("Successfully authenticated user with JWT token, userId:", user.id);
            userID = user.id;
          } else {
            console.log("Failed to authenticate user with JWT token");
          }
        }
        /******************************************************************************** */
        userID = user?.id ?? (Deno.env.get("ENVIRONMENT") === "development" ? "supabase-demo" : null);
        console.log(`Current user ID: ${userID}`); // TODO: remove this line
        if (!userID) {
          throw new Error("User not found for image upload");
        }
        const bucketName = "public-bucket";
        const filePath = `images/${userID}/${newItem.ID}.png`;
        const imageBuffer = decodeBase64(imageBase64);
        const storageFileApi = supabaseAdminClient
          .storage
          .from(bucketName);

        const { error } = await storageFileApi.upload(filePath, imageBuffer, {
          contentType: "image/png",
        });
        if (error) {
          if (error.message.includes("Bucket not found")) {
            const { error: bucketError } = await supabaseAdminClient.storage
              .createBucket(bucketName, {
                public: true,
              });
            if (bucketError) {
              console.error(
                `Failed to create bucket ${bucketName}: ${bucketError.message}`,
              );
              throw new Error("Failed to create bucket");
            }
            console.log(`Created bucket ${bucketName}`);
            const { error: secondUploadError } = await storageFileApi.upload(
              filePath,
              imageBuffer,
              {
                contentType: "image/png",
              },
            );
            if (secondUploadError) {
              console.error(
                `Failed to upload image to Supabase: ${secondUploadError.message}`,
              );
              throw new Error("Failed to upload image to Supabase again");
            }
            console.log(`Uploaded image to S3 at ${filePath}`);
          } else {
            console.error(
              `Failed to upload image to Supabase: ${error.message}`,
            );
            throw new Error("Failed to upload image to Supabase");
          }
        } else {
          console.log(`Uploaded image to S3 at ${filePath}`);
        }
      }

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
