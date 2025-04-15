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
import {
  Container,
  GeneratedItemMetadata,
  Item,
  IVirtualAsset,
  File,
} from "@/types";
import * as FileSystem from "expo-file-system";
import { invalidateCacheByFn } from "./useSupabase";

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

    invalidateCacheByFn("getItems");
    invalidateCacheByFn("searchItems");
    invalidateCacheByFn("getAssets");
    invalidateCacheByFn("searchAssets");

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

    invalidateCacheByFn("getItems");
    invalidateCacheByFn("searchItems");
    invalidateCacheByFn("getAssets");
    invalidateCacheByFn("searchAssets");

    return mapAny2Item(itemData, user, config);
  } catch (error) {
    console.error("createContainer error", error);
    return null;
  }
}

export async function updateContainer({
  id,
  name,
  description,
  parentId,
  parentType,
}: {
  id: string;
  name?: string;
  description?: string;
  parentId?: string;
  parentType?: string;
}) {
  try {
    const user = await requireAuthentication();

    const updateData: Record<string, any> = {
      name: name || undefined,
      description: description || undefined,
      parentId: parentId || undefined,
      parentType: parentType || undefined,
    };

    console.log("updateContainer with:", updateData);

    const updatedContainer = await invokeFunction<any>(`containers/${id}`, {
      method: "PUT",
      body: updateData,
    });

    invalidateCacheByFn("getContainerById");
    invalidateCacheByFn("getContainers");
    invalidateCacheByFn("getItems");
    invalidateCacheByFn("searchItems");
    invalidateCacheByFn("getAssets");
    invalidateCacheByFn("searchAssets");

    return mapAny2Container(updatedContainer, user, config);
  } catch (error) {
    console.error("Failed to update container:", error);
    return null;
  }
}

export async function deleteContainer({ id }: Pick<Container, "id">) {
  try {
    if (!id) {
      throw new Error("No container ID provided");
    }

    await requireAuthentication();

    await invokeFunction(`containers/${id}`, { method: "DELETE" });

    invalidateCacheByFn("getContainerById");
    invalidateCacheByFn("getContainers");
    invalidateCacheByFn("searchItems");
    invalidateCacheByFn("getAssets");
    invalidateCacheByFn("searchAssets");

    return true;
  } catch (error) {
    console.error("Failed to delete container:", error);
    return false;
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

export async function getItemById({ id }: Pick<Item, "id">) {
  try {
    if (!id) {
      throw new Error("No item ID provided");
    }

    const user = await requireAuthentication();

    const item = await invokeFunction<any>(`items/${id}`, { method: "GET" });

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

export async function getContainerById({ id }: Pick<Container, "id">) {
  try {
    if (!id) {
      throw new Error("No container ID provided");
    }

    const user = await requireAuthentication();

    const container = await invokeFunction<any>(`containers/${id}`, {
      method: "GET",
    });

    if (!container) {
      throw new Error("Returned container is null");
    }
    console.log(`getContainerById retrieved "${container.id}"`);

    return mapAny2Container(container, user, config);
  } catch (error) {
    console.error("getContainerById error", error);
    return null;
  }
}

export async function getContainerByVisualCode({
  visualCode,
}: {
  visualCode: string;
}) {
  try {
    const user = await requireAuthentication();

    const container = await invokeFunction<any>(`containers/${visualCode}`, {
      method: "GET",
    });

    if (!container) {
      return null;
    }

    console.log(
      `getContainerByVisualCode retrieved "${container.id}" with code "${visualCode}"`,
    );
    return mapAny2Container(container, user, config);
  } catch (error) {
    console.error("getContainerByVisualCode error", error);
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
    const user = await requireAuthentication();

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

    const items = await invokeFunction<any>("items/search", {
      method: "POST",
      body: {
        queryText: queryText || undefined,
        queryImageBase64: pictureBase64 || undefined,
      },
    });

    console.log(`getItems retrieved ${items.length} items`);

    return mapAny2Items(items, user, config);
  } catch (error) {
    console.error("searchItems error", error);
    return [];
  }
}

export async function deleteItem({ id }: Pick<Item, "id">) {
  try {
    if (!id) {
      throw new Error("No item ID provided");
    }

    await requireAuthentication();

    await invokeFunction(`items/${id}`, { method: "DELETE" });

    invalidateCacheByFn("getItemById");
    invalidateCacheByFn("getItems");
    invalidateCacheByFn("searchItems");
    invalidateCacheByFn("getAssets");
    invalidateCacheByFn("searchAssets");

    return true;
  } catch (error) {
    console.error("Failed to delete item:", error);
    return false;
  }
}

export async function updateItem({
  id,
  name,
  description,
  quantity,
  parentId,
  parentType,
}: {
  id: string;
  name?: string;
  description?: string;
  quantity?: number;
  parentId?: string;
  parentType?: string;
}) {
  try {
    const user = await requireAuthentication();

    const updateData: Record<string, any> = {
      name: name || undefined,
      description: description || undefined,
      quantity: quantity || undefined,
      parentId: parentId || undefined,
      parentType: parentType || undefined,
    };

    console.log("updateItem with:", updateData);

    const updatedItem = await invokeFunction<any>(`items/${id}`, {
      method: "PUT",
      body: updateData,
    });

    invalidateCacheByFn("getItemById");
    invalidateCacheByFn("getItems");
    invalidateCacheByFn("searchItems");
    invalidateCacheByFn("getAssets");
    invalidateCacheByFn("searchAssets");

    return mapAny2Item(updatedItem, user, config);
  } catch (error) {
    console.error("Failed to update item:", error);
    return null;
  }
}

export async function getContainers() {
  try {
    const user = await requireAuthentication();

    const assets = await invokeFunction<any>("containers", {
      method: "GET",
    });

    if (!assets || !Array.isArray(assets)) {
      return [];
    }

    const containers = assets.filter((asset) => asset.type === "container");

    console.log(`getContainers retrieved ${containers.length} containers`);

    return mapAny2Containers(containers, user, config);
  } catch (error) {
    console.error("getContainers error", error);
    return [];
  }
}

export async function getAssets({
  limit = 50,
  offset = 0,
  parentId,
  parentType = "root",
}: {
  limit?: number;
  offset?: number;
  parentId?: string;
  parentType?: "root" | "container";
}) {
  try {
    const user = await requireAuthentication();

    let queryString = `assets?limit=${limit}&skip=${offset}`;

    if (parentId) {
      queryString += `&parentId=${parentId}`;
    }

    const assets = await invokeFunction<any>(queryString, {
      method: "GET",
    });

    console.log(`getAssets retrieved ${assets.length} assets`);

    return mapAny2Assets(assets, user, config);
  } catch (error) {
    console.error("getAssets error", error);
    return [];
  }
}

export async function searchAssets({
  queryText,
  queryImageUri,
  parentId,
  parentType = "root",
  limit = 50,
  offset = 0,
}: {
  queryText?: string;
  queryImageUri?: string;
  parentId?: string;
  parentType?: "root" | "container";
  limit?: number;
  offset?: number;
}) {
  try {
    const user = await requireAuthentication();

    const pictureBase64 = await getPictureBase64FromLocalUri(
      queryImageUri || "",
    );

    console.log(
      `searchItems: queryText: ${queryText}, pictureBase64: ${pictureBase64?.slice(0, 10)}...`,
    );
    if (!queryText && !pictureBase64) {
      console.log("No search query provided, returning all items");
      return await getAssets({
        parentId,
        parentType,
        limit,
        offset,
      });
    }

    const assets = await invokeFunction<any>("items/search", {
      method: "POST",
      body: {
        queryText: queryText || undefined,
        queryImageBase64: pictureBase64 || undefined,
      },
    });

    console.log(`getAssets retrieved ${assets.length} assets`);

    return mapAny2Assets(assets, user, config);
  } catch (error) {
    console.error("searchItems error", error);
    return [];
  }
}

export async function uploadItemFile({
  itemId,
  fileUri,
  fileName,
}: {
  itemId: string;
  fileUri: string;
  fileName: string;
}) {
  try {
    const user = await requireAuthentication();

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error("File doesn't exist at provided URI");
    }

    const filePathInBucket = `${user.id}/${itemId}/${new Date().getTime()}`;

    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const extension = fileName.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";

    if (extension === "pdf") contentType = "application/pdf";
    else if (extension === "doc" || extension === "docx")
      contentType = "application/msword";
    else if (extension === "xls" || extension === "xlsx")
      contentType = "application/vnd.ms-excel";
    else if (extension === "jpg" || extension === "jpeg")
      contentType = "image/jpeg";
    else if (extension === "png") contentType = "image/png";
    else if (extension === "txt") contentType = "text/plain";

    const { data, error } = await supabase.storage
      .from("domain-files")
      .upload(filePathInBucket, decode(fileContent), {
        contentType,
      });

    if (error) {
      throw error;
    }

    console.log("File upload data", data);

    const fileData = await invokeFunction<any>("items/files", {
      method: "POST",
      body: {
        itemId,
        name: fileName,
        originalName: fileName,
        path: data.fullPath,
        mimeType: contentType,
        size: fileInfo.size,
      },
    });

    invalidateCacheByFn("getItemFiles");
    invalidateCacheByFn("getItemById");

    return mapAny2File(fileData, user, config);
  } catch (error) {
    console.error("Upload file error", error);
    return null;
  }
}

export async function getItemFiles({ itemId }: { itemId: string }) {
  try {
    const user = await requireAuthentication();

    const files = await invokeFunction<any>(`items/${itemId}/files`, {
      method: "GET",
    });

    console.log(`getItemFiles retrieved ${files.length} files`);

    return mapAny2Files(files, user, config);
  } catch (error) {
    console.error("getItemFiles error", error);
    return [];
  }
}

export async function deleteItemFile({
  itemId,
  fileId,
}: {
  itemId: string;
  fileId: string;
}) {
  try {
    if (!fileId) {
      throw new Error("No file ID provided");
    }

    await requireAuthentication();

    await invokeFunction(`items/${itemId}/files/${fileId}`, {
      method: "DELETE",
    });

    console.log(`Successfully deleted file with ID: ${fileId}`);

    // Invalidate files cache
    invalidateCacheByFn("getItemFiles");
    invalidateCacheByFn("getItemById");

    return true;
  } catch (error) {
    console.error("deleteItemFile error", error);
    return false;
  }
}

/*
 * HELPERS
 */

function mapAny2Asset(
  asset: any,
  user: { id: string },
  config: { projectUrl: string },
): Item | Container {
  if (!asset) {
    throw new Error("Returned asset is null");
  }

  if (asset.type === "item") {
    return mapAny2Item(asset, user, config);
  } else if (asset.type === "container") {
    return mapAny2Container(asset, user, config);
  }

  throw new Error("Invalid asset type");
}

function mapAny2Assets(
  assets: any[],
  user: { id: string },
  config: { projectUrl: string },
): (Item | Container)[] {
  return assets.map((asset) => mapAny2Asset(asset, user, config));
}

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
    id: item.id,
    ownerId: item.ownerId,
    name: item.name,
    description: item.description,
    imageId: item.imageId,
    imageUrl: item.imageUrl || imageURI,
    type: item.type,
    parentId: item.parentId,
    parentType: item.parentType,
    parentName: item.parentName,
    quantity: item.quantity,
    files: item.files ? mapAny2Files(item.files, user, config) : undefined,
  } satisfies Item;
}

function mapAny2Items(
  items: any[],
  user: { id: string },
  config: { projectUrl: string },
): Item[] {
  return items.map((item) => mapAny2Item(item, user, config));
}

function mapAny2Container(
  container: any,
  user: { id: string },
  config: { projectUrl: string },
): Container {
  if (!container) {
    throw new Error("Returned container is null");
  }

  const imageURI = container.imageId
    ? `${config.projectUrl}/storage/v1/object/public/domain-images/${user.id}/${container.imageId}.png`
    : undefined;

  return {
    id: container.id,
    ownerId: container.ownerId,
    name: container.name,
    description: container.description,
    imageId: container.imageId,
    imageUrl: container.imageUrl || imageURI,
    type: container.type,
    parentId: container.parentId,
    parentType: container.parentType,
    parentName: container.parentName,
    childCount: container.childCount,
    path: container.path,
  } satisfies Container;
}

function mapAny2Containers(
  containers: any[],
  user: { id: string },
  config: { projectUrl: string },
): Container[] {
  return containers.map((container) =>
    mapAny2Container(container, user, config),
  );
}

function mapAny2File(
  file: any,
  user: { id: string },
  config: { projectUrl: string },
): File {
  if (!file) {
    throw new Error("Returned file is null");
  }

  return {
    id: file.id,
    name: file.name,
    originalName: file.originalName,
    fileUrl: file.fileUrl,
    itemId: file.itemId,
    ownerId: file.ownerId,
    mimeType: file.mimeType,
    size: file.size,
    createdAt: file.createdAt,
  } satisfies File;
}

function mapAny2Files(
  files: any[],
  user: { id: string },
  config: { projectUrl: string },
): File[] {
  return files.map((file) => mapAny2File(file, user, config));
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
    console.log(`Error invoking ${functionPath}:`, error);
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
