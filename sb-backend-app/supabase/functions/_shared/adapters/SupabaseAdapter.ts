import { SupabaseService } from "../services/index.ts";
import { DomainCdnService } from "../interfaces/index.ts";
import { inject, injectable } from "@needle-di/core";

@injectable()
export class SupabaseAdapter implements DomainCdnService {
  private readonly bucketName = "domains";
  
  constructor(
    private readonly supabaseService: SupabaseService = inject(SupabaseService),
  ) {
  }

  public async uploadImage(
    domainId: string,
    imageId: string,
    imageBase64: string,
  ): Promise<{ imageUrl: string }> {
    this.supabaseService.ensureFileBase64UploadToBucket(
      {
        bucketName: this.bucketName,
        fileBase64: imageBase64,
        filePath: this.formFilePath(domainId, imageId),
        contentType: "image/png",
        bucketOptions: {
          public: true,
          allowedMimeTypes: ["image/png"],
          fileSizeLimit: "20mb",
        },
      },
    );

    const { imageUrl } = await this.getImageUrl(domainId, imageId)!;

    return { imageUrl: imageUrl! };
  }

  public async getImageUrl(
    domainId: string,
    imageId: string,
  ): Promise<{ imageUrl?: string }> {
    const imageUrl = this.supabaseService.getFilePublicUrl(
      this.bucketName,
      this.formFilePath(domainId, imageId),
    );

    return { imageUrl };
  }

  private formFilePath(domainId: string, imageId: string): string {
    return `${domainId}/${imageId}.png`;
  }
}
