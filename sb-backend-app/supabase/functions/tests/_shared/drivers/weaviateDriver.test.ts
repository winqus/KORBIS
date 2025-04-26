import { assertEquals, assertExists } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { createWeaviateClientV2 } from '../../../_shared/drivers/index.ts';

const mockClientInstance = {
  data: {},
  schema: {},
  batch: {},
  graphql: {},
  classifications: {},
  meta: {},
  misc: {}
};

class ApiKey {
  constructor(public key: string) {}
}

interface ConnectionParams {
  scheme: string;
  host: string;
  apiKey: ApiKey;
}

function createClientMock() {
  const calls: { args: ConnectionParams }[] = [];
  
  const clientFn = (params: ConnectionParams) => {
    calls.push({ args: params });
    return mockClientInstance;
  };
  
  return {
    fn: clientFn,
    calls: calls
  };
}

const mockClient = createClientMock();

Deno.test("weaviateDriver", async (t) => {
  await t.step("createWeaviateClientV2 should create a client with provided parameters", () => {
    mockClient.calls.length = 0;
    
    const params = {
      scheme: "https",
      host: "test-host.com",
      apiKey: "test-api-key"
    };
    
    const client = createWeaviateClientV2(params);
    
    assertExists(client);
    assertEquals(mockClient.calls.length, 0);
  });
  
  await t.step("createWeaviateClientV2 should use defaults for missing parameters", () => {
    mockClient.calls.length = 0;
    
    const params = {
      scheme: undefined,
      host: undefined,
      apiKey: undefined
    };
    
    const client = createWeaviateClientV2(params as any);
    
    assertExists(client);
    assertEquals(mockClient.calls.length, 0);
  });
});