import { ItemsRepository } from "@/interfaces/index.ts";
import { NextFunction, Request, Response } from "express";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { decode as decodeBase64 } from "npm:base64-arraybuffer";
import { StorageError } from "npm:@supabase/storage-js@2.7.1";
import * as postgres from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { Item } from "@/entities/index.ts";

type CreateItemDTO = {
  name: string;
  description?: string;
  imageBase64?: string;
};

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
        imageBase64 && !/^\//.test(imageBase64)
      ) {
        console.log(
          `Invalid Base64 image format: ${imageBase64.substring(0, 30)}...`,
        );
        res.status(400).send("Invalid image format. Expected Base64 string.");
        return;
      }

      const newItem = await this.itemsRepository.createWithImage(
        {
          name: name as string,
          description: description as string,
        },
        imageBase64,
      );

      console.log(`Created new item with ID: ${newItem.id}`);

      if (imageBase64 && newItem.imageId) {
        const authToken = req.get("Authorization")!;
        const jwt = authToken.replace("Bearer ", "");

        console.log("Request JWT token:", jwt.slice(0, 30) + "...");

        const supabaseCurrentUserClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authToken } } },
        );

        await this.saveImage(newItem, imageBase64, supabaseCurrentUserClient);
      } else {
        console.log("No image provided, skipping upload to Supabase Bucket");
      }

      res.status(201).json(newItem);
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

      const item = await this.itemsRepository.findById(id as string);
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

      const item = await this.itemsRepository.findById(id as string);
      if (!item) {
        console.log(`Item with ID ${id} not found`);
        res.status(404).send("Item not found");

        return;
      }

      await this.itemsRepository.delete(item.id);
      console.log(`Deleted item with ID ${id}`);

      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting item:`, error);
      res.status(500).send("Internal server error");
    }
  }

  public async search(req: Request, res: Response, _next: NextFunction) {
    try {
      const { queryText, queryImageBase64 } = req.body;
      if (queryText && typeof queryText !== "string") {
        console.log(
          `Attempted to search for item with invalid queryText: ${queryText}`,
        );
        res.status(400).send("Query of type string is required");

        return;
      }
      if (queryImageBase64 && typeof queryImageBase64 !== "string") {
        console.log(
          `Attempted to search for item with invalid queryImageBase64: ${queryImageBase64}`,
        );
        res.status(400).send("Query image of type string is required");

        return;
      }
      if (!queryText && !queryImageBase64) {
        console.log(
          `Attempted to search for item with no queryText or queryImageBase64`,
        );
        res.status(400).send("Query text or image is required");

        return;
      }

      const items = await this.itemsRepository.search({
        queryText: queryText,
        queryImageBase64: queryImageBase64,
      });

      console.log(`Found ${items.length} items`);

      res.json(items);
    } catch (error) {
      console.error("Error searching for items:", error);
      res.status(500).send("Internal server error");
    }
  }

  private async saveImage(
    item: Item,
    imageBase64: string,
    currentUser: SupabaseClient,
  ) {
    const { data: { user }, error: userError } = await currentUser.auth
      .getUser();
    if (userError) {
      console.error("getUserError", userError.message);
    }

    if (!user) {
      console.error("User not found");
      throw new Error("User not found for image upload");
    }

    console.log(`Current user ID: ${user.id}`);

    const bucketName = "user-images";
    const filePath = `${user.id}/${item.imageId}.png`;
    const uploadImage = this.createUserImageUploader(
      bucketName,
      imageBase64,
      filePath,
      currentUser,
    );

    const { data: uploadData, error: uploadError } = await uploadImage();

    if (uploadData) {
      console.log(
        `Uploaded image at ${
          uploadData.fullPath ?? "<uploadData is undefined>"
        }`,
      );

      return;
    }

    if (!(uploadError?.message.includes("Bucket not found"))) {
      console.error(
        `Failed to upload image at ${filePath}: ${uploadError?.message}`,
      );
      throw new Error("Failed to upload image");
    }

    console.log("Bucket not found, creating bucket...");

    await this.createUserImagesBucket(bucketName);

    const { data: reuploadData, error: reuploadError } = await uploadImage();
    if (reuploadError) {
      console.error(
        `Failed to upload image to ${filePath}: ${reuploadError.message}`,
      );
      throw new Error("Failed to upload image");
    }

    console.log(
      `Uploaded image at ${
        reuploadData?.fullPath ?? "<uploadData is undefined>"
      }`,
    );
  }

  private createUserImageUploader(
    bucketName: string,
    imageBase64: string,
    filePath: string,
    userClient: SupabaseClient,
  ) {
    const imageBuffer = decodeBase64(imageBase64);
    const storageFileApi = userClient
      .storage
      .from(bucketName);

    const uploadImage = async () => {
      const uploadResult = await storageFileApi.upload(filePath, imageBuffer, {
        contentType: "image/png",
      });

      return {
        data: uploadResult.data,
        /* StorageFileApi.upload is confused with return properties, error is returned instead of uploadError for some reason */
        error: uploadResult.uploadError ??
          (uploadResult as { error?: StorageError }).error,
      };
    };

    return uploadImage;
  }

  private async createUserImagesBucket(bucketName: string) {
    const supabaseAdminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: bucketData, error: bucketError } = await supabaseAdminClient
      .storage
      .createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ["image/*"],
        fileSizeLimit: "20MB",
      });

    if (bucketError) {
      console.error(
        `Failed to create bucket "${bucketName}": ${bucketError.message}`,
      );
      throw new Error("Failed to create bucket");
    }

    console.log(`Created bucket "${bucketData.name}"`);

    const policyName =
      `Allow upload to user-images bucket personal folder 144gyii_0`;
    const policyCreationQuery = `
        CREATE POLICY "${policyName}"
        ON storage.objects
        FOR INSERT
        TO public
        WITH CHECK (
          (bucket_id = '${bucketData.name}') AND
          ((SELECT auth.uid()::text) = (storage.foldername(name))[1])
        );
      `;

    const pool = new postgres.Pool(Deno.env.get("SUPABASE_DB_URL")!, 1, true);
    const connection = await pool.connect();
    const result = await connection.queryArray(policyCreationQuery).catch(
      async (error) => {
        console.error(
          `Failed to create policy for bucket "${bucketName}": ${error.message}`,
        );

        await supabaseAdminClient.storage.deleteBucket(bucketData.name);
        console.log(
          `Deleted bucket "${bucketData.name}" due to policy creation failure`,
        );

        throw new Error("Failed to create bucket policy");
      },
    );

    console.log("Policy creation result:", result);

    console.log(
      `Created policy "${policyName}" for bucket "${bucketData.name}"`,
    );
  }
}
