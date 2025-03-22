// @ts-types="npm:@types/express"
import express from "express";
import { WeaviateV2ItemsRepository } from "@/adapters/index";
import ItemsController from "./controller.ts";

const app = express();
const port = 8000;

function bootstrap() {
  app.use(express.json());

  const itemsRepository = new WeaviateV2ItemsRepository();
  const itemsController = new ItemsController(itemsRepository);

  app.get("/items", itemsController.findAll);
  app.post("/items", itemsController.create);

  // app.get("/items/:id", (req, res) => {
  //   res.send(`Hello World with id ${req.params.id}!`);
  // });

}

bootstrap();

app.listen(port, (error) => {
  if (error) {
    return console.error(`Error listening: ${error}`);
  }
});

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
