import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Container, inject } from "@needle-di/core";
// @ts-types="npm:@types/express"
import express from "express";
import { WeaviateV2ContainersRepository } from "@/repositories/index.ts";
import { throwIfMissing } from "@/utils.ts";
import { createWeaviateClientV2 } from "@/drivers/index.ts";
import { DenoEnvConfigService, SupabaseAdapter } from "@/adapters/index.ts";
import { createClient } from "@supabase/supabase-js";

import { isLocalEnv } from "@/utils.ts";
import { ContainersController } from "@/controllers/ContainersController.ts";
import {
  CONFIG_SERVICE,
  CONTAINERS_REPOSITORY,
  DOMAIN_CDN_SERVICE,
  JWT,
  SUPABASE_ADMIN,
  SUPABASE_CURRENT_USER,
  WEAVIATE_CLIENT,
} from "@/injection-tokens.ts";

throwIfMissing("env variables", Deno.env.toObject(), [
  "WEAVIATE_SCHEME",
  "WEAVIATE_ENDPOINT",
  "WEAVIATE_API_KEY",
]);

const port = 8000;
const container = new Container();

container.bindAll(
  {
    provide: CONFIG_SERVICE,
    useClass: DenoEnvConfigService,
  },
  {
    provide: SUPABASE_ADMIN,
    useFactory: () => {
      const configService = inject(CONFIG_SERVICE);
      return createClient(
        configService.getOrThrow("SUPABASE_URL"),
        configService.getOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
      );
    },
  },
  {
    provide: WEAVIATE_CLIENT,
    useFactory: () => {
      const configService = inject(CONFIG_SERVICE);
      return createWeaviateClientV2({
        scheme: configService.getOrThrow("WEAVIATE_SCHEME"),
        host: configService.getOrThrow("WEAVIATE_ENDPOINT"),
        apiKey: configService.getOrThrow("WEAVIATE_API_KEY"),
      });
    },
  },
  {
    provide: CONTAINERS_REPOSITORY,
    useClass: WeaviateV2ContainersRepository,
  },
  {
    provide: DOMAIN_CDN_SERVICE,
    useClass: SupabaseAdapter,
  },
);

const containersController = container.get(ContainersController);

const app = express();
app.use(express.json({ limit: "20mb" }));

app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const authToken = req.get("Authorization")!;
    const jwt = authToken.replace("Bearer ", "");

    if (isLocalEnv()) {
      console.log("[DEV] User JWT token:", jwt);
    } else {
      console.log("User JWT:", jwt.slice(0, 10), "...");
    }

    container.bind({
      provide: JWT,
      useValue: jwt,
    });

    container.bind({
      provide: SUPABASE_CURRENT_USER,
      useFactory: () => {
        const configService = inject(CONFIG_SERVICE);
        const jwt = inject(JWT);

        return createClient(
          configService.getOrThrow("SUPABASE_URL"),
          configService.getOrThrow("SUPABASE_ANON_KEY"),
          { global: { headers: { Authorization: jwt } } },
        );
      },
    });

    // TODO: refactor
    const user = await container.get(SUPABASE_ADMIN).auth.getUser(jwt);
    console.log("User:", user.data.user);
    let userId = user.data.user?.id;
    if (!userId && isLocalEnv()) {
      console.log("[DEV] No userId found in JWT, using a test userId");
      userId = "5f19c1e9-02e9-46f8-bb65-49a74e1db21a"; // TODO: remove this line
    }
    (req as any).userId = userId;
    console.log("UserId:", userId);

    if (!userId) {
      console.error("No userId found in JWT");
      res.status(401).send("Not authorized");
    }
  } else {
    console.error("No JWT Token provided");
    res.status(401).send("No JWT Token provided");
  }

  next();
});

/* NEW */
app.post("/containers", containersController.create.bind(containersController));

// app.post("/items", itemsControllerOld.create.bind(itemsControllerOld));
// app.get("/items", itemsControllerOld.findAll.bind(itemsControllerOld));
// app.get("/items/:id", itemsControllerOld.findById.bind(itemsControllerOld));
// app.delete("/items/:id", itemsControllerOld.delete.bind(itemsControllerOld));
// app.post("/items/search", itemsControllerOld.search.bind(itemsControllerOld));

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
