// @ts-types="npm:@types/express"
import express from "express";
import { WeaviateV2ItemsRepository } from "@/repositories/index.ts";
import ItemsControllerOld from "./controller.ts";
import { throwIfMissing } from "@/utils.ts";
import { createWeaviateClientV2 } from "@/drivers/index.ts";
import { DenoEnvConfigService } from "../_shared/adapters/index.ts";
import { ItemsController } from "../_shared/controllers/index.ts";
import { CreateItem } from "@/usecases/index.ts";
import { SupabaseAdapter } from "@/adapters/index.ts";
import { SupabaseService } from "@/services/index.ts";
import { createClient } from "@supabase/supabase-js";
import { BadRequestError } from "@/errors/index.ts";

const port = 8000;

throwIfMissing("env variables", Deno.env.toObject(), [
  "WEAVIATE_SCHEME",
  "WEAVIATE_ENDPOINT",
  "WEAVIATE_API_KEY",
]);

const configService = new DenoEnvConfigService();

const supabaseAdminClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);


const supabase = new SupabaseService(supabaseAdminClient, configService);

const supabaseAdapter = new SupabaseAdapter(supabase);

const weaviateClient = createWeaviateClientV2({
  scheme: configService.get("WEAVIATE_SCHEME") ?? "http",
  host: configService.get("WEAVIATE_ENDPOINT") ?? "localhost:8080",
  apiKey: configService.get("WEAVIATE_API_KEY") ?? "",
});

// const supabaseCurrentUserClient = createClient(
//   Deno.env.get("SUPABASE_URL")!,
//   Deno.env.get("SUPABASE_ANON_KEY")!,
//   { global: { headers: { Authorization: authToken } } },
// );


const itemsRepository = new WeaviateV2ItemsRepository(weaviateClient);

const createItemUsecase = new CreateItem(itemsRepository, supabaseAdapter);
const itemsController = new ItemsController(createItemUsecase);
const itemsControllerOld = new ItemsControllerOld(itemsRepository);

const app = express();
app.use(express.json({ limit: "20mb" }));

app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    console.log("JWT Token:", token);
  } else {
    console.log("No JWT Token provided");
  }
  next();
});

/* NEW */
app.post("/items", itemsController.create.bind(itemsController));

/* OLD */
app.post("/items", itemsControllerOld.create.bind(itemsControllerOld));
app.get("/items", itemsControllerOld.findAll.bind(itemsControllerOld));
app.get("/items/:id", itemsControllerOld.findById.bind(itemsControllerOld));
app.delete("/items/:id", itemsControllerOld.delete.bind(itemsControllerOld));
app.post("/items/search", itemsControllerOld.search.bind(itemsControllerOld));

app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof BadRequestError) {
    return res.status(400).json({
      error: "Bad Request",
      details: err.message
    });
  }
  
  // Handle other error types or default error response
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, (error) => {
  if (error) {
    return console.error(`Error listening: ${error}`);
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/items' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"SomeNewItemName", "description":"SomeNewItemDescription"}'
*/
