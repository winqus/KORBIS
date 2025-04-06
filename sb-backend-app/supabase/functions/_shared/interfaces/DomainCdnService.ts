export interface DomainCdnService {
  uploadImage(
    domainId: string,
    imageId: string,
    imageBase64: string,
  ): Promise<{ imageUrl: string }>;

  getImageUrl(
    domainId: string,
    imageId: string,
  ): Promise<{ imageUrl?: string }>;
}
