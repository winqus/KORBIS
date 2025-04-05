import * as postgres from "postgres";
import { StorageError } from "@supabase/storage-js";
import { ConfigService } from "../interfaces/index.ts";
import { base64StringToArrayBuffer, correctLocalPublicUrl } from "../utils.ts";
import { isLocalEnv } from "../utils.ts";
import { inject, injectable } from "@needle-di/core";
import {
  CONFIG_SERVICE,
  SUPABASE_ADMIN,
  SUPABASE_CURRENT_USER,
} from "../injection-tokens.ts";

@injectable()
export class SupabaseService {
  constructor(
    private readonly adminClient = inject(SUPABASE_ADMIN, {
      lazy: true,
    }),
    private readonly client = inject(SUPABASE_CURRENT_USER, {
      lazy: true,
    }),
    private readonly config: ConfigService = inject(CONFIG_SERVICE),
  ) {
  }

  public async uploadFileAsAdmin(
    bucketName: string,
    fileBuffer: ArrayBuffer,
    filePath: string,
    contentType: string,
  ) {
    const uploadFile = this.createAdminFileUploader(
      bucketName,
      fileBuffer,
      filePath,
      contentType,
    );

    return await uploadFile();
  }

  /**
   * Creates a function to upload a file to storage
   * @param bucketName Storage bucket name
   * @param fileBuffer File data as Buffer
   * @param filePath Destination path in storage
   * @param client Supabase client instance
   * @param contentType Optional content type.
   * Example: "application/json", "image/png", "image/jpeg", "text/plain", "application/pdf", "application/zip", etc.
   * @returns Async function that performs the upload
   */
  public createAdminFileUploader(
    bucketName: string,
    fileBuffer: ArrayBuffer,
    filePath: string,
    contentType: string,
  ) {
    const client = this.adminClient();
    const storageFileApi = client.storage.from(bucketName);

    const uploadFile = async () => {
      const uploadResult = await storageFileApi.upload(filePath, fileBuffer, {
        contentType,
      });

      return {
        data: uploadResult.data,
        /* StorageFileApi.upload is confused with return properties, error is returned instead of uploadError for some reason */
        error: uploadResult.uploadError ??
          (uploadResult as { error?: StorageError }).error,
      };
    };

    return uploadFile;
  }

  /**
   * Gets the CDN URL for a public file in storage
   * @param bucketName Storage bucket name
   * @param filePath Path to the file in storage
   * @param client Supabase client instance
   * @returns The public CDN URL of the file
   */
  getFilePublicUrl(
    bucketName: string,
    filePath: string,
  ): string {
    const storageFileApi = this.client()
      .storage
      .from(bucketName);

    const url = storageFileApi.getPublicUrl(filePath).data.publicUrl;

    if (isLocalEnv()) {
      return correctLocalPublicUrl(url);
    }

    return url;
  }

  public ensureFileBase64UploadToBucket(options: {
    bucketName: string;
    fileBase64: string;
    filePath: string;
    contentType: string;
    bucketOptions: {
      public?: boolean;
      allowedMimeTypes?: string[];
      fileSizeLimit?: string;
    };
  }) {
    const fileBuffer = base64StringToArrayBuffer(options.fileBase64);

    return this.ensureFileUploadToBucket({
      ...options,
      fileBuffer,
    });
  }

  /**
   * Ensures a file is uploaded to a bucket, creating the bucket if it doesn't exist.
   * @param bucketName Storage bucket name
   * @param fileBuffer File data as Buffer
   * @param filePath Destination path in storage
   * @param client Supabase client instance
   * @param contentType Optional content type
   * @param bucketOptions Options for creating the bucket
   * @param bucketOptions.public Whether the bucket is public (default: true)
   * @param bucketOptions.allowedMimeTypes Allowed MIME types for the bucket (default: all types, example: ["image/*"])
   * @param bucketOptions.fileSizeLimit File size limit for the bucket (default: unlimited, example: "20MB")
   * @returns Object containing upload data or error
   */
  public async ensureFileUploadToBucket(options: {
    bucketName: string;
    fileBuffer: ArrayBuffer;
    filePath: string;
    contentType: string;
    bucketOptions: {
      public?: boolean;
      allowedMimeTypes?: string[];
      fileSizeLimit?: string;
    };
  }) {
    const {
      bucketName,
      fileBuffer,
      filePath,
      contentType,
      bucketOptions,
    } = options;

    const uploadFile = this.createAdminFileUploader(
      bucketName,
      fileBuffer,
      filePath,
      contentType,
    );

    const { data: uploadData, error: uploadError } = await uploadFile();

    if (uploadData || !(uploadError?.message.includes("Bucket not found"))) {
      return { data: uploadData, error: uploadError };
    }

    /* If bucket not found, create it */
    try {
      const { error: createBucketError } = await this.adminClient().storage
        .createBucket(
          bucketName,
          {
            public: bucketOptions.public ?? true,
            allowedMimeTypes: bucketOptions.allowedMimeTypes ?? null,
            fileSizeLimit: bucketOptions.fileSizeLimit ?? null,
          },
        );

      if (createBucketError) {
        console.error(
          `Failed to create bucket ${bucketName}: ${createBucketError.message}`,
        );
        return { data: null, error: createBucketError };
      }

      const { data: reuploadData, error: reuploadError } = await uploadFile();
      return { data: reuploadData, error: reuploadError };
    } catch (error) {
      return {
        data: null,
        error: {
          message: `Failed to create bucket and upload file: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      };
    }
  }

  public async deleteBucket(bucketName: string): Promise<void> {
    const admin = this.adminClient();
    const { error } = await admin.storage.deleteBucket(bucketName);

    if (error) {
      console.error(
        `Failed to delete bucket "${bucketName}": ${error.message}`,
      );
      throw new Error(`Failed to delete bucket: ${error.message}`);
    }

    console.log(`Deleted bucket "${bucketName}"`);
  }

  public createUserFolderPolicy(bucketName: string): Promise<any> {
    const policyName = `Allow upload to ${bucketName} bucket personal folder`
      .slice(0, 50);

    const policyCreationQuery = `
      CREATE POLICY "${policyName}"
      ON storage.objects
      FOR INSERT
      TO public
      WITH CHECK (
        (bucket_id = '${bucketName}') AND
        ((SELECT auth.uid()::text) = (storage.foldername(name))[1])
      );
    `;

    return this.executeQuery(policyCreationQuery);
  }

  protected async executeQuery(query: string): Promise<any> {
    const pool = new postgres.Pool(
      this.config.getOrThrow("SUPABASE_DB_URL"),
      1,
      true,
    );
    const connection = await pool.connect();

    try {
      const result = await connection.queryArray(query);
      console.log("Query execution result:", result);
      return result;
    } catch (error: any) {
      console.error(`Failed to execute query: ${error.message}`);
      throw new Error(`Failed to execute query: ${error.message}`);
    } finally {
      connection.release();
    }
  }
}
