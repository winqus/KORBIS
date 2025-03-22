// @ts-types="npm:weaviate-ts-client"
import weaviate, {
  ApiKey,
  ConnectionParams,
  WeaviateClient,
} from "npm:weaviate-ts-client@2.2.0";

interface CreateWeaviateClientV2Params {
  scheme: string; // e.g. "http", "https"
  host: string; // e.g. `localhost:8080`, `weaviate.mydomain.com`
  apiKey: string;
}

export function createWeaviateClientV2(
  params: CreateWeaviateClientV2Params,
): WeaviateClient {
  const { scheme, host, apiKey } = params;

  // @ts-ignore: client does not exist on type (it will be available at runtime)
  const client: WeaviateClient = weaviate.client(
    {
      scheme: scheme ?? "http",
      host: host ?? "localhost:8080",
      apiKey: new ApiKey(apiKey ?? ""),
    } satisfies ConnectionParams,
  );

  return client;
}
