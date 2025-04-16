// deno-lint-ignore-file no-explicit-any
import { Container, inject, Token } from "@needle-di/core";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { isLocalEnv, throwIfMissing } from "./utils.ts";
import { createWeaviateClientV2 } from "./drivers/index.ts";
import { DenoEnvConfigService, SupabaseAdapter } from "./adapters/index.ts";
import {
  CONFIG_SERVICE,
  DOMAIN_CDN_SERVICE,
  JWT,
  SUPABASE_ADMIN,
  SUPABASE_CURRENT_USER,
  WEAVIATE_CLIENT,
} from "./injection-tokens.ts";
import { SupabaseService } from "./services/index.ts";
import {
  AddFileForItem,
  CreateContainer,
  CreateItem,
  DeleteContainer,
  DeleteFileForItem,
  DeleteItem,
  GetAssetsOfParent,
  GetContainer,
  GetContainers,
  GetItem,
  GetItemFiles,
  GetItems,
  UpdateContainer,
  UpdateItem,
} from "./usecases/index.ts";

export interface BootstrapConfig {
  requiredEnvVars: string[];
  repositories: { token: Token<any>; repository: any }[];
  controllers: { instance: any; routes: RouteConfig[] }[];
  port?: number;
  extraBindings?: {
    provide: Token<any>;
    useClass?: any;
    useFactory?: () => any;
    useValue?: any;
  }[];
}

export interface RouteConfig {
  method: "get" | "post" | "put" | "delete";
  path: string;
  handler: string;
}

export function bootstrap(
  config: BootstrapConfig,
): { app: any; container: Container } {
  const { requiredEnvVars, repositories, controllers, port = 8000 } = config;

  throwIfMissing("env variables", Deno.env.toObject(), requiredEnvVars);

  const container = new Container();

  /* Bind common services */
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
      provide: SupabaseService,
      useClass: SupabaseService,
    },
    {
      provide: DOMAIN_CDN_SERVICE,
      useClass: SupabaseAdapter,
    },
    {
      provide: AddFileForItem,
      useClass: AddFileForItem,
    },
    {
      provide: CreateContainer,
      useClass: CreateContainer,
    },
    {
      provide: CreateItem,
      useClass: CreateItem,
    },
    {
      provide: DeleteContainer,
      useClass: DeleteContainer,
    },
    {
      provide: DeleteFileForItem,
      useClass: DeleteFileForItem,
    },
    {
      provide: DeleteItem,
      useClass: DeleteItem,
    },
    {
      provide: GetAssetsOfParent,
      useClass: GetAssetsOfParent,
    },
    {
      provide: GetContainer,
      useClass: GetContainer,
    },
    {
      provide: GetContainers,
      useClass: GetContainers,
    },
    {
      provide: GetItem,
      useClass: GetItem,
    },
    {
      provide: GetItemFiles,
      useClass: GetItemFiles,
    },
    {
      provide: GetItems,
      useClass: GetItems,
    },
    {
      provide: UpdateContainer,
      useClass: UpdateContainer,
    },
    {
      provide: UpdateItem,
      useClass: UpdateItem,
    },
  );

  /* Bind repositories and their dependencies */
  repositories.forEach(({ token, repository }) => {
    container.bind({
      provide: token,
      useClass: repository,
    });
  });

  /* Allow for additional dependency registrations */
  if (config.extraBindings) {
    config.extraBindings.forEach((binding) => {
      container.bind({
        provide: binding.provide,
        useClass: binding.useClass,
        useFactory: binding.useFactory,
        useValue: binding.useValue,
      });
    });
  }

  const app = express();
  app.use(express.json({ limit: "20mb" }));

  app.use(createAuthMiddleware(container));

  /* Register routes for each controller */
  controllers.forEach(({ instance: instance, routes }) => {
    const controllerInstance: any = container.get(instance);

    routes.forEach(({ method, path, handler }) => {
      app[method](path, controllerInstance[handler].bind(controllerInstance));
    });
  });

  return { app, container };
}

/**
 * Create authentication middleware
 */
function createAuthMiddleware(container: Container) {
  return async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const authToken = req.get("Authorization")!;
      const jwt = authToken.replace("Bearer ", "");

      if (isLocalEnv() || true) { // TODO: remove after testing
        console.log("[DEV] User JWT token:", jwt);
      } else {
        console.log("User JWT:", jwt.slice(0, 10), "...");
      }

      if (!container.has(JWT)) {
        container.bind({
          provide: JWT,
          useValue: jwt,
        });
      }

      if (!container.has(SUPABASE_CURRENT_USER)) {
        container.bind({
          provide: SUPABASE_CURRENT_USER,
        useFactory: () => {
          const configService = inject(CONFIG_SERVICE);
          const jwt = inject(JWT);

          return createClient(
            configService.getOrThrow("SUPABASE_URL"),
            configService.getOrThrow("SUPABASE_ANON_KEY"),
            { global: { headers: { Authorization: `Bearer ${jwt}` } } },
          );
          },
        });
      }

      const user = await container.get(SUPABASE_ADMIN).auth.getUser(jwt);

      let userId = user.data.user?.id;

      if (!userId && isLocalEnv()) {
        console.log(
          "[DEV] No userId found in JWT, using LOCAL_TEST_USER_ID from .env",
        );
        userId = Deno.env.get("LOCAL_TEST_USER_ID") || undefined;
      }
      (req as any).userId = userId;

      console.log("UserId:", userId);

      if (!userId) {
        console.error("No userId found in JWT");
        res.status(401).send("Not authorized");
        return;
      }
    } else {
      console.error("No JWT Token provided");
      res.status(401).send("No JWT Token provided");
      return;
    }

    next();
  };
}
