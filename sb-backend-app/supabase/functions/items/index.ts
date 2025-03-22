// @ts-types="npm:@types/express"
import express from "express";
import { WeaviateV2ItemsRepository } from "@/adapters/index.ts";
import ItemsController from "./controller.ts";
import { throwIfMissing } from "@/utils.ts";
import { createWeaviateClientV2 } from "@/drivers/index.ts";

const port = 8000;

throwIfMissing("env variables", Deno.env.toObject(), [
  "WEAVIATE_SCHEME",
  "WEAVIATE_ENDPOINT",
  "WEAVIATE_API_KEY",
]);

function bootstrap({ port }: { port: number }) {
  const app = express();
  app.use(express.json());

  const weaviateClient = createWeaviateClientV2({
    scheme: Deno.env.get("WEAVIATE_SCHEME") ?? "http",
    host: Deno.env.get("WEAVIATE_ENDPOINT") ?? "localhost:8080",
    apiKey: Deno.env.get("WEAVIATE_API_KEY") ?? "",
  });
  const itemsRepository = new WeaviateV2ItemsRepository(weaviateClient);
  const itemsController = new ItemsController(itemsRepository);

  app.get("/items", itemsController.findAll);
  app.post("/items", itemsController.create);

  // app.get("/items/:id", (req, res) => {
  //   res.send(`Hello World with id ${req.params.id}!`);
  // });

  app.listen(port, (error) => {
    if (error) {
      return console.error(`Error listening: ${error}`);
    }
  });
}

bootstrap({ port });

// Deno.serve(async (req) => {
//   const { name } = await req.json();
//   const data = {
//     message: `Hello ${name}!`,
//   };

//   return new Response(
//     JSON.stringify(data),
//     { headers: { "Content-Type": "application/json" } },
//   );
// });

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/items' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
