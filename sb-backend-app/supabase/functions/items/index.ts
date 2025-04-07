// @ts-types="npm:@types/express"
import express from "express";
import {
  WeaviateV2ContainersRepository,
  WeaviateV2ItemsRepository,
} from "@/repositories/index.ts";
import ItemsControllerOld from "./controller.ts";
import { ItemsController } from "@/controllers/index.ts";
import { bootstrap } from "@/bootstrap.ts";
import { CONTAINERS_REPOSITORY, ITEMS_REPOSITORY } from "@/injection-tokens.ts";

const port = 8000; // Default port for Supabase functions

const { container, app } = bootstrap({
  requiredEnvVars: [
    "WEAVIATE_SCHEME",
    "WEAVIATE_ENDPOINT",
    "WEAVIATE_API_KEY",
  ],
  repositories: [
    { token: ITEMS_REPOSITORY, repository: WeaviateV2ItemsRepository },
    {
      token: CONTAINERS_REPOSITORY,
      repository: WeaviateV2ContainersRepository,
    },
  ],
  controllers: [],
  extraBindings: [],
});

const itemsController = container.get(ItemsController);
const itemsControllerOld = new ItemsControllerOld(
  container.get(ITEMS_REPOSITORY),
);

/* NEW */
app.post("/items", itemsController.create.bind(itemsController));
app.get("/items/:id", itemsController.get.bind(itemsController));
app.delete("/items/:id", itemsController.delete.bind(itemsController));
app.get("/items", itemsController.getPaginated.bind(itemsController));

/* OLD */
app.post("/items/search", itemsControllerOld.search.bind(itemsControllerOld));

// Start the server
app.listen(port, (error: any) => {
  if (error) {
    return console.error(`Error listening: ${error}`);
  }
  console.log(`Server started on port ${port}`);
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/items' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"SomeNewItemName", "description":"SomeNewItemDescription"}'
*/
