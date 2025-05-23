import { SupabaseService } from "../services/index.ts";
import { DomainCdnService } from "../interfaces/index.ts";
import { inject, injectable } from "@needle-di/core";

// @injectable()
export class SupabaseAdapter implements DomainCdnService {
  private readonly config = {
    imageBucketName: "domain-images",
    imageContentType: "image/png",
    imageSizeLimit: "20mb",
    imageAllowedMimeTypes: ["image/*"],
    imageExtension: "png",
  };

  constructor(
    private readonly supabaseService: SupabaseService = inject(SupabaseService),
  ) {
  }

  public async uploadImage(
    domainId: string,
    imageId: string,
    imageBase64: string,
  ): Promise<{ imageUrl: string }> {
    const uploadResult = await this.supabaseService
      .ensureFileBase64UploadToBucket(
        {
          bucketName: this.config.imageBucketName,
          fileBase64: imageBase64,
          filePath: this.formFilePath(domainId, imageId),
          contentType: this.config.imageContentType,
          bucketOptions: {
            public: true,
            allowedMimeTypes: this.config.imageAllowedMimeTypes,
            fileSizeLimit: this.config.imageSizeLimit,
          },
        },
      );

    if (uploadResult.error) {
      console.error("Error uploading image to CDN", uploadResult.error.message);
      throw new Error(
        `Error uploading image to CDN: ${uploadResult.error.message}`,
      );
    }

    const { imageUrl } = this.getImageUrl(domainId, imageId)!;

    return { imageUrl: imageUrl! };
  }

  public getImageUrl(
    domainId: string,
    imageId: string,
  ): { imageUrl?: string } {
    if (!imageId) {
      return { imageUrl: undefined };
    }

    const imageUrl = this.supabaseService.getFilePublicUrl(
      this.config.imageBucketName,
      this.formFilePath(domainId, imageId),
    );

    return { imageUrl };
  }

  public getPublicUrl(path: string): string {
    const bucketName = path.split('/')[0];
    const filePath = path.split('/').slice(1).join('/');
    
    return this.supabaseService.getFilePublicUrl(bucketName, filePath);
  }

  public async deleteFile(fileUrl: string): Promise<void> {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
  
  
    if (pathParts.length < 6 || pathParts[2] !== 'object') {
      throw new Error(`Invalid Supabase file URL format: ${fileUrl}`);
    }
  
    const bucketName = pathParts[4];
    const filePath = pathParts.slice(5).join('/');
  
    await this.supabaseService.deleteFile(bucketName, filePath);
  }

  private formFilePath(domainId: string, imageId: string): string {
    return `${domainId}/${imageId}.${this.config.imageExtension}`;
  }
}
