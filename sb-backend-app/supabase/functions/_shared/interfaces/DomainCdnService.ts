export interface DomainCdnService {
  uploadImage(
    domainId: string,
    imageId: string,
    imageBase64: string,
  ): Promise<{ imageUrl: string }>;

  getImageUrl(
    domainId: string,
    imageId: string,
  ): { imageUrl?: string };
  
  getPublicUrl(path: string): string;
  
  deleteFile(fileUrl: string): Promise<void>;
}
