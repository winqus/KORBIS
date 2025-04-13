import { AppState } from "react-native";
import * as Linking from "expo-linking";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthSessionMissingError,
  createClient,
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { getPictureBase64FromLocalUri, throwIfMissing } from "@/lib/utils";
import { openAuthSessionAsync } from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { decode } from "base64-arraybuffer";
import { GeneratedItemMetadata, Item, IVirtualAsset } from "@/types";

throwIfMissing("env variables", process.env, [
  "EXPO_PUBLIC_SUPABASE_PROJECT_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
]);

export const config = {
  projectUrl: process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL!,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
};

export const supabase = createClient(config.projectUrl, config.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function login() {
  try {
    const redirectUri = Linking.createURL("/");
    console.log("redirectUri", redirectUri);

    const response = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
        scopes: "openid email profile",
      },
    });
    if (response.error) {
      throw new Error("Failed to login: " + response.error.message);
    }
    const browserResult = await openAuthSessionAsync(
      response.data.url,
      redirectUri,
    );
    if (browserResult.type !== "success") {
      throw new Error("Failed to login in browser");
    }

    const { params, errorCode } = QueryParams.getQueryParams(browserResult.url);
    if (errorCode) {
      throw new Error("Failed to login, code:" + errorCode);
    }

    const { access_token, refresh_token } = params;
    if (!access_token || !refresh_token) {
      throw new Error("Failed to get session tokens");
    }

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) {
      throw new Error("Failed to create a session");
    }

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (error instanceof AuthSessionMissingError) {
        console.log("No session found. User is not authenticated.");
        return null;
      }

      throw error;
    }

    const { user } = data;

    if (user.id) {
      throwIfMissing("user data", user, ["id", "email"]);
      throwIfMissing("user metadata", user.user_metadata, [
        "avatar_url",
        "name",
      ]);
      const id: string = user.id!;
      const email: string = user.email!;
      const avatar: string = user.user_metadata["avatar_url"]!;
      const name: string = user.user_metadata["name"]!;
      return {
        id,
        name,
        email,
        avatar,
      };
    }

    return null;
  } catch (error: any) {
    console.error("An unexpected error occurred:", error.message);
    return null;
  }
}

export async function uploadTempPicture({
  pictureBase64,
}: {
  pictureBase64: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("No user data found. User is not authenticated.");
    }

    const filePathInBucket = `${user.id}/${new Date().getTime()}.jpg`;

    const { data, error } = await supabase.storage
      .from("public-bucket")
      .upload(filePathInBucket, decode(pictureBase64), {
        contentType: "image/jpeg",
      });

    if (error) {
      throw error;
    }

    console.log("uploadData", data);

    return { data, error };
  } catch (error) {
    console.error("Upload picture error", error);
    return null;
  }
}

export async function generateItemMetadataFromPicture({
  pictureBase64,
}: {
  pictureBase64: string;
}) {
  try {
    const uploadResult = await uploadTempPicture({
      pictureBase64,
    });

    if (!uploadResult?.data || uploadResult?.error) {
      throw new Error("Failed to upload picture");
    }

    console.log("");
    const { data: itemData, error: funcError } =
      await supabase.functions.invoke("generator/picture-to-item-metadata", {
        method: "POST",
        body: {
          picturePath: uploadResult.data.path,
        },
      });

    if (funcError instanceof FunctionsHttpError) {
      const errorMessage = await funcError.context.json();
      console.log("Function returned an error", errorMessage);
    } else if (funcError instanceof FunctionsRelayError) {
      console.log("Relay error:", funcError.message);
    } else if (funcError instanceof FunctionsFetchError) {
      console.log("Fetch error:", funcError.message);
    }

    if (funcError) {
      throw new Error("Failed to fetch picture based item metadata");
    }

    throwIfMissing("generated item metadata", itemData, [
      "item_name",
      "shorthand",
      "description",
    ]);

    return itemData as GeneratedItemMetadata;
  } catch (error) {
    console.error("Generate item metadata error", error);
    return null;
  }
}

export async function createItem({
  name,
  description,
  pictureBase64,
  parent,
  quantity,
}: {
  name: string;
  description: string;
  pictureBase64?: string;
  parent?: Pick<IVirtualAsset, "type" | "id">;
  quantity?: number;
}) {
  try {
    const user = await requireAuthentication();

    const itemData = await invokeFunction<any>("items", {
      method: "POST",
      body: {
        name,
        description,
        imageBase64: pictureBase64 || undefined,
        parentType: parent?.type || undefined,
        parentId: parent?.id || undefined,
        quantity: quantity || 1,
      },
    });

    console.log("created item", itemData);

    return mapAny2Item(itemData, user, config);
  } catch (error) {
    console.error("createItem error", error);
    return null;
  }
}

export async function createContainer({
  name,
  description,
  pictureBase64,
  parent,
}: {
  name: string;
  description: string;
  pictureBase64?: string;
  parent?: Pick<IVirtualAsset, "type" | "id">;
}) {
  try {
    const user = await requireAuthentication();

    const itemData = await invokeFunction<any>("containers", {
      method: "POST",
      body: {
        name,
        description,
        imageBase64: pictureBase64 || undefined,
        parentType: parent?.type || undefined,
        parentId: parent?.id || undefined,
      },
    });

    console.log("created container", itemData);

    return mapAny2Item(itemData, user, config);
  } catch (error) {
    console.error("createContainer error", error);
    return null;
  }
}

export async function getItems(options?: {
  limit: number;
  offset: number;
  parentId?: string;
}) {
  try {
    const { limit = 50, offset = 0, parentId } = options || {};

    const user = await requireAuthentication();

    let queryString = `items?limit=${limit}&skip=${offset}`;

    if (parentId) {
      queryString += `&parentId=${parentId}`;
    }

    const items = await invokeFunction<any>(queryString, {
      method: "GET",
    });

    console.log(`getItems retrieved ${items.length} items`);

    return mapAny2Items(items, user, config);
  } catch (error) {
    console.error("getItems error", error);
    return [];
  }
}

export async function getItemById({ ID }: Pick<Item, "ID">) {
  try {
    if (!ID) {
      throw new Error("No item ID provided");
    }

    const user = await requireAuthentication();

    const item = await invokeFunction<any>(`items/${ID}`, { method: "GET" });

    if (!item) {
      throw new Error("Returned item is null");
    }
    console.log(`getItemById retrieved "${item.id}"`);

    return mapAny2Item(item, user, config);
  } catch (error) {
    console.error("getItemById error", error);
    return null;
  }
}

export async function searchItems({
  queryText,
  queryImageUri,
}: {
  queryText?: string;
  queryImageUri?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("No user data found. User is not authenticated.");
    }

    const pictureBase64 = await getPictureBase64FromLocalUri(
      queryImageUri || "",
    );

    console.log(
      `searchItems: queryText: ${queryText}, pictureBase64: ${pictureBase64?.slice(0, 10)}...`,
    );
    if (!queryText && !pictureBase64) {
      console.log("No search query provided, returning all items");
      return await getItems();
    }

    const { data: items, error: funcError } = await supabase.functions.invoke(
      "items/search",
      {
        method: "POST",
        body: {
          queryText: queryText || undefined,
          queryImageBase64: pictureBase64 || undefined,
        },
      },
    );

    if (funcError instanceof FunctionsHttpError) {
      const errorMessage = await funcError.context.json();
      console.log("Function returned an error", errorMessage);
    } else if (funcError instanceof FunctionsRelayError) {
      console.log("Relay error:", funcError.message);
    } else if (funcError instanceof FunctionsFetchError) {
      console.log("Fetch error:", funcError.message);
    }

    if (funcError) {
      throw new Error("Failed to get items");
    }

    console.log(`getItems retrieved ${items.length} items`);

    return mapAny2Items(items, user, config);
  } catch (error) {
    console.error("searchItems error", error);
    return [];
  }
}

export async function deleteItem({ ID }: Pick<Item, "ID">) {
  try {
    if (!ID) {
      throw new Error("No item ID provided");
    }

    await requireAuthentication();

    await invokeFunction(`items/${ID}`, { method: "DELETE" });

    console.log(`Successfully deleted item with ID: ${ID}`);

    return true;
  } catch (error) {
    console.error("deleteItem error", error);
    return false;
  }
}

/*
 * HELPERS
 */

function mapAny2Item(
  item: any,
  user: { id: string },
  config: { projectUrl: string },
): Item {
  if (!item) {
    throw new Error("Returned item is null");
  }

  // TODO: remove this temp imageURI when the get many API is fixed
  const imageURI = item.imageId
    ? `${config.projectUrl}/storage/v1/object/public/domain-images/${user.id}/${item.imageId}.png`
    : undefined;
  // console.log(">>>>Received raw ITEM", item);
  return {
    ID: item.id,
    ownerId: item.ownerId,
    name: item.name,
    description: item.description,
    imageID: item.imageId,
    imageURI: item.imageUrl || imageURI,
    type: item.parentType,
    parentId: item.parentId,
    parentType: item.parentType,
    parentName: item.parentName,
    quantity: item.quantity,
  } satisfies Item;
}

function mapAny2Items(
  items: any[],
  user: { id: string },
  config: { projectUrl: string },
): Item[] {
  return items.map((item) => mapAny2Item(item, user, config));
}

async function requireAuthentication() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No user data found. User is not authenticated.");
  }
  return user;
}

async function invokeFunction<T>(
  functionPath: string,
  options: {
    method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
    body?: any;
    headers?: { [key: string]: string };
  },
): Promise<T | null> {
  try {
    const { data, error } = await supabase.functions.invoke(
      functionPath,
      options,
    );

    if (error) {
      handleFunctionsError(error);
      throw new Error(`Failed to invoke function: ${functionPath}`);
    }

    return data as T;
  } catch (error) {
    console.error(`Error invoking ${functionPath}:`, error);
    return null;
  }
}

async function handleFunctionsError(funcError: any): Promise<void> {
  if (funcError instanceof FunctionsHttpError) {
    const errorMessage = await funcError.context.json();
    console.log("Function returned an error", errorMessage);
  } else if (funcError instanceof FunctionsRelayError) {
    console.log("Relay error:", funcError.message);
  } else if (funcError instanceof FunctionsFetchError) {
    console.log("Fetch error:", funcError.message);
  }
}

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
