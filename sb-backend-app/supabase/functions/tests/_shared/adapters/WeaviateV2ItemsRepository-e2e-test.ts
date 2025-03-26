import { assert, assertEquals, assertExists } from "jsr:@std/assert";
import { WeaviateV2ItemsRepository } from "../../../_shared/adapters/WeaviateV2ItemsRepository.ts";
import { createWeaviateClientV2 } from '../../../_shared/drivers/weaviateDriver.ts';

const client = createWeaviateClientV2({
  scheme: "http",
  host: "localhost:8080",
  apiKey: "",
});

const testWeaviateV2ItemsRepositoryCreation = async () => {
  const repo = new WeaviateV2ItemsRepository(client, "TEST-Item");
  assertExists(repo);
};


Deno.test('Creates WeaviateV2ItemsRepository', testWeaviateV2ItemsRepositoryCreation);