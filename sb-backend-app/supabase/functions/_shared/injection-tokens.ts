import { InjectionToken } from "@needle-di/core";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  ConfigService,
  DomainCdnService,
  ItemsRepository,
} from "./interfaces/index.ts";
import { WeaviateClient } from "weaviate-ts-client";

/* SUPABASE */
export const JWT = new InjectionToken<string>("JWT");

export const SUPABASE_ADMIN = new InjectionToken<SupabaseClient>(
  "SUPABASE_ADMIN",
);

export const SUPABASE_CURRENT_USER = new InjectionToken<SupabaseClient>(
  "SUPABASE_CURRENT_USER",
);

/* ADAPTERS */
export const WEAVIATE_CLIENT = new InjectionToken<WeaviateClient>(
  "WEAVIATE_CLIENT",
);

/* CORE */
export const CONFIG_SERVICE = new InjectionToken<ConfigService>(
  "CONFIG_SERVICE",
);

export const ITEMS_REPOSITORY = new InjectionToken<ItemsRepository>(
  "ITEMS_REPOSITORY",
);

export const DOMAIN_CDN_SERVICE = new InjectionToken<DomainCdnService>(
  "DOMAIN_CDN_SERVICE",
);
