import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-types="npm:@types/express"
import _express from "express";
import { ASSETS_REPOSITORY } from "@/injection-tokens.ts";
import { AssetsController } from "@/controllers/index.ts";
import { WeaviateV2AssetsRepository } from "@/repositories/index.ts";
import { bootstrap } from "@/bootstrap.ts";

const port = 8000; /* Default port for Supabase functions */

const { app } = bootstrap({
  requiredEnvVars: [
    "WEAVIATE_SCHEME",
    "WEAVIATE_ENDPOINT",
    "WEAVIATE_API_KEY",
  ],
  repositories: [
    {
      token: ASSETS_REPOSITORY,
      repository: WeaviateV2AssetsRepository,
    },
  ],
  controllers: [
    {
      instance: AssetsController,
      routes: [
        { method: "get", path: "/assets", handler: "get" },
      ],
    },
  ],
  extraBindings: [],
});

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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/assets' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
