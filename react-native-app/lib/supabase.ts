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
import { GeneratedItemMetadata, Item } from "@/types";

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
}: {
  name: string;
  description: string;
  pictureBase64?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("No user data found. User is not authenticated.");
    }

    const { data: itemData, error: funcError } =
      await supabase.functions.invoke("items", {
        method: "POST",
        body: {
          name,
          description,
          imageBase64: pictureBase64 || undefined,
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
      throw new Error("Failed to create new item");
    }

    console.log("created item", itemData);

    return mapAny2Item(itemData, user, config);
  } catch (error) {
    console.error("createItem error", error);
    return null;
  }
}

export async function getItems() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("No user data found. User is not authenticated.");
    }

    const { data: items, error: funcError } = await supabase.functions.invoke(
      "items",
      {
        method: "GET",
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
    console.error("getItems error", error);
    return [];
  }
}

export async function getItemById({ ID }: Pick<Item, "ID">) {
  try {
    if (!ID) {
      throw new Error("No item ID provided");
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error("No user data found. User is not authenticated.");
    }

    const { data: item, error: funcError } = await supabase.functions.invoke(
      `items/${ID}`,
      {
        method: "GET",
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
      throw new Error("Failed to get item");
    }

    console.log(`getItemById retrieved "${item.ID}"`);

    if (!item) {
      throw new Error("Returned item is null");
    }

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

function mapAny2Item(
  item: any,
  user: { id: string },
  config: { projectUrl: string },
): Item {
  if (!item) {
    throw new Error("Returned item is null");
  }

  const imageURI = item.imageID
    ? `${config.projectUrl}/storage/v1/object/public/user-images/${user.id}/${item.imageID}.png`
    : undefined;

  return {
    ID: item.ID || "NO-ID",
    name: item.name || "NO-NAME",
    description: item.description ?? "NO-DESCRIPTION",
    imageID: item.imageID,
    imageURI: imageURI,
  } satisfies Item;
}

function mapAny2Items(
  items: any[],
  user: { id: string },
  config: { projectUrl: string },
): Item[] {
  return items.map((item) => mapAny2Item(item, user, config));
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
